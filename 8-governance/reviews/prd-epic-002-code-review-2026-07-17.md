---
owning_epic: PRD-EPIC-002
review_date: 2026-07-17
reviewer: "@code-reviewer"
verdict: REJECTED
base_sha: 08d9d25
head_sha: 9ed7be2
---

# CODE REVIEW — PRD-EPIC-002 — 2026-07-17

**Reviewer:** @code-reviewer
**Author:** @fullstack-engineer
**Reviewed commits:** `08d9d25..9ed7be2`, 147 files, 28,885 insertions and 360 deletions

**Overall verdict**: REJECTED

The implementation must not be merged to a production branch or deployed. The review confirmed direct account takeover, cross-tenant payroll and attendance mutation, sensitive-data disclosure, payroll calculation defects, and unusable production build/database initialization paths.

## Review scope

- Canonical work item: `PRD-EPIC-002`.
- Reviewed: shared TypeScript package and Prisma schema, attendance backend, payroll backend, web admin, Docker/Compose, CI, and the mobile-to-attendance integration boundary.
- Mobile native platform projects are not present, so a full Flutter build, platform-permission review, and device validation were not possible.
- Dependency vulnerability scanning, load testing, accessibility scoring, and live on-prem deployment were not performed in this review.
- Vietnam tax and insurance are outside the accepted MVP scope under ADR-003. They were reviewed only to determine whether they can affect the executable MVP path.
- Skills/playbooks used: `prismate-delivery`, `code-review`, `backend-development`, `frontend-development`, `debugging`, `problem-solving`, and `sequential-thinking`.

## Test Results

- Linting: **Fail** — `pnpm lint` exits 2 because backend/shared packages have no ESLint configuration.
- Type Checking: **Pass** — fresh `pnpm typecheck` after build completed 5/5 tasks.
- Production build: **Pass on host** — `pnpm build` completed 4/4 packages.
- Attendance tests: **Fail** — 23 pass, 1 readiness test fails without a usable database configuration, 1 integration suite skipped.
- Payroll tests: **Partial** — 73 pass, 2 todo; state-machine and recalculation tests are not implemented.
- Web E2E: **Fail** — after installing the required Chromium binary and rerunning once, 4 pass and 3 fail.
- Coverage: **Unavailable** — both coverage commands fail because `@vitest/coverage-v8` is missing; the ≥90% gate cannot be verified.
- Docker: **Fail** — attendance production image fails during shared build because Prisma Client is not generated; the Dockerfile also omits the lockfile.
- Compose: **Fail configuration review** — backend build contexts resolve to the parent of the repository and `env_file` resolves outside the repository.
- Migration path: **Fail** — `pnpm prisma migrate deploy` returns `Command "prisma" not found`, and no migrations are committed.

## Critical issues (blocker — must fix)

### CODE-BUG-002 — Password authentication is completely bypassed

- `systems/attendance/backend/src/routes/auth.ts:48-64` and `:242-259` only check that a password hash exists and that the submitted password is long enough. Neither route calls `verifyPassword` before issuing a JWT.
- Any eight-character password for a known seeded email or phone reaches token issuance, including system-admin accounts.
- Fix by verifying Argon2id hashes before token issuance and adding negative integration tests for employee and admin login.

### CODE-BUG-003 — Payroll authorization and tenant boundaries are broken

- `systems/payroll/backend/src/routes/payroll.ts:13`, `:62`, and `:256` require authentication but not `payroll.view`, allowing employee tokens to read periods, rules, and employee salary lines.
- Calculate, approve, lock, mark-paid, and line override load resources by raw UUID without scoping them to `request.user.tenantId` (`:55`, `:84`, `:121`, `:142`, `:172`).
- Calculate and override also use the wrong granular permissions.
- Fix every query/update with tenant-scoped ownership checks, pass tenant identity into services, and enforce the exact permission for each action.

### CODE-BUG-004 — Attendance override permits cross-team and cross-tenant payroll fraud

- `systems/attendance/backend/src/routes/attendance.ts:291-327` loads and updates an attendance record by raw UUID without tenant, project, or supervisor-team ownership checks.
- A supervisor can modify attendance outside their assigned project; a known UUID from another tenant can also be modified. The audit row records the attacker's tenant rather than the record's tenant.
- The record update and audit insert are not transactional, so a successful mutation can exist without an audit record.
- Fix with scoped lookup, explicit supervisor-project membership, and one transaction for mutation plus audit.

### CODE-BUG-005 — Production deployment and database initialization artifacts are unusable

- `systems/shared/docker-compose.yml:21`, `:57`, and `:166` resolve `../../..` to the parent of the repository; the referenced Dockerfiles are therefore outside the build context. `env_file` similarly points to the parent directory.
- Backend Dockerfiles do not copy `pnpm-lock.yaml` and fall back to an unlocked install. They do not run `prisma generate`; the verified attendance image build fails with missing Prisma enums.
- CI and the runbook call a migration command that does not exist at the workspace root, and `systems/shared/src/db/prisma/` contains no migrations.
- Fix Compose paths, use the committed lockfile without fallback, generate Prisma Client, create and validate migrations, then smoke-test fresh database startup and both production images.

