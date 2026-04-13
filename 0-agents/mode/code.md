# Code Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Technical implementation phase for code, tests, infrastructure, and technical documentation

## Overview

Code Mode is the technical implementation phase where agents write code, creates tests, configures infrastructure, and builds technical systems based on approved specifications.

**Rule:** DO NOT write code without approved specs from Plan Mode.

## Agent Routing

- **Core owners:** `@fullstack-engineer`, `@devops`, `@system-architecture`
- **Specialist support:** Pull from `agency-agents/` divisions (`engineering/`, `testing/`, `specialized/`)
- **Rule:** Core owner remains accountable for tests, changelog, and domain specs

## When to Use Code Mode

Use when:
- **Writing code** - Implementing features, fixing bugs
- **Writing tests** - Unit, integration, E2E tests
- **Infrastructure** - CI/CD, deployment configs
- **Database** - Schemas, migrations
- **Technical docs** - API docs, technical guides

## Core Activities

### 0. Read Specifications (ALWAYS START HERE)

**Before coding:**
1. Read ALL technical docs in `3-technical/3.1-system-foundation/`
2. Read requirements from `2-product-foundation/requirements/`
3. Verify specs exist (if missing → return to Plan Mode)

### 1. Implement Code

- **Frontend:** `systems/[system-name]/frontend/`
- **Backend:** `systems/[system-name]/backend/`
- **Database:** `systems/[system-name]/db/`
- **Shared:** `systems/shared/`

### 2. Write Tests

- **Coverage:** ≥90% for new code
- **Unit tests:** `tests/unit/`
- **Integration tests:** `tests/integration/`
- **E2E tests:** `tests/e2e/`

### 3. Run Quality Checks

- Linting
- Type checking
- Tests (all passing)

### 4. Documentation Updates

- Update progress: `3-technical/3.2-implementation/status/progress.md`
- Update changelog: `8-governance/changelog.md`

### 5. Domain Specs Check (MANDATORY)

After completing code:
1. Call @docs-guardian - Request domain specs check
2. Provide context - What code/functionality changed
3. Verify updates - Ensure domain specs reflect implementation

## Allowed Actions

✅ **You CAN:**
- Write code in `systems/[system-name]/`
- Write tests in `systems/[system-name]/tests/`
- Configure CI/CD in `.github/workflows/`
- Update progress and changelog
- Call @docs-guardian for domain specs

## Forbidden Actions

❌ **You CANNOT:**
- Write code without specs (return to Plan Mode first)
- Skip tests (≥90% coverage required)
- Commit secrets or hardcoded credentials
- Skip code review (all code must be reviewed)
- Create designs (use Execution Mode)

## Output Locations

- **Source Code:** `systems/[system-name]/`
- **Tests:** `systems/[system-name]/tests/`
- **Infrastructure:** `3-technical/3.3-devops/`
- **Progress:** `3-technical/3.2-implementation/status/progress.md`
- **Changelog:** `8-governance/changelog.md`

## Mode Transition

Code Mode transitions to:
- **review** → When code ready for review
- **execution** → When design assets needed
- **plan** → When specs need clarification

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Files created/modified**:
- `systems/[system-name]/[paths]`
- `systems/[system-name]/tests/[paths]`
- `3-technical/3.2-implementation/status/progress.md`
- `8-governance/changelog.md`

**Tests status**: [All passing / X failing]  
**Coverage**: [X% for new code]

**Next recommended agent**: @code-reviewer  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Specifications read before coding
- ✅ Tests cover ≥90% of new code
- ✅ All quality checks pass
- ✅ Code review passed
- ✅ Progress and changelog updated

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Fullstack Engineer Agent](../agents/core-agents/fullstack-engineer.md)**
- **[Primary Workflow](../workflows/primary-workflow.md)**

---

**Remember:** Code Mode is for implementation—not specs or designs.