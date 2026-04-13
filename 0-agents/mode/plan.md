# Plan Mode — AI-First Startup Factory

**Version:** v3.1  
**Purpose:** Define the scope, activities, and workflow for Plan Mode

## Overview

Plan Mode is the strategic planning phase where agents create detailed roadmaps, specifications, and architectural designs based on validated ideas. This mode focuses on translating validated concepts into actionable plans, requirements, and technical specifications without writing code.

**Key Principles:**
1. **Plan Mode uses different agent perspectives (POV) and skillsets** depending on the planning context. The agent must adopt the appropriate role and activate relevant skills to deliver the best quality and most detailed plans.
2. **Default Focus: Quality & Coverage Metrics** - Plans must prioritize quality standards, coverage metrics, success criteria, and completeness. Quality and coverage are the primary planning concerns.
3. **Timeline is Optional** - Timelines, schedules, deadlines, and milestones are **NOT included by default**. Only add timelines if the user explicitly requests them.

## Agent Routing

Plan Mode is where core factory owners define canonical documents, then optionally use specialists to sharpen depth.

- **Core owners:** `@product-strategist`, `@system-architecture`, `@marketing-expert`, `@business-analyst`, `@creative-director`.
- **Specialist support:** use [../agents/agency-agents/](../agents/agency-agents/) divisions such as `product/`, `engineering/`, `marketing/`, `paid-media/`, and `project-management/` for domain-specific planning depth.
- **Rule:** specialists can inform the plan, but the core owner remains accountable for final document placement and repo-wide consistency.

## When to Use Plan Mode

Use Plan Mode when:
- **Creating product roadmaps** - Prioritizing features, defining backlogs, quality metrics (timelines only if requested)
- **Writing requirements** - Creating PRDs, user stories, acceptance criteria, success metrics
- **Designing architecture** - Creating system architecture, domain models, API contracts, quality standards
- **Planning implementations** - Creating implementation plans, technical specifications, coverage criteria
- **Strategic planning** - Defining go-to-market strategies, marketing plans, financial projections, success metrics

**Note:** Plans focus on **quality and coverage metrics** by default. Timelines are only included if explicitly requested by the user.

## Core Activities

### 0. Determine Plan Type & Adopt Appropriate Agent POV (ALWAYS START HERE)

**Before starting any planning:**

1. **Read `shared/context/current-scope.md`** - Understand finalized scope and context
2. **Determine plan type** - What are you planning?
   - **Technical/Code Planning** - System architecture, domain specs, API contracts, infrastructure
   - **Product Planning** - Product roadmap, requirements, backlog, user stories
   - **Marketing Planning** - Go-to-market strategy, marketing channels, campaigns
   - **Financial Planning** - Financial projections, unit economics, funding plans
   - **Creative/Brand Planning** - Brand guidelines, creative direction, visual identity
   - **Mixed Planning** - Multiple areas (use multiple agent POVs sequentially)

3. **Adopt appropriate agent POV and activate relevant skills:**
   - **Technical Planning** → Adopt **@system-architecture** POV
     - Activate skills: `backend-development`, `databases`, `devops`, `planning`, `problem-solving`, `sequential-thinking`
     - Focus: Scalable architecture, domain modeling, API design, infrastructure
   - **Product Planning** → Adopt **@product-strategist** POV
     - Activate skills: `planning`, `research`, `problem-solving`, `sequential-thinking`
     - Focus: Product vision, requirements, backlog prioritization, user stories
   - **Marketing Planning** → Adopt **@marketing-expert** POV (with @product-strategist collaboration)
     - Activate skills: `research`, `planning`, `ai-multimodal` (for strategy), `sequential-thinking`
     - Focus: Go-to-market strategy, channels, campaigns, positioning
   - **Financial Planning** → Adopt **@business-analyst** POV
     - Activate skills: `planning`, `research`, `problem-solving`, `sequential-thinking`
     - Focus: Financial models, unit economics, projections, funding plans
   - **Creative/Brand Planning** → Adopt **@creative-director** POV
     - Activate skills: `frontend-design`, `ui-ux-pro-max`, `ui-styling`, `planning`
     - Focus: Brand guidelines, visual identity, creative direction

4. **For complex plans requiring multiple perspectives:**
   - **Sequential approach:** Plan one area at a time, switching agent POVs
   - **Example:** Product + Technical planning
     - First: Adopt @product-strategist POV → Create product requirements
     - Then: Adopt @system-architecture POV → Create technical architecture
   - **Collaborative approach:** Consider multiple perspectives when making decisions
   - **Document agent POV used** in orchestration handoff

