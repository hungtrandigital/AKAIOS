# Attendance System

**System Name:** `attendance`
**Status:** Prior remediation gate complete; 2026-08-09 dependency-security candidate validated locally; exact-SHA CI, merge/deployment, remaining MVP slice, and pilot acceptance pending (PRD-EPIC-002)
**Owner:** @fullstack-engineer

## Overview

Hệ thống chấm công cho nhân viên vệ sinh AKAIUNSAN tại 15 dự án. Nhân viên check-in/out qua mobile app (Flutter) kèm GPS + ảnh chụp. Back Office theo dõi real-time, override khi cần. Hệ thống cũng sinh báo cáo PDF/CSV gửi khách hàng.

The employee Flutter client uses the corporate-aligned mobile profile defined in
`docs/style-system/STYLE_GUIDE.md`: Manrope/Be Vietnam Pro typography and the
olive/forest/lime/paper palette, bounded by internal accessibility and attendance
controls. The Back Office retains its Inter/blue internal product profile.

### Target Users

- **~200 nhân viên vệ sinh** (employees): dùng mobile app để check-in/out tại site
- **~15 giám sát dự án** (supervisors): xem real-time, override và ghi nhận ngoại lệ camera trong đúng project được giao
- **~3-5 BO staff**: xem dự án/NV, tạo mẫu ca, phân/hủy lịch ca trên web, review ngoại lệ chấm công và dùng API được phân quyền cho các tác vụ vận hành, báo cáo khách hàng

The Projects and Employees web pages remain read-only. Tenant-scoped shift
planning is available from the `Lịch ca` tab on the attendance operations board,
with a project/month roster, searchable employee selection, paginated full-range
status totals, and same-project schedule copy with mandatory preview.
Exact duplicate employee/project/shift/date rows remain blocked. Other temporal
conflicts are shown as warnings and require explicit confirmation; confirmed
conflicts use a request/resource fingerprint so changed warnings must be reviewed
again, and copy preview shows every source→target mapping. Confirmed conflicts
and copy provenance are audited. Project/employee mutation operations
remain API/operator workflows for now.
Payroll and customer-report generation fail closed with employee/date/assignment
details when more than one assignment was actually attended on the same date;
the current recovery path is the authorized attendance override API. A guided BO
reconciliation screen is deferred and remains a pilot prerequisite.
The mobile Today screen treats reconciled `absent`, `on_leave`, and `holiday`
records as terminal non-working states and does not offer a dead check-in action.
Employee self-attendance always requires geofence-valid GPS plus a new JPEG. The
official mobile client exposes camera capture only, except for a default-off,
debug+iOS-Simulator-only UAT seam that replaces the camera input with a visibly
labeled JPEG while retaining the normal GPS/API/storage checks. Profile/release,
Android, and physical-iPhone paths remain camera-only. The API fully decodes the JPEG,
enforces a 5 MB cap, a 16 MP decode ceiling, and a minimum 320×240 raster before
storage. MVP does not include device attestation/liveness, so a direct API client
cannot cryptographically prove camera origin or capture time.
Camera failure is handled by retry/settings guidance and an operator-only audited
manual-event path for an authorized project supervisor or system-admin break-glass;
manual records are visibly marked for BO review and contain no synthetic photo/GPS.

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
| Cache / auth state | Redis 7 for OTP challenges and abuse controls; refresh-token records are in PostgreSQL |
| Object storage | MinIO (S3-compatible, self-hosted) — for check-in photos + generated PDFs |
| Tests | Vitest with fresh real services + Playwright |
| Auth | Employee SMS OTP; admin password + TOTP; JWT access + rotating refresh tokens |

## Quick Start

### Prerequisites

- Flutter SDK 3.24+
- Node.js 20 LTS
- pnpm 9+ (recommended) or npm 10
- Docker 24+ with Compose v2
- Android Studio / Xcode (for mobile development)

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
# For temporary local UI testing only, DEV_FIXED_ADMIN_2FA_CODE may contain an
# exact four-digit code. Never set it in shared development, staging, or production.

# Root scripts do not auto-load .env. Load the same file before setup:
set -a; source .env; set +a
pnpm prisma:generate
pnpm prisma:migrate:deploy
# Local/demo only: creates the development tenant, users, employees, shifts,
# attendance samples, and the idempotent RBAC catalog. Never run on pilot/prod.
ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:all

# Terminal 1 (blocks): load that same .env, then start the API.
set -a; source .env; set +a
pnpm --filter @ak/attendance-api dev   # http://localhost:3000

# Terminal 2: run the mobile app.
cd systems/attendance/mobile
flutter pub get
flutter gen-l10n
# Android emulator
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
# iOS simulator; no tunnel is required for the loopback-only API
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

The fixed local verifier is enabled only when `NODE_ENV` is explicitly
`development` or `test`. It replaces, rather than supplements, real TOTP for
that process; password checks, active-admin checks, the Redis challenge, attempt
limits, refresh rotation, and logout remain unchanged. Unset the variable to
exercise the normal encrypted six-digit TOTP path used by CI and staging. While
enabled, the API binds to loopback and fixed-mode admin auth rejects an effective
client IP outside the loopback range.

## Directory Structure

```
attendance/
├── README.md                 # This file
├── docs/
│   └── architecture.md       # Attendance-specific architecture
├── backend/                  # Fastify API (TS)
│   ├── src/
│   │   ├── routes/           # HTTP route handlers
│   │   ├── services/         # Business logic (attendance, schedule)
│   │   ├── plugins/          # Fastify plugins (auth, rate-limit, etc.)
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/      # real Postgres/Redis/MinIO
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
└── ../shared/                # Shared Prisma schema/migrations and Compose stacks
```

## Documentation

- **[Architecture](docs/architecture.md)** — Attendance-specific architecture details
- **[API Contracts](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)** — Canonical shared OpenAPI contract
- **[Deployment](../../3-technical/3.3-devops/server-steps.md)** — On-prem deploy + runbook
- **[Shared Architecture](../../3-technical/3.1-system-foundation/)** — Cross-cutting docs (infrastructure, system-design, domain-specs, coding-standards)

## Related Systems

- **[Payroll System](../payroll/README.md)** — Reads attendance data via `/internal/attendance` endpoint to compute payroll.

## Related Documentation

- [PRD-EPIC-002 Plan](../../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#2-attendance-bounded-context)
- [API Contracts](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)

---

*The prior remediation commit passed its historical remote gate. The 2026-08-09 dependency-security candidate passes locally; exact-SHA review, new remote CI, merge, deployment, and remaining slice/pilot acceptance remain pending.*
