# Changelog

## Overview

This document provides a detailed changelog of all changes made to the project. All notable changes are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **PRD-SLICE-003 Prismate loading:** Added optimized Prismate logo derivatives for legacy and Android 12+ native launch, iOS launch, and a reusable reduced-motion-aware Flutter opacity/scale loader for bootstrap and async employee actions, without artificial delay. Native light/dark startup backgrounds remain white to avoid a transition flash.
- **PRD-SLICE-003 employee mobile UX and camera fallback:** Added a branded, auth-state-driven Flutter splash; senior-friendly Login/Today/check flow; explicit camera/location/network recovery; and an operator-only manual attendance event with structured audit and BO-visible exception provenance.
- **PRD-SLICE-003 BO shift planning:** Added a dated BO/supervisor operations board for shift templates, scoped assignments, status coverage, filters, and audited cancellation, with OpenAPI/domain contracts and focused browser/integration coverage.
- **PRD-EPIC-002 remediation (`056a769`; immutable CI passed):** Added explicit audited
  `ProjectSupervisor` membership, Redis-backed employee OTP challenges with SpeedSMS delivery,
  encrypted admin TOTP enrollment, and native refresh-token support.
- **PRD-EPIC-002 production bootstrap:** Added an idempotent production operator
  provisioning command that creates the first system admin without running demo seeds and
  hands off to the existing encrypted TOTP enrollment flow.
- **PRD-EPIC-002 mobile delivery:** Added Android/iOS Flutter platform projects, secure refresh-token storage and single-flight refresh, required camera/location permissions, generated localization sources, CI analysis/tests, and Android APK artifact generation pinned to Flutter 3.24.5.
- **PRD-EPIC-002 iOS local validation:** Added the CocoaPods integration files and lockfile, built and launched the Flutter client on an iOS 26.5 iPhone 17 Pro Simulator with Xcode 26.6, and verified employee password login through the loopback Attendance API. Release signing and physical-device validation remain pending.
- **PRD-EPIC-002 code review:** Published the canonical 2026-07-17 review report with the frozen commit range, verification evidence, verdict, and `CODE-BUG-002..022` remediation backlog.
- Operations domain structure: templates (hiring plan, onboarding, JD), tracking registry (OPS-TASK-XXX), metrics glossary, strategy, and changelog
- Role-specific JD copies: Senior Backend Engineer, Product Manager with OPS linkage and parent epics
- Hiring plans seeded and linked from registry (dates, owners, pipeline, metrics)
- **Market research types:** Quick vs Deep research with planning workflow for deep research
- **Market research plans directory:** `1-ideas/market-research/plans/` for deep research planning
- **Research methods framework:** Qualitative (interviews, focus groups, case studies), Quantitative (surveys, market sizing, cohort analysis), Competitive (feature analysis, pricing, positioning), Trends (Google Trends, VC data, regulatory analysis)
- **TAM/SAM/SOM Accuracy Protocol:** Mandatory methodology, sourcing, triangulation, sensitivity analysis, and benchmark/capacity checks embedded in market-research agent
- **Cursor IDE setup:** Updated `IDE-SETUP/cursor` README and `.cursor/settings.json` with standardized install steps, rules paths, Prettier formatter, and whitespace hygiene

### Changed
- Camera cancellation now stays on the normal retry path, while confirmed permission, hardware, or plugin failures promote supervisor assistance and Today reconciliation. Employee camera-assisted badges now require structured reason-code and actor provenance instead of treating every BO override as a camera failure.
- Employee self check-in/out now requires fresh in-memory GPS plus a newly captured JPEG before submit; the backend fully decodes it with 5 MB/16 MP ceilings and a 320×240 minimum instead of trusting magic bytes. Startup routing reads secure storage once, honors reduced motion, avoids Login/Today flash, and preserves credentials when refresh fails only because the network is unavailable. Device attestation/liveness remains explicitly outside MVP.
- Shift templates are now tenant-owned, daily BO rosters are paginated with
  full-filter status summaries, and employee selection is searchable. The
  database migration expands the former global catalog per tenant and enforces
  one non-cancelled assignment per employee/business date while preserving
  cancelled history. Tenant-scoped demo seed verification and independent final
  code re-review both pass.
