# Implementation Progress

## Current Status

**Last Updated:** 2026-08-09 (production dependency gate merged; HPC routing and deployment pending)

## Production Dependency Security Remediation — 2026-08-09

- The root pnpm production audit baseline of 43 findings (25 High, 15 Moderate,
  3 Low, 0 Critical) is remediated to `No known vulnerabilities found` across
  359 production dependencies. The four pnpm workspaces now resolve Next.js
  15.5.23, Fastify 5.11.3, Sharp 0.35.0, patched Fastify plugins and safe
  transitive fast-uri, find-my-way, PostCSS, nanoid, UUID, and brace-expansion
  versions.
- Three documented cross-range overrides are intentionally required because the
  direct parents have not published compatible ranges: Next.js → PostCSS
  8.5.23, Next.js → Sharp 0.35.0, and ExcelJS → UUID 11.1.1. Other transitive
  remediations remain lockfile-resolved inside their parents' declared ranges.
  The Node runtime floor is now 20.9.0 to match Sharp 0.35.
- Fastify 5 compatibility keeps an unauthenticated request decorator undefined
  and narrows unknown handler errors before reading Zod metadata. Sharp 0.35's
  current export map is paired with a TypeScript-only path to its bundled
  declarations; JPEG decode/boundary tests execute the real native module.
- Runtime-closure review exposed that the original images copied the unpruned
  workspace graph, including development-only test and lint tools, and that the
  web package declared `@ak/shared` even though only Playwright imports it. The
  web dependency is now development-only; each API uses `pnpm deploy --prod`
  with a Prisma client generated inside its isolated closure, while Next.js
  emits a traced standalone server. The one-shot Compose migration service uses
  an explicit `migration` target so Prisma CLI and build tooling are absent from
  every long-running application image.
- All three Node 20 Alpine application images build and run as UID 1000. Their
  filesystems contain none of Vitest, Vite, ESLint, TypeScript-ESLint, TSX,
  Turbo, Prisma CLI, or Playwright; no broken or absolute dependency symlink
  remains. In-image checks execute real Prisma queries from both APIs, Argon2
  hash/verify, Sharp JPEG output, and ExcelJS output. The dedicated migration
  target applies all seven migrations to an empty database; the final
  image-based PostgreSQL/Redis/MinIO stack passes both readiness endpoints,
  web `/login`, and Playwright 9/9. Next's standalone trace retains only its
  required TypeScript runtime files, not the development dependency graph.
