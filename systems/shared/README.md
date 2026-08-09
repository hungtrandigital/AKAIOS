# @ak/shared — Shared Code & Infrastructure

**Location:** `systems/shared/`
**Status:** Active shared runtime for the Attendance, Payroll, and web services

## Purpose

Two things in this directory:

1. **`@ak/shared` package** (`src/`) — shared TypeScript code between attendance-api and payroll-api
2. **Shared deployment infrastructure** (`docker-compose.yml`, platform overrides, `Caddyfile`) — runs the APIs, web admin, data services, migration job, and reverse proxy on one server

## Shared Infrastructure Files

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Eight-service production stack: attendance-api + payroll-api + web-admin + one-shot db-migrate + Postgres + Redis + MinIO + Caddy |
| `docker-compose.dev.yml` | Dev-only infra: Postgres + Redis + MinIO (run backends locally via `pnpm dev`) |
| `docker-compose.windows.yml` | Required thin override for Windows Docker Desktop local/UAT: stable named volumes and loopback-only host ports |
| `Caddyfile` | HTTP origin proxy: default application route plus explicit `CADDY_STORAGE_HOST` → MinIO; Cloudflare terminates public TLS |

Application Dockerfiles live with the code they build: the two backend Dockerfiles
are under `systems/attendance/backend/` and `systems/payroll/backend/`, while the
web-admin Dockerfile is under `systems/payroll/web-admin/`.

## @ak/shared Package

**Workspace package** consumed by both backends.

### Provides

- **Prisma schema** for the entire database (single source of truth) — see `src/db/prisma/schema.prisma`
- **Generated Prisma Client** (types + query API) — `src/db/client.ts`
- **Auth utilities** — JWT issue/verify, password hashing (Argon2id), OTP — `src/auth/`
- **Common types** — Value objects (GPSCoordinate, Money), error classes — `src/types/`
- **Domain enums** — UserRole, AttendanceStatus, PayrollPeriodStatus, etc.

### Exports

```typescript
// Database
import { prisma, Prisma } from '@ak/shared/db'

// Auth
import { issueAccessToken, verifyAccessToken } from '@ak/shared/auth/jwt'
import { hashPassword, verifyPassword } from '@ak/shared/auth/password'
import { generateOtp, getSmsMode } from '@ak/shared/auth/otp'

// Types
import { UserRole, AttendanceStatus, PayrollPeriodStatus } from '@ak/shared/types'
import { ValidationError, NotFoundError, ConflictError } from '@ak/shared/types/errors'
import { GPSCoordinate, Money } from '@ak/shared/types'
```

### File Layout

```
shared/
├── README.md                       # This file
├── package.json                    # @ak/shared workspace package
├── tsconfig.json
├── docker-compose.yml              # Production stack
├── docker-compose.dev.yml          # Dev infra only
├── docker-compose.windows.yml      # Windows local/UAT override
├── Caddyfile                       # Reverse proxy
├── src/
│   ├── index.ts                    # Public exports
│   ├── db/
│   │   ├── client.ts               # Singleton Prisma client
│   │   └── prisma/
│   │       ├── schema.prisma       # Schema (all entities)
│   │       └── migrations/         # Immutable production migrations
│   ├── auth/
│   │   ├── jwt.ts                  # JWT issue/verify
│   │   ├── password.ts             # Argon2id wrapper
│   │   └── otp.ts                  # Redis-backed OTP flow and SMS provider selection
│   └── types/
│       ├── index.ts                # Re-exports
│       ├── errors.ts               # Domain error classes
│       ├── gps.ts                  # GPSCoordinate value object
│       └── money.ts                # Money value object (Decimal-based)
```

## Setup

```bash
# From repo root
pnpm install

# Generate Prisma client (after editing schema.prisma)
pnpm prisma:generate

# Create a development migration after changing the schema
pnpm prisma:migrate

# Apply committed migrations in CI/staging/production
pnpm prisma:migrate:deploy
```

The initial migration is the baseline for fresh databases. Do not edit an applied migration; add a new timestamped migration through `pnpm prisma:migrate` instead.

### Controlled-UAT seed behavior

Run the aggregate dataset only with an explicit controlled-UAT opt-in:

```bash
ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:all
```

Without that process-local flag, the development, demo-account, and attendance
seed scripts refuse to write. The aggregate seed creates five fixed demo
employees and gives each one an open assignment on the current Vietnam date plus
13 following Mon–Sat dates. Historical attendance generation stops at yesterday,
so the day under test stays open. Rerunning the seed keeps active employee/date
assignments unique and preserves every existing UAT attendance record, including
records that have since moved into the historical window. This dataset is
forbidden for production or pilot data.
The named credential list lives in [DEMO_ACCOUNTS.md](../../DEMO_ACCOUNTS.md).
Its demo-account stage also repairs the documented password hash and active
status for reserved demo identities on rerun, after the ownership/linkage
collision preflight; it does not provision pilot or production operators.

Windows Docker Desktop must merge the base and Windows files; using the base file
alone retains Linux `/data` bind mounts and is unsupported. The canonical
PowerShell commands, seed-only reset boundary, and Cloudflare handoff are in the
[Windows Docker deployment runbook](../../3-technical/3.3-devops/windows-docker-deployment.md).

## Conventions

- New exports should be typed; remaining explicit-`any` warnings are tracked deviations
- Keep new files at or below 200 lines where practical; existing larger files require incremental refactoring
- Pure utilities (no I/O outside db/auth) → easy to test in isolation
- No business logic here — that's per-system (attendance, payroll)

## Related Documents

- [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md) — DDD model that Prisma schema implements
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)
- [Docker Compose production stack](docker-compose.yml)
- [Dev docker-compose](docker-compose.dev.yml)
- [Windows Docker local/UAT override](docker-compose.windows.yml)
- [Windows Docker deployment](../../3-technical/3.3-devops/windows-docker-deployment.md)
