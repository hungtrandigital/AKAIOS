# Deliver Mode — AI-First Startup Factory

**Version:** v3.1  
**Purpose:** Define the scope, activities, and workflow for Deliver Mode (autonomous full task delivery)

## Overview

Deliver Mode is an autonomous execution mode where agents deliver complete tasks from start to finish without human intervention. The AI follows guides or plans, makes autonomous decisions when needed, and automatically loops until 100% of expectations are met. This mode orchestrates multiple agents and modes to achieve complete delivery.

**Command:** Use `/deliver` in Cursor IDE to activate this mode.

**Agency Type:** Autonomous Orchestration Agency

**Key Principle:** Once activated, Deliver Mode runs autonomously until the task is 100% complete. No human approval needed for intermediate steps.

## Agent Routing

Deliver Mode is the orchestration shell across the entire agent system.

- **Core owners:** choose the relevant factory owner first for routing, governance, and canonical output control.
- **Specialist support:** Deliver Mode may pull specialists from any division in [../agents/agency-agents/](../agents/agency-agents/) as needed for execution depth.
- **Rule:** autonomous delivery can widen the agent mix, but it cannot bypass mode gates, file placement rules, review, or docs-guardian checks.

## When to Use Deliver Mode

Use Deliver Mode when:
- **Complete task delivery** - You have a plan, guide, or specification and want full autonomous execution
- **End-to-end delivery** - You want the AI to handle everything from planning to implementation to review
- **Autonomous execution** - You want zero human intervention until completion
- **Multi-phase delivery** - Tasks that require multiple modes (plan → execution → code → review)
- **Following existing guides** - When you have implementation guides, plans, or specifications ready

**Note:** Deliver Mode requires a clear plan, guide, or specification. If none exists, the mode will first create one, then execute it.

## Core Activities

### 0. Read Current Scope & Identify Delivery Target (ALWAYS START HERE)

**Before starting delivery:**
1. **Read `shared/context/current-scope.md`** - Understand finalized scope and context
2. **Identify delivery target** - What needs to be delivered? (feature, document, system, etc.)
3. **Check for existing plans/guides** - Look for:
   - Plans in `2-product-foundation/requirements/`
   - Technical specs in `3-technical/3.1-system-foundation/`
   - Implementation guides in `3-technical/3.2-implementation/plans/active/` or `plans/epics/`
   - **Check plan index** - Review `plans/README.md` to find existing plans
   - Design specs in `shared/assets/`
   - Any other relevant guides or specifications
4. **If no plan exists:**
   - Create a delivery plan autonomously
   - Document the plan before execution
   - Proceed with execution

**Action:** Always understand what needs to be delivered and identify or create the delivery plan.

### 1. Autonomous Decision Making

**Deliver Mode can make autonomous decisions for:**
- **Technology choices** - When tech stack is not specified, choose based on best practices and requirements
- **Implementation details** - When specifications are incomplete, make reasonable decisions
- **Design choices** - When design specs are missing, create designs following brand guidelines
- **Architecture decisions** - When architecture is unclear, design and implement following best practices
- **Quality trade-offs** - Balance speed vs. quality based on context (default: quality first)
- **Mode transitions** - Automatically switch between modes as needed (plan → execution → code → review)
- **Agent orchestration** - Automatically call appropriate agents (@fullstack-engineer, @ui-ux-designer, etc.)

**Decision Documentation:**
- All autonomous decisions must be documented in `8-governance/decision-log.md`
- Document reasoning for each decision
- Update relevant documentation with decisions made

### 2. Autonomous Execution Loop

**The Deliver Mode operates in an autonomous loop:**

```
1. Read delivery target and plan
2. Break down into sub-tasks
3. Execute each sub-task autonomously:
   - Switch to appropriate mode (plan/execution/code/review)
   - Call appropriate agents
   - Make decisions as needed
   - Complete the sub-task
4. Verify completion against expectations
5. If not 100% complete:
   - Identify gaps
   - Create tasks to fill gaps
   - Loop back to step 3
6. If 100% complete:
   - Final verification
   - Update progress
   - Exit Deliver Mode
```

**Loop Control:**
- Continue looping until 100% completion
- Each loop iteration must make progress (no infinite loops)
- If stuck, document the blocker and attempt alternative approaches
- Maximum iterations: Document if approaching limits (but continue if progress is being made)

### 3. Mode Orchestration

**Deliver Mode automatically orchestrates other modes:**

