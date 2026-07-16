# Payroll System — Architecture

**Status:** Phase 0 — Architecture defined (PRD-EPIC-002)
**Last Updated:** 2026-07-16
**Owner:** @system-architecture + @fullstack-engineer

## Cross-Cutting Reference

This system follows the shared architecture defined in:
- [Infrastructure](../../3-technical/3.1-system-foundation/infrastructure.md)
- [System Design](../../3-technical/3.1-system-foundation/design-standards/system-design.md)
- [Domain Specs — Payroll](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#3-payroll-bounded-context)
- [API Contracts](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)

This document adds **payroll-specific** architectural details only.

## System Purpose

Web-admin-only system for BO to compute monthly payroll, approve, and export Excel for accounting.

## Components

### Backend API (Fastify)

**Routes:**
- `/v1/payroll-periods/*` — open, calculate, approve, lock, export
- `/v1/payroll-lines/:id/override` — manual override
- `/v1/payroll-rules` — current rule config
- `/v1/audit-logs` — admin-only query

**Pure Engine (most-tested code):**
- `engine/calculator.ts` — takes (employee, attendance[], rules) → PayrollLine
- `engine/rules.ts` — applies rounding, multipliers, etc.

**Services:**
- `PayrollPeriodService` — openPeriod(), calculateAll(), approve(), lock()
- `AttendanceClient` — HTTP client to attendance API `/internal/attendance`
- `ExcelExporter` — uses ExcelJS to format Vietnamese accounting template

**Background Jobs (BullMQ):**
- `payroll-calculate` — triggered by `/calculate` route; iterates employees, calls engine, persists lines
- `payroll-export-cleanup` — weekly, removes exports older than 90 days from local storage

### Web Admin (Next.js)

**Key pages:**
1. `/login` — admin login (email + password + 2FA)
2. `/payroll/periods` — list all periods, status filter
3. `/payroll/periods/new` — open new period (year, month)
4. `/payroll/periods/[id]` — period detail with all lines, status actions
5. `/payroll/periods/[id]/calculate` — trigger calculation (button)
6. `/payroll/lines/[id]/edit` — override single line (advance, deductions)
7. `/payroll/rules` — view current rules (admin only edit)
8. `/audit` — audit log query (system_admin only)

**State:**
- React Query (TanStack Query) for server state
- Forms with React Hook Form + Zod validation

## Payroll Engine (core)

The engine is a **pure function** (no I/O, no DB) for testability:

```typescript
// engine/calculator.ts
function calculateLine(
  employee: EmployeeSnapshot,
  attendance: AttendanceRecord[],
  rules: PayrollRule,
  inputs: { advance: Decimal, otherDeductions: Decimal }
): PayrollLine {
  const workingDays = countWorkingDaysInPeriod(...)
  const actualDaysWorked = countDaysWithPresentOrLate(attendance)
  const totalMinutes = sumTotalMinutesWorked(attendance)
  const otWeekdayMin = sumOTMinutes(attendance, 'weekday')
  const otWeekendMin = sumOTMinutes(attendance, 'weekend')
  const otHolidayMin = sumOTMinutes(attendance, 'holiday')
  const lateMin = sumLateMinutes(attendance)

  const proratedBase = employee.baseSalary.mul(actualDaysWorked).div(workingDays)
  const hourlyRate = employee.baseSalary.div(workingDays).div(rules.workingHoursPerDay).div(60)
  const otWeekday = hourlyRate.mul(otWeekdayMin).mul(rules.otWeekdayMultiplier)
  const otWeekend = hourlyRate.mul(otWeekendMin).mul(rules.otWeekendMultiplier)
  const otHoliday = hourlyRate.mul(otHolidayMin).mul(rules.otHolidayMultiplier)
  const allowances = rules.mealAllowancePerDay.mul(actualDaysWorked).plus(rules.phoneAllowance ?? 0)
  const latePenalty = min(lateMin.mul(rules.latePenaltyPerMinute ?? 0), rules.maxLatePenaltyPerDay ?? Infinity).mul(countLateDays(attendance))

  const gross = proratedBase.plus(otWeekday).plus(otWeekend).plus(otHoliday).minus(latePenalty).plus(allowances)
  const net = gross.minus(inputs.advance).minus(inputs.otherDeductions)

  return { /* all fields */ }
}
```

**Tested with Vitest, target 100% coverage, with edge cases:**
- Month with 28/30/31 days
- February in leap year
- Overnight shifts spanning midnight
- VN holidays (1/1, 30/4, 1/5, 2/9, etc.)
- Empty attendance (all absent)
- Partial month (NV mới vào giữa tháng)
- Rounding 22 min → 15, 38 min → 45
- Negative gross (NV làm thiếu giờ + penalty > base) → return 0
- Decimal precision (1.5x of 48,000 VND/hr × 30 min = 36,000, not 35,999.99)

## Data Flow

```
User Action: BO clicks "Approve" on period
     ↓
POST /v1/payroll-periods/:id/approve
     ↓
Service checks: period.status = calculated, user.role = bo_admin
     ↓
Update DB: status=approved, approvedAt=now, approvedBy=userId
     ↓
Emit PayrollApproved event
     ↓
Return updated PayrollPeriod
```

## State Machine (PayrollPeriod)

```
            ┌──────────────┐
            │    open      │ ──── BO opens new period
            └──────┬───────┘
                   │ BO triggers calculate
                   ▼
            ┌──────────────┐
            │ calculating │ ──── Job runs in background
            └──────┬───────┘
                   │ Job completes (all lines created)
                   ▼
            ┌──────────────┐
            │ calculated   │ ──── BO reviews lines + overrides
            └──────┬───────┘
                   │ BO approves
                   ▼
            ┌──────────────┐
            │  approved    │ ──── No more line edits allowed
            └──────┬───────┘
                   │ BO marks paid
                   ▼
            ┌──────────────┐
            │    paid      │ ──── Money transferred to employees
            └──────┬───────┘
                   │ system_admin locks
                   ▼
            ┌──────────────┐
            │   locked     │ ──── Immutable archive
            └──────────────┘
```

## Key Business Rules (BR)

See [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#business-rules-payroll). Top rules:

| ID | Rule | Implementation |
| --- | --- | --- |
| BR-PAY-001 | Pro-rated base | `engine/calculator.ts:proratedBase` |
| BR-PAY-002 | OT calculation | `engine/calculator.ts:otWeekday/Weekend/Holiday` |
| BR-PAY-003 | Time rounding | `engine/rules.ts:roundToNearest(roundingMinutes)` |
| BR-PAY-007 | Net = gross - deductions | `engine/calculator.ts:net` (no compliance in MVP) |
| BR-PAY-008 | Period state machine | `PayrollPeriodService` enforces transitions |
| BR-PAY-009 | Manual recalc only | Re-calculate endpoint requires explicit trigger, logs audit |

## Excel Export Format

Standard Vietnamese accounting template:

| Mã NV | Họ tên | Ngày công | Phụ cấp | OT thường | OT CN | OT lễ | Lương gross | Tạm ứng | Khấu trừ khác | Thực nhận |
|---|---|---|---|---|---|---|---|---|---|---|
| NV001 | Nguyễn Văn A | 22 | 880,000 | 720,000 | 0 | 0 | 9,140,000 | 1,000,000 | 0 | 8,140,000 |

Excel format: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, generated via ExcelJS.

## Deployment

- Single Docker container `payroll-api` (Fastify, port 3001)
- Single Docker container `web-admin` (Next.js, port 3002)
- Shared Postgres + Redis with attendance system
- Exposed via Caddy at `https://ak-tunnel.example.com/api/v1/payroll/*` and `/web/*`

## Testing Strategy

- **Engine (calculator + rules):** Vitest unit tests, **target 100% coverage**
- **Routes:** Integration tests with testcontainers
- **State machine:** Unit tests for each transition + invalid transitions
- **Excel export:** Snapshot tests comparing against golden files
- **Web admin:** React Testing Library + Vitest for components, Playwright for E2E

## Future Enhancements (out of MVP)

- VN compliance engine (BHXH/PIT, see ADR-003)
- Auto-transfer integration with bank APIs
- Bulk-line override UI for common adjustments
- Recurring deductions (parking, union fees)
- Multi-period comparison reports

## Related Documents

- [PRD-EPIC-002 Plan](../../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [System Design](../../3-technical/3.1-system-foundation/design-standards/system-design.md#payroll-system-components)
- [ADR-003: Skip VN Compliance](../../8-governance/decision-log/adr-003-skip-vn-compliance-mvp.md)
