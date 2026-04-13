# Execution Mode — AI-First Startup Factory

**Version:** v3.1  
**Purpose:** Define the scope, activities, and workflow for Execution Mode (strategic/creative deliverables)

## Overview

Execution Mode is the strategic and creative execution phase where agents create actual deliverables—designs, marketing assets, content, and creative materials—based on approved plans, brand guidelines, and strategic specifications. This mode focuses on bringing creative and strategic plans to life through visual and content deliverables.

**Command:** Use `/execution` in Cursor IDE to activate this mode.

**Agency Type:** Strategic/Creative Agency

## Agent Routing

Execution Mode is led by factory creative owners and can be deepened with specialist playbooks.

- **Core owners:** `@ui-ux-designer`, `@graphics-designer`, `@marketing-expert`, `@creative-director`.
- **Specialist support:** use [../agents/agency-agents/](../agents/agency-agents/) divisions such as `design/`, `marketing/`, `paid-media/`, and `sales/` when deliverables need narrower execution expertise.
- **Rule:** specialists shape deliverable quality, but outputs still land in the canonical asset and marketing folders defined by this repository.

## When to Use Execution Mode

Use Execution Mode when:
- **Creating UI/UX designs** - Designing user interfaces, wireframes, prototypes
- **Creating graphics** - Illustrations, icons, visual assets
- **Creating brand assets** - Brand guidelines implementation, visual identity elements
- **Writing marketing copy** - Landing pages, ads, social content, email sequences
- **Creating marketing creatives** - Ad visuals, social media graphics, campaign materials
- **Creating pitch deck visuals** - Pitch deck slides, fundraising materials
- **Writing content** - Blog posts, articles, strategic documentation
- **Creating moodboards and art direction** - Creative direction deliverables

## Core Activities

### 0. Read Current Scope (ALWAYS START HERE)

**Before starting any execution:**
1. **Read `shared/context/current-scope.md`** - Understand finalized scope and context
2. **Read relevant plans** - Review plans from Plan Mode:
   - Product requirements from `2-product-foundation/requirements/`
   - Marketing strategy from `4-marketing/go-to-market.md`
   - Brand guidelines or approved creative foundations from `shared/assets/`
   - Pitch deck outline from `5-financing/pitches/outline.md` (if exists)
3. **Verify execution aligns with plans** - Ensure deliverables match approved plans
4. **If plans are unclear or missing:**
   - Ask user to complete planning in Plan Mode first
   - Or ask clarifying questions before proceeding

**Action:** Always read scope and plans first, then execute according to approved specifications.

### 1. Design Execution

**UI/UX Design:**
- **User Interfaces:** Create UI assets under `shared/assets/` using approved project-specific subfolders
- **Wireframes:** Keep wireframes under `shared/assets/` until a dedicated design subtree is intentionally created
- **Prototypes:** Store prototype exports and references under `shared/assets/`
- **Design Systems:** Document reusable design assets under `shared/assets/`
- **User Flows:** Store user-flow diagrams under `shared/assets/`

**Graphics & Visual Assets:**
- **Illustrations:** Create illustrations under `shared/assets/`
- **Icons:** Create icon sets under `shared/assets/`
- **Visual Elements:** Create visual elements under `shared/assets/`

**Brand Assets:**
- **Visual Identity:** Create visual identity elements under `shared/assets/`
- **Brand Applications:** Create brand application examples
- **Note:** Brand guidelines foundation is created in Plan Mode; Execution Mode creates actual brand assets

### 2. Content Creation

**Marketing Copy:**
- **Canonical location first:** Update or extend `4-marketing/` documents before inventing new subfolders
- **Campaign copy:** Place reusable campaign messaging in approved files under `4-marketing/`
- **Channel copy:** Create dedicated subfolders only when execution work becomes real and the placement is approved
- **Product Copy:** Write product descriptions, feature copy

**Content Writing:**
- **Strategic content:** Keep strategy-aligned content in canonical `4-marketing/` docs unless a dedicated content subtree is intentionally created later
- **Articles:** Write articles and thought leadership content
- **Documentation:** Write strategic documentation (non-technical) without creating speculative folder sprawl

### 3. Creative Assets

**Marketing Creatives:**
- **Canonical asset storage:** Store creatives under `shared/assets/` and cross-link them from `4-marketing/` when needed
- **Campaign materials:** Create campaign-specific asset folders only when the execution workload is real and the placement is approved

**Pitch Deck Visuals:**
- **Pitch Deck Slides:** Create pitch deck visuals in `5-financing/pitches/`
- **Fundraising Materials:** Create fundraising visuals and materials
- **Note:** Pitch deck outline and structure are planned in Plan Mode; Execution Mode creates actual visuals

**Creative Direction:**
- **Moodboards:** Create moodboards under `shared/assets/`
- **Art Direction Briefs:** Create art direction briefs under `shared/assets/`
- **Creative Decks:** Create creative decks for campaigns or launches

### 4. Strategic Documentation Execution

**Content Calendars:**
- Create detailed content calendars based on content strategy from Plan Mode
- Plan content execution timeline

**Campaign Execution Plans:**
- Create detailed campaign execution plans based on marketing strategy
- Plan campaign asset creation timeline

### 5. Domain Specs Check (MANDATORY - If Structure/Functionality Changed)

**After completing execution that affects project structure or functionality:**

1. **Call @docs-guardian** - Request domain specs maintenance check
2. **Provide context** - Inform @docs-guardian about:
   - What structure changes were made (if any)
   - What functionality was added or changed (if any)
   - What entities, services, or business logic were affected (if any)
