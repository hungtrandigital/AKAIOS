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
- PostgreSQL + Redis + MinIO + 3 backend services + Caddy
- Cloudflare Tunnel for external access

## Deployment

### Deployment Process
1. Provision Ubuntu 22.04 server (Dell OptiPlex / used server)
2. Install Docker + Docker Compose
3. Clone AKAIOS repo + create `.env` with secrets (`openssl rand -hex 32`)
4. Run Prisma migrations
5. (Optional) Run seed data
6. `docker compose up -d`
7. Configure Cloudflare Tunnel for external access

See **[server-steps.md](server-steps.md)** for step-by-step runbook.

### CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push/PR:
- Lint
- Typecheck (TypeScript strict)
- Unit tests (Vitest)
- Build
- Integration tests (with services, requires Docker)

## Monitoring

### Health Checks

| Endpoint | Purpose | Healthy Returns |
|---|---|---|
| `GET /health/live` | Liveness probe (no deps) | 200 always |
| `GET /health/ready` | Readiness probe (checks DB + Redis + MinIO) | 200 if all checks OK, 503 otherwise |

### Monitoring Strategy (MVP)
- UptimeRobot free tier polls `/health/ready` every 5 min
- Slack/Telegram webhook alert on failures

### Future (after MVP)
- Prometheus + Grafana for metrics
- ELK stack for log aggregation

## Disaster Recovery

- **RTO:** 4 hours (restore from backup VPS)
- **RPO:** 24 hours (daily `pg_dump` + MinIO sync)
- See server-steps.md "Disaster Recovery" section for runbook

## Related Documents

- **[Infrastructure](../3.1-system-foundation/infrastructure.md)** — Infrastructure design
- **[Server Steps](server-steps.md)** — Detailed deployment procedures
- **[ADRs](../../8-governance/decision-log/)** — ADR-002 (on-prem hosting), ADR-004 (repo file placement)
- **[Operations Monitoring](../../7-operations-monitoring/README.md)** — Post-deployment monitoring