5. **Verify scope aligns with planning** - Ensure you understand project type, audience, and goals
6. **If scope is unclear or missing:**
   - Ask user to finalize scope in Chat Mode first
   - Or ask clarifying questions and update `shared/context/current-scope.md` with user confirmation
7. **If planning reveals scope issues:**
   - Ask user about discrepancies
   - Update `shared/context/current-scope.md` with user confirmation

**Action:** Always determine plan type first, adopt appropriate agent POV, activate relevant skills, then plan according to the finalized context.

### 1. Product Planning

**Agent POV:** Adopt **@product-strategist** perspective  
**Activate Skills:** `planning`, `research`, `problem-solving`, `sequential-thinking`

**Activities:**
- **Product Overview:** Create or update `2-product-foundation/product-overview.md` (aligned with scope)
- **Backlog Management:** Prioritize and manage `2-product-foundation/product-backlog/backlog.md`
  - Use ICE/RICE/WSJF scoring frameworks
  - Keep backlog ≤30 active items
  - **Focus on quality and coverage:** Define quality criteria, coverage requirements, success metrics
  - **Timeline:** Only include if user explicitly requests
- **Requirements:** Write detailed PRDs in `2-product-foundation/requirements/`
  - Include user stories (As a ... I want ... so that ...)
  - Include acceptance criteria (Given-When-Then)
  - **MANDATORY:** Include success metrics and KPIs (quality and coverage metrics)
  - **MANDATORY:** Define quality standards and coverage requirements
  - **Timeline:** Only include if user explicitly requests
- **User Stories:** Create user stories with acceptance criteria (Given-When-Then)
  - **MANDATORY:** Include quality criteria and coverage requirements
  - **Timeline:** Only include if user explicitly requests

**Product Strategist Mindset:**
- **Primary Focus:** Quality standards, coverage metrics, success criteria, completeness
- Focus on customer value and business justification
- Ensure every feature has measurable success metrics and quality criteria
- Define coverage requirements (what must be covered, tested, validated)
- Link requirements to market research or customer feedback
- Maintain ruthless focus on product vision
- **Timeline:** Only consider timelines if user explicitly requests them

### 2. Technical Planning (MANDATORY - Never Skip)

**Agent POV:** Adopt **@system-architecture** perspective  
**Activate Skills:** `backend-development`, `databases`, `devops`, `planning`, `problem-solving`, `sequential-thinking`

**CRITICAL:** All technical documents in `3-technical/3.1-system-foundation/` MUST be created or updated before transitioning to Code Mode.

**Tech Stack Selection:**
- **Who selects:** You (as @system-architecture)
- **When:** First step in technical planning (before creating other documents)
- **How:** 
  - Check `shared/context/current-scope.md` for tech stack preferences
  - Check requirements for tech stack constraints
  - Consider project requirements: performance, scalability, team expertise, cost, ecosystem
  - Select appropriate tech stack based on project requirements
  - Document in `infrastructure.md` and create ADR for tech stack decision

**Required Technical Documents Checklist (in this exact order):**
- ✅ **`infrastructure.md`** - **START HERE:** Tech stack selection, cloud providers, regions, scaling strategy, cost estimates
- ✅ **`design-standards/system-design.md`** - System architecture with C4 model diagrams (Mermaid)
- ✅ **`architecture/domain-specs.md`** - Domain model using DDD (entities, aggregates, bounded contexts, events)
- ✅ **`architecture/api-contracts/`** - API contract definitions (OpenAPI, GraphQL, tRPC, REST, gRPC - based on tech stack)
- ✅ **`design-standards/coding-standards.md`** - Code quality standards, patterns, conventions

**If any document is missing:**
- **DO NOT proceed to Code Mode**
- **Create the missing documents first**
- **Ensure all technical documents are complete**

**Technical Planning Activities:**
- **System Architecture:** Design system architecture in `3-technical/3.1-system-foundation/design-standards/system-design.md`
  - Use C4 model diagrams (Mermaid)
  - Consider scalability, security, performance
  - **MANDATORY:** Define quality standards and coverage requirements
  - **Timeline:** Only include if user explicitly requests
- **Domain Modeling:** Create domain specs using DDD in `3-technical/3.1-system-foundation/architecture/domain-specs.md`
  - Entities, value objects, aggregates, events
  - Bounded contexts
  - **MANDATORY:** Define domain coverage requirements
  - **Timeline:** Only include if user explicitly requests
