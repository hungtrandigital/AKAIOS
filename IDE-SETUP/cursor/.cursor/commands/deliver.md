# deliver

Use **Deliver Mode** (via `/deliver` command) to autonomously deliver complete tasks from start to finish without human intervention.

## Overview

Deliver Mode orchestrates multiple agents and modes to achieve 100% completion. It makes autonomous decisions, follows plans/guides, and loops until all expectations are met.

## Steps

1. **Read delivery target** - Understand what needs to be delivered
2. **Read `shared/context/current-scope.md`** - Understand project scope
3. **Identify or create delivery plan** - Check for existing plans/guides, create if missing
4. **Break down into sub-tasks** - Divide delivery into manageable tasks
5. **Autonomous execution loop:**
   - Switch to appropriate mode (plan/execution/code/review/fix)
   - Call appropriate agents (@fullstack-engineer, @ui-ux-designer, etc.)
   - Make autonomous decisions when needed
   - Complete each sub-task
   - Verify completion
   - Loop until 100% complete
6. **Final verification** - Ensure all expectations are met
7. **Update progress** - Document completion

## Autonomous Decision Making

Deliver Mode can make decisions for:
- Technology choices (when not specified)
- Implementation details (when specs incomplete)
- Design choices (when design specs missing)
- Architecture decisions (when architecture unclear)
- Quality trade-offs (default: quality first)
- Mode transitions (automatic based on needs)
- Agent orchestration (automatic based on tasks)

All decisions are documented in `8-governance/decision-log.md`.

## Output locations

Varies by deliverable type:
- **Code:** `systems/[system-name]/`
- **Tests:** `systems/[system-name]/tests/`
- **Infrastructure:** `3-technical/3.3-devops/`
- **Designs:** `shared/assets/ui-ux/`
- **Graphics:** `shared/assets/graphics/`
- **Marketing Assets:** `4-marketing/`
- **Documentation:** Appropriate documentation sections
- **Plans:** `2-product-foundation/`, `3-technical/3.1-system-foundation/`
- **Progress:** `3-technical/3.2-implementation/status/progress.md`
- **Changelog:** `8-governance/changelog.md`
- **Decisions:** `8-governance/decision-log.md`

## Handoff

Use the orchestration format in `0-agents/mode/deliver.md`:
- `Current mode: deliver`
- Delivery target and completion status
- Current phase (Planning/Execution/Code/Review/Fixing)
- Sub-tasks completed/in progress/pending
- Autonomous decisions made
- Mode transitions
- Agent calls
- Blockers/issues
- Next actions

## Key Principles

- **Autonomous:** No human approval needed for intermediate steps
- **Complete:** Loops until 100% completion
- **Decision-making:** Makes decisions when plans/guides are incomplete
- **Orchestration:** Automatically coordinates multiple modes and agents
- **Quality:** Meets all quality standards from orchestrated modes

## Related

- Mode definition: `0-agents/mode/deliver.md`
- Global rules: `0-agents/_core/global-rules.md`
- Agent definitions: `0-agents/agents/`

