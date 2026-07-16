# Server Setup Steps — AKAIUNSAN On-Premise Deployment

**Status:** Active runbook for PRD-EPIC-002
**Audience:** DevOps / sysadmin deploying the AKAIUNSAN attendance + payroll stack to the on-premise server

## Overview

AKAIUNSAN runs as a single-host Docker Compose stack. The stack includes:
- `attendance-api` (Fastify + Prisma) — port 3000
- `payroll-api` (Fastify + Prisma) — port 3001
- `web-admin` (Next.js 14) — port 3002
- `postgres` (PostgreSQL 16) — port 5432 (localhost only)
- `redis` (Redis 7) — port 6379 (localhost only)
- `minio` (MinIO/S3) — port 9000 (API), 9001 (console)
- `caddy` (Caddy 2) — port 80/443 (HTTPS via Let's Encrypt)

External access is routed via Cloudflare Tunnel (no need for static IP / port forwarding).

## Prerequisites

**Hardware:**
- Dell OptiPlex / HP ProDesk / used server
- 4 vCPU, 16 GB RAM, 500 GB NVMe SSD (recommend)
- UPS 1000 VA minimum
- Backup target: external USB HDD 1TB (rotated weekly) OR 1× VPS backup (Vultr $6/mo)

**Network:**
- Office internet (stable, ≥ 50 Mbps)
- Office router allows outbound HTTPS (port 443) — required for Cloudflare Tunnel + Let's Encrypt
- Firewall: only port 443 exposed externally; all other ports bound to 127.0.0.1

**Software (installed during setup):**
- Ubuntu 22.04 LTS (server ISO)
- Docker Engine 24+
- Docker Compose v2
- Cloudflare account (free tier is enough)

**Accounts:**
- Cloudflare account with one domain added
- DNS A record for `ak-tunnel.example.com` → 127.0.0.1 (placeholder, Cloudflare Tunnel will rewrite)
- GitHub account (or GitLab) with private repo access

## Initial Server Setup

### Step 1: Provision server

```bash
# At the datacenter or remote hands
# 1. Install Ubuntu 22.04 LTS server (minimal ISO, no GUI)
# 2. Set hostname: sudo hostnamectl set-hostname ak-prod-01
# 3. Configure static IP via Netplan (e.g., 192.168.1.100)
# 4. Set up SSH key for admin user
# 5. Enable unattended-upgrades for security patches
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Step 2: Install Docker

```bash
# Install Docker Engine + Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER  # log out + back in for group to apply

# Verify
docker --version
docker compose version
```

### Step 3: Create directories for persistent data

```bash
sudo mkdir -p /data/{postgres,redis,minio,caddy}
sudo chown -R $USER:$USER /data
```

### Step 4: Clone the repo and configure

```bash
git clone https://github.com/hungtrandigital/AKAIOS.git /opt/ak
cd /opt/ak

# Generate secrets
export JWT_SECRET=$(openssl rand -hex 32)
export INTERNAL_API_KEY=$(openssl rand -hex 32)
export MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)
export POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Create .env from example
cp .env.example .env
# Edit .env with the generated secrets (use a real editor or sed)
sed -i "s|CHANGE_ME_RANDOM_32_BYTES|$JWT_SECRET|" .env
sed -i "s|CHANGE_ME_RANDOM_32_BYTES|$INTERNAL_API_KEY|" .env
sed -i "s|CHANGE_ME|$MINIO_ROOT_PASSWORD|" .env
sed -i "s|ak_user:CHANGE_ME|ak_user:$POSTGRES_PASSWORD|" .env

chmod 600 .env
```

### Step 5: Run database migrations

```bash
# First-time setup: apply migrations
docker compose -f systems/shared/docker-compose.yml up postgres -d  # start postgres first
sleep 10  # wait for postgres ready
docker compose -f systems/shared/docker-compose.yml run --rm attendance-api npx prisma migrate deploy --schema=../../shared/src/db/prisma/schema.prisma
```

### Step 6: Seed initial data (optional, for dev/pilot only)

```bash
docker compose -f systems/shared/docker-compose.yml run --rm attendance-api sh -c "cd /app && npx tsx ../../shared/src/db/seeds/dev-seed.ts"
```

This creates:
- 1 AKAIUNSAN tenant
- 5 admin users (system admin, BO admin, 3 supervisors)
- 4 shift templates (morning/afternoon/night/day)
- 15 projects with realistic VN customer names (Vincom, Bitexco, FV, ...)
- 200 employees (NV0001..NV0200)
- Default payroll rules
- Last 30 days of shift assignments

### Step 7: Start the full stack

```bash
docker compose -f systems/shared/docker-compose.yml up -d

# Wait ~30s for all services to start
sleep 30