## High-severity issues (should fix before re-review)

### CODE-BUG-006 — Required authentication gates are not implemented

- Admin login issues an access token immediately; the OpenAPI `verify-2fa` flow and mandatory admin 2FA do not exist.
- Employee password and OTP login do not reject inactive/suspended users, and check-in/out does not reject inactive employees.
- Enforce both user and employee status and implement the documented short-lived 2FA challenge flow.

### CODE-BUG-007 — Supervisor employee APIs disclose passwords and sensitive payroll PII

- `systems/attendance/backend/src/routes/employees.ts:35-60` grants supervisors tenant-wide employee access and serializes `include: { user: true }`.
- Responses include `passwordHash`, salary, bank account, and identity-number fields for every employee in the tenant.
- Replace broad includes with allowlisted DTO selects and scope supervisors to their assigned projects/teams.

### CODE-BUG-008 — OTP brute-force protection trusts spoofable client IP data

- Attendance API sets `trustProxy: true` while Compose publishes port 3000 on every interface.
- OTP verification has no per-phone attempt cap or cooldown; direct callers can rotate `X-Forwarded-For` to evade the global IP limiter.
- Bind APIs internally, trust only known proxy CIDRs, and add per-account OTP attempt limits and lockout.

### CODE-BUG-009 — Client-supplied GPS accuracy bypasses the geofence

- `systems/attendance/backend/src/services/geo-service.ts:29` returns before distance validation whenever `accuracy > 50`.
- Accuracy is accepted directly from request JSON, and the existing unit test confirms that coordinates far outside the project pass with `accuracy: 100`.
- Never use an untrusted accuracy value to skip distance enforcement; use a reviewed/pending workflow when the signal is poor.

### CODE-BUG-010 — Check-in/out is race-prone and normal checkout does not persist worked time

- Check-in/out record, object upload, attendance update, and assignment update occur as separate operations without compare-and-set or transaction protection.
- Concurrent checkout requests can both pass the empty-checkout precondition and return success.
- Checkout stores overtime but not `totalMinutesWorked` or recalculated status, so reports and payroll consume zero worked minutes for valid shifts.
- Add database state preconditions, transactional persistence/audit, object cleanup, and persist all computed attendance totals.

### CODE-BUG-011 — Mixed UTC/local calendar logic misclassifies Vietnam shifts

- `my-today` uses UTC day boundaries while shift construction and the past-date check use the runtime local timezone; containers do not define `TZ`.
- A 06:10 Vietnam check-in can be compared against 06:00 UTC, and early-morning Vietnam requests query the wrong calendar day.
- Introduce one explicit `Asia/Ho_Chi_Minh` calendar abstraction and convert to UTC instants only at storage/query boundaries.

### CODE-BUG-012 — Customer reports can disclose or overwrite tenant data

- Report GET requires authentication but not `reports.view`.
- The generated PDF includes employee code and full name despite the no-PII contract.
- MinIO object keys omit tenant/project UUIDs; identical project codes and periods across tenants overwrite the same key.
- Enforce view/export permissions, align the PII contract, and namespace keys by tenant/project/report IDs.

### CODE-BUG-013 — The mobile/photo/MinIO attendance path cannot operate as shipped

- The Flutter HTTP client does not use the configured API base URL; referenced providers/platform scaffolds are incomplete, so the mobile app cannot be built or routed to the API.
- Fastify's default body limit rejects typical base64 JPEGs well below the documented 5 MB photo limit.
- In-container MinIO defaults to `localhost:9000`, buckets are never initialized, and public presigned endpoint configuration is unused.
- Complete native scaffolding and providers, wire the base URL, configure a bounded upload limit, initialize buckets, and separate internal from public storage endpoints.

### CODE-BUG-014 — Payroll excludes the last calendar day of every month

- `systems/payroll/backend/src/services/payroll-service.ts:65-66` sets the upper bound to midnight at the start of the month's last day.
- `fetchAttendanceLocal` then filters `checkInAt <= toDate`, excluding all later check-ins that day.
- Use a half-open interval: `monthStart <= checkInAt < nextMonthStart`.

### CODE-BUG-015 — Payroll calculation is non-atomic and cannot recover or recalculate

- The period is changed to `calculating` before rule validation. Missing rules or a later employee failure leave a stuck period and possibly partial lines.
- Retries accept only `open`; manual recalculation from `calculated` required by BR-PAY-009 is absent.
- Validate first, use compare-and-set state transitions and atomic finalization, define recovery, and implement audited recalculation.

### CODE-BUG-016 — Payroll override violates approved-state and money invariants