- Added an opt-in, local/test-only four-digit admin second-factor verifier for
  temporary UI testing. It is disabled by default, refuses non-development/test
  environments, and leaves password, Redis challenge, attempt, session, and
  refresh-token controls intact; staging and CI continue to require real TOTP.
- Reconciled the PRD-EPIC-002 backlog, active plan, progress, work-item registry, risk register, deployment guidance, API/domain contracts, and system READMEs with remediation commit `056a769`, successful [Actions run 29670131275](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275), and the [SHA-pinned GO re-review](reviews/prd-epic-002-code-re-review-2026-07-19.md). The historical rejected review remains unchanged.
- Corrected PRD-EPIC-002 lifecycle metadata and synchronized the active epic, product backlog, work-item registry, progress status, governance risks, and review navigation with the rejected review gate.
- Archived the superseded `docs/review/REVIEW_PLAN.md` content under `archives/2026-07-17-prd-epic-002-review-plan/` and retained a redirect to the canonical plan/result.
- Reframed the core agents in `0-agents/agents/` as the reusable leader layer for multi-project work: each core agent now preserves existing process ownership while explicitly pairing `agency-agents` specialists with matching local skills.
- Registered the factory optimization initiative as `PRD-EPIC-001` / `PRD-SLICE-001` and added the active plan `3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md` plus matching registry/index updates.
- Updated `0-agents/README.md` and `INDEX.md` so the stack description now reflects leader orchestration rather than only specialist routing.
- Developed `0-agents/workflows/marketing.md` into the canonical marketing operating workflow covering validation, discovery, GTM centralization, campaign execution, measurement, and handoff.
- Aligned marketing navigation and templates with the actual repository structure by removing the stale default `4-marketing/channels/` path assumption from workflow-adjacent docs.
- Updated all references to the semantic product foundation paths (`2-product-foundation/product-overview.md`, `2-product-foundation/product-backlog/backlog.md`) across core rules, traceability, workflows, status/registry docs, and ideas/governance docs after the directory rename.
- Archived the deprecated `2-product-foundation/2.2-product-backlog/` directory to `archives/2025-12-15-deprecated-product-backlog/` to keep the active structure clean.
- Added Backlog Scale Rules to `2-product-foundation/product-backlog/backlog.md` to cap active items, enforce metadata, and define grooming/archival cadence.
- Marketing domain: campaign brief template, performance registry, metrics glossary, GTM changelog, README quick links, Parking Lot section
- Finance domain: projection template, tracking registry, metrics glossary, domain plans scale rules, README quick links
- **Market-research agent v4.0:** Enhanced with quick vs deep research types, planning workflow, detailed methods (qualitative/quantitative/competitive/trends), decision matrix for research type selection
- Detached standalone Git metadata from `0-agents/agents/agency-agents/` so the imported agent library now behaves as plain repository content instead of a nested Git repository.
- Updated `INDEX.md`, the root `README.md`, `0-agents/README.md`, and the mode documentation to reflect the actual current template structure, the vendored `agency-agents` specialist library, and the dual-layer operating model for future project reuse.
- Corrected outdated mode paths to match the current repository skeleton, especially around `4-marketing/`, `5-financing/pitches/`, `8-governance/reviews/`, `1-ideas/market-research/`, and `0-agents/workflows/project-config/`.
- Standardized core-agent routing docs so the responsibility matrix and agent definitions now map common task types to recommended `agency-agents` specialists, keeping routing aligned across `INDEX.md`, modes, and agents.
- Replaced the hardcoded tree label `factory/` with `[project-root]/` in the canonical structure docs so the template reads correctly when reused under any repository name and does not imply a literal folder named `factory`.
- Standardized boost/workflow scaffolds and product/marketing docs around the same `[project-root]/` and current-folder conventions, including a real `2-product-foundation/requirements/README.md` skeleton and removal of stale `4-marketing/channels/` assumptions.
- Removed leftover upstream repo metadata from `0-agents/agents/agency-agents/` (`.git/`, `.github/`, `.gitattributes`, `.gitignore`, `CONTRIBUTING.md`) and added a root `.gitignore` to keep `.DS_Store` and nested vendor Git metadata out of the repository going forward.

