# AKAIUNSAN Web Admin

Next.js 14 internal dashboard for attendance operations, payroll, projects,
employees, executive reporting, and RBAC administration.

**Status:** Local production build and live Playwright gate pass as of 2026-07-18;
immutable commit/remote CI and pilot evidence are pending.

## Quick Start

Start both APIs first, then run from the repository root:

```bash
ATTENDANCE_API_URL=http://localhost:3000 \
PAYROLL_API_URL=http://localhost:3001 \
pnpm --filter @ak/payroll-web-admin dev
```

Open <http://localhost:3002>. API URLs are server-side rewrite destinations and
must not include `/api`; browser calls use the web admin's same-origin `/api/*`
routes.

## Authentication

- Admin login verifies email/password and active-account status.
- Successful password verification proceeds to `/login/2fa` for TOTP.
- Access tokens are stored in browser storage; refresh tokens use HTTP-only
  cookies with server-side rotation and revocation.
- Logout revokes the refresh session and clears local access state.

## Implemented Surfaces

- Realtime attendance view with audited manual override.
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
independent TOTP logins, attendance, payroll, projects, logout, and opening a
payroll period.

## Production

The production image and service are defined in
`systems/payroll/web-admin/Dockerfile` and `systems/shared/docker-compose.yml`.
Use the canonical on-premise runbook at
`3-technical/3.3-devops/server-steps.md`; do not start the web image with
localhost API rewrite destinations.

## Related Documents

- [Payroll system](../README.md)
- [Payroll architecture](../docs/architecture.md)
- [Coding standards](../../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)
- [PRD-EPIC-002 progress](../../../3-technical/3.2-implementation/status/progress.md)
