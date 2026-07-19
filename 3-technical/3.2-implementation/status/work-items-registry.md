# Work-Item Registry — Master Index

**Purpose:** Centralized, real-time index of all work items across the organization (epics, slices, tasks, bugs, experiments, research). Use this to navigate, track progress, and understand cross-domain dependencies.

**Last Updated:** 2026-07-19
**Scope:** Active + recently completed work items

---

## Active Epics (Product)

| ID | Title | Status | Owner | Created | Slices | Bugs | Related Domains | Plan |
|----|-------|--------|-------|---------|--------|------|----------------|------|
| PRD-EPIC-001 | Factory Agent Leadership Orchestration | in-progress | @product-strategist | 2026-04-13 | 1 | 0 | code | [Backlog](../../../2-product-foundation/product-backlog/backlog.md) |
| PRD-EPIC-002 | Attendance + Payroll Systems for AKAIUNSAN | in-progress | @fullstack-engineer | 2026-07-16 | 6 | 21 | code, ops | [Active plan](../plans/active/PRD-EPIC-002.md) |

**Notes:**
- Slices = count of active feature slices (PRD-SLICE-*) belonging to this epic
- Bugs = count of discovered bugs (CODE-BUG-*) belonging to this epic
- Related Domains = which other domains (Marketing, Finance, Ops) have tasks for this epic

---

## Active Feature Slices (Code)

| ID | Title | Epic | Status | Owner | Created | Tasks | Bugs | Plan |
|----|-------|------|--------|-------|---------|-------|------|------|
| PRD-SLICE-001 | Standardize Core-Agent Leadership Orchestration | PRD-EPIC-001 | in-progress | @docs-guardian | 2026-04-13 | 2 | 0 | [Active plan](../plans/active/agent-leadership-orchestration.md) |
| PRD-SLICE-002 | Foundation (5 architecture docs + scaffolds) | PRD-EPIC-002 | in-progress | @system-architecture | 2026-07-16 | 4 | 4 | [Active plan](../plans/active/PRD-EPIC-002.md) |
| PRD-SLICE-003 | Attendance (mobile check-in/out + admin realtime) | PRD-EPIC-002 | in-progress | @fullstack-engineer | 2026-07-16 | 6 | 10 | [Active plan](../plans/active/PRD-EPIC-002.md) |
| PRD-SLICE-004 | Payroll engine + Excel export | PRD-EPIC-002 | in-progress | @fullstack-engineer | 2026-07-16 | 4 | 6 | [Active plan](../plans/active/PRD-EPIC-002.md) |
| PRD-SLICE-005 | Customer report generator | PRD-EPIC-002 | in-progress | @fullstack-engineer | 2026-07-16 | 3 | 1 | [Active plan](../plans/active/PRD-EPIC-002.md) |
| PRD-SLICE-006 | Pilot (1-2 projects) | PRD-EPIC-002 | planned | @ops + @fullstack-engineer | 2026-07-16 | 3 | 0 | [Active plan](../plans/active/PRD-EPIC-002.md) |
| PRD-SLICE-007 | Scale-out (13 projects) | PRD-EPIC-002 | planned | @ops + @fullstack-engineer | 2026-07-16 | 3 | 0 | [Active plan](../plans/active/PRD-EPIC-002.md) |

---

## Active Tasks (by Domain)

### Code Tasks

| ID | Title | Parent | Owner | Status | Created | Folder |
|----|-------|--------|-------|--------|---------|--------|
| CODE-TASK-001 | Add leader-orchestration contract to all core agents | PRD-SLICE-001 | @docs-guardian | in-progress | 2026-04-13 | `0-agents/agents/` |
| CODE-TASK-002 | Align specialist-to-skill pairings with the real skill library | PRD-SLICE-001 | @docs-guardian | in-progress | 2026-04-13 | `0-agents/agents/skills/` |
| CODE-TASK-004 | Scaffold `systems/attendance/` + `systems/payroll/` from TEMPLATE-SYSTEM | PRD-SLICE-002 | @fullstack-engineer | in-progress | 2026-07-16 | `systems/` |
| CODE-TASK-006 | Docker Compose stack + Caddy reverse proxy config | PRD-SLICE-002 | @devops | in-progress | 2026-07-16 | `systems/shared/` |

### Marketing Tasks

No registered active marketing tasks.

### Finance Tasks

No registered active finance tasks.

### Operations Tasks

| ID | Title | Area | Owner | Status | Created |
|----|-------|------|-------|--------|---------|
| OPS-TASK-006 | Select 1-2 pilot projects for attendance/payroll rollout | Operations | @ops | planned | 2026-07-16 |
| OPS-TASK-007 | Rollout plan for 13 remaining projects (after pilot) | Operations | @ops | planned | 2026-07-16 |

---

## Active Bugs (Code)

No active code bugs are registered for PRD-EPIC-002; release and pilot gates
remain tracked in the active plan.

---

## Active Experiments & Research

### Experiments (Marketing / Product)

No registered active experiments.

