# Plan Management Workflow

## Overview

This workflow defines how agents should create, update, and manage implementation plans to prevent plan clutter and maintain effective tracking.

## Plan Creation Rules

### When to Create a Plan

**Create plan when:**
- ✅ Starting new feature implementation
- ✅ Planning complex bug fix
- ✅ Planning refactoring work
- ✅ Breaking down epic into features
- ✅ User explicitly requests plan

**Do NOT create plan when:**
- ❌ Simple bug fix (can be done directly)
- ❌ Small change (< 1 hour work)
- ✅ Plan already exists for the work

### Plan Location Decision

**Decision Tree:**

```
Is this part of an epic?
├─ Yes → plans/epics/[epic-name]/[feature-name].md
└─ No → Is this a feature?
    ├─ Yes → plans/active/[feature-name].md
    └─ No → Is this a fix?
        ├─ Yes → plans/active/fix-[issue-name].md
        └─ No → plans/active/[type]-[name].md
```

### Plan Naming Convention

**Format:** `[type]-[name].md` (kebab-case)

**Types:**
- Feature: `[feature-name].md` (e.g., `user-authentication.md`)
- Fix: `fix-[issue-name].md` (e.g., `fix-login-error.md`)
- Refactor: `refactor-[area].md` (e.g., `refactor-auth-service.md`)
- Epic: `epics/[epic-name]/plan.md`

## Plan Metadata Template

**Every plan MUST include metadata:**

```markdown
---
status: active | completed | archived
type: feature | fix | refactor | epic
priority: high | medium | low
created: YYYY-MM-DD
updated: YYYY-MM-DD
epic: [epic-name] | -
system: [system-name] | cross-system
related-requirements: [path-to-requirements]
related-architecture: [path-to-architecture-docs]
---

# [Plan Title]

[Plan content...]
```

## Plan Lifecycle Management

### 1. Creating Plan

**Agent Actions:**
1. Check if plan already exists (search `plans/active/` and `plans/epics/`)
2. If exists, update existing plan instead of creating new
3. If not exists, create plan with metadata
4. Add entry to `plans/README.md` index (Active Plans table)
5. If part of epic, also update `plans/epics/README.md`

**Example:**
```markdown
# Creating feature plan for user authentication

1. Check: plans/active/user-authentication.md exists? No
2. Create: plans/active/user-authentication.md with metadata
3. Update: plans/README.md - Add to Active Plans table
4. Link: Add link to requirements in metadata
```

### 2. Updating Plan

**Agent Actions:**
1. Update plan content
2. Update `updated` date in metadata
3. Update Last Updated in `plans/README.md` index

### 3. Completing Plan

**Agent Actions:**
1. Mark plan status as "completed" in metadata
2. Add completion date
3. Move plan to `plans/completed/[YYYY-MM]/[plan-name].md`
4. Remove from Active Plans table in `plans/README.md`
5. Add to Completed Plans table in `plans/README.md`
6. Update `plan-overview.md` if needed

**Example:**
```markdown
# Completing user authentication plan

1. Update metadata: status: completed, completed: 2025-12-15
2. Move: plans/active/user-authentication.md → plans/completed/2025-12/user-authentication.md
3. Update: plans/README.md - Remove from Active, Add to Completed
```

### 4. Archiving Plan

**Agent:** @docs-guardian (automatic cleanup)

**When:**
- Completed plan older than 3 months
- Plan superseded by new plan
- Plan no longer relevant

**Action:**
1. Move to `plans/archived/[YYYY-MM-DD]/[plan-name].md`
2. Remove from Completed Plans table
3. Update changelog

## Plan Index Maintenance

### Automatic Updates (By Agents)

**When creating plan:**
```markdown
| [plan-name] | [type] | Active | [priority] | [created] | [updated] | [epic] | [system] |
```

**When updating plan:**
- Update Last Updated date in index

**When completing plan:**
- Remove from Active Plans
- Add to Completed Plans (last 3 months only)

### Manual Updates (By Project Manager)

**Weekly:**
- Review Active Plans table
- Check for stale plans (no updates > 1 month)
- Update priorities if needed

**Monthly:**
- Archive completed plans older than 3 months
- Consolidate related plans if possible
- Review plan completion metrics

## Plan Search & Discovery

### Finding Plans

**By Feature Name:**
1. Check `plans/active/[feature-name].md`
2. Check `plans/epics/[epic-name]/[feature-name].md`
3. Search in `plans/README.md` index

**By Epic:**
1. Check `plans/epics/[epic-name]/`
2. Check `plans/epics/README.md` for epic index

**By Status:**
- Active: `plans/active/` or index Active Plans table
- Completed: `plans/completed/[YYYY-MM]/` or index Completed Plans table
- Archived: `plans/archived/[YYYY-MM-DD]/`

**By System:**
- Check plan metadata for system field
- Search index table by system column

## Preventing Plan Clutter

### Rules for Agents

1. **Check before creating:** Always check if plan exists before creating new
2. **Update existing:** If plan exists, update it instead of creating duplicate
3. **Complete promptly:** Move to completed when implementation is done
4. **Add metadata:** Always include full metadata for tracking
5. **Update index:** Always update index when creating/updating/completing

### Rules for @docs-guardian

1. **Detect duplicates:** Find plans with >85% similarity
2. **Archive old plans:** Move completed plans older than 3 months
3. **Clean index:** Remove archived plans from index
4. **Verify links:** Ensure all plan links in index are valid

## Plan Consolidation

### When to Consolidate

**Consolidate when:**
- Multiple plans for same feature (duplicates)
- Related plans that should be combined
- Plans that are too granular (merge into parent)

**Action:**
1. Identify related plans
2. Merge content into single plan
3. Archive duplicates
4. Update index

## Metrics & Reporting

### Plan Metrics

**Track in `plans/README.md`:**
- Active Plans Count
- Completed Plans (Last 3 Months)
- Plans by Type (Feature/Fix/Refactor)
- Plans by Priority (High/Medium/Low)
- Plans by System
- Average Plan Completion Time

### Reporting

**Weekly Report:**
- Active plans status
- Plans completed this week
- Plans at risk (no updates > 2 weeks)

**Monthly Report:**
- Plan completion rate
- Plans archived
- Plan quality metrics

## Related Documents

- **[Plans README](../../3-technical/3.2-implementation/plans/README.md)** - Plans index and management
- **[Epic Plans README](../../3-technical/3.2-implementation/plans/epics/README.md)** - Epic plans index
- **[Docs Guardian Agent](../agents/docs-guardian.md)** - Plan archiving and cleanup
- **[Documentation Management Workflow](documentation-management.md)** - General doc management

---

**Remember:** Plans are living documents. Keep them current, organized, and indexed for effective project management.
