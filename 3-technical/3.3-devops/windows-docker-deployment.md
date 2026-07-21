# Windows Docker Deployment — Local / Controlled UAT

**Work item:** `PRD-EPIC-002 / CODE-TASK-006`

**Audience:** Human operator or AI agent working directly on the authorized Windows host

**Supported host:** Windows 10/11, Docker Desktop with WSL2 Linux containers

**Not approved as:** AKAIUNSAN production or live-pilot replacement for the Ubuntu 22.04 profile

## Read This First

Git carries source code, Prisma migrations, and seed scripts. Git does **not**
carry PostgreSQL files, Docker volumes, MinIO objects, `.env`, or Cloudflare
credentials.

The current Windows environment contains seed-only data. It may therefore be
rebuilt from the committed migrations and `db:seed:all` after explicit owner
confirmation. Use `ResetSeedUat` when the existing seed database does not need
to be retained. Use `Update` when UAT data must survive the deployment.

The Windows script never pushes Git, opens the firewall, configures Cloudflare,
or removes Docker volumes. `ResetSeedUat` is the one destructive database action:
it runs Prisma `migrate reset --force` against the Windows UAT PostgreSQL database
after an interactive high-impact confirmation. It must never target production
or pilot data.

## Deployment Model

```text
Developer Mac → reviewed Git commit → GitHub main + green CI
                                         ↓ exact 40-char SHA
Windows host → git fetch/checkout → Docker build → migrate → seed → health
                                                        ↓
                                              Caddy on 127.0.0.1:80
                                                        ↓
                                     operator-managed cloudflared service
```

Do not expose the Docker TCP API. Remote operators may use a separately approved
SSH/Cloudflare Access path to run this script on Windows, but Docker remains
local to that host.

## Files the Windows AI Must Use

- `windows-docker.ps1` — guarded deployment actions.
- `../../systems/shared/docker-compose.yml` — canonical application stack.
- `../../systems/shared/docker-compose.windows.yml` — required Windows override.
- `../../systems/shared/src/db/prisma/migrations/` — committed schema history.
- `../../systems/shared/src/db/seeds/` — reproducible UAT data.

All commands below run in **PowerShell 7 as the Windows user that owns the
checkout**. Do not run from OneDrive, Desktop sync, or a shared folder.

## 1. Host Prerequisites

Install and start:

1. Git for Windows with Git Credential Manager, or a read-only deploy key.
2. Docker Desktop using the WSL2 backend and Linux containers.
3. PowerShell 7.
4. At least 4 CPU, 12–16 GB RAM available to Docker, and 40 GB free disk for UAT.

Verify:

```powershell
git --version
docker info --format '{{.OSType}}'
docker compose version
$PSVersionTable.PSVersion
```

Expected Docker OS is `linux`; Compose must be at least `2.24.4` because the
Windows override uses the Compose `!override` merge tag.

## 2. Clone Without Putting Credentials in Commands

```powershell
New-Item -ItemType Directory -Force C:\AKAIOS | Out-Null
Set-Location C:\AKAIOS
git clone https://github.com/hungtrandigital/AKAIOS.git app
Set-Location C:\AKAIOS\app
git remote -v
```

Authenticate through Git Credential Manager's interactive prompt. Never place a
PAT, password, Cloudflare token, or deploy-key content in a command, Git URL,
transcript, ticket, or AI chat.

## 3. Select an Immutable Release

The owner supplies a full 40-character commit SHA only after the commit is merged
into `main`, CI is green, and review is approved.

```powershell
$ReleaseSha = '<40-character-reviewed-main-sha>'
git fetch --prune origin main
git show --no-patch --oneline $ReleaseSha
git merge-base --is-ancestor $ReleaseSha origin/main
if ($LASTEXITCODE -ne 0) { throw 'Release is not in origin/main' }
```

Do not deploy a branch name, `latest`, a seven-character SHA, an uncommitted
working tree, or a commit whose CI/review is still failing.

## 4. Create and Protect `.env`

```powershell
Copy-Item .env.example .env

$jwt = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
$internal = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
$totp = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$postgres = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
$minio = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).ToLowerInvariant()
```

