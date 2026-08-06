# Work-Item Registry — Master Index

**Purpose:** Centralized, real-time index of all work items across the organization (epics, slices, tasks, bugs, experiments, research). Use this to navigate, track progress, and understand cross-domain dependencies.

**Last Updated:** 2026-08-05
**Scope:** Active + recently completed work items

---

## Active Epics (Product)

| ID | Title | Status | Owner | Created | Slices | Bugs | Related Domains | Plan |
|----|-------|--------|-------|---------|--------|------|----------------|------|
| PRD-EPIC-001 | Factory Agent Leadership Orchestration | in-progress | @product-strategist | 2026-04-13 | 1 | 0 | code | `2-product-foundation/product-backlog/backlog.md#epic-1-factory-agent-leadership-orchestration` |
| PRD-EPIC-002 | Attendance + Payroll Systems for AKAIUNSAN | in-progress | @fullstack-engineer | 2026-07-16 | 6 | 0 | code, ops | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md` |

**Notes:**
- Slices = count of active feature slices (PRD-SLICE-*) belonging to this epic
- Bugs = count of discovered bugs (CODE-BUG-*) belonging to this epic
- Related Domains = which other domains (Marketing, Finance, Ops) have tasks for this epic

---

## Active Feature Slices (Code)

| ID | Title | Epic | Status | Owner | Created | Tasks | Bugs | Plan |
|----|-------|------|--------|-------|---------|-------|------|------|
| PRD-SLICE-001 | Standardize Core-Agent Leadership Orchestration | PRD-EPIC-001 | in-progress | @docs-guardian | 2026-04-13 | 2 | 0 | `3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md` |
| PRD-SLICE-002 | Foundation (5 architecture docs + scaffolds) | PRD-EPIC-002 | in-progress | @system-architecture | 2026-07-16 | 4 | 0 | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md#phase-0--architecture-foundation` |
| PRD-SLICE-003 | Attendance (mobile check-in/out + admin realtime) | PRD-EPIC-002 | planned | @fullstack-engineer | 2026-07-16 | 6 | 0 | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md#phase-2--attendance-` |
| PRD-SLICE-004 | Payroll engine + Excel export | PRD-EPIC-002 | planned | @fullstack-engineer | 2026-07-16 | 4 | 0 | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md#phase-3--payroll-` |
| PRD-SLICE-005 | Customer report generator | PRD-EPIC-002 | planned | @fullstack-engineer | 2026-07-16 | 3 | 0 | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md#phase-4--customer-report-` |
| PRD-SLICE-006 | Pilot (1-2 projects) | PRD-EPIC-002 | planned | @ops + @fullstack-engineer | 2026-07-16 | 3 | 0 | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md#phase-5--pilot-` |
| PRD-SLICE-007 | Scale-out (13 projects) | PRD-EPIC-002 | planned | @ops + @fullstack-engineer | 2026-07-16 | 3 | 0 | `3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md#phase-6--scale-out-` |

---

## Active Tasks (by Domain)

### Code Tasks

| ID | Title | Parent | Owner | Status | Created | Folder |
|----|-------|--------|-------|--------|---------|--------|
| CODE-TASK-001 | Add leader-orchestration contract to all core agents | PRD-SLICE-001 | @docs-guardian | in-progress | 2026-04-13 | `0-agents/agents/` |
| CODE-TASK-002 | Align specialist-to-skill pairings with the real skill library | PRD-SLICE-001 | @docs-guardian | in-progress | 2026-04-13 | `0-agents/agents/skills/` |
| CODE-TASK-003 | Produce 5 architecture docs (Phase 0) | PRD-SLICE-002 | @system-architecture | in-progress | 2026-07-16 | `3-technical/3.1-system-foundation/` |
| CODE-TASK-004 | Scaffold `systems/attendance/` + `systems/payroll/` from TEMPLATE-SYSTEM | PRD-SLICE-002 | @fullstack-engineer | planned | 2026-07-16 | `systems/` |
| CODE-TASK-005 | Create 3 ADRs (tech stack, on-prem, skip VN compliance MVP) | PRD-SLICE-002 | @system-architecture | planned | 2026-07-16 | `8-governance/decision-log/` |
| CODE-TASK-006 | Docker Compose stack + Caddy reverse proxy config | PRD-SLICE-002 | @devops | planned | 2026-07-16 | `systems/attendance/` |

