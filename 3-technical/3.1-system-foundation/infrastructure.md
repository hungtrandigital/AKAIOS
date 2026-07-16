# Infrastructure — AKAIUNSAN Attendance + Payroll Systems

**Status:** Active — Phase 0 deliverable for PRD-EPIC-002
**Last Updated:** 2026-07-16
**Owner:** @system-architecture
**Related ADRs:** [adr-001-tech-stack](../architecture/api-contracts/../../../../8-governance/decision-log/adr-001-tech-stack.md), [adr-002-on-premise](../architecture/api-contracts/../../../../8-governance/decision-log/adr-002-on-premise.md)

## Overview

This document describes the on-premise infrastructure hosting the **attendance** and **payroll** systems for AKAIUNSAN. Both systems share the same infrastructure (single server, single Postgres database, shared authentication) but are independently deployed as separate Docker Compose services to enable independent scaling and reuse.

## Hosting Model

**Decision:** On-premise single server (user-approved). See ADR-002.

- **Why on-prem:** Data residency in VN, low latency to 15 project sites, no recurring cloud cost, full control over backups.
- **Trade-off:** We own hardware reliability, network uptime, and physical security. Mitigations: redundant storage, Cloudflare Tunnel for failover-friendly remote access, quarterly backup restore drills.

## Server Specification (Recommended Baseline)

| Component | Spec | Rationale |
| --- | --- | --- |
| OS | Ubuntu 22.04 LTS | Long support, mature Docker support, easy to hire sysadmins in VN |
| CPU | 4 vCPU (Intel Xeon or AMD EPYC) | Sufficient for backend + Postgres + MinIO concurrent load at 200 users |
| RAM | 16 GB | Postgres 4 GB + Redis 1 GB + MinIO 2 GB + Backend 1 GB + Web 1 GB + headroom 7 GB |
| Storage | 500 GB SSD (NVMe preferred) | Postgres ~50 GB/year at 200 users × 30 check-ins/day × 12 months + photos ~200 GB/year |
| Backup storage | External USB HDD 1 TB (rotated weekly) OR 1× backup VPS (e.g., Vultr $6/mo) | Off-site backup for disaster recovery |
| Network | Static IP (preferred) OR dynamic + Cloudflare Tunnel | Mobile app needs stable address |
| Power | UPS 1000 VA minimum | Survive 30-min outages without data loss |

**Cost estimate (one-time + monthly):**
- Server hardware: ~$800-1500 USD one-time (refurbished Dell OptiPlex or used server)
- UPS: ~$100 USD one-time
- Internet: existing office connection (assumed)
- Cloudflare Tunnel: free (or $5/mo for advanced features)
- Total recurring: ~$0-10 USD/month

## Tech Stack

| Layer | Technology | Version | Why |
| --- | --- | --- | --- |
| Mobile (employee) | Flutter | 3.24+ (Dart 3.5+) | Single codebase iOS + Android, strong camera/GPS libraries |
| Backend API | Node.js + Fastify + TypeScript | Node 20 LTS | Async I/O, large ecosystem, type-safe, fast iteration |
| Web admin | Next.js | 14.x (App Router) | React + SSR + TS, fast build, easy Docker deploy |
| Database | PostgreSQL | 16 | Relational integrity for HR/payroll, JSONB for flexible fields |
| ORM | Prisma | 5.x | Type-safe queries, migrations, strong TS integration |
| Cache / queue | Redis | 7 | Sessions, BullMQ for payroll jobs |
| Object storage | MinIO | RELEASE.2024+ | S3-compatible, self-hosted, on-prem friendly |
| Reverse proxy + TLS | Caddy | 2.x | Auto HTTPS, simple config, low memory |
| External access | Cloudflare Tunnel | free tier | Static URL, no port forwarding, DDoS protection |
| Container runtime | Docker Engine + Compose | 24+ / v2 | Standard, well-documented |
| CI | GitHub Actions or Gitea Actions | latest | Per repo host |

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Internet                                                            │
└────────┬──────────────────────────────────────┬─────────────────────┘
         │ HTTPS                               │ HTTPS
         │ (api.ak.internal)                    │ (admin.ak.internal)
         │                                      │