Edit `.env` locally and paste independent values into the matching fields. Also
set:

```dotenv
NODE_ENV="production"
DEV_FIXED_ADMIN_2FA_CODE=
SMS_MODE="speedsms"
SPEEDSMS_ACCESS_TOKEN="<vault-provided-value>"
SPEEDSMS_SENDER="AKAIUNSAN"
MINIO_PUBLIC_ENDPOINT="https://<approved-storage-hostname>"
CADDY_STORAGE_HOST="<approved-storage-hostname>"
```

Requirements:

- Replace every `CHANGE_ME`, placeholder, JWT/internal/TOTP/DB/MinIO value.
- Use at least 32 characters for database, MinIO, JWT and internal API secrets;
  the TOTP key must decode from Base64 to exactly 32 bytes.
- Keep `DEV_FIXED_ADMIN_2FA_CODE` empty. Shared UAT uses real six-digit TOTP;
  fixed `1111` is limited to a loopback development process and is refused here.
- Use SpeedSMS when employee OTP is under test.
- Use an absolute HTTPS `MINIO_PUBLIC_ENDPOINT`; its hostname must equal
  `CADDY_STORAGE_HOST`.
- Store the final `.env` in the approved vault; never commit or send it to Git.

Restrict the NTFS ACL:

```powershell
icacls .env /inheritance:r
icacls .env /grant:r "${env:USERNAME}:(R,W)"
```

## 5. Read-Only Preflight

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\3-technical\3.3-devops\windows-docker.ps1 Validate `
  -ReleaseSha $ReleaseSha -WhatIf
```

This must exit `0` and print only the PASS summary. It checks:

- Docker Desktop is reachable and uses Linux containers.
- Docker Compose supports the Windows merge file.
- Git is clean, canonical, and contains the exact SHA in `origin/main`.
- `.env` has no placeholders, fixed test 2FA, or mock SMS mode.
- merged Compose is valid without printing its secret-resolved configuration.
- a new install has no conflicting loopback ports.
- an existing Windows-profile install still uses the expected named volumes.

Stop on any failure. Do not bypass the check by editing the deployment script on
the host.

For the one-time transition from a legacy `/data/...` seed install, `Validate`
intentionally reports the legacy mount and exits non-zero. That specific result
does not authorize a normal update. Use only the `ResetSeedUat
-ConfirmSeedOnly` path below: it repeats the common preflight and requires the
running database to match the committed seed tenant/admin sentinel before it can
reach the destructive confirmation.

### Maintenance behavior

Every `Start`, `Update`, or `ResetSeedUat` stops Caddy, web-admin, Payroll API,
and Attendance API before migration/reset. PostgreSQL, Redis, and MinIO remain
running. For `Update`, release images build first; the application writers then
stop, the PostgreSQL/MinIO checkpoint is taken, and only then do migrations and
seed run. Expect a short Cloudflare 502/connection failure during this window.

If checkpoint creation fails, no migration has run. After fixing the backup
target, the operator may restart the unchanged old containers with:

```powershell
docker start ak-attendance-api ak-payroll-api ak-web-admin ak-caddy
```

If migration, reset, or seed fails, the script leaves application/ingress
stopped. Do not restart them against a partial or incompatible schema. Preserve
logs and either resolve/retry the disposable UAT reset or restore the verified
checkpoint before any application restart.

## 6A. Fresh Seeded UAT Install

Use this when there is no existing AKAIOS container state:

```powershell
.\3-technical\3.3-devops\windows-docker.ps1 Install `
  -ReleaseSha $ReleaseSha -SeedDemoData
```

Confirm the interactive prompt. The script checks out the SHA, builds all three
application images, starts PostgreSQL/Redis/MinIO, applies every committed
migration, runs `db:seed:all`, starts the full stack, and waits for readiness.

Seed data includes fixed demonstration identities and is not production data.
Do not publish a seeded environment to the public Internet. If the owner attaches
the existing Cloudflare Tunnel for controlled UAT, Cloudflare Access must restrict
the hostnames to named testers first.

## 6B. Replace the Existing Seed-Only Database

Use this for the current Windows environment when old data is disposable, or
when migration preflight rejects historical seed rows:

```powershell
.\3-technical\3.3-devops\windows-docker.ps1 ResetSeedUat `
  -ReleaseSha $ReleaseSha `
  -ConfirmSeedOnly
