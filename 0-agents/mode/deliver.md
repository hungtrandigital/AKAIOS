# Deliver Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Autonomous end-to-end task delivery from planning through completion

## Overview

Deliver Mode is for autonomous execution where the AI delivers complete tasks from start to finish without human intervention. Orchestrates multiple agents and modes until 100% expectations are met.

**Key Principle:** Runs autonomously until complete. No human approval for intermediate steps.

**Rule:** Requires a clear plan/guide. If none exists, create one first.

## Agent Routing

- **Core owners:** Choose relevant core owner for task type
- **Specialist support:** Pull from any `agency-agents/` division as needed
- **Rule:** Cannot bypass mode gates, file placement, review, or docs-guardian

## When to Use Deliver Mode

Use when:
- **Complete delivery** - Have plan/guide, want full autonomous execution
- **End-to-end delivery** - Planning to implementation to review
- **Autonomous execution** - Zero human intervention until completion
- **Multi-phase tasks** - Tasks requiring multiple modes

## Core Activities

### 0. Read Scope & Identify Target (ALWAYS START HERE)

1. Read `shared/context/current-scope.md`
2. Identify delivery target
3. Check for existing plans/guides:
   - Plans in `2-product-foundation/requirements/`
   - Specs in `3-technical/3.1-system-foundation/`
   - Plans in `3-technical/3.2-implementation/plans/`
4. If no plan exists → Create one first

### 1. Execute Delivery

- Auto-loop through modes as needed
- Make autonomous decisions when needed
- Track progress and completion

### 2. Verify Completion

- Ensure all requirements met
- Update changelog
- Report completion status

## Allowed Actions

✅ **You CAN:**
- Orchestrate any mode as needed
- Make autonomous decisions
- Use any core or specialist agent
- Auto-loop until complete

## Forbidden Actions

❌ **You CANNOT:**
- Skip mode gates
- Skip review
- Skip docs-guardian checks

## Output Locations

Varies by task type (per mode requirements)

## Mode Transition

Deliver Mode loops autonomously until 100% complete, then transitions to:
- **chat** → When delivery complete

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Delivery target**: [What is being delivered]
**Completion status**: [X% complete]

**Current phase**: [Planning/Execution/Code/Review/Fixing]

**Sub-tasks completed**:
- [Task 1] ✅
- [Task 2] ✅
- [Task 3] 🔄 (in progress)

**Next recommended agent**: [Agent based on next phase]  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Plan created/exists before execution
- ✅ All phases completed
- ✅ Mode gates followed
- ✅ Changelog updated

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Primary Workflow](../workflows/primary-workflow.md)**

---

**Remember:** Deliver Mode is autonomous until 100% complete.