- **Plan Mode** - When planning is needed (requirements, architecture, specs)
- **Execution Mode** - When creative/strategic deliverables are needed (designs, marketing assets)
- **Code Mode** - When technical implementation is needed (code, tests, infrastructure)
- **Review Mode** - When quality assurance is needed (code review, design review, documentation review)
- **Fix Mode** - When issues are discovered during execution
- **Ideas Mode** - When research or validation is needed

**Mode Transition Rules:**
- Automatically switch modes based on task requirements
- Complete work in each mode before transitioning
- Verify mode outputs before moving to next mode
- Document mode transitions in progress tracking

### 4. Agent Orchestration

**Deliver Mode automatically calls appropriate agents:**

- **@fullstack-engineer** - For code implementation
- **@ui-ux-designer** - For UI/UX design creation
- **@graphics-designer** - For graphics and visual assets
- **@marketing-expert** - For marketing content and assets
- **@code-reviewer** - For code quality review
- **@creative-director** - For creative asset approval
- **@system-architecture** - For architecture decisions
- **@product-strategist** - For product planning
- **@devops** - For infrastructure setup
- **@docs-guardian** - For documentation quality

**Agent Call Format:**
- Use `@agent-name` to call specific agents
- Agents operate within their defined scope
- **Agents MUST activate relevant skills** from `0-agents/agents/skills/` as defined in their agent definition
- Verify agent outputs before proceeding

**Skill Usage:**
- Each agent has a "Skills & Tools" section listing recommended skills
- **Agents MUST consider and activate relevant skills** for their tasks
- Skills provide specialized knowledge, workflows, and tools
- Skills auto-activate based on task context (progressive disclosure)
- If a skill is relevant to the task, the agent should explicitly mention using it

### 5. Progress Tracking & Verification

**Continuous Progress Tracking:**
- Update `3-technical/3.2-implementation/status/progress.md` after each major step
- Track completion percentage
- Document blockers and resolutions
- Update `8-governance/changelog.md` with significant changes

**Completion Verification:**
- Verify each deliverable against original expectations
- Check quality standards (code quality, design quality, documentation quality)
- Ensure all requirements are met
- Verify all dependencies are satisfied
- Confirm all tests pass (if applicable)
- Confirm all reviews are passed (if applicable)
- **Domain Specs Check (MANDATORY)** - Call @docs-guardian to check and update domain specs after all changes

**100% Completion Criteria:**
- All planned deliverables are created
- All quality standards are met
- All tests pass (if applicable)
- All reviews are passed (if applicable)
- All documentation is complete
- All progress tracking is updated
- **Domain specs are checked and updated** (via @docs-guardian)
- No blockers remain

## Allowed Actions

✅ **You CAN:**
- **Make autonomous decisions** - Make any decision needed to complete the delivery
- **Switch modes automatically** - Transition between modes as needed
- **Call any agent** - Orchestrate any agent needed for delivery
- **Create plans** - Create delivery plans if none exist
- **Create any deliverables** - Code, designs, documentation, tests, infrastructure
- **Skip human approval** - Make decisions and execute without asking (within scope)
- **Loop until complete** - Continue execution until 100% completion
- **Fix issues autonomously** - Identify and fix issues without asking
- **Update documentation** - Update all relevant documentation
- **Create missing specifications** - Create specs if needed for execution

## Forbidden Actions

❌ **You CANNOT:**
- **Ask for human approval** - Make decisions autonomously (except for scope changes)
- **Stop before 100% completion** - Continue until all expectations are met
- **Skip quality checks** - All deliverables must meet quality standards
- **Skip documentation** - All decisions and changes must be documented
- **Ignore existing plans** - Follow existing plans/guides when available
- **Create deliverables outside scope** - Stay within the delivery target scope
- **Skip tests** - All code must have tests (if applicable)
- **Skip reviews** - All deliverables must pass reviews (if applicable)
- **Hardcode credentials** - Use environment variables, add security warnings
- **Skip `.env.example`** - If project uses environment variables, `.env.example` is mandatory

## Output Locations

All Deliver Mode outputs go to appropriate locations based on deliverable type:
- **Code:** `systems/[system-name]/`
- **Tests:** `systems/[system-name]/tests/`
- **Infrastructure:** `3-technical/3.3-devops/`
- **Designs and Graphics:** `shared/assets/`
- **Marketing Assets:** `4-marketing/`
- **Documentation:** Appropriate documentation sections
- **Plans:** `2-product-foundation/`, `3-technical/3.1-system-foundation/`
- **Progress:** `3-technical/3.2-implementation/status/progress.md`
- **Changelog:** `8-governance/changelog.md`
- **Decisions:** `8-governance/decision-log.md`