```

The explicit switch declares the owner's seed-only decision; it is not sufficient
by itself. The script also verifies that the database contains exactly the
committed AK seed tenant and `admin@ak.local`, then presents a second, interactive
confirmation stating that PostgreSQL will be reset. If the stack was stopped, it
temporarily starts only `ak-postgres` for this classification and stops it again
before confirmation. In `-WhatIf` mode, start only `ak-postgres` first because a
stopped database cannot be inspected without changing runtime state. After
approval, the script:

1. checks out the exact reviewed SHA;
2. builds the release images;
3. recreates stateful containers with Windows named volumes if the old Compose
   used Linux `/data/...` binds;
4. drops/recreates the UAT schema through Prisma;
5. applies all migrations and runs `db:seed:all`;
6. starts services and verifies readiness.

It does not copy database files through Git and does not delete the old `/data`
bind directory. An operator may remove obsolete data only in a separate,
explicitly approved cleanup after the new UAT passes.

## 6C. Update While Keeping UAT Data

Only use this when the UAT database must survive:

```powershell
.\3-technical\3.3-devops\windows-docker.ps1 Update `
  -ReleaseSha $ReleaseSha `
  -BackupRoot E:\AKAIOS-Backups `
  -SeedDemoData
```

`BackupRoot` must be outside the Git checkout, preferably encrypted removable or
off-host storage. The script checks out and builds the new release while the old
containers are still serving traffic. It then stops Caddy and all application
writers, verifies a PostgreSQL custom-format dump, mirrors the two MinIO buckets,
writes SHA-256 checksums, applies migrations, reruns idempotent seed scripts,
starts services, and records deployment evidence.

Migration `20260720164000_add_shift_tenant_scope` intentionally stops on duplicate
active employee/date assignments or cross-tenant seed drift. Since this Windows
database contains seed-only data, stop and obtain owner confirmation before
switching from `Update` to `ResetSeedUat`; never patch migration history manually.

## 7. Enroll Real TOTP for Seeded Admins

Seeded admin accounts do not receive a deployable fixed TOTP. Enroll the accounts
needed for UAT from the release container:

```powershell
docker compose --env-file .env `
  -f systems/shared/docker-compose.yml `
  -f systems/shared/docker-compose.windows.yml `
  run --rm db-migrate `
  pnpm --filter @ak/shared auth:enroll-totp admin@ak.local
```

Scan the one-time URI with the approved authenticator, verify login, and clear
terminal scrollback according to the operator policy. Repeat for BO/supervisor
accounts being tested. Do not store the URI in Git or AI chat.

## 8. Operate the Stack

```powershell
# Read-only status
.\3-technical\3.3-devops\windows-docker.ps1 Status

# Health checks
.\3-technical\3.3-devops\windows-docker.ps1 SmokeTest

# Last 200 log lines
.\3-technical\3.3-devops\windows-docker.ps1 Logs

# Follow logs
.\3-technical\3.3-devops\windows-docker.ps1 Logs -Follow

# Preserve containers and volumes while stopping
.\3-technical\3.3-devops\windows-docker.ps1 Stop

# Apply idempotent migrations + RBAC before restarting
.\3-technical\3.3-devops\windows-docker.ps1 Start
```

The script contains no volume removal, Docker prune, firewall, WinRM, RDP,
cloudflared, Git commit, or Git push action.

## 9. Cloudflared Already Installed on Windows

Cloudflared remains an operator-managed Windows service. Application updates do
not require restarting the tunnel.

Use two explicit hostnames through the same Caddy maintenance boundary:

```yaml
ingress:
  - hostname: <approved-application-hostname>
    service: http://127.0.0.1:80
  - hostname: <approved-storage-hostname>
    service: http://127.0.0.1:80
  - service: http_status:404
```

