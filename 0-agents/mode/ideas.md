# Ideas Mode — AI-First Startup Factory

**Version:** v3.1  
**Purpose:** Define the scope, activities, and workflow for Ideas Mode

## Overview

Ideas Mode is the phase where agents explore, research, validate, and synthesize ideas before they become formal plans. This mode supports two distinct scenarios:

1. **New Product Ideas** - Initial product concepts requiring comprehensive market research, competitive analysis, and business validation
2. **Feature Ideas** - New features for existing products requiring impact analysis, integration planning, and user validation

This mode focuses on discovery, validation, and early-stage analysis without committing to specific implementations.

## Agent Routing

Ideas Mode is led by the factory research layer and can pull in domain researchers from the specialist library.

- **Core owners:** `@market-research`, `@business-analyst`, `@product-strategist`, `@docs-guardian`.
- **Specialist support:** use [../agents/agency-agents/](../agents/agency-agents/) divisions such as `product/`, `marketing/`, `paid-media/`, `academic/`, `support/`, and `strategy/` when deeper research angles are needed.
- **Rule:** research can widen, but outputs still land in `1-ideas/` and governance files according to the factory structure.

## When to Use Ideas Mode

Use Ideas Mode when:

### New Product Ideas (Full Research)
- **Starting a new project** - Exploring initial product concepts and possibilities
- **Conducting market research** - Gathering data, analyzing competitors, understanding market needs
- **Validating business cases** - Creating financial models, unit economics, TAM/SAM/SOM calculations
- **Early-stage planning** - Creating initial plans that will later be refined (e.g., initial financing plan, initial go-to-market plan)

### Feature Ideas (Existing Product)
- **Adding features to existing product** - Exploring new feature concepts for products already in development or production
- **User-driven feature requests** - Validating feature ideas based on user feedback or requests
- **Competitive feature analysis** - Analyzing competitor features to inform feature ideas
- **Feature impact assessment** - Understanding how new features affect existing product architecture and user experience
- **Feature prioritization** - Creating business cases for feature additions

## Core Activities

### Who Does What (Ideas Mode)
- **@market-research:** Owns `1-ideas/market-research/` (reports, summaries, resources); update `summaries.md` every time.
- **@business-analyst:** Owns `1-ideas/finance/initial-financing-plan.md`, `1-ideas/marketing/initial-go-to-market-plan.md`, and business cases in `1-ideas/business-case-[name].md`; update existing before creating.
- **@product-strategist:** Converts approved ideas into backlog/requirements; decides when to move to Plan/Execution.
- **@docs-guardian:** Enforces placement/naming; blocks generic/duplicate files; keeps INDEX and links correct.

### Existing vs New Idea Rule
- **If idea already exists:** Update the existing file and its `summaries.md` entry (market research → `market-research/summaries.md`; features → `features/summaries.md`; plans → `finance/initial-financing-plan.md` or `marketing/initial-go-to-market-plan.md`). No new file unless scope materially changes and docs-guardian approves.
- **If idea is new:** After consulting docs-guardian, create the correctly named file in the right folder (`market-research/reports/[topic]-[YYYY-MM].md` or `features/feature-[name].md`), then add a status row/link in the relevant `summaries.md`.

### When a human submits a new idea request (triage-first)
1) **Classify the idea** (before any writing):
  - New product research (market-research), feature idea (features), marketing idea (marketing), finance idea (finance), technical/ops/product concepts (respective folder), or executive summary (executive-docs).
2) **Check for existing coverage:**
  - Look in the relevant Ideas Status Table (newest-first tables in each folder) for a matching or related item.
  - Open the linked doc if present; note current `Status`, `Stage`, `Last Updated`.
3) **If it exists:**
  - Update the existing row (Status/Stage/Owner/Last Updated) and the linked doc with the new ask or findings.
  - Summarize back to the human what exists and what you will update (or what is already covered).
4) **If it does not exist:**
  - Ask docs-guardian to confirm placement/name, then create the new doc with kebab-case and add a row to the table (newest-first order).
5) **Respond with next steps:**
  - Say which category you used, whether it was existing vs new, what you updated, and what you will analyze next. Keep traceability to the table row and linked doc.

### 0. Determine Idea Type & Read Context (ALWAYS START HERE)

**Before starting any research or analysis:**

