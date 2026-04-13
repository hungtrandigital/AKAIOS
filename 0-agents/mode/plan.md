# Plan Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Strategic planning phase for requirements, architecture, specifications, and roadmaps before implementation

## Overview

Plan Mode is for creating detailed roadmaps, specifications, and architectural designs based on validated ideas. This mode focuses on translating concepts into actionable plans WITHOUT writing code.

**Key Principles:**
1. **Quality & Coverage first** - Plans must include success metrics and quality standards
2. **Timelines are OPTIONAL** - Only include if user explicitly requests

## Agent Routing

- **Core owners:** `@product-strategist`, `@system-architecture`, `@marketing-expert`, `@business-analyst`, `@creative-director`
- **Specialist support:** Pull from `agency-agents/` divisions (`product/`, `engineering/`, `marketing/`)
- **Rule:** Core owner remains accountable for document placement and repo-wide consistency

## When to Use Plan Mode

Use when:
- **Product Planning** - Creating roadmaps, backlogs, PRDs, user stories
- **Technical Planning** - System architecture, domain specs, API contracts
- **Marketing Planning** - Go-to-market strategies
- **Financial Planning** - Projections, unit economics, funding plans

## Core Activities

### 0. Read Context (ALWAYS START HERE)

1. **Read `shared/context/current-scope.md`** - Understand finalized scope
2. **Determine plan type:** Technical / Product / Marketing / Financial / Creative

### 1. Adopt Agent POV

**Technical Planning →** @system-architecture  
- Focus: Scalable architecture, domain modeling, API design

**Product Planning →** @product-strategist  
- Focus: Product vision, requirements, backlog

**Marketing Planning →** @marketing-expert  
- Focus: GTM strategy, channels, positioning

**Financial Planning →** @business-analyst  
- Focus: Financial models, projections

**Creative Planning →** @creative-director  
- Focus: Brand guidelines, visual identity

### 2. Create Required Documents

**Technical Plans (ALL REQUIRED before Code Mode):**
- `3-technical/3.1-system-foundation/infrastructure.md`
- `3-technical/3.1-system-foundation/design-standards/system-design.md`
- `3-technical/3.1-system-foundation/architecture/domain-specs.md`
- `3-technical/3.1-system-foundation/architecture/api-contracts/`
- `3-technical/3.1-system-foundation/design-standards/coding-standards.md`

**Product Plans:**
- `2-product-foundation/product-overview.md`
- `2-product-foundation/product-backlog/backlog.md`
- `2-product-foundation/requirements/[feature-name]/`

### 3. Create Implementation Plans

- Check `plans/active/` and `plans/epics/` first
- Add metadata (status, type, priority, dates, epic, system)
- Update index in `plans/README.md`

## Allowed Actions

✅ **You CAN:**
- Create specs in `2-product-foundation/`, `3-technical/3.1-system-foundation/`
- Create implementation plans in `3-technical/3.2-implementation/plans/`
- Update backlogs and roadmaps
- Create ADRs in `8-governance/decision-log.md`
- Include quality standards and coverage requirements

## Forbidden Actions

❌ **You CANNOT:**
- Write code (use Code Mode)
- Create designs/assets (use Execution Mode)
- Transition to Code Mode without ALL technical docs created
- Skip quality and coverage metrics

## Output Locations

- **Product:** `2-product-foundation/`
- **Technical:** `3-technical/3.1-system-foundation/`
- **Implementation Plans:** `3-technical/3.2-implementation/plans/`
- **Marketing:** `4-marketing/go-to-market.md`
- **Financial:** `5-financing/plans.md`

## Mode Transition

Plan Mode transitions to:
- **execution** → When creative/strategic plans ready
- **code** → When ALL technical documents created
- **review** → When plans need validation

**Before Code Mode:** Verify ALL technical docs exist in `3-technical/3.1-system-foundation/`

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Plan Type**: [Technical/Product/Marketing/Financial/Creative]

**Files created/modified**:
- `2-product-foundation/[files]` OR
- `3-technical/3.1-system-foundation/[files]` OR
- `4-marketing/[files]` OR
- `5-financing/[files]`

**Next recommended agent**: @system-architecture (if technical ready) OR @fullstack-engineer (if code ready)  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Requirements are clear and actionable
- ✅ ALL technical docs created before Code Mode
- ✅ Quality standards and coverage requirements defined
- ✅ Backlog prioritized (≤30 active items)
- ✅ Timelines only if user requested

## Related Documents

- **[Product Strategist Agent](../agents/product-strategist.md)**
- **[System Architecture Agent](../agents/system-architecture.md)**
- **[Primary Workflow](../workflows/primary-workflow.md)**

---

**Remember:** Plan Mode is for specs — no code yet.