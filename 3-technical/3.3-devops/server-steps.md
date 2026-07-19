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
- `caddy` (Caddy 2) — HTTP reverse proxy behind the Cloudflare Tunnel

External access is routed through Cloudflare Tunnel. Cloudflare terminates public
TLS; the tunnel reaches Caddy on local port 80, so no inbound router port or
Let's Encrypt challenge is required.

## Prerequisites

**Hardware:**
- Dell OptiPlex / HP ProDesk / used server
- 4 vCPU, 16 GB RAM, 500 GB NVMe SSD (recommend)
- UPS 1000 VA minimum
- Backup target: external USB HDD 1TB (rotated weekly) OR 1× VPS backup (Vultr $6/mo)

**Network:**
- Office internet (stable, ≥ 50 Mbps)
- Office router allows outbound HTTPS (port 443) for Cloudflare Tunnel
- Firewall exposes no inbound application ports; database/cache/storage/API ports remain local

**Software (installed during setup):**
- Ubuntu 22.04 LTS (server ISO)
- Docker Engine 24+
- Docker Compose v2
- Cloudflare account (free tier is enough)

**Accounts:**
- Cloudflare account with one domain added
- Two final hostnames, represented below by `ak-tunnel.example.com` and
  `storage.ak-tunnel.example.com`; the tunnel command creates their DNS records
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
# Install Docker Engine + Compose and the encrypted backup client
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER  # log out + back in for group to apply
sudo apt install -y restic

# Verify
docker --version
docker compose version
```

### Step 3: Create directories for persistent data

```bash
sudo mkdir -p /data/{postgres,redis,minio,caddy,backups/postgres,backups/minio}
sudo chown -R $USER:$USER /data
```

### Step 4: Clone the repo and configure

```bash
git clone https://github.com/hungtrandigital/AKAIOS.git /opt/ak
cd /opt/ak

# Generate secrets
export JWT_SECRET=$(openssl rand -hex 32)
export INTERNAL_API_KEY=$(openssl rand -hex 32)
export TOTP_ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')
export MINIO_ROOT_PASSWORD=$(openssl rand -hex 16)
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export RESTIC_PASSWORD=$(openssl rand -hex 32)

# Create .env from example
cp .env.example .env
# Edit .env with a real editor. Set each generated value in its matching field;
# also set SMS_MODE=speedsms and the SpeedSMS token/sender for production.
# Do not reuse one secret for JWT_SECRET, INTERNAL_API_KEY, or TOTP_ENCRYPTION_KEY.

chmod 600 .env
```

#### Mandatory secret-backup gate

Before migrations, TOTP enrollment, or a live pilot, store the production `.env`
as an encrypted, access-controlled item in an approved **off-host** secret vault.
The backup must preserve at least `TOTP_ENCRYPTION_KEY`,
`TOTP_ENCRYPTION_KEY_VERSION`, the MinIO credentials, database credentials, JWT
secret, internal API key, `RESTIC_PASSWORD`, and the recovery location for any
restricted SFTP private key. Never put the plaintext file in Git, cloud-drive
sync, tickets/chat, or `/data/backups` beside the database/object backups.

Set `RESTIC_REPOSITORY` to either a dedicated remote SFTP repository or a mounted,
encrypted USB target that is rotated off-site; configure its restricted SSH key or
mount before continuing. Test the vault restore into a temporary memory-backed path, set mode `600`, compare
it with `/opt/ak/.env`, then delete the restored copy. Record only the vault item
identifier, authorized custodians, and restore-test date in the deployment log.
Do not continue to Step 6 unless this restore test has passed; disaster recovery
depends on the original TOTP key/version and MinIO credentials.

Initialize and verify the encrypted off-host repository before the first backup:

```bash
cd /opt/ak
set -a; source .env; set +a
: "${RESTIC_REPOSITORY:?set an off-host restic repository in .env}"
: "${RESTIC_PASSWORD:?set and vault the independent restic password}"
if ! restic snapshots >/dev/null 2>&1; then restic init; fi
restic check
```

For an SFTP target, keep the restricted SSH private key recovery material in the
approved vault. For USB, use filesystem encryption and rotate the device to a
different physical location; a permanently attached disk is not an off-host copy.

### Step 5: Run database migrations

```bash
# Build the lockfile-backed release image, tag the exact release SHA, start
# PostgreSQL, and run committed migrations once. Base-image tags remain mutable;
# record the resolved image IDs/digests in the release evidence.
docker compose --env-file .env -f systems/shared/docker-compose.yml build db-migrate
docker compose --env-file .env -f systems/shared/docker-compose.yml up -d postgres
docker compose --env-file .env -f systems/shared/docker-compose.yml run --rm db-migrate