## Mode Transition

Deliver Mode typically:
- **Starts from:** Chat Mode (when user requests full delivery)
- **Orchestrates:** Plan Mode, Execution Mode, Code Mode, Review Mode, Fix Mode
- **Ends in:** Chat Mode (when 100% complete)

**Note:** Deliver Mode does not transition to other modes—it orchestrates them internally and returns to Chat Mode when complete.

## Pre-Delivery Checklist

Before starting delivery, ensure:
- ✅ Delivery target is clear (what needs to be delivered)
- ✅ Scope is understood (read `shared/context/current-scope.md`)
- ✅ Existing plans/guides are identified (if any)
- ✅ Delivery plan is created (if none exists)

## Quality Standards

Deliver Mode must meet all quality standards from orchestrated modes:
- **Code Quality:** Follows coding standards, passes linting, type checking (from Code Mode)
- **Test Coverage:** ≥90% for new code (from Code Mode)
- **Design Quality:** Brand consistency, accessibility WCAG 2.1 AA (from Execution Mode)
- **Documentation Quality:** Complete, up-to-date, follows 10-year maintainability standards (from all modes)
- **Review Quality:** All reviews passed (from Review Mode)

## Orchestration Handoff Format

When in Deliver Mode, use this format:

```markdown
**Current mode**: deliver  
**Delivery target**: [What is being delivered]  
**Completion status**: [X% complete]  
**Current phase**: [Planning/Execution/Code/Review/Fixing]

**Sub-tasks completed**:
- [Task 1] ✅
- [Task 2] ✅
- [Task 3] 🔄 (in progress)
- [Task 4] ⏳ (pending)

**Autonomous decisions made**:
- [Decision 1] - [Reasoning]
- [Decision 2] - [Reasoning]

**Mode transitions**:
- [Previous mode] → [Current mode] → [Next planned mode]

**Agent calls**:
- @agent-name: [What agent did]
- @docs-guardian: [Domain specs check status - Pending/Completed]

**Domain Specs Check**: [Pending/Completed] - @docs-guardian checked and updated domain specs

**Blockers/Issues**: [None / List any blockers and how they're being resolved]

**Next actions**: [What will be done next autonomously]
```

## Success Criteria

Deliver Mode is successful when:
- ✅ 100% of delivery target is complete
- ✅ All quality standards are met
- ✅ All tests pass (if applicable)
- ✅ All reviews are passed (if applicable)
- ✅ All documentation is complete
- ✅ All progress tracking is updated
- ✅ No blockers remain
- ✅ User expectations are fully met

## Autonomous Decision Examples

**Example 1: Tech Stack Not Specified**
- **Situation:** Plan requires backend API but tech stack not specified
- **Decision:** Choose Node.js + Express (or Python + FastAPI) based on requirements
- **Documentation:** Document choice in `8-governance/decision-log.md` with reasoning

**Example 2: Design Spec Missing**
- **Situation:** Code Mode needs UI design but design spec doesn't exist
- **Decision:** Switch to Execution Mode, create design following brand guidelines, then return to Code Mode
- **Documentation:** Document design creation and link to design files

**Example 3: Architecture Unclear**
- **Situation:** Implementation requires architecture but architecture doc is incomplete
- **Decision:** Design architecture following best practices, document it, then implement
- **Documentation:** Update architecture docs and decision log

**Example 4: Quality Issue Found**
- **Situation:** Review Mode finds code quality issues
- **Decision:** Switch to Fix Mode, fix issues, re-run Review Mode, continue until all issues resolved
- **Documentation:** Document fixes in changelog

## Related Documents

- **[Fullstack Engineer Agent](../agents/fullstack-engineer.md)** - Code implementation
- **[UI/UX Designer Agent](../agents/ui-ux-designer.md)** - Design creation
- **[Code Reviewer Agent](../agents/code-reviewer.md)** - Code review
- **[Plan Mode](plan.md)** - Planning phase
- **[Execution Mode](execution.md)** - Creative/strategic execution
- **[Code Mode](code.md)** - Technical execution
- **[Review Mode](review.md)** - Quality assurance
- **[Fix Mode](fix.md)** - Issue resolution
- **[Global Rules](../_core/global-rules.md)** - Repository rules and constraints
- **[Orchestration Protocol](../workflows/orchestration-protocol.md)** - How agents coordinate

---

**Remember:** Deliver Mode is about autonomous, complete delivery.  
Make decisions. Execute. Loop until 100% complete. No human intervention needed.