- GitHub Actions now has an independent exact-SHA container-runtime job that
  builds the three production images plus the one-shot migration target. For
  the three long-running images it enforces non-root execution, pruned and
  relocatable dependency closures, Argon2/Sharp/ExcelJS runtime smokes, and web
  `/login` HTTP 200. Migration execution remains local evidence; this job only
  proves that target builds. The exact candidate [Actions run 31295175661](https://github.com/hungtrandigital/AKAIOS/actions/runs/31295175661)
  and post-merge `main` [Actions run 31295350615](https://github.com/hungtrandigital/AKAIOS/actions/runs/31295350615)
  each pass all nine jobs, including this container gate.
- Final local gates pass on the remediated graph: frozen-lockfile install, lint
  (0 errors), typecheck, 170/170 unit tests, coverage above 90%, all production
  package builds, seven fresh migrations, Attendance 13/13 plus Payroll 1/1
  integration tests, and Playwright 9/9 against both production processes and
  the final container stack. React 18.3.1 remains a deliberate
  minimal-compatibility choice accepted by the installed Next.js peer range and
  verified by the complete production build/browser suite; a React 19 migration
  is not bundled into this audit-only batch.
- The separate corporate-website npm audit is outside the 43-finding pnpm batch
  and remains a distinct release risk. Code Reviewer and Docs Guardian returned
  GO for candidate `90a95b0`, which merged through [PR #1](https://github.com/hungtrandigital/AKAIOS/pull/1)
  as `4f72810`. Neither the merge nor its green CI authorizes HPC deployment;
  the mobile route and normal release/operations gates remain open.

## Android UAT Package and HPC Route Readiness — 2026-08-09

- Installed a minimal local Android build toolchain (OpenJDK 17, SDK/build-tools
  34 and accepted licenses), cleaned stale Docker-generated Flutter artifacts,
  and built the employee app as an installable debug APK with
  `API_BASE_URL=https://akaios.prismate.vn/api/attendance`.
- The 114,236,964-byte package identifies as `vn.akaiunsan.ak_attendance_mobile` version
  `0.1.0+1`, targets Android 34 with minSdk 21, includes Internet/GPS/camera
  permissions, verifies under the Android debug certificate, and has SHA-256
  `33a9a8fb2cf64493702db647138f94b4baa1b8e97a2b1b8c71c2e527b5ca4b55`.
  It installed and launched on a Google APIs Android emulator without a fatal
  runtime error; Login rendered with the corporate-aligned fonts and layout.
- The public host itself returns HTTPS 200, but its mobile path is not ready:
  `GET /api/attendance/v1/attendance/my-today` reaches the backend as
  `/v1/attendance/v1/attendance/my-today` and returns 404. Read-only remote
  inspection found the clean HPC checkout on
  `agent/akaiunsan-corporate-website` at `cbb3a96`; that release predates the
  guarded Windows update script and active Caddy prefix handling. The supported
  HPC update must wait for a reviewed, clean release SHA containing the routing
  and mobile changes. Do not treat this APK as live-UAT-ready until the same
  request returns authenticated 401 rather than route 404.
- Current-worktree gates pass without cached execution: root lint/typecheck,
  Shared 2/2, Attendance 56/56 and Payroll 112/112 unit tests, core coverage,
  all production package builds, seven migrations on fresh PostgreSQL, Attendance
  13/13 plus Payroll 1/1 integration tests, and Playwright 9/9. The browser gate
  exposed and fixed a calendar-dependent fixture that used a July date after the
  monthly UI had advanced to August; it now selects a different valid date inside
  the active month. Flutter format/analyze, 22/22 tests, APK signature/archive
  verification, emulator install and cold launch also pass. The 43-finding root
  production audit recorded at this point was subsequently remediated by the
  dependency-security batch above. The separate corporate website audit still
  reports four High affected packages (not four advisories): `nanoid`, `next`,
  `postcss`, and `sharp`; it remains separate from the Android APK and pnpm batch.

## Corporate-aligned Employee Mobile UI — 2026-08-08

- Merged the latest corporate/mobile work from
  `akaios/agent/akaiunsan-corporate-website` while retaining the existing
  authentication, multi-assignment, camera-failure, simulated-camera UAT, and
  schedule/payroll changes in the working tree. The merge also adds the corporate
  website workspace and its independent CI gate.
- Revamped Login, Today, and the check-in/out sequence with the bounded employee
  mobile profile: Manrope headings, Be Vietnam Pro body/control text, corporate
  olive/forest/lime/paper colors, clearer editorial hierarchy, and a large
  explicit action for each shift. Marketing hero scale and decorative website
  effects remain excluded from the operational workflow.
- Bundled the required font weights and their upstream SIL OFL licenses for
  offline iOS/Android rendering. Mobile remains scroll-safe at 200% text on a
  320×568 viewport and preserves ≥52dp primary actions, explicit status, GPS,
  fresh-camera evidence, and supervisor-recovery controls.
- Local gates pass: Flutter analyze and 22/22 tests; corporate website lint
  (one pre-existing `<img>` warning), TypeScript, build, and 3/3 tests; root
  lint/typecheck and 170/170 Shared/Attendance/Payroll unit tests. Physical-device
  camera UAT and release signing remain pending.

## Mobile Attendance UAT UX and Demo Seed Repair — 2026-08-07

- The reserved demo-account seed now reasserts the documented `Demo@2026`
  password and active status for all 13 named demo identities on every controlled
  rerun. The rerun created no duplicate schedules; API first-factor login passed
  for all eight named CEO/BO/supervisor operators. Web login now defaults to
  `ops@ak.local` and lists the complete named operator set, removing the prior
  `admin@ak.local`/`Demo@2026` mismatch.
- Employee Today now places shift state, project, work time, two-point progress,
  and the next check action in one card. Check-in/out adds a compact three-step
  header, explicit UAT provenance, and maintains the 200% text-scale gate.
- A default-off `UAT_SIMULATED_CAMERA=true` seam replaces only camera capture in
  a debug iOS Simulator build. Profile/release, Android, and physical-iPhone runs
  stay camera-only and fail closed. Simulator check-in/out completed through fresh
  project GPS, full JPEG validation, MinIO storage, and the normal API; PostgreSQL
  shows `checked_out` with both photo keys. This is data-path evidence, not
  physical-camera or pilot acceptance.
- Local gates pass: Flutter analyze, 20/20 Flutter tests, iOS Simulator debug
  build/launch, and Shared lint/typecheck. Physical-device GPS/camera UAT remains
  mandatory before release or pilot acceptance.

## Monthly Project Schedule and Copy MVP — 2026-07-24

- Added the project/month roster to the attendance operations board, including
  employee, work date, shift, status, notes, monthly filters, and the existing
  guarded create/cancel actions.
- Added same-project schedule copy for a 1–31 day source range with mandatory
  preview. Calendar offsets and notes are retained, while attendance, status, and
  historical audit data are never cloned.
- Exact active employee/project/shift/date duplicates remain hard-blocked.
  Overlapping time ranges and multiple non-overlapping shifts in one day are
  warnings only, but save/copy requires explicit acknowledgement and writes the
  conflict evidence to immutable audit. Opaque fingerprints bind acknowledgement
  to the exact request, resource snapshot, and conflict set; concurrent changes
  force BO to review again.
- Copy is atomic and request-idempotent, including concurrent retries and
  mismatched request UUID rejection. Candidate assignments are checked against
  both existing target rows and one another before commit. Create/copy/cancel use
  a consistent project→membership→employee lock order plus tenant-scoped row
  locks, and the preview UI shows every mapping with problem rows first.
- Employee Today now returns and renders every non-cancelled assignment for the
  Vietnam work date, with a separate attendance state and action for each.
  Reconciled non-working records are terminal and never show a dead check-in action.
- Payroll and customer reporting group day-level units and fail closed with
  assignment IDs when multiple assignments were actually attended on one date,
  so BO must reconcile rather than receive guessed OT or duplicated days.
- Local verification passes: all seven migrations on an isolated PostgreSQL
  database; Attendance 56/56 unit tests and 13/13 full integration tests,
  including resource-fingerprint, concurrent-copy, cancel-lock, and
  mismatched-replay regressions; 100% statements/lines/functions and 97.59%
  branches across covered core services; Payroll typecheck and 112/112 unit
  tests; Flutter analyze plus 19/19 tests; web lint/typecheck/production build;
  focused Chromium scheduling/copy E2E; OpenAPI YAML parse; and a real
  seeded smoke request returning 15 active projects and 293 monthly assignments
  for the selected project.
- A loopback-only demo runs against the isolated database on ports 3200–3202.
  The existing services and legacy local database were left untouched. This is
  local working-tree evidence; no commit, push, deployment, remote CI, or pilot
  acceptance was performed.
- Pilot still requires a verified backup, server-first/mobile-second coordinated
  rollout, client-adoption confirmation, and a guided BO reconciliation surface
  (or explicit product-owner deferral). Rolling downgrade is unsafe after
  confirmed multi-shift data exists.

## Windows Docker Git-to-UAT Deployment — 2026-07-21

- Added a required Windows 10/11 Docker Desktop/WSL2 Compose override with
  stable named volumes and loopback-only Caddy/API/data/web bindings. This is a
  local/controlled-UAT profile; Ubuntu 22.04 remains the production/pilot host
  baseline under ADR-002.
- Added a guarded PowerShell entry point for validate/install/start/update,
  seed-only database reset, status/logs/stop and smoke testing. Exact release
  SHAs must be full reviewed commits in canonical remote `main`; mutating actions
  use high-impact confirmation. Install refuses existing containers/volumes;
  reset requires an explicit seed-only switch plus the committed tenant/admin
  sentinel. The script never deletes volumes, prunes Docker, opens the
  firewall/tunnel, exposes Docker remotely, or pushes Git.
- The owner confirmed the current Windows data is disposable seed data. Git
  therefore transports migrations and seed scripts rather than database files.
  `ResetSeedUat` may rebuild PostgreSQL from all committed migrations plus
  `db:seed:all`; preserving UAT uses a verified PostgreSQL/MinIO checkpoint and
  `Update`. Neither path is allowed for production/pilot data.
- Made the default payroll-rule seed idempotent so rerunning the dev/UAT seed
  updates the first tenant/effective-date rule instead of adding another rule.
- Added a deterministic employee UAT window: `NV-DEMO-01..05` each receive one
  active assignment on the current Vietnam date and 13 following Mon–Sat work
  dates, while generated historical attendance ends yesterday. Fresh aggregate
  seed and a second rerun both retain `5` demo employees, `5` open assignments
  today, `0` prefilled attendance records today, and `70` current/future
  assignments total. Demo writes now require a process-local
  `ALLOW_DEMO_SEED=true` sentinel, fail before writes on reserved-identity
  collisions, preserve existing attendance records on historical reruns, and
  construct seeded shift instants from Vietnam wall time (`+07:00`).
- Final isolated safety checks retained a manually edited historical attendance
  record and its `completed` assignment byte-for-byte after another seed, rendered
  a `06:00` shift at `06:03` Vietnam time with deterministic jitter, and rejected
  a reserved demo phone owned by a foreign tenant before creating any demo
  identity. Running a demo seed without the opt-in also fails before DB access.
- Caddy now owns both application ingress and the explicit storage hostname.
  Start/update/reset stop Caddy and all application writers before checkpoint,
  migration or reset while retaining stateful services; a failed schema/seed
  transition leaves writers stopped instead of serving an inconsistent database.
- Local gates pass: merged Compose config parses; every published port is
  loopback; no Linux `/data/...` bind remains; PowerShell parser and
  PSScriptAnalyzer Error gate pass; `Validate -WhatIf`, `Install -WhatIf`, and
  seed-sentinel `ResetSeedUat -WhatIf` make no checkout change; Caddy validates;
  Actionlint passes; shared
  typecheck/lint pass without shared-package warnings; and
  an isolated six-migration PostgreSQL run seeded twice while retaining exactly
  one default payroll rule. Independent code and documentation reviews returned
  **GO** with no remaining findings. Actual Windows-host mutation, tunnel changes,
  real-TOTP UAT and restart persistence remain pending.
- The first remote run exposed a parallel MinIO startup race: two integration
  workers could both observe a missing bucket before one created it. Bucket
  initialization now accepts only the two S3 already-created conflict codes,
  rechecks access with `HeadBucket`, and still fails every unrelated storage
  error. Shared regression tests cover both the safe race and fail-closed path.
  Commit `7c8edd1` passes all seven jobs in
  [GitHub Actions run 29801416748](https://github.com/hungtrandigital/AKAIOS/actions/runs/29801416748),
  including the repaired parallel integration gate and both Windows deployment
  configuration gates.
- A fresh isolated API walkthrough for `NV-DEMO-01` passes employee password
  login, Today assignment lookup with no attendance record, project-GPS plus
  decoded JPEG/MinIO check-in, check-out, and final `checked_out` state. This is
  seed/API evidence only; the user-owned physical-device UAT remains pending.

## Employee Mobile UX and Camera Failure — 2026-07-21

- Rebuilt the employee path from auth bootstrap through Login, Today and
  check-in/out with a static native Prismate launch mark that transitions into a
  reusable real-state Flutter loader (no fake delay), gentle reduced-motion-aware
  animation, Vietnamese-first copy, ≥16sp body text, ≥52dp actions, scroll-safe
  small-screen layouts and one clear next action. Login retains AKAIUNSAN product
  identity; Prismate is limited to operating/loading identity.
- Replaced async secure-storage reads inside router redirects with one bootstrap
  controller and synchronous redirects. Storage timeout has Retry, Login/Today
  no longer flash during startup, and refresh network loss no longer deletes a
  valid local session.
- Camera/location capture is fail-closed: self attendance still needs fresh GPS
  and a newly captured JPEG ≤5 MB. The backend now fully decodes the JPEG with
  16 MP/320×240 bounds instead of trusting magic bytes; device attestation and
  liveness remain explicitly outside MVP. Cancelled, denied/permanent permission,
  unavailable camera, plugin failure and unconfirmed network results have
  separate recovery; cancellation remains a quiet retry while only confirmed
  permission/hardware/plugin failures promote supervisor help. Timeout/409 and
  supervisor-assisted records reconcile against `my-today`; cache photos are
  deleted on retake, capture failure, success and screen disposal.
- Added operator-only `POST /v1/attendance/assignments/:id/manual-event` for an
  active in-project supervisor or system-admin break-glass. Employee and BO
  creation, cross-scope access, supervisor self-fallback, future/wrong-date
  events, out-of-assignment support-window events and duplicate state transitions
  fail closed. Manual record + assignment state + structured `override_attendance`
  audit commit atomically without synthetic GPS/photo, and BO visibly sees the
  manual exception. Employee manual badges now require structured camera-failure
  reason provenance as well as the authorized actor, so ordinary BO overrides
  are not mislabeled.
- Local gates pass: Flutter analyze plus 16/16 tests including 200% text on
  320×568, back/reload navigation, no-shift logout and supervisor reconciliation;
  reduced-motion loader semantics and camera recovery-state coverage; visual
  cold-launch/Login/Today QA and iOS debug build on iPhone 17 Pro Simulator;
  Attendance 48/48 unit and
  11/11 isolated fresh-service integration tests; API/web typecheck; production
  web build; and focused mocked Playwright manual-exception/focus scenario 1/1.
  The authenticated schedule browser scenario still requires the separate E2E
  account/TOTP fixture; its backend scheduling lifecycle remains covered by the
  passing integration suite.
- Independent Prismate code re-review returned **GO** with no High/Medium
  findings after verifying all six prior blockers. Remaining non-blocking test
  depth is limited to explicit upper-window/overnight boundary assertions and
  direct Playwright Tab-wrap/pending-close assertions; the implementation paths
  are present. Android now has both legacy and API 31+ Prismate splash resources
  with a white light/dark startup background. The latest Android APK package was
  not rerun because this Mac has no Android SDK; XML and image resources were
  validated and the prior Android gate remains historical evidence. Targeted
  post-fix re-review returned **GO** with no High/Medium/Low findings.
  Physical-device GPS/camera UAT remains a release/pilot gate.
  Physical-device camera/GPS UAT, release signing, pilot and staging integration
  remain pending. This remains working-tree evidence; no commit/push/deploy was
  performed in this batch.

## BO Shift Scheduling and Local Attendance UAT — 2026-07-20

- Added the Attendance operations board `Lịch ca` tab for BO/admin and scoped
  supervisors: create assignments, filter the daily roster, see operational
  status counts, create BO-only shift templates, and cancel an untouched
  assignment with an audited reason.
- Hardened assignment APIs around active actor/resource checks, tenant and
  supervisor-project scope, project contract dates, duplicate/concurrent writes,
  adjacent-day overnight overlap, atomic create/cancel audits, and cancellation
  rejection after attendance.
- Closed the follow-up review blockers: shift templates now belong to a tenant;
  the API and database enforce one non-cancelled assignment per employee/work
  date; roster results are paginated with untruncated status summaries; employee
  selection is searchable; OpenAPI/Turbo/E2E/a11y contracts are synchronized.
- Live local UAT passed for a seeded employee, BO, and an explicitly assigned
  supervisor: assignment appeared on iOS, GPS resolved inside `PRJ001`,
  check-in/out photo payloads were accepted, private object keys stayed hidden,
  and BO/supervisor views showed the final `checked_out` roster and attendance.
- UAT found and fixed mobile UTC timestamp rendering; the rebuilt iOS app showed
  the expected Vietnam-local check-in/out times. The Simulator enforced the
  camera requirement but cannot supply a camera stream, so physical-device
  capture remains pending and is not represented as passed.
- Database gates pass on an isolated fresh six-migration database and on a
  two-tenant backfill built from the prior schema. The legacy local demo database
  remains untouched because repeated active employee/date assignments correctly
  fail the migration preflight and require audited reconciliation before upgrade.
- The full attendance demo seed processed 13,800 AK assignments without writing
  the foreign-tenant sentinel. Independent final code re-review returned GO with
  no remaining High/Medium findings.
- Targeted gates pass: Attendance unit 47/47 and integration 9/9; Payroll
  integration 1/1; Flutter test 4/4 and analyze clean; web lint/typecheck/build;
  focused BO Playwright schedule create/cancel; OpenAPI YAML parse. This is
  working-tree/local evidence; no commit, push, deployment, or remote CI belongs
  to this batch yet.

## Local Authentication Test Exception — 2026-07-20

- An ignored local `DEV_FIXED_ADMIN_2FA_CODE` can replace the admin TOTP verifier
  only under an explicit `NODE_ENV=development|test`; invalid values or any
  other environment fail configuration startup.
- Password and active-admin checks, Redis challenge TTL/attempt limits, replay
  prevention for each challenge, and refresh/session rotation remain enforced.
  Fixed mode accepts only its configured four-digit value; it does not also
  accept stored TOTP. The process binds to loopback and rejects fixed-mode admin
  auth from an effective non-loopback client address. The web-admin development
  proxy also binds to loopback, so it cannot expose this path to the LAN.
- Targeted validation passes: Attendance lint/typecheck, 46/46 unit tests, both
  real-TOTP and fixed-verifier integration scenarios, plus web-admin
  lint/typecheck and production builds. Independent code/security re-review
  returned GO with no remaining findings.
- The exception is working-tree/local evidence only. Staging/pilot must omit the
  flag and revalidate the real six-digit authenticator flow.

## Remediation Gate — 2026-07-18

- **Remediation verdict:** GO from the independent attendance/auth/mobile and payroll reviewers; no blocking findings remain in commit `056a769`.
- **Bug status:** All 21 review findings are fixed. The 20 implementation findings pass local verification, and Docs Guardian returned GO for `CODE-BUG-022` on 2026-07-19.
- **Release status:** Commit `056a769` is pushed, [GitHub Actions run 29670131275](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275) passes all five jobs, and the [SHA-pinned re-review](../../../8-governance/reviews/prd-epic-002-code-re-review-2026-07-19.md) records GO. The historical rejected report remains unchanged; the non-code pilot gates remain pending.
- **Epic status:** `in-progress`. The remote CI/re-review gate has passed but is
  not sufficient for pilot: unmet PRD-SLICE-003..005 acceptance items must be completed or
  explicitly deferred and approved before the live 1–2 project pilot.

### Current verification evidence (refreshed 2026-07-19)

| Check | Result |
| --- | --- |
| Install / Prisma generation / lint / typecheck | Pass; lint has warnings only, no errors |
| Unit tests | Pass: Attendance 43/43; Payroll 107/107 (150 total) |
| Coverage | Pass: Attendance 100% statements/lines/functions and 96.15% branches; Payroll 98.76% statements/lines, 94.39% branches, and 100% functions |
| Fresh PostgreSQL 16 migration | Pass: all five working-tree migration directories applied from an empty database |
| Fresh concurrent integration | Pass: Attendance 7/7 and Payroll 1/1 (8 total) against PostgreSQL, Redis, and MinIO |
| Browser E2E | Pass: Playwright 7/7 with live APIs/web, five independent TOTP admins, and a fresh seeded database |
| Production build and images | Pass: all packages and the Attendance API, Payroll API, and web-admin images build; largest BuildKit application-context transfer is under 0.7 MB |
| Flutter mobile | Pass: localization generation, analyze, 3/3 tests, and Android debug APK build with Flutter 3.24.5 |
| iOS native compile | Pass for debug Simulator: Xcode 26.6, CocoaPods 1.17.0, iOS 26.5 / iPhone 17 Pro; employee login reaches Today through the loopback API. Release signing and physical-device validation remain pending |
| Compose / Caddy / OpenAPI | Pass: configuration validates and OpenAPI YAML parses |

## Historical Review Gate — 2026-07-17

- **Verdict:** REJECTED — 4 Critical, 14 High, and 3 Medium findings.
- **Scope:** commit range `08d9d25..9ed7be2`, 147 files.
- **Canonical report:** [PRD-EPIC-002 code review](../../../8-governance/reviews/prd-epic-002-code-review-2026-07-17.md).
- **Historical open work:** `CODE-BUG-002..018`, `CODE-BUG-020`, and `CODE-BUG-022`; `CODE-BUG-019` and `CODE-BUG-021` were already fixed. These findings were subsequently remediated and locally validated on 2026-07-18.

### Reviewed-head verification evidence (historical)

| Check | Result |
| --- | --- |
| `pnpm lint` | Fail: ESLint configuration missing |
| `pnpm typecheck` | Pass: 5/5 tasks |
| `pnpm build` | Pass: 4/4 packages on host |
| Attendance tests | Fail: 23 pass, 1 fail, 1 integration skipped |
| Payroll tests | Partial: 73 pass, 2 todo |
| Web E2E after Chromium install | Fail: 4 pass, 3 fail |
| Coverage | Fail: provider missing; ≥90% not measurable |
| Attendance Docker image | Fail: Prisma Client not generated during image build |
| Root migration command | Fail: Prisma command unavailable; no committed migrations |

## Implementation vs Acceptance

| Slice / Surface | Implementation observed in reviewed range | Acceptance status |
| --- | --- | --- |
| Foundation / architecture | Architecture, shared package, Compose, Dockerfiles, CI, migrations, and seeds are present | **Immutable gate passed:** fresh migration, production images, configuration, and [all five remote CI jobs](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275) pass for `056a769` |
| Attendance backend | Auth, employee/project/shift, check-in/out, override, and report routes are present | **Working-tree review GO:** tenant/project scope, geofence, time, concurrency, audit, and auth invariants are covered |
| Attendance mobile | Flutter app plus Android/iOS native scaffolds are present | **Android and iOS debug validated:** analyze/tests/APK pass; iOS Simulator assignment/GPS and final attendance state pass. Simulator camera is unavailable; release signing and physical-device GPS/camera validation remain pending |
| Payroll backend | Calculation, period state routes, overrides, rules, and Excel export are present | **Working-tree review GO:** authorization, month boundary, atomicity, decimal, override, OT, and MVP scope invariants pass |
| Payroll web admin | Next.js 2FA authentication, attendance, shift planning, and payroll views are present | **Local gate passed:** production build, prior 7/7 live Playwright scenarios, focused schedule create/cancel E2E, and live BO/supervisor roster checks pass |
| Customer reports | PDF/CSV generation and report routes are present | **Working-tree review GO:** permission, safe DTO, and tenant-scoped object paths are enforced |
| Pilot | No accepted live pilot evidence | **Pending:** requires operational gates and completion or approved deferral of PRD-SLICE-003..005 acceptance gaps |
| Scale-out | No accepted rollout evidence | **Blocked by pilot completion** |

## Remaining Release Actions

1. Validate a signed iOS release build on a physical device before distributing iOS artifacts.
2. Complete or explicitly approve deferral of unmet PRD-SLICE-003..005 acceptance
   items, reconcile legacy allowance overrides, and pass the operational gates
   before executing the 1–2 project pilot.

### Historical CI and migration baseline — 2026-07-17

| Check | Local result on 2026-07-17 |
| --- | --- |
| Prisma client generation | Pass with the canonical shared schema path |
| Lint / typecheck / unit | Pass; Attendance 29/29, Payroll 73 pass and 2 todo |
| Coverage | Pass; Attendance 98.52% statements / 92.30% branches, Payroll 98.63% / 91.11% |
| Production build | Pass: 4/4 packages |
| Fresh PostgreSQL 16 migration | Pass: initial migration applied; schema up to date; 16 public tables |
| Fresh aggregate seed | Pass: all four stages; randomized multi-month attendance dataset; 52 RBAC mappings |
| Real integration gate | Pass: PostgreSQL, Redis, MinIO, bucket readiness, and API readiness exercised |
| Playwright E2E | Executed with Chromium and live services: 5 pass, 2 fail on open `CODE-BUG-002` and `CODE-BUG-020` |

At that historical baseline, `CODE-BUG-019` was fixed by [GitHub Actions run 29555194773](https://github.com/hungtrandigital/AKAIOS/actions/runs/29555194773): quality, production build, and live-service integration passed; Playwright installed Chromium, migrated and seeded a fresh database, started all services, then reported 5 pass and 2 fail. The 2026-07-17 verdict remained rejected because those failures reproduced `CODE-BUG-002` and `CODE-BUG-020`, while `CODE-BUG-005` was still open. The 2026-07-18 evidence above supersedes those working-tree limitations but not the immutable historical report.

## Gate to Start Pilot

1. Complete the deployment runbook checks, mandatory RBAC seed, credential rotation where relevant, and legacy allowance-override reconciliation.
2. Complete or explicitly defer with product-owner approval every unmet
   PRD-SLICE-003..005 acceptance item; current gaps include mobile history,
   remaining BO project/employee mutation UI, pilot-grade reconciliation evidence, and the
   15-template/<10-second report acceptance target.

## Related Documents

- **[Plans Index](../plans/README.md)** - Active/completed/archived plans
- **[Plan Overview](../plans/plan-overview.md)** - Planning conventions and overview
- **[History Log](../history/history.log.md)** - Completed work history
- **[Product Backlog](../../../2-product-foundation/product-backlog/backlog.md)** - Source of work items

---

*Update this document regularly (daily/weekly) to track progress.*