# Mandatory after every migration: seed the idempotent permission catalog and
# role mappings. This is required in production even when demo data is skipped.
docker compose --env-file .env -f systems/shared/docker-compose.yml run --rm db-migrate \
  pnpm --filter @ak/shared db:seed:rbac
```

#### Existing-install upgrade: reconcile legacy allowance overrides

Migration `20260717140000_add_payroll_allowance_override` defaults the new
`allowancesOverridden` marker to `false`. Before recalculating any migrated period,
compare non-zero allowances with the payroll audit trail and rule configuration:

```sql
SELECT id, "payrollPeriodId", "employeeId", allowances, "updatedAt"
FROM payroll_lines
WHERE allowances <> 0
ORDER BY "updatedAt" DESC;

-- Mark only IDs confirmed by the audit trail as historical manual overrides.
UPDATE payroll_lines
SET "allowancesOverridden" = TRUE
WHERE id IN ('confirmed-payroll-line-id');
```

Take a database backup first, have BO verify the selected rows, and record the
reconciliation in the deployment log. Do not mark rule-derived allowances as manual.
Migration `20260718120000_add_payroll_workday_units` also initializes historical
`workdayUnits` to zero. Recalculate every editable migrated period before clearing
an allowance override; the API rejects clear for a line with worked days and an
uninitialized zero unit value. Approved/paid/locked periods remain immutable.

### Step 6: Provision production operators and TOTP

```bash
# The first operator creates the tenant and must be a system_admin. Read the
# password without placing it in shell history, then pass it only to this
# one-shot container.
export OPERATOR_TENANT_NAME='AKAIUNSAN Cleaning Services'
export OPERATOR_EMAIL='admin@your-company.example'
export OPERATOR_PHONE='+84901234567'
export OPERATOR_ROLE='system_admin'
read -rsp 'Initial admin password: ' OPERATOR_PASSWORD; export OPERATOR_PASSWORD

docker compose --env-file .env -f systems/shared/docker-compose.yml run --rm \
  -e OPERATOR_TENANT_NAME -e OPERATOR_EMAIL -e OPERATOR_PHONE \
  -e OPERATOR_ROLE -e OPERATOR_PASSWORD db-migrate \
  pnpm --filter @ak/shared auth:provision-operator

# Enroll TOTP immediately. Scan the one-time URI, verify it in the web login,
# then clear the terminal scrollback/history according to the ops policy.
docker compose --env-file .env -f systems/shared/docker-compose.yml run --rm \
  db-migrate pnpm --filter @ak/shared auth:enroll-totp "$OPERATOR_EMAIL"
unset OPERATOR_PASSWORD
```

Repeat `auth:provision-operator` with `OPERATOR_ROLE=bo_admin` or
`OPERATOR_ROLE=supervisor`, a unique email/phone/password, then enroll TOTP for
each account. The command is idempotent for an exact active account and never
resets an existing password. It is an out-of-band privileged operation: record
the returned tenant/user IDs in the deployment log and restrict host access.

Never run `db:seed:all` on production or a live pilot. It creates development
and showcase accounts with fixed credentials, 200 synthetic employees, 15
synthetic projects, demo attendance, and RBAC mappings. It is for isolated
development/CI databases only; production runs only the idempotent RBAC seed
from Step 5 and provisions real data through authorized workflows.

### Step 7: Start the full stack

```bash
docker compose --env-file .env -f systems/shared/docker-compose.yml up -d --build

