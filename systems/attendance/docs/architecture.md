# Attendance System — Architecture

**Status:** Phase 0 — Architecture defined (PRD-EPIC-002)
**Last Updated:** 2026-07-16
**Owner:** @system-architecture + @fullstack-engineer

## Cross-Cutting Reference

This system follows the shared architecture defined in:
- [Infrastructure](../../3-technical/3.1-system-foundation/infrastructure.md) — Tech stack, on-prem setup
- [System Design](../../3-technical/3.1-system-foundation/design-standards/system-design.md) — C4 diagrams
- [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md) — DDD aggregates and business rules
- [API Contracts](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml) — REST endpoints
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md) — TS/Flutter conventions

This document adds **attendance-specific** architectural details only.

## System Purpose

Manages employee check-in/out at 15 project sites via mobile app, with real-time visibility for supervisors and customer-facing reports.

## Components

### Mobile App (Flutter)

- **State management:** Riverpod 2.x
- **Auth:** Phone + password (or OTP); JWT in `flutter_secure_storage`
- **Camera/GPS plugins:** `image_picker`, `geolocator`
- **Offline support (Phase 3+):** queue failed check-ins, sync when online
- **Localization:** Vietnamese (default), English (optional)

**Key screens:**
1. Login (phone + password OR phone + OTP)
2. Today — show today's assignment (shift, project, time)
3. Check-in — button → request GPS → take photo → upload
4. Check-out — same flow
5. History — list of my recent check-ins/outs

### Backend API (Fastify)

**Routes (from openapi.yaml):**
- `/v1/auth/*` — login, OTP, refresh (shared with payroll)
- `/v1/employees/*` — CRUD
- `/v1/projects/*` — CRUD with geofence config
- `/v1/shifts/*` — shift template + assignment CRUD
- `/v1/attendance/check-in`, `/v1/attendance/check-out`, `/v1/attendance/records`
- `/v1/reports/customer` — generate customer report (PDF/CSV)
- `/internal/attendance` — internal endpoint for payroll

**Services:**
- `AttendanceService` — recordCheckIn(), recordCheckOut(), calculateStatus()
- `ScheduleService` — assignShift(), detectConflict()
- `GeoService` — GPS validation (BR-ATT-001)
- `PhotoService` — uploadToMinIO(), getPresignedUrl()
- `ReportService` — generateCustomerPDF(), generateCSV()

**Background Jobs (BullMQ):**
- `cleanup-stale-checkins` — daily, marks assignments without check-out after 4 hours (await supervisor manual add)
- `report-cleanup` — weekly, removes old report files from MinIO (>12 months)

### Data Layer

PostgreSQL tables (subset — see Domain Specs for full):
- `users` — shared with payroll (Identity context)
- `employees` — shared with payroll
- `tenants` — multi-tenant ready
- `projects` — with `latitude`, `longitude`, `geofenceRadiusMeters`
- `shifts` — shift templates
- `shift_assignments` — date × employee × project × shift
- `attendance_records` — check-in/out + GPS + photo URLs + status

## Key Business Rules (BR)

See [Domain Specs — Attendance](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#business-rules-attendance) for full list. Top rules encoded in code:

| ID | Rule | Implementation |
| --- | --- | --- |
| BR-ATT-001 | GPS in geofence | `GeoService.isWithinRadius()` called in `/v1/attendance/check-in` route |
| BR-ATT-002 | Late threshold | `AttendanceService.calculateStatus()` compares checkInAt to shift.startTime + lateThresholdMinutes |
| BR-ATT-004 | No double check-in/out | Service checks `attendanceRecord.checkInAt === null` before allowing check-in |
| BR-ATT-005 | Photo required | Schema validation in route rejects requests with `photoBase64 === null` |
| BR-ATT-007 | Project geofence required | Project create/update enforces `latitude && longitude && geofenceRadiusMeters` |
| BR-ATT-008 | Past date check-in | Route checks `assignment.date >= today - 7 days` |

## Deployment

- Single Docker container `attendance-api` (Fastify)
- Reads env vars: `DATABASE_URL`, `REDIS_URL`, `MINIO_*`, `JWT_SECRET`, `INTERNAL_API_KEY`
- Exposed via Caddy at `https://ak-tunnel.example.com/api/v1/attendance/*`
- MinIO bucket: `attendance-photos` (lifecycle: 12 months to cold storage)

## Internal API (for Payroll)

`GET /internal/attendance?employeeId=X&from=Y&to=Z`
- Auth: `X-Internal-API-Key` header
- Returns: list of `AttendanceRecord` for the period
- Used by Payroll system to fetch data for payroll calculation

## Testing Strategy

- Unit tests (Vitest): all services + value objects
- Integration tests (Vitest + testcontainers): all routes with real Postgres/Redis/MinIO
- E2E tests (Playwright): login → check-in → check-out flow
- Widget tests (Flutter): login screen, check-in flow
- Coverage: target ≥90%, 100% for `AttendanceService` and `GeoService`

## Development Workflow

```bash
# Run tests
pnpm test          # all
pnpm test:unit     # unit only
pnpm test:e2e      # Playwright

# Lint + typecheck
pnpm lint
pnpm typecheck

# DB migration
pnpm prisma migrate dev

# Build Docker image
docker build -t attendance-api:latest .
```

## Future Enhancements (out of MVP)

- Offline mode with retry queue
- Face recognition / liveness detection
- Push notifications via FCM
- Customer-facing real-time dashboard
- Geofence polygon (vs circle) for complex site shapes

## Related Documents

- [PRD-EPIC-002 Plan](../../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [System Design](../../3-technical/3.1-system-foundation/design-standards/system-design.md#attendance-system-components)
