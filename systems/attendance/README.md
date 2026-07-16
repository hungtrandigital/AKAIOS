# Attendance System

**System Name:** `attendance`
**Status:** Phase 0 — architecture defined, code pending (PRD-EPIC-002)
**Owner:** @fullstack-engineer

## Overview

Hệ thống chấm công cho nhân viên vệ sinh AKAIUNSAN tại 15 dự án. Nhân viên check-in/out qua mobile app (Flutter) kèm GPS + ảnh chụp. Back Office theo dõi real-time, override khi cần. Hệ thống cũng sinh báo cáo PDF/CSV gửi khách hàng.

### Target Users

- **~200 nhân viên vệ sinh** (employees): dùng mobile app để check-in/out tại site
- **~15 giám sát dự án** (supervisors): xem real-time, override khi cần
- **~3-5 BO staff**: CRUD dự án, NV, ca, xem báo cáo khách hàng

### Out of Scope

- BHXH/PIT computation (BO làm thủ công)
- Face recognition (chỉ GPS + ảnh chụp)
- Customer self-service portal (BO gửi báo cáo qua email/Zalo)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile | Flutter 3.24 (Dart 3.5), Riverpod 2.x, flutter_localizations (vi/en) |
| Backend API | Node.js 20 LTS + Fastify + TypeScript (strict mode) |
| ORM | Prisma 5 (shared with payroll) |
| Database | PostgreSQL 16 (shared with payroll) |
| Cache / queue | Redis 7 + BullMQ (shared with payroll) |
| Object storage | MinIO (S3-compatible, self-hosted) — for check-in photos + generated PDFs |
| Tests | Vitest + testcontainers + Playwright |
| Auth | JWT (15-min access) + refresh token (30-day, httpOnly cookie) |

## Quick Start

### Prerequisites

- Flutter SDK 3.24+
- Node.js 20 LTS
- pnpm 9+ (recommended) or npm 10
- Docker 24+ with Compose v2
- Android Studio / Xcode (for mobile development)

### Local Development

```bash
# 1. From repo root, start shared infrastructure
cd systems/attendance
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# 2. Run backend in dev mode
cd backend
pnpm install
pnpm prisma migrate dev
pnpm dev   # http://localhost:3000

# 3. Run mobile app
cd ../mobile
flutter pub get
flutter run   # with Android emulator / iOS simulator running)
```

## Directory Structure

```
attendance/
├── README.md                 # This file
├── docs/
│   ├── architecture.md       # Attendance-specific architecture
│   ├── api-contracts.md      # Cross-references shared openapi.yaml
│   └── deployment.md         # On-prem deploy runbook
├── backend/                  # Fastify API (TS)
│   ├── src/
│   │   ├── routes/           # HTTP route handlers
│   │   ├── services/         # Business logic (attendance, schedule)
│   │   ├── repositories/     # Prisma queries
│   │   ├── domain/           # Value objects (GPSCoordinate, etc.)
│   │   ├── plugins/          # Fastify plugins (auth, rate-limit, etc.)
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/      # testcontainers (real Postgres/Redis/MinIO)
│   │   └── e2e/              # Playwright
│   ├── prisma/
│   │   ├── schema.prisma     # Shared with payroll
│   │   └── migrations/
│   └── package.json
├── mobile/                   # Flutter app
│   ├── lib/
│   │   ├── core/
│   │   ├── features/attendance/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   ├── l10n/             # vi, en
│   │   └── main.dart
│   ├── test/
│   ├── android/
│   └── ios/
└── docker-compose.dev.yml    # Local dev stack
```

## Documentation

- **[Architecture](docs/architecture.md)** — Attendance-specific architecture details
- **[API Contracts](docs/api-contracts.md)** — Cross-references [shared openapi.yaml](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- **[Deployment](docs/deployment.md)** — On-prem deploy + runbook
- **[Shared Architecture](../../3-technical/3.1-system-foundation/)** — Cross-cutting docs (infrastructure, system-design, domain-specs, coding-standards)

## Related Systems

- **[Payroll System](../payroll/README.md)** — Reads attendance data via `/internal/attendance` endpoint to compute payroll.

## Related Documentation

- [PRD-EPIC-002 Plan](../../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#2-attendance-bounded-context)
- [API Contracts](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)

---

*Phase 0 architecture complete. Implementation starts Phase 1 (foundation build).*
