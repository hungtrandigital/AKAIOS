# ADR-004: Repository File Layout — Monorepo Tooling at Root

**Status:** Accepted
**Date:** 2026-07-16
**Decider:** @user (after review feedback)
**Related:** [System Creation Workflow](../../0-agents/workflows/system-creation-workflow.md), [System README](../../systems/README.md)

## Context

AKAIUNSAN's repo was bootstrapped from the AI-First Startup Factory template (a documentation-driven monorepo skeleton). When adding the actual product codebase for PRD-EPIC-002 (attendance + payroll), the `@fullstack-engineer` introduced Node + pnpm + Turborepo tooling at the repository root. A subsequent review raised the question: **which files belong at root vs inside numbered factory dirs (e.g., `3-technical/`, `8-governance/`)?**

## Audited Root Files (as of 2026-07-16)

| File | Origin | Decision | Rationale |
| --- | --- | --- | --- |
| `README.md` | Factory + updated for AKAIUNSAN | Keep at root | Repository front page; universal convention. **Restored to mention both factory + AKAIUNSAN context.** |
| `INDEX.md` | Factory (auto-generated) | Keep at root | Auto-generated TOC; factory convention |
| `USAGE_GUIDE.md` | Factory | Keep at root | Factory quick-start |
| `package.json` | Monorepo (new) | Keep at root | **REQUIRED** at root for npm/pnpm workspaces. Standard monorepo convention. |
| `pnpm-workspace.yaml` | Monorepo (new) | Keep at root | **REQUIRED** at root for pnpm to discover `systems/*` packages. Tool requirement. |
| `turbo.json` | Monorepo (new) | Keep at root | **REQUIRED** at root for Turborepo task graph. Tool requirement. |
| `.gitignore` | Standard | Keep at root | Git convention; tools expect it at root |
| `.env.example` | Monorepo (new) | Keep at root | Single source for shared env vars across all packages. Alternative: per-package; chose root for simplicity in MVP. |
| `.dockerignore` | Monorepo (new) | Keep at root | Controls what `docker compose build` includes. Root scope = all Dockerfiles in monorepo. |
| `.github/workflows/ci.yml` | Monorepo (new) | Keep at root | **REQUIRED** by GitHub at `.github/` root |
| `0-agents/`...`8-governance/` | Factory | Keep at root | Factory lifecycle phases; convention |
| `systems/` | Factory + AKAIUNSAN | Keep at root | Factory convention for all product code |
| `IDE-SETUP/` | Factory | Keep at root | IDE-specific config (Cursor, VSCode) |
| `shared/` (root) | Factory | Keep at root | Factory templates, assets, context — distinct from `systems/shared/` |
| `archives/`, `refactoring/` | Factory | Keep at root | Factory support folders |

## Decisions

### 1. Monorepo Tooling at Root (Accepted)

**Put `package.json`, `pnpm-workspace.yaml`, `turbo.json` at root, NOT inside a sub-folder.**

- Standard practice across the JS/TS monorepo ecosystem (Turborepo, Nx, Lerna).
- Tools assume root: `pnpm install` looks for `pnpm-workspace.yaml` at root; `turbo run` reads `turbo.json` at root.
- Adding a sub-folder like `monorepo/` would create an unnecessary level of nesting and break tooling idioms.

### 2. Shared Code in `systems/shared/` (Accepted per factory)

**Put shared cross-system code in `systems/shared/`, NOT in root `shared/`.**

- Per `[systems/README.md:76-80]`: "Shared code (auth, logging used by both attendance & payroll) → `systems/shared/{libraries,packages,services}/`"
- Root `shared/` per factory holds **templates, assets, context** (non-code), distinct from `systems/shared/`.
- This 2-tier separation matches factory intent.

### 3. Deployment Infrastructure in `systems/shared/` (Accepted)

**Put `docker-compose.yml`, `docker-compose.dev.yml`, `Caddyfile` in `systems/shared/`, NOT in `3-technical/3.3-devops/`.**

- These files BUILD + RUN both backends (cross-system deployment artifact).
- `3-technical/3.3-devops/` is documented as docs-only (README, local-config, server-steps.md) — Dockerfile/Caddyfile don't fit cleanly there.
- Per-backend `Dockerfile` stays in `systems/[system]/backend/Dockerfile` (adjacent to the code it builds).

### 4. Per-Backend `.env.example` Stays in `systems/[system]/backend/`

**Each backend has its own `.env.example`** (in addition to root) showing only its required vars.

- Per-package env files are conventional; root `.env.example` shows shared + system-level vars.
- Avoids coupling between systems.

### 5. Plan File Lives in Repo at Canonical Location

**Canonical plan lives at `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md`**, NOT in session-scoped plans.

- The session-scoped `/Users/hungtran/.claude/plans/stateful-splashing-micali.md` is for planning approval only.
- Once approved, plan content is **copied into the repo** at the canonical path so future agents can find it.
- Work-items-registry already references this canonical path.

## Anti-Patterns Avoided

- **No `tools/`, `scripts/`, `mono/`, `infra/` sub-folders** — adds nesting without value
- **No `vendoring` 3rd-party code** in repo (use pnpm workspaces)
- **No duplicate dotfiles** (.gitignore at root only; per-package ignores via a separate file)

## Verification

After this decision:
- `pnpm install` works from root without flag overrides
- `turbo run build/test/lint` from root discovers all packages
- `docker compose -f systems/shared/docker-compose.yml up` works from root or from `systems/shared/`
- `git` finds `.gitignore` automatically

## Future Triggers to Revisit

- If we add another tech stack (Python, Go) → reconsider monorepo tool choice
- If number of systems grows beyond ~10 → consider splitting into separate repos or polyrepo

ADR supersedes none. Superseded by none.