1. **Determine idea type:**
   - **New Product Idea** - Completely new product concept, no existing product
   - **Feature Idea** - New feature for existing product (product already has foundation)

2. **Read relevant context:**
   - **For New Product Ideas:**
     - Read `shared/context/current-scope.md` - Understand finalized scope and context if any
     - Check project type - Is this an internal tool or external product?
   - **For Feature Ideas (MANDATORY):**
     - Read `2-product-foundation/product-overview.md` - Understand existing product
     - Read `2-product-foundation/product-backlog/backlog.md` - Understand existing features
     - Read `3-technical/3.1-system-foundation/architecture/domain-specs.md` - Understand existing domain model
     - Read `3-technical/3.2-implementation/domain-specs.md` - Understand implementation details
     - Check `2-product-foundation/requirements/` - Review existing requirements
     - **Understand product context** - What does the product currently do? What are existing features?

3. **Verify research approach:**
   - **New Product Ideas:** Full market research, competitive analysis, business validation
   - **Feature Ideas:** Focused research on feature impact, user needs, integration points
   - **Internal tools:** Skip market research, focus on internal requirements and technical feasibility

4. **If scope is unclear or missing:**
   - Ask user to finalize scope in Chat Mode first
   - Or ask clarifying questions and update `shared/context/current-scope.md` with user confirmation

**Action:** Always determine idea type first, then read appropriate context, then decide research approach.

### 1. Research & Discovery

#### For New Product Ideas:
- **Market Research:** Conduct comprehensive market analysis, competitor research, customer interviews (ONLY for external products, not internal tools)
- **Data Collection:** Gather quantitative and qualitative data from various sources
- **Trend Analysis:** Identify market trends, opportunities, and threats
- **Customer Validation:** Understand customer pain points, needs, and willingness to pay

#### For Feature Ideas:
- **Existing Product Analysis:** Review current product features, architecture, and user flows
- **Feature Impact Analysis:** Understand how new feature affects:
  - Existing features and user workflows
  - Domain model and business logic
  - Technical architecture and implementation
  - User experience and product positioning
- **User Research (Focused):** Gather user feedback on feature need (surveys, interviews, analytics)
- **Competitive Feature Analysis:** Analyze how competitors implement similar features (if applicable)
- **Integration Planning:** Identify integration points with existing features and systems

**Scope-Based Research:**
- **New External Products:** Full market research, competitive analysis, customer validation
- **New Internal Tools:** Skip market research, focus on internal requirements and technical feasibility
- **Feature Additions (External):** Focused research on feature impact, user needs, competitive positioning
- **Feature Additions (Internal):** Focus on internal requirements, technical feasibility, integration points

### 2. Business Analysis

#### For New Product Ideas:
- **Financial Modeling:** Create unit economics models (CAC, LTV, payback period, gross margin)
- **Market Sizing:** Calculate TAM/SAM/SOM with sources and methodology
- **Competitive Analysis:** Build competitor matrices, feature comparisons, positioning analysis
- **Risk Assessment:** Identify and document risks in `8-governance/risk-register.md`

#### For Feature Ideas:
- **Feature Business Case:** Create business case for feature addition:
  - User value and impact
  - Development effort estimation
  - Revenue impact (if applicable)
  - Competitive advantage
  - Risk assessment
- **Feature Prioritization:** Compare feature against existing backlog priorities
- **Integration Cost Analysis:** Estimate effort to integrate with existing features
- **Risk Assessment:** Identify risks specific to feature addition (technical, user experience, business)

### 3. Initial Planning
- **Initial Financing Plan:** Create early-stage financial projections in `1-ideas/finance/initial-financing-plan.md`
- **Initial Go-to-Market Plan:** Draft early GTM strategy in `1-ideas/marketing/initial-go-to-market-plan.md`
- **Business Cases:** Write business cases for major initiatives with go/no-go recommendations

### 4. Documentation

#### For New Product Ideas:
- **Research Reports:** Document findings in `1-ideas/market-research/reports/`
- **Summaries:** Maintain executive summaries in `1-ideas/market-research/summaries.md`
- **Business Cases:** Create business case documents in `1-ideas/business-case-[product-name].md`