- **API Contracts:** Define API contracts in `3-technical/3.1-system-foundation/architecture/api-contracts/`
  - Format based on tech stack (OpenAPI, GraphQL, tRPC, REST, gRPC)
  - Versioning strategy
  - **MANDATORY:** Define API quality standards and coverage requirements
  - **Timeline:** Only include if user explicitly requests
- **Infrastructure:** Plan infrastructure in `3-technical/3.1-system-foundation/infrastructure.md`
  - Cloud providers, regions, scaling strategy
  - Cost estimates at different scales
  - **MANDATORY:** Define infrastructure quality and reliability standards
  - **Timeline:** Only include if user explicitly requests
- **Coding Standards:** Define coding standards in `3-technical/3.1-system-foundation/design-standards/coding-standards.md`
  - Code quality standards, patterns, conventions
  - **MANDATORY:** Define quality metrics and coverage requirements
- **Implementation Plans:** Create plans in `3-technical/3.2-implementation/plans/active/` or `plans/epics/[epic-name]/`
  - **Check existing first** - Search `plans/active/` and `plans/epics/` before creating
  - **Add metadata** - Include status, type, priority, dates, epic, system
  - **Update index** - Add to `plans/README.md` Active Plans table
  - **MANDATORY:** Focus on quality standards, coverage metrics, success criteria
  - **MANDATORY:** Define what must be covered, tested, validated
  - **Timeline:** Only include if user explicitly requests

**System Architecture Mindset:**
- **Primary Focus:** Quality standards, coverage metrics, completeness, architectural quality
- Design for 20-year scalability
- Consider cost, latency, and failure modes at scale
- Document all architectural decisions as ADRs
- Ensure architecture supports business goals
- Define quality and coverage requirements for all components
- **Timeline:** Only consider timelines if user explicitly requests them

### 3. Marketing Planning

**Agent POV:** Adopt **@marketing-expert** perspective (collaborate with @product-strategist)  
**Activate Skills:** `research`, `planning`, `ai-multimodal` (for strategy), `sequential-thinking`

**Activities:**
- **Go-to-Market Strategy:** Create or update `4-marketing/go-to-market.md` (strategy only)
  - Positioning & messaging framework
  - Primary + secondary channels
  - Funnel goals (visitors → signups → paid)
  - **MANDATORY:** Define success metrics, quality standards, coverage requirements
  - Budget allocation
  - **Timeline:** Only include launch timeline & milestones if user explicitly requests
- **Marketing Planning:** Plan marketing channels, campaigns, and content strategy
  - Plan what campaigns to run and on which channels
  - Plan content topics and themes (not actual content)
  - Plan A/B testing strategies
  - Plan tracking and measurement
  - **MANDATORY:** Define campaign quality metrics and coverage requirements
  - **Timeline:** Only include "when" (timing) if user explicitly requests
  - Note: Actual marketing copy, creatives, and content are created in Execution Mode
- **Pitch Deck Planning:** Plan pitch deck structure, outline, key messages, and slide flow
  - Create pitch deck outline in `5-financing/pitches/outline.md` (if needed)
  - Define key messages and value propositions
  - Plan slide structure and flow
  - **MANDATORY:** Define pitch deck quality standards and coverage requirements
  - **Timeline:** Only include if user explicitly requests
  - Note: Actual pitch deck visuals are created in Execution Mode

**Marketing Expert Mindset:**
- **Primary Focus:** Quality metrics, coverage requirements, success criteria, measurement standards
- Focus on measurable customer acquisition
- Consider unit economics (CAC, LTV, payback period)
- Plan for tracking and optimization
- Align with product positioning and brand guidelines
- Define quality standards for all marketing activities
- **Timeline:** Only consider timelines if user explicitly requests them

### 3.5. Financial Planning

**Agent POV:** Adopt **@business-analyst** perspective  
**Activate Skills:** `planning`, `research`, `problem-solving`, `sequential-thinking`

**Activities:**
- **Financial Plans:** Create detailed financial plans in `5-financing/plans.md`
  - Unit economics models (CAC, LTV, payback period, gross margin)
  - Revenue projections
  - Cost structure
  - Funding requirements
  - **MANDATORY:** Define financial quality metrics and validation criteria
  - **MANDATORY:** Define coverage requirements (what scenarios must be covered)
  - **Timeline:** Only include financial milestones if user explicitly requests
- **Business Cases:** Create business cases for major initiatives
  - Go/no-go recommendations
  - Financial justification
  - Risk assessment
  - **MANDATORY:** Define success metrics and quality criteria
  - **MANDATORY:** Define coverage requirements (what must be validated)
  - **Timeline:** Only include if user explicitly requests

