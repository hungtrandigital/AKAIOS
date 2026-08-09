# Implementation Domain Specifications

## Overview

This document contains implementation-specific domain specifications. For high-level domain specs, see [3.1-system-foundation/architecture/domain-specs.md](../3.1-system-foundation/architecture/domain-specs.md).

## Implementation Details

### Domain Implementation

- **Identity/authentication:** Employee password and single-use SMS OTP login share
  the Attendance API. Admin password verification always creates a TOTP challenge;
  TOTP credentials are AES-256-GCM encrypted with a versioned key. Refresh-token
  families are hashed in PostgreSQL and rotated by compare-and-swap; replay revokes
  the family. Redis is limited to OTP/challenge state and abuse controls. Production
  operators are created through the idempotent `auth:provision-operator` command;
  demo aggregate seeds remain restricted to development and CI.
- **Attendance:** The authenticated employee's assignment is the write boundary.
  Check-in/out enforce project geofence distance, JPEG validation, server-owned
  Vietnam work dates, and conditional database writes. Device GPS accuracy is
  evidence only and cannot expand the configured radius. Overrides recompute
  status and worked/late/overtime minutes in one audited transaction.
- **Payroll:** Period calculation is serialized and atomic. Attendance reads use the
  tenant-bound internal API contract with a five-second transport timeout and
  validated calendar-date payloads; upstream availability and protocol failures
  map to 503/502. Money uses decimal-safe `Money` values, and the inclusive Vietnam
  month range covers the final calendar day. Monthly proration and meal allowance
  use explicit workday units; hourly regular/OT pay requires a positive hourly rate,
  and late caps apply per attendance day. Manual allowance overrides are explicit
  and survive recalculation until cleared. BHXH/PIT modes do not affect MVP net pay
  under ADR-003.
- **Reporting/storage:** Customer reports are tenant/project-authorized before
  generation, use tenant/project/report object keys, and return short-lived presigned
  URLs. Attendance photos live in a private bucket under date/record/random keys;
  access is governed by the scoped attendance record rather than a public path.
- **Operational constraints:** Production rejects mock/unimplemented SMS modes,
  requires independent JWT/internal/TOTP secrets, and starts fail-closed when an
  explicit supervisor membership is absent. No BullMQ worker, offline mobile queue,
  or automatic retention worker is shipped in this MVP.

### Data Models
- `project_supervisors` is an additive authorization join table with composite primary key
  `(projectId, userId)`, foreign keys to `projects` and `users`, and lookup indexes on
  `(userId, projectId)` and `assignedById`.
- The table is never backfilled from `shift_assignments`. Production starts fail-closed until
  BO/system admin explicitly provisions memberships; development seed mappings are explicit
  and idempotent.
- Every supervisor-scoped query includes both project tenant ownership and a live membership.
  Membership is read from the database per request and is not embedded in JWT claims.
- `payroll_lines.workdayUnits` persists fractional paid-day units so monthly
  proration, rule-derived meal allowance, and clearing an allowance override use
  the same half-day/holiday semantics. Migrated editable periods must be
  recalculated before clearing an old override.

### Service Implementation
- `project-access.ts` is the shared attendance authorization boundary used by projects,
  attendance records/overrides, employee DTOs, customer reports, and shift assignments.
- `/internal/attendance` validates a constant-time internal key plus explicit tenant,
  employee, and calendar-date bounds. It is private to the Compose network, bypasses
  the public global rate limiter, and returns only the payroll projection fields.
- Membership grant/revoke endpoints validate an active same-tenant supervisor and active
  BO/system-admin actor inside the same transaction as the membership mutation and audit row.
- Supervisor employee scope intentionally includes historical shift assignments within an
  authorized project, because payroll/attendance review requires prior-period records; project
  authority itself never comes from those assignments.
- Employee OTP challenge, cooldown, attempt cap, and lockout are atomic Redis state keyed by a
  phone hash. Redis stores only an HMAC of the OTP. Production supports configured SpeedSMS
  delivery and fails startup for mock or unimplemented provider modes.

## Related Documents

- **[Architecture Domain Specs](../3.1-system-foundation/architecture/domain-specs.md)** - High-level domain model
- **[API Contract](api-contract.md)** - API definitions
- **[Product Requirements](../../2-product-foundation/requirements/)** - Source requirements

---

*This document focuses on implementation details rather than abstract domain concepts.*
