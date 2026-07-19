# 3.3 DevOps

## Purpose

Active DevOps documentation for AKAIUNSAN's on-premise deployment of attendance + payroll systems (PRD-EPIC-002).

## Navigation

### Key Documents

- **[server-steps.md](server-steps.md)** — On-premises deployment runbook (Ubuntu 22.04 + Docker Compose + Cloudflare Tunnel)
- **[local-config/](local-config/)** — Local development configuration (gitignored)

## Configuration

### Local Development
- Configuration files in `local-config/` (not committed to git)
- Setup instructions for local environment
- Environment variable templates

### Server Configuration
- Production server setup (single Ubuntu host, Docker Compose stack)
- PostgreSQL + Redis + MinIO + 2 API services + web admin + Caddy
- Cloudflare Tunnel for external access

## Deployment

### Deployment Process
1. Provision Ubuntu 22.04 server (Dell OptiPlex / used server)
2. Install Docker + Docker Compose
3. Clone AKAIOS repo + create `.env` with secrets (`openssl rand -hex 32`)
4. Build lockfile-backed production artifacts, tag the exact release SHA, and run the one-shot Prisma migration service
5. Run the mandatory idempotent RBAC seed
6. For upgrades, reconcile legacy manual allowance overrides before recalculation
7. Provision real production operators and enroll TOTP; never run demo seeds on production/pilot
8. `docker compose up -d`
9. Configure Caddy's HTTP origin hosts and Cloudflare Tunnel

See **[server-steps.md](server-steps.md)** for step-by-step runbook.

### CI/CD Pipeline

`.github/workflows/ci.yml` runs for pushes to `main` and pull requests targeting `main`:
- Lint
- Typecheck (TypeScript strict)
- Unit tests (Vitest)
- Build
- Integration tests (with services, requires Docker)
- Browser E2E with fresh migrations, seeded TOTP admins, and live services
- Flutter format, analysis, tests, and Android debug APK build

## Monitoring

### Health Checks

| Endpoint | Purpose | Healthy Returns |
|---|---|---|
| `GET /health/live` | Liveness probe (no deps) | 200 always |
| `GET /health/ready` | Readiness probe (checks DB + Redis + MinIO) | 200 if all checks OK, 503 otherwise |

### Monitoring Strategy (MVP)
- A host-local systemd timer or equivalent polls both `/health/ready` endpoints every 5 minutes; the current Caddy routes do not expose them externally
- Slack/Telegram webhook alert on failures

### Future (after MVP)
- Prometheus + Grafana for metrics
- ELK stack for log aggregation

## Disaster Recovery

- **RTO objective:** 4 hours (unvalidated until a recorded isolated restore drill passes)
- **RPO objective:** 24 hours (unvalidated until scheduled PostgreSQL and MinIO backups pass)
- See server-steps.md "Disaster Recovery" section for runbook

## Related Documents

- **[Infrastructure](../3.1-system-foundation/infrastructure.md)** — Infrastructure design
- **[Server Steps](server-steps.md)** — Detailed deployment procedures
- **[ADRs](../../8-governance/decision-log/)** — ADR-002 (on-prem hosting), ADR-004 (repo file placement)
- **[Operations Monitoring](../../7-operations-monitoring/README.md)** — Post-deployment monitoring
