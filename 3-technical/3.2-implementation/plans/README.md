# Implementation Plans

## Overview

This directory contains all implementation plans for features, epics, fixes, and refactoring work. Plans are automatically created by agents during development and need to be actively managed to avoid clutter.

## Directory Structure

```
plans/
├── README.md                    # This file - Plans index and management
├── plan-overview.md             # High-level overview of all plans
├── plan.md                      # Current active plan (if single plan)
├── active/                      # Currently active plans
│   ├── [feature-name].md
│   └── [epic-name].md
├── epics/                       # Epic-specific plans
│   ├── [epic-name]/
│   │   ├── plan.md
│   │   └── [sub-feature].md
│   └── README.md                # Epic plans index
├── completed/                    # Completed plans (moved here after completion)
│   └── [YYYY-MM]/               # Organized by month
│       └── [feature-name].md
└── archived/                     # Archived plans (moved by docs-guardian)
    └── [YYYY-MM-DD]/
        └── [feature-name].md
```

## Plan Lifecycle

### 1. Active Plans
- **Location:** `plans/active/` or `plans/epics/[epic-name]/`
- **Status:** In progress, planned, or ready to start
- **Action:** Keep in active directory until completed

### 2. Completed Plans
- **Location:** `plans/completed/[YYYY-MM]/`
- **Status:** Implementation finished
- **Action:** Move to completed after implementation is done
- **Retention:** Keep for reference, archive after 3 months

### 3. Archived Plans
- **Location:** `plans/archived/[YYYY-MM-DD]/`
- **Status:** Old, superseded, or no longer relevant
- **Action:** Moved by @docs-guardian during cleanup

## Plan Index

### Active Plans

| Plan Name | Type | Status | Priority | Created | Last Updated | Epic | System |
|-----------|------|--------|----------|---------|--------------|------|--------|
| [agent-leadership-orchestration.md](active/agent-leadership-orchestration.md) | slice | in-progress | high | 2026-04-13 | 2026-04-13 | PRD-EPIC-001 | `0-agents/agents/` |

### Completed Plans (Last 3 Months)

| Plan Name | Type | Completed | Epic | System | Link |
|-----------|------|-----------|------|--------|------|
| *[No completed plans yet]* | - | - | - | - | - |

## Plan Management Rules

### Work-Item Traceability (MANDATORY)

**All plans MUST follow the Work-Item Traceability System:**
- **Read:** `../../0-agents/_core/work-item-traceability.md` — Complete glossary, ID schema, metadata requirements
- **Reference:** `../status/work-items-registry.md` — Master index of all work items (epics, slices, tasks, bugs)

**Every plan MUST include YAML frontmatter with mandatory metadata:**

```yaml
---
id: PRD-EPIC-001                        # Unique work-item ID (see ID schema in traceability.md)
title: "Human-readable title"
type: epic | slice | task | bug | spike | experiment | research
domain: product | code | marketing | finance | operations | research
status: active | in-progress | completed
parent_id: [PARENT-ID] | -              # If slice/task/bug: ref parent. If epic: use -
related_ids: [CODE-BUG-042, MKT-TASK-031]  # Linked work items
created: YYYY-MM-DD
updated: YYYY-MM-DD
priority: high | medium | low
owner: @agent-name or @human-name
phases: [ideas, plan, code, review]     # Which modes passed through? (order matters)
folder: systems/[system-name]/          # Where is work located?
related_domain_docs: [4-marketing/go-to-market.md, 5-financing/plans.md]  # Cross-domain links
---
```

**Benefits of metadata:**
- **Traceability:** Navigate from bug → owning epic → related marketing task → finance impact
- **Phase tracking:** See which modes a work item passed through (ideas → plan → code → review)
- **History:** When viewing an epic, all related bugs/slices/tasks visible via `related_ids`
- **Cross-domain:** Marketing tasks for a product epic are linked and discoverable