The application hostname reaches Caddy's default application route. The storage
hostname must equal `CADDY_STORAGE_HOST`; Caddy routes that host to MinIO.
`MINIO_PUBLIC_ENDPOINT` uses the same hostname over HTTPS. Keeping both hostnames
behind Caddy ensures the deployment maintenance transition closes all application
and object-storage ingress before checkpoint, migration, or reset. The Windows
override binds Caddy and all direct service ports to loopback; the local
cloudflared service can still reach them. Never change them to `0.0.0.0` to make
mobile testing easier. Protect both seed UAT hostnames with Cloudflare Access
before enabling the tunnel.

## 10. Verification and Evidence

The script verifies locally:

```text
Attendance  http://127.0.0.1:3000/health/ready  → 200
Payroll     http://127.0.0.1:3001/health/ready  → 200
Web admin   http://127.0.0.1:3002/               → 200
MinIO       http://127.0.0.1:9000/minio/health/live → 200
```

After the separately managed tunnel is enabled, load an approved Cloudflare
Access service token from the vault into process-only environment variables and
verify its storage route without allowing an interactive-login redirect:

```powershell
$env:CF_ACCESS_CLIENT_ID = Read-Host 'Cloudflare Access service-token ID'
$accessSecret = Read-Host 'Cloudflare Access service-token secret' -AsSecureString
try {
  $env:CF_ACCESS_CLIENT_SECRET = [Net.NetworkCredential]::new('', $accessSecret).Password
  .\3-technical\3.3-devops\windows-docker.ps1 SmokeTest -External
} finally {
  Remove-Item Env:CF_ACCESS_CLIENT_ID, Env:CF_ACCESS_CLIENT_SECRET -ErrorAction SilentlyContinue
  $accessSecret.Dispose()
}
```

The script sends these values only as Cloudflare Access headers, refuses to run
without both values, disables redirects, and rejects an HTML response. A PASS
therefore checks authenticated tunnel routing to MinIO health, not object access.
Never store the token in `.env`, Git, a command transcript, or AI chat.

The operator must additionally verify:

1. `https://prismate.cloud` reaches the intended release.
2. Admin password + real TOTP login works; fixed `1111` fails.
3. Employee/manager demo roles can perform the agreed UAT flow.
4. A seeded attendance row and MinIO object survive `Stop` → `Start` and a
   Docker Desktop restart.
5. A newly generated attendance photo/report presigned URL uses the storage
   hostname and returns the expected private object; this validates signing and
   routing beyond the MinIO health endpoint.
6. `_prisma_migrations` contains every committed migration with `finished_at`.
7. `git rev-parse HEAD` equals the approved release SHA.

## 11. Rollback Boundary

If the new schema remains backward compatible, application rollback is:

```powershell
$PreviousSha = '<previous-reviewed-40-character-sha>'
.\3-technical\3.3-devops\windows-docker.ps1 Update `
  -ReleaseSha $PreviousSha `
  -BackupRoot E:\AKAIOS-Backups
```

Do not reverse Prisma migrations automatically. If the schema is incompatible,
stop applications and restore the verified PostgreSQL/MinIO checkpoint into
isolated volumes before replacing UAT. For disposable seed data, owner-approved
`ResetSeedUat` is the supported clean rebuild.

## Handoff Prompt for the Windows AI

Give the Windows AI this repository path, this document path, and the approved
full SHA. Its first response must report, without secrets:

1. current `git rev-parse HEAD` and whether the worktree is clean;
2. `origin` URL and whether the approved SHA belongs to `origin/main`;
3. Docker OS and Compose version;
4. current container status and PostgreSQL/MinIO mount type/name;
5. whether the owner chose `Update` (preserve UAT) or `ResetSeedUat` (reseed);
6. result of `Validate -WhatIf`.

The AI must stop for confirmation before `Install`, `Update`, or `ResetSeedUat`,
and must stop on migration, backup, seed, or health failure. It must not improvise
with schema edits, delete volumes, expose Docker, or weaken authentication.

## References

- [Ubuntu production runbook](server-steps.md)
- [Docker Compose merge rules](https://docs.docker.com/reference/compose-file/merge/)
- [Docker Desktop WSL2 backend](https://docs.docker.com/desktop/features/wsl/)
- [GitHub secure use of self-hosted runners](https://docs.github.com/en/actions/reference/security/secure-use)
