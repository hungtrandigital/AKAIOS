# System Design — AKAIUNSAN Attendance + Payroll

**Status:** Reconciled with the 2026-07-18 implementation tree

**Last Updated:** 2026-07-18

**Owner:** @system-architecture + @fullstack-engineer

**Related:** [Infrastructure](../infrastructure.md), [Domain Specs](../architecture/domain-specs.md)

## Context

Attendance owns employee authentication, projects, explicit supervisor scope,
shifts, check-in/out, photos, and customer reports. Payroll owns periods, rules,
calculation, approval, overrides, and XLSX export. Both run as separate APIs over
one physical PostgreSQL schema; Identity is a shared kernel.

```mermaid
flowchart LR
    Employee[Employee mobile user] --> Attendance[Attendance system]
    Ops[Supervisor / BO / admin] --> Web[Shared web admin]
    Web --> Attendance
    Web --> Payroll[Payroll system]
    Attendance --> SMS[SpeedSMS]
    Payroll -->|tenant-bound internal HTTP read| Attendance
```

The shipped mobile flow covers login, today's assignment, GPS/photo check-in/out,
and refresh rotation. Mobile history, offline retry, and push notifications remain
future work. The web admin is an internal operations surface, not a customer portal.

## Container View

```mermaid
flowchart TB
    CF[Cloudflare Tunnel / public TLS] --> Caddy[Caddy HTTP origin]
    Caddy -->|main host default| Web[web-admin :3002]
    Caddy -->|/api/attendance/v1/*| Attendance[attendance-api :3000]
    Caddy -->|storage host| MinIO[(MinIO :9000)]
    Web --> Attendance
    Web --> Payroll[payroll-api :3001]
    Payroll -->|/internal/attendance| Attendance
    Attendance --> PG[(PostgreSQL 16)]
    Payroll --> PG
    Attendance --> Redis[(Redis 7)]
    Attendance --> MinIO
```

- Caddy preserves one main hostname for web and mobile; it strips only the
  public `/api/attendance` prefix before forwarding mobile `/v1/*` requests.
- Next.js server-side rewrites reach both APIs by Compose service name.
- Payroll calculation is synchronous and transactional. Redis is not a job queue.
- The internal projection is registered at `/internal/attendance`, requires the
  shared internal key and explicit tenant/employee/date inputs, and is not routed
  by the public Caddy configuration.

## Implemented Component Map

### Attendance

| Area | Implemented boundary |
| --- | --- |
| HTTP routes | `src/routes/{auth,attendance,employees,projects,shifts,reports,rbac,internal}.ts` |
| Authorization | shared permission middleware plus `project-access.ts` tenant/membership predicates |
| Attendance logic | `attendance-service.ts`, `schedule-service.ts`, `geo-service.ts` |
| Media/reporting | `photo-service.ts` and `services/reports/customer-report.ts` |
| Persistence | Prisma queries in routes/services; there is no separate repository directory in this MVP |
| Mobile | Flutter `core`, `features/auth`, and `features/attendance` with Riverpod/Dio/secure storage |

### Payroll

| Area | Implemented boundary |
| --- | --- |
| HTTP routes | `src/routes/payroll.ts` with permission and tenant checks |
| Orchestration | `payroll-service.ts` serializes and commits period calculation atomically |
| Pure engine | `engine/{calculator,holidays,working-days,vietnam-tax}.ts`; compliance modes are disabled for MVP outcomes |
| Attendance input | `clients/attendance-client.ts` calls the tenant-bound Attendance internal endpoint |
| Export | `excel-exporter.ts` returns XLSX binary |
| Persistence | Prisma queries in routes/services; no BullMQ worker or repository abstraction is shipped |

The conceptual aggregates in the domain specs guide invariants; they are not a
claim that every aggregate is implemented as a class with the same methods.

## Critical Data Flows

### Employee check-in/out

1. Mobile authenticates and stores native access/refresh tokens in secure storage.
2. Mobile sends assignment ID, GPS evidence, and bounded JPEG data.
3. Attendance verifies employee/assignment/project scope and Haversine distance.
4. A conditional transaction creates/updates one coherent attendance record.
5. The private MinIO key is persisted; authorized reads receive a short-lived URL.

### Payroll calculation

1. An authorized actor claims an open/calculated period by compare-and-set.
2. Payroll loads active same-tenant employees and rules.
3. For each employee, Payroll calls Attendance with `tenantId`, `employeeId`, and
   the inclusive Vietnam date range using `X-Internal-API-Key`.
4. Decimal-safe calculation preserves explicit allowance overrides.
5. Lines, totals, state, and calculation audit are committed atomically.

### Admin authentication

1. Password verification and active-account checks create an opaque TOTP challenge.
2. The challenge is stored/attempt-limited in Redis and delivered by an HTTP-only cookie.
3. Successful TOTP verification issues access and rotating refresh credentials.
4. Refresh replay revokes the complete token family.

## Shipped Patterns and Deferred Patterns

| Shipped | Deferred / not claimed |
| --- | --- |
| Separate Attendance and Payroll APIs | Redis pub/sub domain events |
| Shared PostgreSQL Identity kernel | BullMQ/asynchronous payroll jobs |
| Internal HTTP attendance projection | Dedicated repository layer |
| Permission + tenant + project-membership authorization | Full CQRS/event sourcing |
| Transactional/conditional state transitions | Multi-host HA/Kubernetes |

## Security Boundaries

| Boundary | Current controls |
| --- | --- |
| Internet → origin | Cloudflare public TLS and tunnel; Caddy origin routing |
| Mobile/web → APIs | JWT, refresh rotation, production global rate limit, auth-specific abuse controls |
| Supervisor → project data | Explicit active `ProjectSupervisor` membership plus tenant predicates |
| Payroll → Attendance | Private Compose network, shared internal key, required tenant/employee/date scope |
| APIs → PostgreSQL/Redis/MinIO | Service credentials and private/local bindings |

No source-IP allowlist is implemented inside the Attendance internal route. The
Compose network and key are current controls; network policy hardening is an
operator deployment responsibility.

## Validation Boundary

The implementation is locally validated by unit/coverage suites, real-service
integration, live web E2E, production package/image builds, configuration checks,
and Android analysis/tests/APK. Native iOS, load/SLO testing, production tunnel,
backup/restore, immutable remote CI, and pilot acceptance remain open gates.

## Related Documents

- [Infrastructure](../infrastructure.md)
- [Domain Specs](../architecture/domain-specs.md)
- [OpenAPI Contract](../architecture/api-contracts/openapi.yaml)
- [Coding Standards](coding-standards.md)
- [Attendance Architecture](../../../systems/attendance/docs/architecture.md)
- [Payroll Architecture](../../../systems/payroll/docs/architecture.md)