#### For Feature Ideas:
- **Feature Ideas:** Document feature ideas in `1-ideas/features/feature-[feature-name].md`
- **Feature Analysis:** Create analysis documents in `1-ideas/features/analysis/`
- **Feature Summaries:** Maintain feature ideas summary in `1-ideas/features/summaries.md`
- **Business Cases:** Create feature business case in `1-ideas/features/business-case-[feature-name].md`
- **Integration Plans:** Document integration considerations in feature documents

## Allowed Actions

✅ **You CAN:**
- **Read `shared/context/current-scope.md`** - Always read scope before starting work
- **Update `shared/context/current-scope.md`** - If research reveals scope issues, ask user and update scope
- **UPDATE existing files** in `1-ideas/` directory (preferred)
  - Update `1-ideas/market-research/summaries.md` with new findings
  - Update existing reports in `1-ideas/market-research/reports/` if they exist
  - Update `1-ideas/finance/initial-financing-plan.md` and `1-ideas/marketing/initial-go-to-market-plan.md`
- **CREATE new files** ONLY when:
  1. You have consulted `@docs-guardian` about file location and naming
  2. The file follows kebab-case naming (e.g., `competitor-analysis-2025-12.md`, NOT `COMPLETE_REPORT.md`)
  3. The file is placed in the correct directory structure
  4. You update `summaries.md` to link to the new file
- Conduct research and gather data
- Create financial models and business cases
- Update `8-governance/risk-register.md` with identified risks
- Create initial plans (will be moved to final locations later)
- Use web search (if authorized) for market research
- Generate ideas and brainstorm solutions

## Forbidden Actions

❌ **You CANNOT:**
- **Create standalone report files** with generic names like:
  - `COMPLETE_REPORT.md`, `FULL_REPORT.md`, `FINAL_REPORT.md`
  - `RESEARCH.md`, `ANALYSIS.md`, `FINDINGS.md`
  - `report.md`, `summary.md`, `log.md` (use existing `summaries.md` instead)
- **Create files without consulting docs-guardian** → Always check file location and naming with `@docs-guardian` first
- **Create duplicate files** → Always check if a similar file exists and update it instead
- **Create files outside allowed structure** → All files must be in `1-ideas/` subdirectories
- **Skip updating summaries.md** → Always update `1-ideas/market-research/summaries.md` when creating new reports
- Create detailed product requirements (use Plan Mode)
- Write code or technical specifications (use Code Mode)
- Create final marketing plans (initial only, final goes to `4-marketing/`)
- Create final financing plans (initial only, final goes to `5-financing/`)
- Make final go/no-go decisions (only recommendations)
- Skip research validation (all claims must have sources)

## Output Locations & File Creation Rules

**CRITICAL: Before creating ANY new file, you MUST:**
1. Check if a similar file already exists (search the directory)
2. If exists → **UPDATE it** instead of creating a new file
3. If doesn't exist → Consult `@docs-guardian` about:
   - Correct file location
   - Proper file naming (kebab-case, descriptive, dated)
   - Whether the file should be created or content should go in existing files

All Ideas Mode outputs go to:

#### For New Product Ideas:
- **Market Research:** `1-ideas/market-research/`
  - `reports/` - Detailed research reports (named: `[topic]-[YYYY-MM].md`, e.g., `competitor-analysis-2025-12.md`)
  - `summaries.md` - **ALWAYS UPDATE THIS FILE** with new findings (do NOT create new summary files)
  - `resources/` - Reference materials
- **Business Cases:** `1-ideas/business-case-[product-name].md` (kebab-case, descriptive)
- **Initial Plans:** 
  - `1-ideas/finance/initial-financing-plan.md` (→ final: `5-financing/plans.md`) - **UPDATE, don't recreate**
  - `1-ideas/marketing/initial-go-to-market-plan.md` (→ final: `4-marketing/go-to-market.md`) - **UPDATE, don't recreate**

#### For Feature Ideas:
- **Feature Ideas:** `1-ideas/features/`
  - `feature-[feature-name].md` - Feature idea document (e.g., `feature-user-dashboard.md`)
  - `summaries.md` - **ALWAYS UPDATE THIS FILE** with new feature ideas (do NOT create new summary files)
  - `analysis/` - Feature analysis documents (e.g., `analysis-[feature-name]-impact.md`)
  - `business-case-[feature-name].md` - Feature business case documents
- **Integration Notes:** Include in feature documents how feature integrates with existing product

#### Common:
- **Risks:** `8-governance/risk-register.md` - **UPDATE existing entries, don't create new risk files**

