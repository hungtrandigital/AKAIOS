# Payroll System

**System Name:** `payroll`
**Status:** 2026-08-09 dependency-security gate merged; deployment, remaining slice, and pilot acceptance pending (PRD-EPIC-002)
**Owner:** @fullstack-engineer

## Overview

Hệ thống tính lương cho nhân viên AKAIUNSAN. Back Office mở kỳ lương hàng tháng, hệ thống tự động tính gross + OT + phụ cấp + khấu trừ dựa trên dữ liệu chấm công, BO duyệt và xuất Excel cho kế toán.

### Target Users

- **~3-5 BO staff** (`bo_admin` role): web UI hiện mở/tính/duyệt/xuất kỳ lương; API còn hỗ trợ override line, rules, paid và lock
- **~1-2 system admin** (`system_admin` role): dùng các API được phân quyền cho cấu hình/khóa; audit-log UI/API chưa được ship

Line-level review/override controls, rule management, paid/lock controls, and an
audit-log view remain web-slice work; backend capability does not imply a shipped UI.

### Out of Scope (MVP)

- BHXH/PIT/thuế TNCN computation (BO xử lý thủ công, xem ADR-003)
- Mobile app (BO dùng web admin trên laptop)
- Customer-facing reports (là của attendance system)
- Tích hợp ngân hàng (BO vẫn chuyển khoản tay sau khi xuất Excel)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend API | Node.js 20 LTS + Fastify + TypeScript (strict mode) |
| ORM | Prisma 5 (shared with attendance) |
| Database | PostgreSQL 16 (shared with attendance) |
| Cache | Redis 7 (shared runtime infrastructure); payroll calculation is transactional in the API |
| Web admin | Next.js 15 (App Router) + TypeScript |
| Tests | Vitest against fresh real services + Playwright through web admin |
| Auth | Admin password + TOTP, JWT access, and rotating refresh token (shared with attendance) |

## Quick Start

### Prerequisites

- Node.js 20 LTS
- pnpm 9+ (recommended) or npm 10
- Docker 24+ with Compose v2

### Local Development

```bash
# From repo root: install and start PostgreSQL :5433, Redis :6380, MinIO :9100.
pnpm install --frozen-lockfile
cp .env.example .env
pnpm docker:up:dev

# Edit .env once: use the dev endpoints above and paste three independently
# generated JWT_SECRET, INTERNAL_API_KEY, and TOTP_ENCRYPTION_KEY values.
# Generate them once with: openssl rand -hex 32 (twice) and
# openssl rand -base64 32 (once). Do not regenerate them per terminal.

# Load the same file for setup. Root scripts do not auto-load it.
set -a; source .env; set +a
pnpm prisma:generate
pnpm prisma:migrate:deploy
# Local/demo only: creates the development tenant, users, employees, shifts,
# attendance samples, and the idempotent RBAC catalog. Never run on pilot/prod.
ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:all

# Each command below blocks. Run it in a separate terminal after loading the
# same .env with: set -a; source .env; set +a
pnpm --filter @ak/attendance-api dev   # http://localhost:3000
pnpm --filter @ak/payroll-api dev      # http://localhost:3001
pnpm --filter @ak/payroll-web-admin dev # http://localhost:3002
```

## Directory Structure

```
payroll/
├── README.md                 # This file
├── docs/
│   └── architecture.md       # Payroll-specific architecture
├── backend/                  # Fastify API (TS)
│   ├── src/
│   │   ├── routes/           # payroll periods, lines, rules, and audit-producing actions
│   │   ├── services/         # Business logic (payroll engine, rules)
│   │   ├── engine/           # Pure payroll calculation (no I/O)
│   │   │   ├── calculator.ts
│   │   │   ├── holidays.ts
│   │   │   ├── vietnam-tax.ts
│   │   │   └── working-days.ts
│   │   ├── clients/          # Internal HTTP client (attendance)
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
├── web-admin/                # Next.js 15
│   ├── app/                  # login/2fa, attendance, payroll, projects, employees, RBAC
│   ├── components/
│   ├── e2e/
│   └── package.json
└── ../shared/                # Shared Prisma schema/migrations and Compose stacks
```

## Documentation

- **[Architecture](docs/architecture.md)** — Payroll engine design, calculation flow
- **[API Contracts](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)** — Canonical shared OpenAPI contract
- **[Deployment](../../3-technical/3.3-devops/server-steps.md)** — On-prem deploy runbook

## Key Concepts

- **Payroll Period:** Một tháng (vd: 2026-07). Có state machine: `open → calculating → calculated → approved → paid → locked`.
- **Payroll Line:** Một dòng lương của 1 NV trong 1 period.
- **Payroll Engine:** Pure function tính lương từ attendance input + rules. Current package coverage is 98.76% statements/lines, 94.39% branches, and 100% functions.
- **Payroll Rule:** Config cho OT rates, allowances, rounding, etc. Versioned theo `effectiveFrom`.

## Calculation Flow

```
[BO mở period 2026-07]
     ↓
[POST /v1/payroll/periods/:id/calculate]
     ↓
[Transactional payroll service + calculator.ts]
     ↓
For each active employee:
  Pull attendance from /internal/attendance (HTTP call)
  Apply rules (OT rates, late penalty, allowances)
  Compute: proratedBase + otWeekday + otWeekend + otHoliday + allowances - latePenalty = gross
  Compute: gross - advance - otherDeductions = net
  Save PayrollLine
     ↓
[period.status = calculated]
     ↓
[BO reviews period in the current UI; line override remains backend-only]
     ↓
[POST /v1/payroll/periods/:id/approve]
     ↓
[period.status = approved]
     ↓
[GET /v1/payroll/periods/:id/export]
     ↓
[BO imports Excel into accounting software]
```

## Related Systems

- **[Attendance System](../attendance/README.md)** — Source of attendance data via `/internal/attendance` endpoint.

## Related Documentation

- [PRD-EPIC-002 Plan](../../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [Domain Specs — Payroll](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#3-payroll-bounded-context)
- [ADR-003: Skip VN Compliance at MVP](../../8-governance/decision-log/adr-003-skip-vn-compliance-mvp.md)
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)

---

*Reviewed candidate `90a95b0` passed all nine exact-SHA jobs, merged through PR #1 as `4f72810`, and passed all nine post-merge jobs. Deployment and remaining slice/pilot acceptance remain pending.*