- Approved periods remain editable; negative and unbounded money strings are accepted.
- Changing allowances does not update gross/net, tax is dropped from the net recomputation, and period totals are not refreshed.
- The line update and audit insert are not transactional.
- Restrict override to the calculated state, validate Decimal inputs, recompute through one invariant-preserving function, and update line/totals/audit atomically.

### CODE-BUG-017 — Weekend and holiday overtime is double-counted

- `systems/payroll/backend/src/engine/calculator.ts:141-146` adds `totalWorkMinutes + overtimeMinutes` even though total worked minutes already include the overtime portion.
- A nine-hour Sunday shift with one overtime hour is aggregated as ten overtime hours.
- Normalize the attendance/payroll contract and count each worked minute exactly once; add a cross-service contract test.

### CODE-BUG-018 — Out-of-scope BHXH/PIT changes executable net pay without auditable breakdown

- BO users can enable tax modes even though ADR-003 excludes compliance from MVP.
- The calculator subtracts tax/insurance from net, but payroll persistence and Excel export do not store or expose the breakdown; an override can remove the deduction again.
- For MVP, prevent modes other than `none` from entering the calculation path. Move compliance to a separately approved epic with legal validation, effective-date versioning, persistence, export, and audit.

### CODE-BUG-019 — CI does not provide a trustworthy quality gate

- Lint cannot start because no ESLint configuration exists.
- The quality job runs Playwright without installing a browser or starting the required backends.
- The integration job calls a missing migration command and never sets `RUN_INTEGRATION=true`, so its only integration suite is skipped.
- Coverage tooling/configuration is missing despite the documented ≥90% requirement.
- Repair CI commands and environment propagation, run real database/API integration tests, install browser dependencies, and enforce coverage thresholds.

## Medium-severity issues

### CODE-BUG-020 — Web-admin auth state and E2E assertions are internally inconsistent

- Login writes local storage directly without updating `AuthProvider`, so first-login navigation leaves the user null and hides logout/RBAC controls until reload.
- E2E expects `.error`, while the UI renders `.alert-error`; the payroll smoke assertion can miss a visible error.
- The attendance table formats checkout from `checkInAt`, so it displays the check-in time in the checkout column.

### CODE-BUG-021 — The aggregate seed command silently omits attendance and RBAC data

- `systems/shared/package.json:41-42` declares `db:seed:all` twice. JSON keeps only the second command, dropping attendance and RBAC seeds.
- Fresh environments therefore lack the mappings required by protected routes even when the documented aggregate seed command succeeds.

### CODE-BUG-022 — Canonical plan, status, API, and implementation have drifted

- At reviewed head `9ed7be2`, the active epic frontmatter says draft while backlog/registry say in-progress, and progress reports payroll/web admin as pending. This review delivery corrects those tracking records, but not the implementation defects.
- ADR-003 excludes compliance, but executable tax modes were added. OpenAPI documents 2FA that does not exist.
- The superseded review plan used conflicting file/LOC totals and excluded mobile while claiming full Phase 0-4 review; it is now archived for historical context.

## Praise (what was done well)

- Core money arithmetic uses Decimal.js-backed `Money`; the default `taxMode=none` path does not introduce floating-point payroll errors.
- Refresh cookies use `httpOnly`, `sameSite=strict`, and `secure` in production; sequential refresh-token reuse detection exists.
- Server-side JPEG magic-byte and decoded 5 MB checks exist, and employee self check-in verifies assignment ownership.
- Host TypeScript build/typecheck succeeds, and payroll pure-function tests cover a useful set of monthly calculation cases.

## Suggestions for improvement

- Fix in this order: authentication bypass; tenant/permission boundaries; deployment/migrations; attendance/payroll money integrity; real integration/coverage gates; UI and documentation drift.
- Treat authorization and tenant scope as reusable query/service invariants rather than per-route conventions.
- Add adversarial integration tests for every permission and tenant boundary, then state-transition and concurrent-request tests for attendance/payroll.
- Keep compliance disabled until a separately approved, legally validated work item owns it.

## Next action

@fullstack-engineer should fix all Critical issues and the security/payroll High issues in bounded batches, request code review after each batch, then rerun the complete gate. Deployment and pilot remain blocked.

### ORCHESTRATION HANDOFF

**Task completed**: Yes
**Feature/Epic**: PRD-EPIC-002

**Files created/modified**:
- `8-governance/reviews/prd-epic-002-code-review-2026-07-17.md`
- Canonical epic, registry, progress, backlog, risk, changelog, and navigation documents listed in the delivery diff

**Review verdict**: REJECTED — 4 Critical, 14 High, 3 Medium findings

**Next recommended agent**: @fullstack-engineer
**Next task**: Fix CODE-BUG-002 through CODE-BUG-019 in prioritized batches and request re-review
**Priority**: Critical

**Blockers/Issues**: Authentication takeover, cross-tenant mutations and data disclosure, invalid payroll results, nonfunctional production build/database initialization, and untrustworthy CI gates.