**File Naming Examples:**
- ✅ `competitor-analysis-2025-12.md` (market research)
- ✅ `customer-interviews-q4-2025.md` (market research)
- ✅ `market-size-tam-sam-som.md` (market research)
- ✅ `feature-user-dashboard.md` (feature idea)
- ✅ `feature-payment-integration.md` (feature idea)
- ✅ `analysis-user-dashboard-impact.md` (feature analysis)
- ✅ `business-case-user-dashboard.md` (feature business case)
- ❌ `COMPLETE_REPORT.md`
- ❌ `report.md`
- ❌ `FINDINGS.md`
- ❌ `summary.md` (use `summaries.md` instead)

## Pre-Action Checklist (MANDATORY)

Before creating or modifying ANY file in Ideas Mode:

#### For New Product Ideas:
1. ✅ **Read existing files first** - Check `1-ideas/market-research/summaries.md` and `reports/` directory
2. ✅ **Check for similar files** - Search for existing files with similar content
3. ✅ **Consult docs-guardian** - If creating a new file, ask `@docs-guardian` about location and naming
4. ✅ **Update summaries.md** - Always update `1-ideas/market-research/summaries.md` when adding new research
5. ✅ **Follow naming convention** - Use kebab-case, descriptive names, dates (YYYY-MM format)
6. ✅ **Link in summaries.md** - Add link to new report in `summaries.md`

#### For Feature Ideas:
1. ✅ **Read existing product docs first** - Check `2-product-foundation/`, `3-technical/3.1-system-foundation/architecture/domain-specs.md`
2. ✅ **Check existing feature ideas** - Check `1-ideas/features/summaries.md` and existing feature documents
3. ✅ **Check product backlog** - Review `2-product-foundation/product-backlog/backlog.md` for similar features
4. ✅ **Consult docs-guardian** - If creating a new file, ask `@docs-guardian` about location and naming
5. ✅ **Update summaries.md** - Always update `1-ideas/features/summaries.md` when adding new feature ideas
6. ✅ **Follow naming convention** - Use kebab-case, descriptive names (e.g., `feature-[feature-name].md`)
7. ✅ **Link in summaries.md** - Add link to new feature idea in `summaries.md`
8. ✅ **Consider integration** - Document how feature integrates with existing product

**If unsure → Ask docs-guardian first, don't create files blindly.**

## Mode Transition

Ideas Mode typically transitions to:
- **Plan Mode** - When ideas are validated and ready for detailed planning
- **Review Mode** - When research needs validation or quality check
- **Docs Guardian** - After creating/modifying files, docs-guardian should review structure compliance

## Orchestration Handoff Format

When in Ideas Mode, use this format:

```markdown
**Current mode**: ideas  
**Task completed**: [Yes/No/Partial]  
**Research/Analysis Topic**: [Description]

**Idea Type**: [New Product Idea / Feature Idea]

**Files created/modified**:
- For New Product: `1-ideas/market-research/[files]`, `1-ideas/business-case-[name].md`
- For Feature: `1-ideas/features/feature-[name].md`, `1-ideas/features/business-case-[name].md`
- `8-governance/risk-register.md`

**Key Findings**:
- [Finding 1]
- [Finding 2]

**Feature Integration** (if Feature Idea):
- [How feature integrates with existing product]
- [Impact on existing features]
- [Technical considerations]

**Next recommended agent**: 
- New Product: @product-strategist OR @business-analyst
- Feature: @product-strategist OR @system-architecture (for integration planning)
**Next task**: "[Clear task description]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

Ideas Mode is successful when:
- ✅ All research is properly documented with sources
- ✅ Business cases have clear go/no-go recommendations
- ✅ Financial models are accurate and validated
- ✅ Risks are identified and documented
- ✅ Initial plans are created and ready for refinement
- ✅ Data supports product strategy decisions

## Related Documents

- **[Market Research Agent](../agents/market-research.md)** - Primary agent for Ideas Mode
- **[Business Analyst Agent](../agents/business-analyst.md)** - Business case creation
- **[Primary Workflow](../workflows/primary-workflow.md)** - Overall workflow context
- **[Global Rules](../_core/global-rules.md)** - Repository rules and constraints

---

**Remember:** Ideas Mode is about exploration and validation.  
Don't commit to implementations yet—that's for Plan, Execution, and Code modes.