**After creating/updating a plan:**
- [ ] Update `../status/work-items-registry.md` entry for this work item
- [ ] If epic: add to `2-product-foundation/product-backlog/backlog.md`
- [ ] Update `progress.md` if code-related

### Creating Plans

**When to Create:**
- New feature implementation
- Bug fix requiring planning
- Refactoring work
- Epic breakdown

**Naming Convention:**
- **Feature plans:** `[feature-name].md` (kebab-case)
- **Fix plans:** `fix-[issue-name].md`
- **Refactoring plans:** `refactor-[area].md`
- **Epic plans:** `epics/[epic-name]/plan.md`



### Updating Plans

**When to Update:**
- Progress made on implementation
- Requirements changed
- Status changed (active → completed)
- Priority changed

**Action:** Update plan file and update index in this README

### Completing Plans

**When to Complete:**
- Implementation is finished
- All tasks in plan are done
- Code is reviewed and merged

**Action:**
1. Update plan status to "completed"
2. Add completion date
3. Move to `plans/completed/[YYYY-MM]/`
4. Update index in this README
5. Update `plan-overview.md` if needed

### Archiving Plans

**When to Archive:**
- Plan is older than 3 months (completed)
- Plan is superseded by new plan
- Plan is no longer relevant

**Action:** @docs-guardian will archive during cleanup

## Plan Organization

### By Status
- **Active:** `plans/active/` - Currently being worked on
- **Completed:** `plans/completed/[YYYY-MM]/` - Finished plans
- **Archived:** `plans/archived/[YYYY-MM-DD]/` - Old plans

### By Type
- **Features:** `plans/active/[feature-name].md`
- **Fixes:** `plans/active/fix-[issue-name].md`
- **Refactoring:** `plans/active/refactor-[area].md`
- **Epics:** `plans/epics/[epic-name]/`

### By Epic
- Epic plans in `plans/epics/[epic-name]/`
- Related feature plans reference epic in metadata
- Epic README tracks all related plans

## Plan Index Maintenance

### Automatic Updates

**Agents should:**
1. **When creating plan:** Add entry to Active Plans table
2. **When updating plan:** Update Last Updated date
3. **When completing plan:** Move to Completed Plans table
4. **When archiving plan:** Remove from index (handled by @docs-guardian)

### Manual Updates

**Project Manager should:**
- Review index monthly
- Archive old completed plans
- Update priorities
- Consolidate related plans

## Search & Discovery

### Finding Plans

**By Status:**
- Active plans: `plans/active/`
- Completed plans: `plans/completed/`
- Epic plans: `plans/epics/`

**By Feature:**
- Search in `plans/active/[feature-name].md`
- Check epic directory if part of epic

**By System:**
- Check plan metadata for system field
- Search by system name in index table

**By Date:**
- Active: Check Last Updated in index
- Completed: Check Completed date in index
- Archived: Check archive date in directory name

## Best Practices

### For Agents

1. **Always add metadata** to plans (status, type, priority, dates)
2. **Update index** when creating/updating/completing plans
3. **Link to requirements** in plan metadata
4. **Reference epic** if plan is part of epic
5. **Move to completed** when implementation is done

### For Project Managers

1. **Review index weekly** to track active plans
2. **Archive old plans monthly** (older than 3 months)
3. **Consolidate related plans** when possible
4. **Update priorities** based on business needs
5. **Track plan completion rate** for metrics

## Related Documents

- **[Plan Overview](plan-overview.md)** - High-level implementation overview
- **[Epic Plans](epics/README.md)** - Epic-specific plans index
- **[Progress Tracking](../status/progress.md)** - Implementation progress
- **[History](../history/)** - Completed work history
- **[Plan Management Workflow](../../../0-agents/workflows/plan-management-workflow.md)** - Detailed workflow

---

**Last Updated:** [Auto-updated by agents]  
**Active Plans Count:** [Auto-calculated]  
**Completed Plans (Last 3 Months):** [Auto-calculated]