### Research & Spikes (Technical)

No registered active research spikes.

---

## Epic Dependency Map

```
PRD-EPIC-001: Factory Agent Leadership Orchestration (in-progress)
├─ Code Slices:
│  └─ PRD-SLICE-001: Standardize Core-Agent Leadership Orchestration (in-progress)
│     ├─ Tasks: CODE-TASK-001, CODE-TASK-002
│     └─ Bugs: none currently documented
├─ Marketing: none
├─ Finance: none
└─ Product Research: user-requested factory optimization context
```

---

## Recently Completed Work (Last 3 Months)

### Completed Slices

No slices completed in the current three-month window.

### Completed Tasks

| ID | Title | Domain | Completed |
|----|-------|--------|-----------|
| CODE-TASK-003 | Produce 5 architecture docs (Phase 0) | code | 2026-07-18 |
| CODE-TASK-005 | Create 3 ADRs (tech stack, on-prem, skip VN compliance MVP) | code | 2026-07-18 |

### Completed Bugs

| ID | Title | Epic | Fixed | Fixed By |
|----|-------|------|-------|----------|
| CODE-BUG-002 | Password authentication bypass | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-003 | Payroll RBAC and cross-tenant IDOR | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-004 | Attendance override cross-team/cross-tenant IDOR | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-005 | Production build and DB initialization unusable | PRD-EPIC-002 | 2026-07-18 | @devops |
| CODE-BUG-006 | Missing 2FA and inactive-account enforcement | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-007 | Supervisor PII and password-hash disclosure | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-008 | Spoofable OTP rate-limit boundary | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-009 | GPS accuracy bypasses geofence | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-010 | Attendance race and missing worked-time persistence | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-011 | Vietnam timezone/calendar drift | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-012 | Customer-report authorization and tenant leakage | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-013 | Mobile/photo/MinIO path cannot operate | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-014 | Payroll excludes the last day of month | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-015 | Payroll calculation non-atomic and unrecoverable | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-016 | Payroll override breaks money/state invariants | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-017 | Weekend/holiday overtime double-counted | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-018 | Out-of-scope compliance changes net pay | PRD-EPIC-002 | 2026-07-18 | @product-strategist |
| CODE-BUG-019 | CI/integration/coverage gate invalid | PRD-EPIC-002 | 2026-07-17 | @devops |
| CODE-BUG-020 | Web-admin auth/E2E/display defects | PRD-EPIC-002 | 2026-07-18 | @fullstack-engineer |
| CODE-BUG-021 | Aggregate seed omits attendance/RBAC | PRD-EPIC-002 | 2026-07-17 | @fullstack-engineer |
| CODE-BUG-022 | Canonical documentation and implementation drift | PRD-EPIC-002 | 2026-07-19 | @docs-guardian |

---

## How to Use This Registry

### Finding Work Related to an Epic
1. Look up epic ID (e.g., `PRD-EPIC-001`) in "Active Epics" table
2. See all related slices, tasks, bugs, and related domains
3. Click the Plan link to see full epic documentation

### Finding Work Items by Domain
- **Code:** "Active Feature Slices" and "Code Tasks"
- **Marketing:** "Marketing Tasks" (sorted by parent epic)
- **Finance:** "Finance Tasks" (sorted by parent epic)
- **Operations:** "Operations Tasks"
- **Research:** "Research & Spikes"

### Tracking Cross-Domain Dependencies
- See "Epic Dependency Map" to understand which marketing/finance/ops tasks belong to which product epic
- Use this for milestone planning and resource allocation

### Checking What Happened in a Time Period
1. Look at "Recently Completed Work" section
2. Or filter by `created` or `completed` date in any table

---

## Maintaining This Registry

### Monthly (Automated or Manual)
- [ ] Add new epics as they are created (from `2-product-foundation/product-backlog/backlog.md`)
- [ ] Move completed items to "Recently Completed Work"
- [ ] Archive items older than 3 months
- [ ] Update "Epic Dependency Map" if new slices/tasks added

### Weekly
- [ ] Update Status column for in-progress items
- [ ] Add any new bugs discovered

### Per Phase Transition
- [ ] When epic enters new phase (ideas → plan → execution), update status
- [ ] When slice completes, move to Completed Slices + update epic's slice count

### Manual Triggers
- [ ] Product Manager: Update when product backlog changes
- [ ] Tech Lead: Update when slice status changes
- [ ] Agents: Add entry immediately when creating new work item

---

## Related Documents

- **[Work-Item Traceability System](../../../0-agents/_core/work-item-traceability.md)** - Glossary, ID schema, metadata requirements
- **[Product Backlog](../../../2-product-foundation/product-backlog/backlog.md)** - Canonical epic definitions
- **[Implementation Plans](../plans/README.md)** - Slice & task plans
- **[Changelog](../../../8-governance/changelog.md)** - Historical record of all work (backup)
- **[Progress Tracking](progress.md)** - Implementation progress & metrics

---

**When in doubt: Check this registry first. It's the single source of truth for "what is happening and where."**