┌────────▼──────────────────────────────────────▼─────────────────────┐
│  Cloudflare Tunnel (ak-tunnel)                                       │
│  - Free, no port forwarding on office router                        │
│  - DDoS protection                                                   │
│  - TLS termination                                                   │
└────────┬────────────────────────────────────────────────────────────┘
         │ HTTP (internal)
┌────────▼────────────────────────────────────────────────────────────┐
│  Caddy (port 80, 443) on 127.0.0.1                                   │
│  - Routes /api/*  → backend:3000                                     │
│  - Routes /*      → web-admin:3001                                   │
│  - Auto-renew Let's Encrypt certs via Cloudflare DNS challenge      │
└────────┬──────────────────────────────────────┬─────────────────────┘
         │                                      │
┌────────▼──────────────┐              ┌───────▼──────────────┐
│  Backend (Fastify)    │              │  Web Admin (Next.js)  │
│  Port 3000            │              │  Port 3001            │
│  Container: backend   │              │  Container: web-admin │
└────────┬──────────────┘              └───────────────────────┘
         │
         │ TCP
┌────────▼───────────────────────────────────────────────────────────┐
│  Docker Compose private network (172.20.0.0/16)                     │
│  - postgres:5432                                                    │
│  - redis:6379                                                       │
│  - minio:9000 (API), :9001 (console)                                │
└────────────────────────────────────────────────────────────────────┘
```

**Why Cloudflare Tunnel:** Avoids opening ports on office router, no static IP needed, provides stable hostname even if ISP changes IP, free DDoS protection.

## Storage

### Database (PostgreSQL 16)
- Default storage path `/var/lib/postgresql/data` (inside container, mounted to host `/data/postgres`)
- Daily `pg_dump` to `/data/backups/postgres/` (host)
- Daily rsync to backup VPS
- WAL archiving enabled (point-in-time recovery)
- Retention: 90 days daily backups, 12 months monthly backups

### Object Storage (MinIO)
- Bucket `attendance-photos/` for check-in photos
- Bucket `reports/` for generated customer report PDFs
- Lifecycle policy: photos older than 12 months move to cold storage bucket (manual setup Phase 6)
- Daily bucket sync to backup VPS

### File System Layout on Server
```
/data/
├── postgres/         # Postgres data dir (mounted from container)
├── minio/            # MinIO data dir (mounted from container)
├── redis/            # Redis dump + AOF
├── backups/
│   ├── postgres/    # Daily pg_dump files
│   ├── minio/       # Daily MinIO bucket snapshots
│   └── configs/      # Snapshots of docker-compose.yml, .env, Caddy config
└── logs/
    ├── backend/
    ├── web-admin/
    └── caddy/
```

## Security

| Concern | Mitigation |
| --- | --- |
| TLS | All external traffic terminated at Cloudflare Tunnel with TLS 1.2+; internal traffic between Caddy and backend stays on private Docker network (no TLS for performance, but not exposed externally) |
| Authentication | JWT access tokens (15 min TTL) + refresh tokens (30 days, httpOnly cookie); employees use phone+OTP or phone+password; admins use email+password+2FA (TOTP via Google Authenticator) |
| Authorization | RBAC roles: `employee`, `supervisor`, `bo_admin`, `system_admin`; per-endpoint permission checks in Fastify middleware |
| Password hashing | Argon2id (memory=64MB, iterations=3, parallelism=4) |
| Secrets management | `.env` file on server, mode 600, never committed; for dev, `.env.example` checked in |
| Rate limiting | Fastify rate-limit plugin: 100 req/min per IP for unauthenticated, 600 req/min per user for authenticated |
| Audit logging | All admin actions (override attendance, payroll approve, user CRUD) logged to `audit_log` table with actor, action, target, timestamp, IP |
| Photo privacy | Photos stored in MinIO with presigned URLs (5 min expiry); no public bucket access |
| Database access | Postgres not exposed externally; only backend container can connect |
| Firewall | UFW allow only SSH (from admin IP), deny all incoming otherwise |
| Backup encryption | Optional: encrypt backup files with age/gpg before rsync to VPS |

## Observability

- **Logs:** All containers log to stdout, collected by Docker to `/data/logs/<service>/` via json-file driver with rotation (max 10 MB × 5 files)
- **Metrics:** Phase 2+ : Add Prometheus + Grafana (later, not MVP); for MVP, use Postgres slow query log + manual checks
- **Alerts:** Phase 2+ : Simple health check endpoint `/health` polled by external uptime monitor (e.g., UptimeRobot free tier)
- **Backup verification:** Weekly cron job sends Slack/Zalo notification with last backup timestamp + size; if no backup in 25 hours, alert

## Non-Functional Requirements (NFRs)

| NFR | Target | Notes |
| --- | --- | --- |
| Availability | 99% during business hours (7am-10pm VN time, Mon-Sun) | Acceptable for internal tool; downtime for nightly backups (30 min window 2-2:30am VN time) |
| Latency | Mobile check-in < 2 sec end-to-end (P95) | Single on-prem server, low network latency |
| Throughput | 200 concurrent users, 50 check-ins/min peak | Far below capacity (single Postgres can handle 1000+ TPS) |
| Data durability | 99.99% (4 nines) | Daily backups + WAL archiving + off-site backup |
| RTO (Recovery Time Objective) | 4 hours | Restore from backup if server dies; worst case is reinstall + restore from VPS backup |
| RPO (Recovery Point Objective) | 24 hours | Daily backup; in worst case, lose 1 day of attendance |
| Scalability | Vertical scale to 1000 users (still single server); horizontal scale deferred until Phase 6+ | Postgres + Redis + MinIO all support clustering if needed |

## Cost Estimate by Scale

| Users | Servers | Monthly Cloud Cost | Notes |
| --- | --- | --- | --- |
| 200 (MVP) | 1× server | ~$0-10 | Current target |
| 500 (Year 2) | 1× upgraded server (32 GB RAM) | ~$0-10 | Vertical scale |
| 1000 (Year 3+) | 2× servers (app + DB split) | ~$20-50 | Add second server, Postgres replication |
| 2000+ (SaaS) | Multi-server, Kubernetes | ~$200-500 | Out of scope for this epic |

## Disaster Recovery

1. **Daily automated backup** to local external drive
2. **Daily rsync** to backup VPS (Vultr Singapore $6/mo)
3. **Weekly restore drill** (random day, pick latest backup, restore to test server, verify)
4. **Runbook** in `3-technical/3.3-devops/server-steps.md` for:
   - Server hardware failure → install new server, restore from VPS backup (~4 hours)
   - Postgres corruption → restore from `pg_dump` (~30 min)
   - Accidental data deletion → point-in-time recovery via WAL archive (~30 min)
   - MinIO photo loss → restore from bucket snapshot (~1 hour for 100 GB)

## Related Documents

- [System Design](design-standards/system-design.md) — C4 diagrams
- [Domain Specs](architecture/domain-specs.md) — DDD entities and business rules
- [API Contracts](architecture/api-contracts/) — OpenAPI specs
- [Coding Standards](design-standards/coding-standards.md) — TypeScript/Flutter conventions
- [Server Steps](../3.3-devops/server-steps.md) — On-prem deploy runbook (to be updated Phase 1)
- [ADR-001: Tech Stack Choice](../../8-governance/decision-log/adr-001-tech-stack.md)
- [ADR-002: On-Premise Hosting](../../8-governance/decision-log/adr-002-on-premise.md)
