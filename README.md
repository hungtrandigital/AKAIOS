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
# 1. Install dependencies
pnpm install

# 2. Copy env file
cp .env.example .env
# Edit .env: change JWT_SECRET, INTERNAL_API_KEY, etc.

# 3. Start shared infrastructure (Postgres, Redis, MinIO)
pnpm docker:up

# 4. Run database migrations + generate Prisma client
pnpm prisma:migrate
pnpm prisma:generate

# 5. Start backends in dev mode
pnpm dev
# Attendance API → http://localhost:3000
# Payroll API    → http://localhost:3001
```

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
│   │   ├── web-admin/        # (shared with payroll)
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

| Phase | Status | What |
| --- | --- | --- |
| Phase 0 — Architecture | Complete | 5 docs + 3 ADRs + 2 scaffolds |
| Phase 1 — Foundation | In progress | Monorepo + shared + backends + Docker |
| Phase 2 — Attendance | Pending | Mobile check-in/out + admin realtime |
| Phase 3 — Payroll | Pending | Engine + Excel export |
| Phase 4 — Customer Report | Pending | PDF/CSV generator |
| Phase 5 — Pilot | Pending | 1-2 projects live |
| Phase 6 — Scale-out | Pending | 13 remaining projects |

## Conventions

See [Coding Standards](3-technical/3.1-system-foundation/design-standards/coding-standards.md):
- TypeScript strict mode, no `any`
- Conventional commits
- Test coverage >= 90% (target 100% for domain logic)
- File size under 200 lines
- No AI references in commits or code

## License

Proprietary. AKAIUNSAN.
