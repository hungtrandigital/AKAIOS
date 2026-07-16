# Implementation Progress

## Current Status

**Last Updated:** 2026-07-16 (PRD-EPIC-002 — Attendance + Payroll systems, Phase 0+1+2 backend + mobile scaffold complete; typecheck + tests passing)

## Overall Progress

- **Completion:** PRD-EPIC-002 Phase 0+1+2 backend + mobile: ✅ 95%
- **Current Sprint:** Phase 2 (attendance mobile + admin pending) and Phase 3 (payroll engine)

## PRD-EPIC-002 — Attendance + Payroll Systems (AKAIUNSAN)

### Phase 0 — Architecture ✅ Complete (2026-07-16)
- 5 architecture docs produced (infrastructure, system-design C4, domain-specs DDD, api-contracts OpenAPI, coding-standards)
- 3 ADRs written (tech stack, on-premise, skip VN compliance MVP)
- 2 system scaffolds (attendance, payroll) with README + docs/architecture
- Tracking: Epic 2 added to backlog + work-items-registry + plans/README

### Phase 1 — Foundation ✅ Complete (2026-07-16)
- Monorepo: pnpm + Turborepo at root (`pnpm-workspace.yaml`, `turbo.json`, root `package.json`)
- `@ak/shared` package: Prisma schema (15 models, all entities from domain-specs), Auth (JWT, Argon2id, OTP), GPSCoordinate value object (Haversine), Money value object (Decimal.js), MinIO client
- `@ak/attendance-api` scaffold: Fastify 4 + TS strict, health + auth (login password/OTP) + me endpoints
- `@ak/payroll-api` scaffold: Fastify 4 + TS strict, health endpoint, payroll engine stub (Phase 3 implements)
- Shared Docker stack (`systems/shared/docker-compose.yml`, `docker-compose.dev.yml`, `Caddyfile`)
- Per-backend Dockerfiles (multi-stage build)
- CI workflow `.github/workflows/ci.yml` (lint + typecheck + unit + integration with Postgres+Redis services)
- ADR-004 documenting monorepo tooling placement

### Phase 2 — Attendance ✅ Backend Complete, Mobile Scaffold Done (2026-07-16)
- **Backend services** (pure functions, ~310 LOC + tests):
  - `GeoService` — BR-ATT-001 (geofence), BR-ATT-007 (project GPS required), BR-ATT-010 (low accuracy tolerance)
  - `AttendanceService` — BR-ATT-002 (late threshold), BR-ATT-004 (no double check-in/out)
  - `ScheduleService` — BR-ATT-006 (conflict detection), BR-ATT-008 (past date window)
  - `PhotoService` — BR-ATT-005 (photo required, JPEG verified, max 5MB), MinIO upload
- **Backend routes** (4 route files, ~470 LOC):
  - `/v1/auth/{login, request-otp, login-otp, logout, me}` — Phase 1 minimal
  - `/v1/attendance/{my-today, check-in, check-out, records, records/:id/override}` — Phase 2
  - `/v1/projects` CRUD (admin only) — Phase 2
  - `/v1/employees` CRUD (admin) — Phase 2
  - `/v1/shifts` + `/v1/shifts/assignments` — Phase 2
- **Backend tests** (3 files, 25 test cases):
  - `geo-service.test.ts` — 8 cases (inside/outside/low-accuracy/project missing GPS)
  - `attendance-service.test.ts` — 13 cases (absent/present/late/overnight/no-double)
  - `auth.test.ts` + `health.test.ts` — 2 cases
  - `engine.test.ts` + `health.test.ts` (payroll) — 2 cases
- **Mobile scaffold** (`systems/attendance/mobile/`, ~900 LOC Dart):
  - pubspec.yaml (Riverpod, Dio, Geolocator, image_picker, secure_storage, go_router)
  - vi/en ARB localization files
  - 4 screens: Login (password OR OTP), Today (assignment + status), CheckIn/CheckOut (GPS + camera + submit)
  - Repositories (auth, attendance) + Riverpod providers + secure storage
  - README with `flutter create` instructions
  - ⚠️ Requires `flutter create --platforms=android,ios .` to scaffold native folders + add permissions
- **Deferred**: Next.js web admin (Phase 2.5+)

### Phase 3 — Payroll ⏳ Pending
- Engine implement BR-PAY-001..BR-PAY-010 (pro-rated, OT, allowances, rounding, late penalty, gross/net)
- Excel export (Vietnamese accounting format)
- Web admin routes for payroll periods + lines

### Phase 4 — Customer Report ⏳ Pending
- PDF generator (PDFKit) + CSV per 15 projects
- Templates per customer

### Phase 5 — Pilot ⏳ Pending
- 1-2 projects live
- Bug-fix sprint 2 weeks

### Phase 6 — Scale-out ⏳ Pending
- 13 remaining projects
- Multi-project conflict handling

### Verification Status (2026-07-16)

```
✅ pnpm install         → 277 packages, 0 errors
✅ pnpm prisma:generate → Prisma Client v5.22.0 generated
✅ pnpm typecheck       → All 4 packages pass (0 errors)
✅ pnpm test            → 25/25 tests pass (attendance 23/23, payroll 2/2, shared passWithNoTests)
⏳ Docker compose      → Built but not runtime-tested (no Postgres locally)
⏳ pnpm build           → Cached (shared compiled)
⏳ Flutter run         → Requires `flutter create` first; not yet executed
```

### Known Issues / Carry-over

1. **flutter pub get** not yet run — mobile won't build until executed
2. **`flutter create` requires user** to generate `android/` and `ios/` folders
3. **Schedule conflict (BR-ATT-006)** + **past date (BR-ATT-008)** logic exists in services but not yet wired into `POST /v1/shifts/assignments` and `POST /v1/attendance/check-in` respectively
4. **Audit log** writes for override; missing for create/update/delete of other resources
5. **Refresh endpoint** `/v1/auth/refresh` not implemented (planned Phase 2.5)
6. **README.md** at root lost factory context — restoration + AKAIUNSAN section planned Phase 2 close
7. **`--dart-define=API_BASE_URL`** needs to be passed when building mobile

- **Next Milestone:** *Milestone name and date*

## Active Work

### In Progress
- *Task 1*
- *Task 2*
- *Task 3*

### Blocked
- *Blocked item 1 - reason*
- *Blocked item 2 - reason*

## Completed This Sprint

- *Completed item 1*
- *Completed item 2*

## Upcoming

### Next Sprint
- *Planned item 1*
- *Planned item 2*

### Future Milestones
- *Milestone 1 - target date*
- *Milestone 2 - target date*

## Metrics

- *Velocity metric*
- *Burn-down chart link*
- *Other relevant metrics*

## Related Documents

- **[Plans Index](../plans/README.md)** - Active/completed/archived plans
- **[Plan Overview](../plans/plan-overview.md)** - Planning conventions and overview
- **[History Log](../history/history.log.md)** - Completed work history
- **[Product Backlog](../../2-product-foundation/product-backlog/backlog.md)** - Source of work items

---

*Update this document regularly (daily/weekly) to track progress.*

