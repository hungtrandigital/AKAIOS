# AKAIUNSAN — Attendance + Payroll Systems

**PRD-EPIC-002.** This monorepo hosts the internal attendance and payroll systems for AKAIUNSAN, a Vietnamese cleaning service company with ~200 employees across 15 project sites.

## What's Inside

| System | Purpose | Tech |
| --- | --- | --- |
| [`systems/attendance/`](systems/attendance/README.md) | Mobile check-in/out (GPS + photo), customer-facing reports | Flutter + Fastify |
| [`systems/payroll/`](systems/payroll/README.md) | Monthly payroll calculation, web admin, Excel export | Fastify + Next.js |
| [`systems/shared/`](systems/shared/README.md) | Prisma schema, auth utilities, common types, docker-compose stack | TypeScript |

## Quick Start

```bash
# Install dependencies and copy the environment template.
pnpm install --frozen-lockfile
cp .env.example .env

# Edit .env once for the development Compose endpoints:
# DATABASE_URL=postgresql://ak_user:dev_password@localhost:5433/ak_main?schema=public
# REDIS_URL=redis://localhost:6380
# MINIO_ENDPOINT=localhost:9100
# MINIO_ROOT_USER=ak_admin
# MINIO_ROOT_PASSWORD=dev_minio_password
# Generate and paste independent JWT_SECRET and INTERNAL_API_KEY values with
# `openssl rand -hex 32`, plus TOTP_ENCRYPTION_KEY with `openssl rand -base64 32`.
# Do not regenerate these values in each terminal.
# Optional local-only admin test mode: set DEV_FIXED_ADMIN_2FA_CODE to exactly
# four digits. Leave it unset for real TOTP and every shared,
# staging, or production environment; the API refuses this flag outside dev/test.

# Start development PostgreSQL, Redis, and MinIO.
pnpm docker:up:dev

# Root scripts do not auto-load .env. Load the same file for setup.
set -a; source .env; set +a
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm --filter @ak/shared db:seed:all

# These commands block. Run each in a separate terminal after loading the same
# .env with `set -a; source .env; set +a`.
pnpm --filter @ak/attendance-api dev     # http://localhost:3000
pnpm --filter @ak/payroll-api dev        # http://localhost:3001
pnpm --filter @ak/payroll-web-admin dev  # http://localhost:3002
```

The web-admin development server binds to loopback by default. This prevents a
LAN client from reaching the local fixed-verifier path through the Next.js proxy;
the production start command and deployment topology are unchanged.

The aggregate seed is development/demo-only. Production bootstrap, TOTP
enrollment, migrations, and supervisor provisioning are covered by the
[on-premise runbook](3-technical/3.3-devops/server-steps.md).

When `DEV_FIXED_ADMIN_2FA_CODE` is set locally, admin email/password, the opaque
Redis challenge, attempt limits, and session issuance remain enforced; only the
second-factor verifier is replaced. The configured value is intentionally absent
from committed files. The API binds to loopback and rejects fixed-mode admin auth
requests whose effective client address is not loopback.

## Documentation

- **Architecture:** [`3-technical/3.1-system-foundation/`](3-technical/3.1-system-foundation/)
  - [Infrastructure](3-technical/3.1-system-foundation/infrastructure.md) — On-prem setup, server spec, cost
  - [System Design](3-technical/3.1-system-foundation/design-standards/system-design.md) — C4 diagrams
  - [Domain Specs](3-technical/3.1-system-foundation/architecture/domain-specs.md) — DDD model + business rules
  - [API Contracts](3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml) — OpenAPI 3.1
  - [Coding Standards](3-technical/3.1-system-foundation/design-standards/coding-standards.md) — TS/Flutter conventions
- **Plan:** [`3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md`](3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- **ADRs:** [`8-governance/decision-log/`](8-governance/decision-log/)
  - [ADR-001: Tech Stack](8-governance/decision-log/adr-001-tech-stack.md)
  - [ADR-002: On-Premise](8-governance/decision-log/adr-002-on-premise.md)
  - [ADR-003: Skip VN Compliance at MVP](8-governance/decision-log/adr-003-skip-vn-compliance-mvp.md)

## Repository Structure

```
.
├── package.json              # Root workspace + scripts
├── pnpm-workspace.yaml
├── turbo.json                # Turborepo config
├── .env.example              # Copy to .env
├── systems/
│   ├── shared/               # @ak/shared + shared docker-compose/Caddy
│   │   ├── src/              # Prisma schema, auth, types
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── Caddyfile
│   ├── attendance/           # @ak/attendance — mobile + API
│   │   ├── backend/          # @ak/attendance-api
│   │   │   ├── Dockerfile
│   │   │   └── src/
│   │   └── mobile/           # @ak/attendance-mobile (Flutter)
│   └── payroll/              # @ak/payroll — API + web admin
│       ├── backend/          # @ak/payroll-api
│       │   ├── Dockerfile
│       │   └── src/
│       └── web-admin/        # @ak/payroll-web-admin (Next.js)
├── 3-technical/              # Architecture docs
├── 8-governance/             # ADRs, decisions, risks
└── ...
```

## Status

The 2026-07-18 remediation tree passes the local implementation gate: unit and
coverage suites, fresh-service integration, live browser E2E, production builds
and images, configuration validation, Flutter analysis/tests, and an Android
debug APK. Independent attendance/auth/mobile and payroll reviews returned GO.

The remediation is preserved at commit `056a769` and all five jobs in
[GitHub Actions run 29670131275](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275)
pass, including the Android APK artifact. The release is not final: SHA-pinned
re-review is published with a GO verdict, but native iOS compilation/signing,
the 1–2 project pilot, remaining
MVP slice acceptance, and scale-out are still pending. See the canonical
[progress report](3-technical/3.2-implementation/status/progress.md).

## Conventions

See [Coding Standards](3-technical/3.1-system-foundation/design-standards/coding-standards.md):
- TypeScript strict mode; eliminating the remaining explicit-`any` lint warnings is a target
- Conventional commits
- Test coverage >= 90% (target 100% for domain logic)
- File size under 200 lines is a target; the current documented deviations still require refactoring
- No AI references in commits or code

## License

Proprietary. AKAIUNSAN.