3. **Wait for verification** - @docs-guardian will check and update domain specs if needed
4. **Verify updates** - Ensure domain specs reflect current state

**Action:** If execution work affects project structure or functionality, always call @docs-guardian to check and update domain specs.

**Note:** Pure design/creative work (UI designs, graphics, marketing copy) typically doesn't require domain specs updates. Only call @docs-guardian if structure or functionality changed.

## Allowed Actions

✅ **You CAN:**
- **Read `shared/context/current-scope.md`** - Always read scope before starting execution
- **Read plans from Plan Mode** - Review requirements, marketing strategy, brand guidelines
- Create UI/UX designs, wireframes, prototypes
- Create graphics, illustrations, visual assets
- Create brand assets (based on brand guidelines from Plan Mode)
- Write marketing copy and content
- Create marketing creatives and campaign materials
- Create pitch deck visuals (based on outline from Plan Mode)
- Create moodboards and art direction briefs
- Create content calendars and campaign execution plans
- Update progress and changelog files

## Forbidden Actions

❌ **You CANNOT:**
- Write code in `systems/[system-name]/` - use Code Mode
- Create brand guidelines foundation (use Plan Mode - Creative Director)
- Plan marketing strategy (use Plan Mode - Marketing Expert)
- Plan product requirements (use Plan Mode - Product Strategist)
- Plan technical architecture (use Plan Mode - System Architecture)
- Skip brand guidelines (all designs must align with brand guidelines)
- Create designs without approved requirements
- Skip Creative Director approval (for visual assets)
- Create content without marketing strategy alignment
- Create files outside the defined structure

## Output Locations

All Execution Mode outputs go to existing canonical locations:
- **Creative and design assets:** `shared/assets/`
  - Create project-specific subfolders only when execution work is real and placement is approved
- **Marketing execution:** `4-marketing/`
  - Reuse canonical docs such as `go-to-market.md`, `personas.md`, `templates/`, `performance/`, and `history/`
- **Fundraising materials:** `5-financing/pitches/`
- **Progress:** `3-technical/3.2-implementation/status/progress.md`
- **Changelog:** `8-governance/changelog.md`

## Mode Transition

Execution Mode typically transitions to:
- **Review Mode** - When creative assets are ready for Creative Director approval
- **Code Mode** - When designs are ready for frontend implementation
- **Plan Mode** - When execution reveals gaps in planning
- **Execution Mode** (continue) - When iterating on creative deliverables

## Pre-Execution Checklist

Before starting execution, ensure:
- ✅ Brand guidelines exist (from Plan Mode or Creative Director)
- ✅ Product requirements are clear (from Plan Mode)
- ✅ Marketing strategy is defined (from Plan Mode)
- ✅ Creative direction is approved (for visual assets)
- ✅ Pitch deck outline exists (for pitch deck visuals)

## Quality Standards

Execution Mode must meet:
- **Brand Consistency:** All designs align with brand guidelines
- **Accessibility:** WCAG 2.1 AA minimum (for UI designs)
- **Creative Director Approval:** All visual assets must be approved
- **Marketing Strategy Alignment:** All content aligns with marketing strategy
- **User Experience Quality:** Designs meet UX best practices
- **Content Quality:** Copy is clear, compelling, and on-brand

## Orchestration Handoff Format

When in Execution Mode, use this format:

```markdown
**Current mode**: execution  
**Task completed**: [Yes/No/Partial]  
**Deliverable Type**: [Design/Content/Creative Asset]

**Files created/modified**:
- `shared/assets/[paths]` (for designs/graphics) OR
- `4-marketing/[paths]` (for marketing execution assets) OR
- `5-financing/pitches/[paths]` (for pitch materials)
- `3-technical/3.2-implementation/status/progress.md`
- `8-governance/changelog.md`

**Brand Guidelines Alignment**: [Yes/No - Aligned with brand guidelines]
**Creative Director Approval**: [Pending/Approved/Not Required]

**Domain Specs Check**: [Not Required/Pending/Completed] - @docs-guardian checked and updated domain specs (if structure/functionality changed)

**Next recommended agent**: @creative-director (for review) OR @ui-ux-designer (for iteration) OR @fullstack-engineer (if ready for implementation) OR @docs-guardian (if domain specs check needed)  
**Next task**: "[Clear task description]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

Execution Mode is successful when:
- ✅ All designs are on-brand and accessible
- ✅ All content aligns with marketing strategy
- ✅ Creative Director approval obtained (for visual assets)
- ✅ All deliverables meet quality standards
- ✅ Progress is tracked and changelog updated
- ✅ Designs are ready for implementation (if transitioning to Code Mode)

## Related Documents

- **[UI/UX Designer Agent](../agents/ui-ux-designer.md)** - Primary agent for UI/UX design execution
- **[Graphics Designer Agent](../agents/graphics-designer.md)** - Primary agent for graphics execution
- **[Marketing Expert Agent](../agents/marketing-expert.md)** - Primary agent for marketing content execution
- **[Creative Director Agent](../agents/creative-director.md)** - Creative direction and approval (review)
- **[Plan Mode](plan.md)** - Creates plans and specifications that Execution Mode executes
- **[Code Mode](code.md)** - Technical implementation (receives designs from Execution Mode)
- **[Global Rules](../_core/global-rules.md)** - Repository rules and constraints

---

**Remember:** Execution Mode is about creating strategic and creative deliverables.  
Brand consistency > creativity. Alignment > originality.
