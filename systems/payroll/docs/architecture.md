# Payroll System — Architecture

**Status:** Implemented; local remediation/review gate GO (PRD-EPIC-002)

**Last Updated:** 2026-07-18

**Owner:** @system-architecture + @fullstack-engineer

## Cross-Cutting References

- [Infrastructure](../../../3-technical/3.1-system-foundation/infrastructure.md)
- [System design](../../../3-technical/3.1-system-foundation/design-standards/system-design.md)
- [Payroll domain specs](../../../3-technical/3.1-system-foundation/architecture/domain-specs.md#3-payroll-bounded-context)
- [OpenAPI contract](../../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- [ADR-003: no VN compliance calculation in MVP](../../../8-governance/decision-log/adr-003-skip-vn-compliance-mvp.md)

## Purpose and Boundaries

Payroll lets authorized BO/admin users open a monthly period, calculate employee
lines from Attendance, review audited overrides, approve/mark paid/lock the
period, and export Excel. It reads Attendance through the internal API and owns
payroll periods, lines, rules, and payroll audit events.

BHXH/PIT calculation is outside the MVP. No executable compliance mode may alter
gross or net pay under ADR-003.

## Components

### Payroll API

Fastify mounts permission-gated routes below `/v1/payroll`:

- `GET/POST /periods`
- `GET /periods/:id`
- `POST /periods/:id/calculate`
- `POST /periods/:id/approve`
- `POST /periods/:id/mark-paid`
- `POST /periods/:id/lock`
- `GET /periods/:id/export`
- `POST /lines/:id/override`
- `GET/POST /rules`

Every object lookup includes the authenticated tenant. BO and system-admin
permissions are checked at the route boundary; raw IDs cannot cross tenants.

### Calculation path

Calculation is synchronous and transactional in the API; no BullMQ worker is
shipped in the MVP.

1. Serialize calculation by locking the period and verify that its state permits
   calculation.
2. Request the inclusive Vietnam calendar range from Attendance using the
   internal API key.
3. Use the pure engine for working days, prorated base, OT, late penalty, and
   rule-derived allowances.
4. Re-read existing lines inside the transaction so concurrent overrides cannot
   be lost.
5. Preserve only fields explicitly marked as manual overrides, upsert decimal
   values, and atomically set the period to `calculated`.
6. On failure, roll back the lines and period state together.

Money uses decimal-backed value objects and string API inputs; JavaScript binary
floating point is not used for persisted payroll arithmetic.

### Overrides and audit

Overrides are allowed only in valid period states and are tenant scoped. Advance,
other deductions, and allowances are validated as non-negative decimal strings.
`allowancesOverridden` distinguishes a manual allowance from rule-derived data so
later recalculation preserves only intentional edits. Clearing that marker
recomputes the allowance from the active rule. Each payroll-line override records
previous/new values and the actor; calculation, approval, export, and rule updates
also emit audit rows.

Existing installations must reconcile historical manual allowance rows after
migration; see the deployment runbook before recalculating migrated periods.

### Web admin

The shared Next.js admin exposes `/login`, `/login/2fa`, `/attendance`,
`/payroll`, `/projects`, `/employees`, `/executive`, and `/admin/rbac`. Browser
API calls remain same-origin and Next rewrites them to the internal Attendance and
Payroll service names in production.

## State Machine

`open → calculating → calculated → approved → paid → locked`

- Calculate is explicit and serialized.
- Overrides are rejected after approval.
- Approval requires a fully calculated period.
- Paid/locked transitions require their dedicated permissions.
- Calculate and approve transitions plus line overrides are audited. Mark-paid
  and lock currently persist state/timestamps but do not yet emit `AuditLog`; do
  not treat the payroll audit trail as transition-complete.

## Core Invariants

- Attendance range includes the final calendar day of the month.
- Weekend and holiday categories are mutually exclusive; OT is not double-counted.
- Gross/net and deductions remain internally consistent after calculate or override.
- Concurrent calculation/override cannot silently discard a committed edit.
- Tenant and RBAC predicates apply to every payroll read/mutation.
- Compliance deductions remain zero in the MVP.

## Validation

- Payroll unit tests: 107/107.
- Fresh-database integration: 1/1, including concurrent calculation/override.
- Coverage: 98.76% statements/lines, 94.39% branches, and 100% functions.
- Independent payroll review: GO with no blocking findings.
- Live web-admin Playwright: 7/7 against fresh migrations and seeded TOTP admins.
- Production API and web-admin images build successfully.

## Deployment

Use the shared PostgreSQL/Redis infrastructure, Payroll Dockerfile, web-admin
Dockerfile, Compose stack, and Caddy configuration. Apply every committed
migration, run the mandatory idempotent RBAC seed, and reconcile legacy manual
allowance overrides before recalculation.

Follow the [on-premise runbook](../../../3-technical/3.3-devops/server-steps.md).

## Future Enhancements

- VN compliance engine under a separately approved scope/ADR.
- Bank-transfer integration and dual-control payment workflow.
- Bulk override tooling and multi-period comparison reports.
- Asynchronous calculation only if a future scale profile requires it and adds
  durable job/idempotency semantics.
