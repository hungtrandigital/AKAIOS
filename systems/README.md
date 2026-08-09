# Systems

This directory contains the PRD-EPIC-002 product code. The implementation is a
monorepo with two API bounded contexts, one shared web admin, one Flutter client,
and a shared runtime package.

## Repository Map

```text
systems/
├── attendance/
│   ├── backend/            # Fastify Attendance/Identity API
│   ├── mobile/             # Flutter employee client + Android/iOS scaffolds
│   └── docs/architecture.md
├── payroll/
│   ├── backend/            # Fastify Payroll API and calculation engine
│   ├── web-admin/          # Next.js admin for both systems
│   └── docs/architecture.md
└── shared/
    ├── src/auth/           # JWT, password, OTP/TOTP, refresh, RBAC
    ├── src/db/prisma/      # Canonical schema, migrations, seeds
    ├── src/storage/        # MinIO helpers
    ├── docker-compose.yml
    ├── docker-compose.dev.yml
    └── Caddyfile
```

## System Boundaries

| System | Owns | Entry points |
| --- | --- | --- |
| [Attendance](attendance/README.md) | Identity/auth, employees, projects, explicit supervisor scope, shifts, attendance, photos, customer reports | Fastify `:3000`, Flutter mobile |
| [Payroll](payroll/README.md) | Periods, lines, rules, synchronous calculation, approval, override, XLSX export | Fastify `:3001`, shared Next.js web `:3002` |
| [Shared](shared/README.md) | Prisma schema/migrations, auth/RBAC primitives, money/errors/health/storage, Compose/Caddy | Workspace package `@ak/shared` |

Payroll calculation reads Attendance through the tenant-bound private
`/internal/attendance` HTTP endpoint. Both APIs share PostgreSQL physically and
read the Identity shared kernel; Payroll does not directly query attendance
records during calculation.

## Current Gate

Local unit/coverage, fresh-service integration, live browser E2E, production
package/image builds, Compose/Caddy checks, Flutter analysis/tests, and Android
APK build pass. The 2026-08-09 dependency-security candidate is locally
validated; exact-SHA review, new remote CI, merge, iOS release signing and
physical-device validation, production operations, remaining MVP slice
acceptance, pilot, and scale-out remain pending.

## Canonical Documentation

- [System Overview](../3-technical/3.1-system-foundation/architecture/system-overview.md)
- [System Design](../3-technical/3.1-system-foundation/design-standards/system-design.md)
- [Domain Specs](../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [OpenAPI Contract](../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml)
- [Infrastructure](../3-technical/3.1-system-foundation/infrastructure.md)
- [Deployment Runbook](../3-technical/3.3-devops/server-steps.md)