### Fixed
- **PRD-SLICE-003 attendance UAT:** Hardened assignment overlap/concurrency, active-resource and supervisor-membership enforcement, hid cancelled assignments from employee Today, and corrected mobile attendance timestamps from UTC to the device timezone. Local employee/BO/supervisor UAT passes; physical-device camera validation remains pending because iOS Simulator has no camera stream.
- **PRD-EPIC-002 remediation (working-tree review GO):** Implemented tenant/project-scoped
  supervisor authorization, safe employee/report DTO boundaries, atomic attendance checkout
  and override total recomputation, Vietnam calendar handling, geofence enforcement, and
  bounded mobile photo/MinIO routing. Public attendance projections now expose only short-lived
  presigned photo URLs, and Prisma `DATE` lookups use exact Vietnam work-date keys. Independent
  attendance/auth/mobile review found no blockers.
- **PRD-EPIC-002 payroll remediation:** Enforced payroll RBAC and tenant scope, serialized period calculation, re-read lines inside transactions, made money inputs decimal-safe, tracked explicit allowance overrides, fixed month-end and weekend/holiday rules, and kept BHXH/PIT out of MVP calculations. Independent payroll review found no blockers.
- **PRD-EPIC-002 service boundary:** Replaced Payroll's direct Attendance-table read with
  a tenant/date-scoped internal HTTP projection protected by a constant-time API-key check;
  kept the route off the public Caddy surface and exempted it from the public request quota.
  Payroll now returns safe 502/503 responses for invalid and unavailable Attendance dependencies.