### 4. Creative & Brand Planning

**Agent POV:** Adopt **@creative-director** perspective  
**Activate Skills:** `frontend-design`, `ui-ux-pro-max`, `ui-styling`, `planning`

**Activities:**
- **Brand Guidelines:** Create brand guidelines in `shared/assets/`
  - Color palette, typography, motion principles, brand voice
  - Visual identity principles
  - Usage guidelines
  - **MANDATORY:** Define brand quality standards and coverage requirements
  - This is foundational planning (like architecture)
  - **Timeline:** Only include if user explicitly requests
  - Note: Actual brand assets and visual identity elements are created in Execution Mode
- **Creative Direction:** Plan creative direction and visual identity strategy
  - Art direction briefs
  - Visual style guidelines
  - Creative campaign concepts
  - **MANDATORY:** Define creative quality standards and coverage requirements
  - **Timeline:** Only include if user explicitly requests
  - Note: Actual designs, graphics, and creative assets are created in Execution Mode

**Creative Director Mindset:**
- **Primary Focus:** Brand quality standards, visual identity coverage, creative quality metrics
- Focus on brand consistency and visual identity
- Ensure brand guidelines support product positioning
- Consider accessibility and usability
- Plan for long-term brand evolution
- Define quality standards for all creative output
- **Timeline:** Only consider timelines if user explicitly requests them

### 5. Architecture Decision Records (ADRs)
- **Document Decisions:** Create ADRs in `8-governance/decision-log.md`
- **Status Tracking:** Mark ADRs as proposed | accepted | deprecated | superseded

## Allowed Actions

✅ **You CAN:**
- **Read `shared/context/current-scope.md`** - Always read scope before starting planning
- **Update `shared/context/current-scope.md`** - If planning reveals scope issues, ask user and update scope
- Create and modify files in `2-product-foundation/`, `3-technical/3.1-system-foundation/`, `4-marketing/`, `5-financing/`
- Create product requirements, user stories, acceptance criteria
- Design system architecture, domain models, API contracts
- Create implementation plans and technical specifications
- Update backlogs and roadmaps
- Create ADRs for architectural decisions
- Plan marketing strategies and financial projections
- **Focus on quality and coverage metrics** - This is the default planning approach
- **Include timelines only if user explicitly requests** - Timelines are optional, not default

## Forbidden Actions

❌ **You CANNOT:**
- Write code in `systems/[system-name]/` - use Code Mode
- Create actual designs, graphics, or visual assets (use Execution Mode)
- Write actual marketing copy or content (use Execution Mode)
- Create pitch deck visuals or slides (use Execution Mode)
- Create brand assets beyond guidelines (use Execution Mode)
- **Skip technical documents** - All required documents in `3-technical/3.1-system-foundation/` MUST be created
- **Transition to Code Mode** without completing technical planning checklist
- **Transition to Execution Mode** without brand guidelines (for creative work)
- Skip requirement validation (all requirements must be clear and actionable)
- Create vague specifications ("make it better" → rejected)
- Make technical decisions without ADRs (for major changes)
- Skip backlog prioritization (use ICE/RICE/WSJF)
- Create requirements without success metrics
- **Skip quality and coverage metrics** - All plans MUST include quality standards and coverage requirements
- **Include timelines by default** - Timelines are optional, only include if user explicitly requests

## Output Locations

**Placement guardrails (anti-sprawl):**
- Default to updating the canonical file for the domain (marketing → `4-marketing/`, financing → `5-financing/`, product → `2-product-foundation/`, architecture → `3-technical/3.1-system-foundation/`).
- Do not place marketing or financing plans inside `3-technical/`.
- If you must create a new plan file, it must be:
  - In `3-technical/3.2-implementation/plans/active/` (or `plans/epics/`)
  - Listed in `3-technical/3.2-implementation/plans/README.md`
  - Moved to `completed/` when done

All Plan Mode outputs go to:
- **Product Planning:** `2-product-foundation/`
  - `product-overview.md` - Product vision and overview
  - `product-backlog/backlog.md` - Prioritized backlog
  - `requirements/[feature-name]/` - Detailed requirements
- **Technical Planning:** `3-technical/3.1-system-foundation/` (ALL REQUIRED)
  - `infrastructure.md` - Infrastructure design (cloud, scaling, cost, tech stack)
  - `design-standards/system-design.md` - System architecture with diagrams
  - `architecture/domain-specs.md` - Domain model (DDD)
  - `architecture/api-contracts/` - API contracts (OpenAPI, GraphQL, tRPC, etc.)
  - `design-standards/coding-standards.md` - Code quality standards and conventions
