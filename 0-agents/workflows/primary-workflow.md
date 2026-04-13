# Primary Workflow — AI-First Startup Factory

This workflow is the default operating system for coordinated, multi-agent work in this repository.

**Always:** activate relevant skills from `0-agents/agents/skills/` when the task matches.
**Always:** let a core factory agent own routing/governance, and pull in `0-agents/agents/agency-agents/` specialists when the task benefits from deeper domain execution.

## 1) Pick the Right Mode (do this first)

- `chat` → Q&A, scope alignment, no repo modifications
- `ideas` → research/brainstorming in `1-ideas/`
- `plan` → roadmaps/specs/backlogs in `2-product-foundation/` + `3-technical/`
- `code` → implementation in `systems/[system-name]/`
- `review` → QA-only (no new features)
- `fix` → bug fixes and problem resolution
- `deliver` → orchestrate end-to-end until complete

## 2) Product & Business Inputs (when building anything new)

- @business-analyst → market + unit economics + realistic assumptions (with sources)
- @product-strategist → requirements + acceptance criteria + success metrics

**Output must include:** measurable KPIs, leading indicators, and explicit assumptions (avoid single-point “perfect” projections).

## 3) Architecture (before code)

- @system-architecture → tech stack + domain specs + API contracts + NFRs + ADRs

**Gate:** if any mandatory architecture doc is missing, stop and request it (do not guess).

## 4) Plan the Work (before code changes)

- Create/update an implementation plan in `3-technical/3.2-implementation/plans/` (check existing first).
- Keep the plan task-oriented and test-first.

## 5) Implement & Verify

- @fullstack-engineer → implement in `systems/[system-name]/` following design standards and API contracts
- Run the stack’s compile/lint/tests locally (no “green by cheating”)
- Use `debugging` + `sequential-thinking` skills when diagnosing failures

## 6) Review & Governance

- @code-reviewer → approve/reject with explicit blockers
- @docs-guardian → verify docs structure, links, and domain spec updates (implementation-level)

**Always update after changes:**
- `8-governance/changelog.md`
- `3-technical/3.2-implementation/status/progress.md` (when code-related)

## 7) Handoff

End every session with the handoff block defined in `0-agents/workflows/orchestration-protocol.md`.
