# @ak/shared — Shared Code & Infrastructure

**Location:** `systems/shared/`
**Status:** Phase 1 active

## Purpose

Two things in this directory:

1. **`@ak/shared` package** (`src/`) — shared TypeScript code between attendance-api and payroll-api
2. **Shared deployment infrastructure** (`docker-compose.yml`, `docker-compose.dev.yml`, `Caddyfile`) — runs both backends + databases on one server

## Shared Infrastructure Files

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Production stack: attendance-api + payroll-api + Postgres + Redis + MinIO + Caddy |
| `docker-compose.dev.yml` | Dev-only infra: Postgres + Redis + MinIO (run backends locally via `pnpm dev`) |
| `Caddyfile` | Reverse proxy config (routes to both backends, TLS termination) |

The Dockerfiles live with each backend (`systems/attendance/backend/Dockerfile` and `systems/payroll/backend/Dockerfile`), not here — they belong with the code they build.

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
│   │   └── otp.ts                  # OTP generation (mock mode in Phase 1)
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

## Conventions

- All exports must be typed (no `any`)
- Each file ≤200 lines
- Pure utilities (no I/O outside db/auth) → easy to test in isolation
- No business logic here — that's per-system (attendance, payroll)

## Related Documents

- [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md) — DDD model that Prisma schema implements
- [Coding Standards](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)
- [Docker Compose production stack](docker-compose.yml)
- [Dev docker-compose](docker-compose.dev.yml)
