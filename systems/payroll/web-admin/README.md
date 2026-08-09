# AKAIUNSAN Web Admin

Next.js 15 internal dashboard for attendance operations, payroll, projects,
employees, executive reporting, and RBAC administration.

**Status:** The 2026-08-09 dependency-security candidate passes the production
build, 9/9 live Playwright scenarios, and a Node 20 Alpine `/login` container
smoke locally. Remote CI and exact-SHA merge evidence remain pending; pilot
evidence is not claimed.

## Quick Start

Start both APIs first, then run from the repository root:

```bash
ATTENDANCE_API_URL=http://localhost:3000 \
PAYROLL_API_URL=http://localhost:3001 \
pnpm --filter @ak/payroll-web-admin dev
```

Open <http://localhost:3002>. API URLs are server-side rewrite destinations and
must not include `/api`; browser calls use the web admin's same-origin `/api/*`
routes. The development script binds to `127.0.0.1` so the temporary local fixed
verifier cannot be reached from another LAN device through this proxy. The
production `start` command is unchanged.

## Authentication

- Admin login verifies email/password and active-account status.
- Successful password verification proceeds to `/login/2fa` for TOTP.
- A development build also permits a four-digit input so a local Attendance API
  configured with `DEV_FIXED_ADMIN_2FA_CODE` can be tested. The value is owned
  by the API environment and is never embedded in the browser bundle.
- Access tokens are stored in browser storage; refresh tokens use HTTP-only
  cookies with server-side rotation and revocation.
- Logout revokes the refresh session and clears local access state.

Staging and production builds remain six-digit TOTP-only. Do not set the fixed
verifier flag outside an explicitly local/test API process.

## Implemented Surfaces

- Realtime attendance view with audited manual override.
- Project/month shift planning with searchable employee selection, paginated
  full-range operational totals, guarded cancellation, BO/admin shift-template
  creation, and same-project copy preview that shows every mapping. Conflict
  acknowledgement is fingerprint-bound and requires re-review after any change.
- Payroll period open/calculate/approve/export flow.
- Projects and employees views.
- Executive dashboard and recent customer reports.
- RBAC administration.

## Validation

```bash
pnpm --filter @ak/payroll-web-admin lint
pnpm --filter @ak/payroll-web-admin typecheck
pnpm --filter @ak/payroll-web-admin build

# Requires fresh seeded services and E2E_* variables; CI provides these.
pnpm test:e2e
```

The current E2E suite covers unauthenticated redirect, invalid password, five
independent TOTP logins, attendance, monthly shift assignment create/cancel and
copy-warning behavior, payroll, projects, logout, and opening a payroll period.

## Production

The production image and service are defined in
`systems/payroll/web-admin/Dockerfile` and `systems/shared/docker-compose.yml`.
The image copies Next.js `output: 'standalone'` plus static/public assets, runs
as the non-root Node user on port 3002, and excludes Playwright, ESLint, and the
rest of the development dependency graph. `@ak/shared` is retained only as an
E2E development dependency; production source must not import it without an
explicit runtime-closure change and matching container test.
Use the canonical on-premise runbook at
`3-technical/3.3-devops/server-steps.md`; do not start the web image with
localhost API rewrite destinations.

## Related Documents

- [Payroll system](../README.md)
- [Payroll architecture](../docs/architecture.md)
- [Coding standards](../../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)
- [PRD-EPIC-002 progress](../../../3-technical/3.2-implementation/status/progress.md)