# Wait ~30s for all services to start
sleep 30

# Check health
curl http://localhost:3000/health/live  # attendance-api
curl http://localhost:3001/health/live  # payroll-api
curl http://localhost:3002/             # web admin
```

### Step 8: Configure the Caddy origin routes

Replace the development block in `systems/shared/Caddyfile` with this production
topology. The main hostname serves web admin and preserves the mobile
`/api/attendance/v1/*` prefix; the separate storage hostname reaches only MinIO.
Payroll stays behind web-admin same-origin rewrites and is not exposed on a third
public hostname.

```caddy
http://ak-tunnel.example.com {
  encode zstd gzip

  handle /api/attendance/v1/* {
    uri strip_prefix /api/attendance
    reverse_proxy attendance-api:3000
  }

  handle {
    reverse_proxy web-admin:3002
  }
}

http://storage.ak-tunnel.example.com {
  encode zstd gzip
  reverse_proxy minio:9000
}
```

Set `MINIO_PUBLIC_ENDPOINT=https://storage.ak-tunnel.example.com` in `.env`,
then reload Caddy:

```bash
docker compose --env-file .env -f systems/shared/docker-compose.yml restart caddy
```

### Step 9: Configure Cloudflare Tunnel

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
cloudflared tunnel route dns ak-prod storage.ak-tunnel.example.com

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
  - hostname: storage.ak-tunnel.example.com
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

Verify `https://ak-tunnel.example.com`, an authenticated mobile request through
`/api/attendance/v1/*`, and a newly generated presigned object URL on the storage
host. Cloudflare must enforce HTTPS and an access policy appropriate for an
internal application.

## Day-2 Operations

### Daily automated backups

Create `/opt/ak/scripts/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

cd /opt/ak
set -a
source .env
set +a

POSTGRES_BACKUP_DIR=/data/backups/postgres
MINIO_BACKUP_DIR=/data/backups/minio
MANIFEST_DIR=/data/backups/manifests
DATE=$(date +%Y%m%d)
MC_IMAGE='minio/mc@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727'

alert_failure() {
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl --fail --silent --show-error -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      --data '{"text":"AKAIUNSAN backup FAILED"}' || true
  fi
}
trap alert_failure ERR

: "${RESTIC_REPOSITORY:?missing off-host RESTIC_REPOSITORY}"
: "${RESTIC_PASSWORD:?missing RESTIC_PASSWORD}"
mkdir -p "$POSTGRES_BACKUP_DIR" "$MINIO_BACKUP_DIR" "$MANIFEST_DIR"

# PostgreSQL: write atomically so a failed dump is never mistaken for a backup.
PG_TMP="$POSTGRES_BACKUP_DIR/.ak-$DATE.sql.gz.tmp"
docker exec ak-postgres pg_dump -U "${POSTGRES_USER:-ak_user}" "${POSTGRES_DB:-ak_main}" \
  | gzip > "$PG_TMP"
mv "$PG_TMP" "$POSTGRES_BACKUP_DIR/ak-$DATE.sql.gz"

# MinIO: run a separate pinned client on the private Compose network and mount
# the host backup target. The server container is not assumed to contain `mc`.
docker run --rm --network ak-monorepo_ak-net \
  -e MINIO_ROOT_USER -e MINIO_ROOT_PASSWORD -e DATE \
  -v "$MINIO_BACKUP_DIR:/backup" \
  --entrypoint /bin/sh "$MC_IMAGE" -c '
    mc alias set source http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
    for bucket in attendance-photos reports; do
      mkdir -p "/backup/$bucket/$DATE"
      mc mirror --overwrite "source/$bucket" "/backup/$bucket/$DATE"
    done
  '

# Create a deterministic manifest, then require an encrypted off-host snapshot.
# A failed upload exits non-zero and triggers the alert instead of silently
# retaining only the same-host copy.
(
  cd /data/backups
  find "postgres/ak-$DATE.sql.gz" \
    "minio/attendance-photos/$DATE" "minio/reports/$DATE" \
    -type f -print0 | sort -z | xargs -0 sha256sum \
    > "manifests/ak-$DATE.sha256"
)
restic backup \
  "$POSTGRES_BACKUP_DIR/ak-$DATE.sql.gz" \
  "$MINIO_BACKUP_DIR/attendance-photos/$DATE" \
  "$MINIO_BACKUP_DIR/reports/$DATE" \
  "$MANIFEST_DIR/ak-$DATE.sha256"
restic forget --keep-daily 30 --keep-weekly 8 --keep-monthly 12 --prune
restic snapshots --latest 1

# Retain last 30 days of daily backups
find "$POSTGRES_BACKUP_DIR" -name '*.sql.gz' -mtime +30 -delete
find "$MINIO_BACKUP_DIR" -mindepth 2 -maxdepth 2 -type d -mtime +30 \
  -exec rm -rf -- {} +
```

```bash
chmod +x /opt/ak/scripts/backup.sh
# Cron daily at 2:30am
echo "30 2 * * * /opt/ak/scripts/backup.sh" | sudo crontab -
```

### Weekly off-host restore drill

Restore the latest encrypted off-host snapshot, verify its manifest, then load the
database backup into a separate test database:

```bash
cd /opt/ak
set -a
source .env
set +a

DRILL_DIR=$(mktemp -d /dev/shm/ak-restore-drill.XXXXXX)
restic restore latest --target "$DRILL_DIR"
BACKUP_ROOT="$DRILL_DIR/data/backups"
(cd "$BACKUP_ROOT" && sha256sum -c "$(ls -t manifests/ak-*.sha256 | head -1)")
LATEST=$(ls -t "$BACKUP_ROOT"/postgres/ak-*.sql.gz | head -1)
docker exec ak-postgres dropdb -U "${POSTGRES_USER:-ak_user}" --if-exists ak_main_restore_test
docker exec ak-postgres createdb -U "${POSTGRES_USER:-ak_user}" ak_main_restore_test
gunzip -c "$LATEST" | docker exec -i ak-postgres \
  psql -U "${POSTGRES_USER:-ak_user}" -d ak_main_restore_test
# Verify row counts
docker exec ak-postgres psql -U "${POSTGRES_USER:-ak_user}" -d ak_main_restore_test \
  -c "SELECT COUNT(*) FROM employees;"
```

Also restore both latest MinIO bucket snapshots into an isolated temporary MinIO
container and list the restored objects:

```bash
LATEST_DATE=$(find "$BACKUP_ROOT/minio/attendance-photos" -mindepth 1 -maxdepth 1 \
  -type d -printf '%f\n' | sort | tail -1)
docker rm -f ak-minio-restore-test 2>/dev/null || true
docker run -d --name ak-minio-restore-test --network ak-monorepo_ak-net \
  -e MINIO_ROOT_USER -e MINIO_ROOT_PASSWORD \
  minio/minio:RELEASE.2024-09-13T03-09-25Z server /data
sleep 5
docker run --rm --network ak-monorepo_ak-net \
  -e MINIO_ROOT_USER -e MINIO_ROOT_PASSWORD -e LATEST_DATE \
  -v "$BACKUP_ROOT/minio:/backup:ro" \
  --entrypoint /bin/sh \
  minio/mc@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727 -c '
    mc alias set restore http://ak-minio-restore-test:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
    for bucket in attendance-photos reports; do
      mc mb --ignore-existing "restore/$bucket"
      mc mirror "/backup/$bucket/$LATEST_DATE" "restore/$bucket"
      mc ls --recursive "restore/$bucket"
    done
  '
docker rm -f ak-minio-restore-test
rm -rf "$DRILL_DIR"
```

Document commands, timestamps, row/object counts, elapsed time, and failures in
`/opt/ak/scripts/restore-drill-log.txt`. The RTO/RPO targets are not accepted
until scheduled backups and this isolated restore drill both succeed.

### Monitoring

For MVP, run a host-local systemd timer or equivalent every five minutes against
`http://localhost:3000/health/ready` and `http://localhost:3001/health/ready`,
with alert delivery on non-200 responses. An external monitor cannot reach these
local endpoints through the documented Caddy routes. Prometheus/Grafana or an
explicitly protected external health route are future work.

## Pilot Rollout (Phase 5)

Do not execute this section merely because CI is green. First complete or obtain
an explicit approved deferral for every unmet PRD-SLICE-003..005 acceptance item,
including mobile history, required BO CRUD/scheduling surfaces, real-user
attendance stability, BO hand-check reconciliation, and customer-template/time
evidence. Record that product acceptance together with the immutable CI/review,
backup/restore, monitoring, and iOS distribution gates.

1. Choose 1–2 real projects and accountable supervisors; do not use synthetic seed names as production records.
2. Sign in with password + TOTP and place the short-lived access token in
   `ADMIN_ACCESS_TOKEN` without recording it in shell history/logs. The current
   Projects/Employees web pages are read-only, so provision each real pilot
   project and employee through the authenticated Attendance API (or separately
   reviewed import tooling), never demo seeds. For example:

   ```bash
   curl -X POST 'https://ak-tunnel.example.com/api/attendance/v1/projects' \
     -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
     -H 'Content-Type: application/json' \
     --data '{"code":"PILOT-001","name":"Pilot Site","clientName":"Real Client","address":"Real address","latitude":10.77,"longitude":106.70,"geofenceRadiusMeters":100,"contractStartDate":"2026-08-01"}'

   curl -X POST 'https://ak-tunnel.example.com/api/attendance/v1/employees' \
     -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
     -H 'Content-Type: application/json' \
     --data '{"phone":"+84901234568","employeeCode":"NV-PILOT-001","fullName":"Real Employee","hireDate":"2026-08-01","baseSalary":"9000000","salaryType":"monthly"}'
   ```

   Capture the generated temporary password response once and deliver it through
   a separate secure channel if password login is used. Passwordless login uses
   a SpeedSMS OTP and does not transmit/reset a password.
3. Set `SMS_MODE=speedsms`, validate the SpeedSMS credentials with test recipients, and confirm production refuses mock mode.
4. Provision real supervisor operators with `auth:provision-operator`, enroll TOTP, then grant each explicit project membership as a signed-in BO/system admin:

   ```bash
   curl -X POST 'https://ak-tunnel.example.com/api/attendance/v1/projects/<PROJECT_ID>/supervisors' \
     -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN" \
     -H 'Content-Type: application/json' \
     --data '{"userId":"<SUPERVISOR_USER_ID>"}'
   ```

   Obtain `ADMIN_ACCESS_TOKEN` only after password + TOTP login, keep it out of
   shell history/logs, and verify the membership with `GET` on the same endpoint.
5. On-site training: ~2 hours with supervisors + 1 hour with cleaners.
6. Run pilot for 2 weeks; BO uses web admin daily; collect feedback.
7. After pilot: bug-fix sprint, then Phase 6 rollout to remaining 13 projects.

## Scale-Out (Phase 6)

1. Add the remaining real projects with the authenticated `POST /api/attendance/v1/projects` route or approved import tooling; the current web page is read-only.
2. Roll out per project using the same operator/TOTP/membership/employee process proven in pilot.
3. Measure host saturation and request latency before increasing rollout. No repository evidence currently guarantees one-server capacity for 200+ concurrent users.

## Disaster Recovery

If the server dies completely:
1. Provision an equivalent host and install Docker plus Restic.
2. Check out the exact reviewed release commit. Restore the production `.env`
   from the separate secret backup with mode `600`; this is not a fresh-install
   secret-generation step. The original `TOTP_ENCRYPTION_KEY` and
   `TOTP_ENCRYPTION_KEY_VERSION` are mandatory to decrypt enrolled admin TOTP
   credentials. Restore the MinIO credentials/config, `RESTIC_PASSWORD`, and any
   restricted SFTP key recovery material used for the encrypted off-host backup.
   JWT and internal API keys may be deliberately rotated, provided both APIs are
   updated together and all existing sessions are expected to be invalidated.
3. Pull the latest encrypted off-host snapshot into staging, verify its manifest,
   and only then place the verified data under `/data/backups`:

   ```bash
   sudo apt update && sudo apt install -y restic
   cd /opt/ak
   chmod 600 .env
   set -a; source .env; set +a
   : "${RESTIC_REPOSITORY:?missing off-host repository}"
   : "${RESTIC_PASSWORD:?missing vault-restored restic password}"
   STAGING=$(mktemp -d /dev/shm/ak-dr.XXXXXX)
   restic check
   restic restore latest --target "$STAGING"
   BACKUP_ROOT="$STAGING/data/backups"
   (cd "$BACKUP_ROOT" && sha256sum -c "$(ls -t manifests/ak-*.sha256 | head -1)")
   sudo mkdir -p /data/backups
   sudo cp -a "$BACKUP_ROOT/." /data/backups/
   sudo chown -R "$USER:$USER" /data/backups
   rm -rf "$STAGING"
   ```

   Stop if Restic or checksum verification fails; do not fall back silently to
   an unverified same-host copy.
4. Load `.env`, start only the stateful services, and wait for PostgreSQL and
   MinIO to become healthy:

   ```bash
   cd /opt/ak
   chmod 600 .env
   set -a
   source .env
   set +a
   docker compose --env-file .env -f systems/shared/docker-compose.yml \
     up -d postgres redis minio
   until docker exec ak-postgres pg_isready \
     -U "${POSTGRES_USER:-ak_user}" -d "${POSTGRES_DB:-ak_main}"; do sleep 2; done
   until curl --fail --silent http://localhost:9000/minio/health/live; do sleep 2; done
   ```

5. Restore the database only after PostgreSQL is running:

   ```bash
   LATEST=$(ls -t /data/backups/postgres/ak-*.sql.gz | head -1)
   gunzip -c "$LATEST" | docker exec -i ak-postgres \
     psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-ak_user}" \
     -d "${POSTGRES_DB:-ak_main}"
   ```

6. Restore both latest MinIO bucket snapshots into the running `minio` service
   using the pinned `minio/mc` image and the same `mc mb`/`mc mirror` procedure
   from the weekly restore drill. Verify recursive object counts for
   `attendance-photos` and `reports` before continuing.
7. Start the complete stack. The one-shot migration service applies only any
   migrations newer than the restored backup:

   ```bash
   docker compose --env-file .env -f systems/shared/docker-compose.yml up -d
   curl --fail http://localhost:3000/health/ready
   curl --fail http://localhost:3001/health/ready
   ```

8. Restore the Cloudflare Tunnel only after local readiness passes, then verify
   login/TOTP, a private photo, a report, and the payroll-to-attendance internal
   request. Record elapsed time, recovered backup timestamps, and failures.

Targets: 4-hour RTO and 24-hour RPO. These are operational objectives, not
guarantees; validate them from recorded backup and restore drills before pilot.

## Reference

- Architecture: [3-technical/3.1-system-foundation/infrastructure.md](../3.1-system-foundation/infrastructure.md)
- Decisions: [8-governance/decision-log/](../../8-governance/decision-log/)
- Health probes:
  - `GET /health/live` (200 always, liveness)
  - `GET /health/ready` (200 if all checks pass, 503 otherwise)

---

*Maintained by the AKAIUNSAN engineering team. Update when adding new services or changing deployment topology.*
