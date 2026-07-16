# Payroll System

**System Name:** `payroll`
**Status:** Phase 0 — architecture defined, code pending (PRD-EPIC-002)
**Owner:** @fullstack-engineer

## Overview

Hệ thống tính lương cho nhân viên AKAIUNSAN. Back Office mở kỳ lương hàng tháng, hệ thống tự động tính gross + OT + phụ cấp + khấu trừ dựa trên dữ liệu chấm công, BO duyệt và xuất Excel cho kế toán.

### Target Users

- **~3-5 BO staff** (`bo_admin` role): mở kỳ, tính lương, override từng line, duyệt, xuất Excel
- **~1-2 system admin** (`system_admin` role): config OT rules, lock period, view audit log

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
| Cache / queue | Redis 7 + BullMQ (used for monthly calculation jobs) |
| Web admin | Next.js 14 (App Router) + TypeScript |
| Tests | Vitest + testcontainers |
| Auth | JWT (15-min access) + refresh token (shared with attendance) |

## Quick Start

### Prerequisites

- Node.js 20 LTS
- pnpm 9+ (recommended) or npm 10
- Docker 24+ with Compose v2

### Local Development

```bash
# 1. From repo root, start shared infrastructure (shared with attendance)
cd systems/payroll
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d postgres redis

# 2. Run backend in dev mode
cd backend
pnpm install
pnpm prisma migrate dev
pnpm dev   # http://localhost:3001

# 3. Run web admin
cd ../web-admin
pnpm install
pnpm dev   # http://localhost:3002
```

## Directory Structure

```
payroll/
├── README.md                 # This file
├── docs/
│   ├── architecture.md       # Payroll-specific architecture
│   ├── api-contracts.md      # Cross-references shared openapi.yaml
│   └── deployment.md         # On-prem deploy runbook
├── backend/                  # Fastify API (TS)
│   ├── src/
│   │   ├── routes/           # payroll-periods, payroll-lines, payroll-rules, audit
│   │   ├── services/         # Business logic (payroll engine, rules)
│   │   ├── engine/           # Pure payroll calculation (no I/O)
│   │   │   ├── calculator.ts
│   │   │   └── rules.ts
│   │   ├── clients/          # Internal HTTP client (attendance)
│   │   ├── repositories/     # Prisma queries
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/             # Engine tests (100% coverage target)
│   │   ├── integration/
│   │   └── e2e/
│   └── package.json
├── web-admin/                # Next.js 14
│   ├── app/
│   │   ├── (auth)/
│   │   ├── payroll/
│   │   │   ├── periods/
│   │   │   ├── lines/
│   │   │   └── rules/
│   │   └── layout.tsx
│   ├── components/
│   └── package.json
└── docker-compose.dev.yml
```

## Documentation

- **[Architecture](docs/architecture.md)** — Payroll engine design, calculation flow
- **[API Contracts](docs/api-contracts.md)** — Cross-references [shared openapi.yaml](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- **[Deployment](docs/deployment.md)** — On-prem deploy runbook

## Key Concepts

- **Payroll Period:** Một tháng (vd: 2026-07). Có state machine: `open → calculating → calculated → approved → paid → locked`.
- **Payroll Line:** Một dòng lương của 1 NV trong 1 period.
- **Payroll Engine:** Pure function tính lương từ attendance input + rules. 100% test coverage.
- **Payroll Rule:** Config cho OT rates, allowances, rounding, etc. Versioned theo `effectiveFrom`.

## Calculation Flow

```
[BO mở period 2026-07]
     ↓
[POST /v1/payroll-periods/:id/calculate]
     ↓
[BullMQ job: calculator.ts]
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
[BO reviews + overrides individual lines]
     ↓
[POST /v1/payroll-periods/:id/approve]
     ↓
[period.status = approved]
     ↓
[GET /v1/payroll-periods/:id/export?format=xlsx]
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

*Phase 0 architecture complete. Implementation starts Phase 1 (foundation build).*
