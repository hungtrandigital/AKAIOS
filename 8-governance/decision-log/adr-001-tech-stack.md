# ADR-001: Tech Stack Choice for Attendance + Payroll Systems

**Status:** Accepted
**Date:** 2026-07-16
**Decider:** @fullstack-engineer (proposed), @user (approved)
**Related:** [Infrastructure](../../3-technical/3.1-system-foundation/infrastructure.md), [System Design](../../3-technical/3.1-system-foundation/design-standards/system-design.md)

## Context

Building 2 new systems (`attendance` + `payroll`) for AKAIUNSAN. Need to pick tech stack for: mobile app (employee check-in), backend API (Fastify/NestJS/etc.), web admin (React/Next.js/Vue), database (Postgres/MySQL/Mongo), object storage (S3/MinIO/local), container/deployment.

Requirements: 200 blue-collar users on personal phones (mostly Android), 15 project sites across Vietnam, BO staff on laptops, on-premise hosting, single server with no Kubernetes complexity.

## Considered Options

### Mobile Framework

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Flutter** (chosen) | Single codebase iOS + Android, native perf, strong camera/GPS libraries (`image_picker`, `geolocator`), dev pool available in VN | Dart less mainstream than JS | ✓ |
| React Native | JS ecosystem | Performance worse for camera-heavy apps, harder with native modules | |
| Native (Kotlin + Swift) | Best UX, best perf | 2x dev effort, 2x hire cost | |

**Decision:** Flutter for mobile.

### Backend API

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Node.js + Fastify + TS** (chosen) | Type-safe, async I/O great for I/O-bound attendance workloads, large ecosystem (JWT, ORM), dev pool in VN | Payroll calculations less natural than Python | ✓ |
| Python + FastAPI | Excellent for complex business logic (payroll), ML ecosystem for future analytics | Slightly slower for I/O, smaller dev pool in VN for this combo | |
| Go | Fast, low memory | Smaller dev pool, less ready-made HR/payroll libs | |
| NestJS (TS) | Opinionated structure | Slower than Fastify, more boilerplate | |

**Decision:** Node.js + Fastify for both attendance and payroll APIs.

### Web Admin

| Option | Verdict |
| --- | --- |
| **Next.js 14 (App Router)** (chosen) | Same TS ecosystem as backend, SSR for fast initial loads, easy Docker deploy, dev pool |
| Plain React + Vite | Less batteries-included (no API routes, no SSR) | |
| Vue 3 + Nuxt | Smaller VN dev pool | |

**Decision:** Next.js 14.

### Database

| Option | Verdict |
| --- | --- |
| **PostgreSQL 16** (chosen) | Strong relational integrity for HR/payroll, JSONB for flexible fields (geofence, custom config), mature, dev pool |
| MySQL | Similar but weaker JSON support, slightly less stdlib for migrations | |
| MongoDB | Schema flexibility but no real relations — wrong for HR | |

**Decision:** PostgreSQL 16.

### Object Storage (photos)

| Option | Verdict |
| --- | --- |
| **MinIO** (chosen) | S3-compatible, self-hosted on-prem, zero recurring cost, presigned URLs |
| S3 | Recurring cost, data leaves VN | |
| Local filesystem | Hard to scale, no presigned URLs, manual access control | |

**Decision:** MinIO.

### ORM

| Option | Verdict |
| --- | --- |
| **Prisma 5** (chosen) | Type-safe, great TS integration, generated types, migrations, dev pool |
| TypeORM | Less ergonomic, less type-safe | |
| Drizzle | Newer, smaller ecosystem | |
| Raw SQL | Faster but tedious for CRUD | |

**Decision:** Prisma 5.

### Cache / Queue

| Option | Verdict |
| --- | --- |
| **Redis 7** (chosen) | BullMQ for payroll jobs, session cache, ubiquitous |
| Memcached | No queue support | |
| No cache/queue | Premature optimization | |

**Decision:** Redis 7.

### Reverse Proxy / TLS

| Option | Verdict |
| --- | --- |
| **Caddy 2** (chosen) | Auto HTTPS, simple config, low memory |
| nginx | More familiar but manual cert renewal | |
| Traefik | More dynamic but overkill for our setup | |

**Decision:** Caddy 2.

## Decision

Adopt the stack:

- Mobile: Flutter 3.24 (Dart 3.5)
- Backend: Node.js 20 LTS + Fastify + TypeScript (strict mode)
- Web admin: Next.js 14 (App Router) + TypeScript
- Database: PostgreSQL 16
- Cache / queue: Redis 7 + BullMQ
- Object storage: MinIO (S3-compatible)
- ORM: Prisma 5
- Reverse proxy: Caddy 2
- Container: Docker Engine + Compose

## Consequences

**Positive:**
- Single TS codebase for backend + web admin, shared types via monorepo
- Flutter one build → iOS + Android (2 weeks saved vs native)
- All components on-prem friendly, no cloud dependencies
- Strong type safety (TS strict, Prisma generated types)
- Dev pool for all components available in VN

**Negative / Risks:**
- Payroll engine in TS less ergonomic than Python — mitigated with Decimal.js for exact money math
- Flutter binaries larger than React Native (~20 MB per app) — acceptable for internal app
- Single server = single point of failure — mitigated with daily backup + restore drill
- Need to set up monorepo (pnpm workspaces or Turborepo) — Phase 1 task

**Rollback path:**
Each layer is independently swappable:
- Backend → Python rewrite of specific services if needed
- Mobile → React Native rewrite if perf insufficient
- DB → MySQL migration possible (Prisma supports both)

ADR supersedes none. Superseded by none.

## Implementation Note — 2026-07-18

The accepted component choices remain, with these MVP refinements:

- Redis stores atomic OTP/TOTP challenge and abuse-control state plus readiness
  dependencies. Payroll runs synchronously and transactionally in the API; no
  BullMQ queue or worker is shipped.
- Caddy is the local HTTP origin reverse proxy. Cloudflare Tunnel terminates
  public TLS at the edge, so Caddy auto-HTTPS is not used in the shipped topology.
- “No cloud dependencies” applies only to durable application data/services.
  Public access and production SMS depend on Cloudflare Tunnel and SpeedSMS;
  GitHub Actions is the remote delivery gate.