### Marketing Tasks

| ID | Title | Parent Epic | Owner | Status | Created | Folder |
|----|-------|-------------|-------|--------|---------|--------|
| MKT-TASK-001 | [Task] | PRD-EPIC-001 | @marketing | planned | YYYY-MM-DD | `4-marketing/` |
| MKT-TASK-002 | Lock AKAIUNSAN corporate brand guide and web messaging | PRD-EPIC-003 | @marketing | completed | 2026-08-05 | `4-marketing/brand-guidelines.md` |

### Finance Tasks

| ID | Title | Parent Epic | Owner | Status | Created | Folder |
|----|-------|-------------|-------|--------|---------|--------|
| FIN-TASK-001 | [Task] | PRD-EPIC-001 | @analyst | planned | YYYY-MM-DD | `5-financing/` |

### Operations Tasks

| ID | Title | Area | Owner | Status | Created |
|----|-------|------|-------|--------|---------|
| OPS-TASK-001 | [Task] | HR / Legal / Vendor | @ops | planned | YYYY-MM-DD |
| OPS-TASK-006 | Select 1-2 pilot projects for attendance/payroll rollout | Operations | @ops | planned | 2026-07-16 |
| OPS-TASK-007 | Rollout plan for 13 remaining projects (after pilot) | Operations | @ops | planned | 2026-07-16 |

---

## Active Bugs (Code)

| ID | Title | Epic | Slice | Status | Owner | Created | Fixed | Plan |
|----|-------|------|-------|--------|-------|---------|-------|------|
| CODE-BUG-001 | [Bug] | PRD-EPIC-001 | PRD-SLICE-001 | open | @engineer | YYYY-MM-DD | - | See "Known Issues" in epic plan |

---

## Active Experiments & Research

### Experiments (Marketing / Product)

| ID | Title | Epic | Owner | Status | Start | End | Success Criteria |
|----|-------|------|-------|--------|-------|-----|-----------------|
| MKT-EXPT-001 | [Experiment] | PRD-EPIC-001 | @growth | active | YYYY-MM-DD | YYYY-MM-DD | [Metric Target] |

### Research & Spikes (Technical)

| ID | Title | Type | Owner | Status | Created | Feeds Into |
|----|-------|------|-------|--------|---------|-----------|
| RES-SPIKE-001 | [Research] | technical | @architect | planned | YYYY-MM-DD | PRD-EPIC-001 |

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

| ID | Title | Epic | Completed | Status |
|----|-------|------|-----------|--------|
| PRD-SLICE-001 | [Slice Name] | PRD-EPIC-001 | YYYY-MM-DD | completed |
| PRD-SLICE-008 | AKAIUNSAN Corporate Website and CMS V1 | PRD-EPIC-003 | 2026-08-05 | completed |

### Completed Tasks

| ID | Title | Domain | Completed |
|----|-------|--------|-----------|
| CODE-TASK-001 | [Task] | code | YYYY-MM-DD |
| CODE-TASK-002 | [Task] | code | YYYY-MM-DD |
| CODE-TASK-024 | Corporate CMS content model, migrations, and seeds | code | 2026-08-05 |
| CODE-TASK-025 | Public corporate website | code | 2026-08-05 |
| CODE-TASK-026 | Authenticated admin, media, and leads | code | 2026-08-05 |
| CODE-TASK-027 | Validation and Docker/Cloudflare Tunnel review deployment | code | 2026-08-05 |

### Completed Bugs

| ID | Title | Epic | Fixed | Fixed By |
|----|-------|------|-------|----------|
| CODE-BUG-001 | [Bug] | PRD-EPIC-001 | YYYY-MM-DD | @[engineer] |

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

- **[Work-Item Traceability System](../../0-agents/_core/work-item-traceability.md)** - Glossary, ID schema, metadata requirements
- **[Product Backlog](../../2-product-foundation/product-backlog/backlog.md)** - Canonical epic definitions
- **[Implementation Plans](../3.2-implementation/plans/README.md)** - Slice & task plans
- **[Changelog](../../8-governance/changelog.md)** - Historical record of all work (backup)
- **[Progress Tracking](progress.md)** - Implementation progress & metrics

---

**When in doubt: Check this registry first. It's the single source of truth for "what is happening and where."**
