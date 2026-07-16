# AKAIUNSAN Web Admin (Next.js 14)

**Phase 2.5 → Phase 5 deliverable.** Internal admin dashboard for BO staff.

## Quick Start

```bash
cd systems/payroll/web-admin
pnpm install

# Run dev
pnpm dev
# → http://localhost:3002
```

## Environment

Set in `.env.local`:
- `ATTENDANCE_API_URL=http://localhost:3000/api`
- `PAYROLL_API_URL=http://localhost:3001/api`

Used by `next.config.js` rewrites.

## Structure

- **Pages:** `app/{login,attendance,payroll,projects,employees}/page.tsx`
- **Layout:** `app/layout.tsx` + `globals.css` (no Tailwind, plain CSS for fast bootstrap)
- **Providers:** `app/providers.tsx` (TanStack Query)
- **API client:** `lib/api.ts` (JWT + refresh cookie handling)

## Build

```bash
pnpm build
pnpm start
```

## Production deploy

Add `web-admin` service to `systems/shared/docker-compose.yml` (after adding Dockerfile).

## Status

- ✅ Login page (admin email + password)
- ✅ Realtime attendance view (auto-refresh 30s)
- ✅ Projects / Employees lists (read-only)
- ✅ Payroll periods page (open, calculate, approve, export Excel)
- ⏳ Attendance override modal
- ⏳ Employee CRUD form
- ⏳ Project creation form
- ⏳ Customer report generation UI

## Related

- [Payroll System Architecture](../../docs/architecture.md)
- [Coding Standards](../../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)

Next.js 14 App Router scaffold. Has:
- ✅ Login page (admin email + password)
- ✅ Realtime attendance view (auto-refresh every 30s)
- ✅ Projects + Employees lists
- ✅ Payroll periods page (open, calculate, approve, export Excel)
- ⏳ Attendance override modal (TODO)
- ⏳ Employee CRUD form (TODO)
- ⏳ Project creation form (TODO)
- ⏳ Customer report generation UI (TODO)

## Quick Start

```bash
cd systems/payroll/web-admin
pnpm install
cp .env.example .env.local   # or set in your shell

pnpm dev
# → http://localhost:3002
```

## Environment

Required env vars (set in `.env.local`):
- `ATTENDANCE_API_URL=http://localhost:3000/api`
- `PAYROLL_API_URL=http://localhost:3001/api`

Used by `next.config.js` rewrites.

## Architecture

- **Pages:** `app/{login,attendance,payroll,projects,employees}/page.tsx`
- **Components:** `components/` (extend as needed)
- **API client:** `lib/api.ts` (handles JWT + refresh token cookies)
- **State:** TanStack Query v5 for server data, React useState for forms

## Build

```bash
pnpm build
pnpm start
```

## Production deploy

Same Docker image strategy as backends. Add `web-admin` service to `systems/shared/docker-compose.yml`.

## Related Documents

- [Payroll System Architecture](../../docs/architecture.md)
- [Coding Standards](../../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)