# Check health
curl http://localhost:3000/health/live  # attendance-api
curl http://localhost:3001/health/live  # payroll-api
curl http://localhost:3002/             # web admin
```

### Step 8: Configure Cloudflare Tunnel

```bash
# Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared focal main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# Authenticate
cloudflared tunnel login
# (follow browser prompts to grant access)

# Create tunnel
cloudflared tunnel create ak-prod
# Note the tunnel ID + path to credentials JSON

# Configure DNS
cloudflared tunnel route dns ak-prod ak-tunnel.example.com

# Create config
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Example `/etc/cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID_HERE>
credentials-file: /home/akuser/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: ak-tunnel.example.com
    service: http://localhost:80
  - service: http_status:404
```

Start as a systemd service:
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### Step 9: Configure HTTPS in Caddy (edit `systems/shared/Caddyfile`)

```caddy
ak-tunnel.example.com {
  encode zstd gzip
  reverse_proxy web-admin:3002
}

attendance.ak-tunnel.example.com {
  encode zstd gzip
  reverse_proxy attendance-api:3000
}

payroll.ak-tunnel.example.com {
  encode zstd gzip
  reverse_proxy payroll-api:3001
}
```

Then restart Caddy to pick up the new config:
```bash
docker compose -f systems/shared/docker-compose.yml restart caddy
```

## Day-2 Operations

### Daily automated backups

Create `/opt/ak/scripts/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR=/data/backups/postgres
DATE=$(date +%Y%m%d)

# Postgres full backup
docker exec ak-postgres pg_dump -U ak_user ak_main \
  | gzip > $BACKUP_DIR/ak-$DATE.sql.gz

# MinIO bucket sync (using mc client)
docker exec ak-minio mc mirror /data/attendance-photos /backup/attendance-photos-$DATE

# Retain last 30 days of daily backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Alert on failure
if [ $? -ne 0 ]; then
  curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"AKAIUNSAN backup FAILED"}'
fi
```

```bash
chmod +x /opt/ak/scripts/backup.sh
# Cron daily at 2:30am
echo "30 2 * * * /opt/ak/scripts/backup.sh" | sudo crontab -
```

### Weekly restore drill

Restore latest backup to a test DB:

```bash
LATEST=$(ls -t /data/backups/postgres/ak-*.sql.gz | head -1)
docker exec -i ak-postgres psql -U ak_user ak_main_test < <(gunzip -c $LATEST)
# Verify row counts
docker exec ak-postgres psql -U ak_user ak_main_test -c "SELECT COUNT(*) FROM employees;"
```

Document outcome in `/opt/ak/scripts/restore-drill-log.txt`.

### Monitoring

For MVP: `curl http://localhost:3000/health/ready` polled every 5 minutes via UptimeRobot (free tier).

Production-ready later: scrape `/health/ready` metrics into Prometheus + Grafana.

## Pilot Rollout (Phase 5)

1. Choose 1-2 projects to pilot (recommend easy projects: Vincom Đồng Khởi + Bitexco — see seed data)
2. Reset all 200 employees' passwords to per-employee random strings (sent via SMS OTP, see ADR mock mode)
3. Onboard supervisors with 2FA setup
4. On-site training: ~2 hours with supervisors + 1 hour with cleaners
5. Run pilot for 2 weeks; BO uses web admin daily; collect feedback
6. After pilot: bug-fix sprint, then Phase 6 rollout to remaining 13 projects

## Scale-Out (Phase 6)

1. Add 13 remaining projects via web admin (or `POST /v1/projects`)
2. Roll out per-project: same onboarding as pilot, 1 project per week
3. Update Caddy to handle increased load (no changes needed for 200+ users on single server)

## Disaster Recovery

If the server dies completely:
1. Provision new identical server
2. Install Docker (Step 2 above)
3. Mount backup VPS filesystem or download latest backup
4. Clone AKAIOS repo + setup .env (Step 4)
5. Restore Postgres: `gunzip -c ak-LATEST.sql.gz | docker exec -i ak-postgres psql -U ak_user ak_main`
6. Sync MinIO buckets from backup
7. Start stack, verify health
8. Restore Cloudflare Tunnel

Recovery time: 4 hours (RTO)
Data loss: at most 24 hours of attendance (RPO)

## Reference

- Architecture: [3-technical/3.1-system-foundation/infrastructure.md](../3.1-system-foundation/infrastructure.md)
- Decisions: [8-governance/decision-log/](../decision-log/)
- Health probes:
  - `GET /health/live` (200 always, liveness)
  - `GET /health/ready` (200 if all checks pass, 503 otherwise)

---

*Maintained by the AKAIUNSAN engineering team. Update when adding new services or changing deployment topology.*
