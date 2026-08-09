# Attendance System — Architecture

**Status:** Implemented; local remediation/review gate GO (PRD-EPIC-002)

**Last Updated:** 2026-07-18

**Owner:** @system-architecture + @fullstack-engineer

## Cross-Cutting References

- [Infrastructure](../../../3-technical/3.1-system-foundation/infrastructure.md)
- [System design](../../../3-technical/3.1-system-foundation/design-standards/system-design.md)
- [Domain specs](../../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [OpenAPI contract](../../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- [Coding standards](../../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)

## Purpose and Boundaries

Attendance owns employee check-in/out, shifts, project geofences, supervisor
membership, attendance overrides, photos, and customer reports. Payroll reads a
tenant-scoped attendance projection through the authenticated internal API; it
does not write attendance data.

## Components

### Flutter mobile app

- Riverpod providers live outside the presentation layer.
- Employee login supports password or Redis-backed SMS OTP.
- Native access and refresh tokens are stored with `flutter_secure_storage` and
  rotated through a single-flight refresh path. Logout removes both tokens.
- Check-in/out obtains GPS accuracy and a bounded JPEG, then sends the photo as
  base64 JSON to the API. The API owns geofence enforcement and MinIO storage.
- Android and iOS native projects include camera/location permissions. Android
  permits cleartext only in debug; release builds require HTTPS and a real signing
  configuration. iOS permits insecure networking only for localhost development.
- Vietnamese and English localization sources are generated from ARB files.

### Attendance API

Fastify mounts these route groups:

- `/v1/auth`: employee password/OTP login, admin password challenge, TOTP verify,
  refresh, logout, and current-user lookup.
- `/v1/attendance`: today's assignment, check-in, check-out, and scoped records.
- `/v1/projects`: scoped project reads/creation plus audited supervisor
  membership grant/revoke.
- `/v1/employees`, `/v1/shifts`, `/v1/reports`, and `/v1/rbac`: permission-gated
  administration and reporting.
- `/internal/attendance`: service-to-service payroll projection protected by the
  internal API key and tenant/period inputs.

Authorization combines RBAC permissions, tenant predicates, and explicit
`ProjectSupervisor` membership. Supervisor-facing responses use safe DTOs and do
not expose password hashes, bank data, or unrelated employee PII.

### Auth and concurrency state

- Admin TOTP secrets are AES-256-GCM encrypted with versioned keys.
- Redis stores single-use employee OTP challenges and abuse-control counters.
- Refresh tokens are hashed in PostgreSQL and rotated with compare-and-swap;
  replay revokes the token family.
- Check-in/out and override operations use database transactions and conditional
  writes so duplicate requests cannot create incoherent records.

### Storage and data

PostgreSQL is shared physically with Payroll but bounded by tenant-aware models.
Relevant tables include tenants, users, TOTP credentials, refresh tokens,
employees, projects, project supervisors, shifts, assignments, attendance
records, generated reports, permissions, role mappings, and audit logs.

Check-in photo keys use a date/attendance-record/random UUID layout inside the
private `attendance-photos` bucket. Customer-report keys include tenant, project,
and report IDs. The API validates decoded JPEG size/type and returns short-lived
presigned access rather than public object paths; authorization is enforced before
records or report metadata are returned.

No BullMQ worker is shipped in the MVP. Cleanup/retention automation remains a
future operational enhancement and must not be assumed by the deployment.

## Core Invariants

- Server-side Haversine distance must satisfy the configured project geofence.
  Device accuracy is retained as evidence/telemetry and never expands or bypasses
  that radius; no separate accuracy threshold is enforced in the MVP.
- The server computes Vietnam work dates and shift boundaries; mobile timestamps
  are evidence, not authority.
- A shift assignment can have at most one coherent check-in/check-out sequence.
- Checkout and overrides recompute status, worked minutes, late minutes, and OT
  minutes together.
- Manual changes require role/project scope and produce an audit record.
- Customer reports and their object keys are tenant/project scoped. Photo records
  are tenant/project-authorized through attendance data even though their private
  bucket keys do not repeat those IDs.

## Validation

- Attendance unit tests: 43/43.
- Fresh-database integration: 7/7, including auth replay, project scope, and
  attendance concurrency.
- Coverage: 100% statements/lines/functions and 96.15% branches.
- Flutter 3.24.5: localization generation, analysis, 3/3 tests, and Android debug
  APK build pass. iOS native compilation still requires a full Xcode/CocoaPods
  and signing environment.
- Live web-admin E2E: 7/7 against fresh migrations and seeded TOTP users.

## Deployment

The production stack uses the Attendance Dockerfile, shared Compose file, Caddy,
PostgreSQL 16, Redis 7, and MinIO. Required security configuration includes
independent JWT/internal/TOTP keys, trusted-proxy boundaries, HTTPS, and SpeedSMS
credentials; production refuses mock SMS mode.

Follow the [on-premise runbook](../../../3-technical/3.3-devops/server-steps.md).

## Future Enhancements

- Offline retry queue with explicit conflict semantics.
- Push notifications and scheduled retention workers.
- Face/liveness checks and polygon geofences.
- Customer-facing real-time portal.