- **Implementation Plans:** `3-technical/3.2-implementation/plans/active/` or `plans/epics/[epic-name]/`
  - **Check existing first** - Review `plans/README.md` index before creating
  - **Add metadata** - Include status, type, priority, dates, epic, system
  - **Update index** - Add to `plans/README.md` Active Plans table
- **Marketing Plans:** `4-marketing/go-to-market.md`
- **Financial Plans:** `5-financing/plans.md`
- **ADRs:** `8-governance/decision-log.md`

## Mode Transition

Plan Mode typically transitions to:
- **Execution Mode** - When creative/strategic plans are ready (brand guidelines, marketing strategy, pitch deck outline)
- **Code Mode** - When technical plans are ready for implementation (ONLY after ALL technical documents are created)
- **Review Mode** - When plans need validation or quality check
- **Ideas Mode** - When plans reveal gaps that need research

**Before transitioning to Execution Mode:**
- ✅ Brand guidelines exist (for creative work)
- ✅ Marketing strategy is defined (for marketing deliverables)
- ✅ Product requirements are clear (for design work)
- ✅ Pitch deck outline exists (for pitch deck visuals)

**Before transitioning to Code Mode:**
- ✅ Verify ALL technical documents in `3-technical/3.1-system-foundation/` are created and populated
- ✅ If any document is missing, create it before transitioning

## Orchestration Handoff Format

When in Plan Mode, use this format:

```markdown
**Current mode**: plan  
**Task completed**: [Yes/No/Partial]  
**Plan Type**: [Technical/Product/Marketing/Financial/Creative/Mixed]
**Agent POV Used**: [@system-architecture / @product-strategist / @marketing-expert / @business-analyst / @creative-director]
**Skills Activated**: [List skills used, e.g., `backend-development`, `planning`, `research`]
**Product/Feature/Architecture**: [Description]

**Files created/modified**:
- `2-product-foundation/[files]` OR
- `3-technical/3.1-system-foundation/[files]` OR
- `4-marketing/[files]` OR
- `5-financing/[files]` OR
- `shared/assets/[files]`
- `8-governance/decision-log.md` (if ADR created)

**Agent POV Transitions** (if multiple POVs used):
- [Previous POV] → [Current POV] → [Next POV if needed]

**Next recommended agent**: 
- Technical plans: @fullstack-engineer OR @system-architecture
- Product plans: @system-architecture OR @ui-ux-designer
- Marketing plans: @creative-director OR @graphics-designer
- Financial plans: @product-strategist
- Creative plans: @ui-ux-designer OR @graphics-designer
**Next task**: "[Clear task description based on plan]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

Plan Mode is successful when:
- ✅ All requirements are clear, actionable, and have success metrics
- ✅ **All plans include quality standards and coverage requirements** (MANDATORY)
- ✅ Backlog is prioritized and manageable (≤30 active items)
- ✅ **ALL technical documents in `3-technical/3.1-system-foundation/` are created:**
  - ✅ `infrastructure.md` exists and is populated
  - ✅ `architecture/domain-specs.md` exists and is populated
  - ✅ `architecture/api-contracts/` contains API contracts
  - ✅ `design-standards/system-design.md` exists with architecture diagrams
  - ✅ `design-standards/coding-standards.md` exists and is populated
- ✅ System architecture is documented with diagrams
- ✅ API contracts are complete and versioned
- ✅ Domain model accurately reflects business requirements
- ✅ Implementation plans are detailed and feasible
- ✅ All major decisions are documented as ADRs
- ✅ **Quality metrics and coverage requirements are defined for all deliverables**
- ✅ **Timelines are only included if user explicitly requested** (not default)

## Related Documents

- **[Product Strategist Agent](../agents/product-strategist.md)** - Primary agent for product planning
- **[System Architecture Agent](../agents/system-architecture.md)** - Primary agent for technical planning
- **[Marketing Expert Agent](../agents/marketing-expert.md)** - Marketing planning
- **[Primary Workflow](../workflows/primary-workflow.md)** - Overall workflow context
- **[Global Rules](../_core/global-rules.md)** - Repository rules and constraints

---

**Remember:** Plan Mode is about creating actionable specifications and strategies.  
- Don't write code yet—that's for Code Mode.
- Don't create actual designs, copy, or visuals yet—that's for Execution Mode.