- **PRD-EPIC-002 browser gate:** Added five independent seeded TOTP admins and passed the live Playwright suite 7/7 on a fresh five-migration database. Added `E2E_TOTP_SECRET` to Turbo's `test:e2e` environment allowlist so Actions can execute authenticated scenarios.
- **PRD-EPIC-002 deployment remediation:** Repaired lockfile-backed production builds, Compose/Caddy routing, migration orchestration, and Docker build context filtering; all three application images build locally, with the largest BuildKit application-context transfer under 0.7 MB after generated Next.js/mobile outputs are excluded. Release evidence must record resolved image IDs/digests and tag the exact release SHA because upstream base-image tags remain mutable.
- **PRD-EPIC-002 CI remediation:** Corrected the Prisma schema path, added real unit/integration/E2E entry points, enforced ≥90% coverage over core attendance/payroll logic, and replaced skipped or incomplete Actions checks with independent quality, build, live-service integration, and Playwright jobs; remote execution was verified by [Actions run 29555194773](https://github.com/hungtrandigital/AKAIOS/actions/runs/29555194773).
- **PRD-EPIC-002 database baseline:** Added and verified the immutable initial Prisma migration on a fresh PostgreSQL 16 database; added the production-safe `prisma:migrate:deploy` command.
- **PRD-EPIC-002 seed orchestration:** Removed the duplicate `db:seed:all` key so attendance and RBAC seed stages are no longer silently omitted from the aggregate command.
- **PRD-EPIC-002 documentation remediation:** Reconciled the canonical plan, status, domain model, OpenAPI 3.1 contract, runbook, ADRs, risk register, and system READMEs with the implemented boundaries and verified evidence; Docs Guardian returned GO for `CODE-BUG-022` on 2026-07-19.
- Cleared remaining references to legacy numbered product foundation paths (plan/boost scaffolds) and added a redirect notice in the old backlog file to point to `product-backlog/backlog.md`.
- **Structure:** Fixed `financial-modeling` skill to follow Agent Skills Spec (moved from `skills/financial-modeling.md` to `skills/financial-modeling/SKILL.md` with proper YAML frontmatter)
- **Finance-director agent:** Enhanced to explicitly activate `financial-modeling` skill during all projection work (steps 3, 4, 5) and added mandatory skill usage pattern
- **Cursor modes:** Added missing `/refactor` command to Cursor to match `0-agents/mode/refactor.md`

### Security
- Manual camera-failure attendance is restricted to active, explicitly scoped supervisors or system-admin break-glass with `attendance.override`; employees and BO cannot create it, supervisors cannot self-record, cross-tenant/project, wrong-date, future, and out-of-shift-support-window events fail closed, and compare-and-set record/assignment changes share a transaction with immutable audit. No synthetic photo/GPS is written.
- The fixed local admin verifier is fail-closed outside explicit
  `development|test`, never committed with a value, and mutually exclusive with
  the real TOTP verifier to keep environment behavior deterministic. While it is
  enabled, the API binds to loopback and rejects fixed-mode admin auth from an
  effective non-loopback client address; the development web proxy also binds to
  loopback so it cannot expose that path to the LAN.
- **Remediation review GO; immutable CI passed:** Password verification, inactive-account enforcement,
  mandatory admin TOTP, OTP abuse controls, refresh-token CAS rotation, and project membership
  grant/revoke audit boundaries now have fresh-database integration coverage.
- **Historical review findings:** The 2026-07-17 review confirmed password authentication bypass, payroll/attendance cross-tenant mutation, sensitive employee data disclosure, and spoofable OTP rate limiting. Those findings are fixed in `056a769`; all five jobs in [Actions run 29670131275](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275) pass, and SHA-pinned re-review evidence records the replacement GO verdict without altering the historical report.

## [2.0.0] - 2025-12-14 (Factory AI 2.0)

### Added
- **Work-Item Traceability System** (`0-agents/_core/work-item-traceability.md`) — Unified taxonomy, ID schema, and lifecycle tracking for all work items across domains (product, code, marketing, finance, operations, research). Implements HMVC-like architecture for project management.
  - Glossary: epic vs slice vs task vs bug vs experiment vs spike vs research with scope definitions
  - ID schema: `[DOMAIN]-[TYPE]-[SEQUENCE]` (e.g., `PRD-EPIC-001`, `CODE-BUG-042`, `MKT-TASK-031`)
  - Mandatory metadata: YAML frontmatter with `id`, `parent_id`, `related_ids`, `phases`, `owner`, `folder` for every work item
  - Attachment rules: every task/bug/slice declares parent epic; cross-domain tasks link back to product epic
  - Lifecycle tracking: work items pass through phases (ideas → plan → code → review) with full history
- **Work-Item Registry** (`3-technical/3.2-implementation/status/work-items-registry.md`) — Master index aggregating all work items, enabling cross-domain navigation and dependency tracking
  - Tables: Active Epics, Slices, Tasks (by domain), Bugs, Experiments, Recently Completed
  - Epic Dependency Map showing cross-domain task relationships
- **Task Validation Gate** (enforced by @product-strategist) — Prevents orphan tasks and scope creep by requiring every new task to link to an existing epic, idea, or plan before other agents proceed
  - Added rule 10.1 to `0-agents/_core/global-rules.md`
  - Updated `0-agents/agents/product-strategist.md` with mandatory task validation workflow and rejection template
  - Updated `0-agents/workflows/orchestration-protocol.md` section 0 (Task Validation Gate — ALWAYS FIRST)
  - Ensures product strategy is followed, system integrity maintained, and no drift occurs
- **Ideas status tables (standardized)** across all `1-ideas/` departments (`market-research/summaries.md`, `marketing/README.md`, `finance/README.md`, `features/summaries.md`, `technical/README.md`, `operations/README.md`, `product/README.md`, `executive-docs/README.md`) with newest-first ordering to keep latest work visible.

### Changed
- Updated `0-agents/_core/global-rules.md` — Added section **"Work-Item Traceability System (MANDATORY — Read This First)"** with ID schema, metadata templates, and attachment rules; added new rule 10.1 **"Task Validation Gate (MANDATORY — Product Strategist Enforces)"**
- Updated `0-agents/agents/product-strategist.md` — Added **"Task Validation Gate (MANDATORY)"** section defining validation checklist, rejection workflow, and reasoning; tightened Forbidden Actions against orphan tasks.
- Updated `0-agents/mode/fix.md` — Enforce parent-attachment for all bugs: identify owning epic/slice, attach to parent plan, no orphan docs.
- Updated `2-product-foundation/product-backlog/backlog.md` — Added epic metadata template and "Known Issues" section for bug tracking.
- Updated `3-technical/3.2-implementation/plans/README.md` — Made work-item metadata mandatory; added metadata frontmatter requirements.
- Updated `0-agents/workflows/orchestration-protocol.md` — Added section 0 (Task Validation Gate) as first orchestration pattern.
- Renamed `1-ideas/feature-ideas/` → `1-ideas/features/` and renamed initial plan files (`finance/initial-financing-plan.md`, `marketing/initial-go-to-market-plan.md`); updated references across agents, modes, workflows, marketing/financing docs, INDEX; added ideas-warehouse status guidance in `1-ideas/README.md`.
- Updated `0-agents/mode/ideas.md` — Added human-request triage flow (classify → check status tables → update existing first → create new only with docs-guardian) and clarified response expectations.
- Updated `0-agents/agents/docs-guardian.md` — Enforce the triage flow, prevent duplicate idea files, and keep Ideas Status Tables current/newest-first.
- Updated `0-agents/mode/boost.md` — Added a verification loop to ensure every required directory has a templated README before Boost completes.
- Updated `1-ideas/features/summaries.md` — Added a standardized feature status table (feature, status, priority, stage, owner, last updated, link) to enforce update-before-create tracking.

### Fixed
- Removed old plan metadata format; unified on work-item traceability frontmatter.
- Removed test data from template files; restored `backlog.md` and `work-items-registry.md` to clean placeholder format.

## Added
- *New features, capabilities, or functionality*

### Changed
- Regenerated `INDEX.md` to reflect current structure (`.github/`, `IDE-SETUP/` visibility)
### Fixed
- Relocated `6-operations/team-structure.md` to `6-operations/team/team-structure.md` to align with Boost Mode directory rules; updated links in `6-operations/README.md`, `6-operations/hr/README.md`, `6-operations/legal/README.md`, `INDEX.md`, `0-agents/_core/file-placement-guide.md`, and Boost docs.
- Updated root `README.md` to include IDE setup and GitHub config, reinforce mode discipline and alignment with global rules
- Updated agent coordination docs to align with the actual AI Factory agent roster and plan locations (`0-agents/workflows/primary-workflow.md`, `0-agents/workflows/development.md`, `0-agents/workflows/orchestration-protocol.md`)
- Expanded responsibility matrix to include forecasting/projection ownership and workflow/skill maintenance expectations
- Tightened Plan/Fix modes and documentation management defaults to reduce file sprawl and enforce correct folder placement

### Fixed
- Fixed skills frontmatter `name` fields to comply with Agent Skills Spec and folder naming (`debugging`, `problem-solving`, `frontend-development`)
- Aligned `planning` and `research` skills with AI Factory plan/report locations and “update existing docs first” rules
- Fixed `progress.md` to link to the canonical plans index (`3-technical/3.2-implementation/plans/README.md`)

### Deprecated
- *Features that are still available but will be removed in a future version*

### Removed
- *Features that have been removed in this version*

### Fixed
- *Bug fixes and error corrections*

---

## Change Categories

### Added
New features, capabilities, or functionality.

### Changed
Changes to existing functionality, behavior, or APIs.

### Deprecated
Features that are still available but will be removed in a future version.

### Removed
Features that have been removed in this version.

### Fixed
Bug fixes and error corrections.

### Security
Security-related fixes and improvements.

## Version Format

When creating a new version entry, use this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Change 1
- Change 2

### Fixed
- Bug fix 1
- Bug fix 2
```

## Related Documents

- **[Project Versions](project-versions.md)** - Version milestones
- **[Decision Log](decision-log.md)** - Decisions leading to changes
- **[Implementation History](../3-technical/3.2-implementation/history/history.log.md)** - Technical implementation details

---

*Maintain this changelog for all releases to track project evolution.*
