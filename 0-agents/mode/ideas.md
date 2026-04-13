# Ideas Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Research, validation, and exploration phase for new product concepts or feature ideas before formal planning

## Overview

Ideas Mode is the validation and exploration phase for ideas before they become formal plans. This mode supports:

1. **New Product Ideas** - Market research, competitive analysis, business validation
2. **Feature Ideas** - Impact analysis, integration planning, user validation

**Rule:** DO NOT create new files if similar idea already exists — update instead.

## Agent Routing

- **Core owners:** `@market-research`, `@business-analyst`, `@product-strategist`, `@docs-guardian`
- **Specialist support:** Pull from `agency-agents/` divisions (`product/`, `marketing/`, `paid-media/`, `academic/`)
- **Rule:** Research can widen but outputs must land in `1-ideas/` per factory structure

## When to Use Ideas Mode

Use when:
- **New Product** - Exploring initial product concepts, gathering market data
- **Feature Request** - Validating feature ideas for existing products
- **Business Validation** - Creating financial models, unit economics, TAM/SAM/SOM

## Core Activities

### 0. Read Context (ALWAYS START HERE)

**Before starting research:**
1. Read `shared/context/current-scope.md` - Understand finalized scope
2. **For Feature Ideas (MANDATORY):** Read `2-product-foundation/product-overview.md` and `backlog.md`

### 1. Classify Idea (Triage-First)

1. **Classify the idea** before any writing:
   - New product research → `market-research/`
   - Feature idea → `features/`
   - Marketing idea → `marketing/`
   - Finance idea → `finance/`

2. **Check for existing coverage:**
   - Look in relevant `summaries.md` for matching or related item
   - If exists → Update existing, DO NOT create new

3. **If new:** Ask @docs-guardian to confirm placement/name

### 2. Research & Validation

**For New Product Ideas:**
- Market research and competitive analysis
- Business case creation (unit economics, TAM/SAM/SOM)
- Initial financing/go-to-market plans

**For Feature Ideas:**
- Impact assessment on existing product
- Feature prioritization and business case
- Integration planning

### 3. Update Summaries

- **ALWAYS update** `summaries.md` after research
- Add status row with link to research findings

## Allowed Actions

✅ **You CAN:**
- Research and validate ideas in `1-ideas/`
- Create/update market research reports
- Create/update business cases
- Update existing files (preferred over creating new)
- Update `summaries.md` after research

## Forbidden Actions

❌ **You CANNOT:**
- Jump to implementation (use Code Mode)
- Create designs or content (use Execution Mode)
- Skip scope for new products (use Chat Mode first)
- Create new files without checking existing (must update existing if exists)
- Skip docs-guardian consultation for new files

## Output Locations

- **New Product:** `1-ideas/market-research/reports/`, `1-ideas/business-case-[name].md`
- **Feature Ideas:** `1-ideas/features/feature-[name].md`
- **Summaries:** `1-ideas/*/summaries.md` (ALWAYS update)

## Mode Transition

Ideas Mode transitions to:
- **plan** → When idea is validated and ready for formal specs
- **execution** → When creative deliverables needed
- **code** → When technical implementation needed
- **Chat** → When scope needs clarification

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Files created/modified**:
- `1-ideas/market-research/reports/[report-name].md` (if new product)
- `1-ideas/features/feature-[name].md` (if feature)
- `1-ideas/*/summaries.md` (ALWAYS updated)

**Key Findings**:
- [Finding 1]
- [Finding 2]

**Next recommended agent**: @business-analyst OR @product-strategist  
**Next task**: "[Clear task based on findings]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Existing files updated before creating new
- ✅ Research findings documented in `summaries.md`
- ✅ Scope confirmed for new products
- ✅ Product context read for feature ideas

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Primary Workflow](../workflows/primary-workflow.md)** - Default workflow

---

**Remember:** Ideas Mode is for validation. When idea is ready, transition to Plan Mode for formal specs.