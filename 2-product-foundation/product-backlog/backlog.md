# Product Backlog

## Overview

This document contains the product backlog organized by epics and user stories. Use this to track features, prioritize work, and plan sprints.

**Important:** All epics must include Work-Item metadata (ID, owner, status, phases). See `0-agents/_core/work-item-traceability.md` for ID schema and metadata requirements.

**Master Index:** See `3-technical/3.2-implementation/status/work-items-registry.md` for real-time view of all work items across domains (product, code, marketing, finance, operations, research).

## Backlog Scale Rules
- Keep <= 30 active items in the main list; push lower-priority items to a Parking Lot section at the bottom.
- Group epics by theme/initiative and maintain a short TOC for navigation when counts grow.
- Enforce YAML metadata with PRD-EPIC IDs; detailed slices/tasks live in implementation plans (`3-technical/3.2-implementation/plans/active/`) and link back here.
- Mirror IDs in `3-technical/3.2-implementation/status/work-items-registry.md` for cross-domain visibility.
- Groom weekly (prune stale), resequence monthly (ICE/RICE/WSJF), and archive completed/aged-out items quarterly to `archives/YYYY-MM/`.

## Epics

### Epic 1: Factory Agent Leadership Orchestration

**Work-Item Metadata:**
```yaml
id: PRD-EPIC-001
title: "Factory Agent Leadership Orchestration"
type: epic
domain: product
status: in-progress
created: 2026-04-13
updated: 2026-04-13
priority: high
owner: @product-strategist
phases: [ideas, plan, review]
related_domain_tasks: [PRD-SLICE-001]
```

**Status:** *In Progress*
**Priority:** *High*

**Description:**
Standardize the factory's outer/core agents as the reusable leader layer for multi-project delivery. Each core agent must preserve the current process, folder discipline, and sequential steps while explicitly orchestrating one or more `agency-agents` specialists plus the matching local skills from `0-agents/agents/skills/`.

**Success Metrics:**
- All core agents in `0-agents/agents/*.md` describe leader ownership explicitly.
- Every core agent maps narrow specialist pull-ins to real local skills that already exist in `0-agents/agents/skills/`.
- No changes are made to the existing mode files or workflow files as part of this optimization.
- The resulting agent stack is reusable across multiple projects without breaking current factory governance.

**User Stories (Feature Slices):**
- [ ] Story 1 (PRD-SLICE-001): Standardize leader orchestration rules across all core agents
  - [ ] Task 1 (CODE-TASK-001): Add explicit leader-orchestration guidance without changing the existing workflow order
  - [ ] Task 2 (CODE-TASK-002): Align specialist-to-skill pairings with the real skill library in `0-agents/agents/skills/`
- [ ] Story 2 (PRD-SLICE-002): Keep the current mode and workflow layer unchanged while improving agent depth
- [ ] Story 3 (PRD-SLICE-003): Improve handoff quality so the factory can be reused across many projects

**Related Documents:**
- [Active Slice Plan](../../3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md)
- [Agent Stack Overview](../../0-agents/README.md)
- [Technical Implementation Status](../../3-technical/3.2-implementation/status/work-items-registry.md)
- [Cross-Domain Tasks](../../3-technical/3.2-implementation/status/work-items-registry.md)

**Known Issues (Bugs Found During Execution):**
- None currently documented.

---

### Epic 2: [Epic Name]
*Repeat structure above*

## Backlog Items (Unprioritized)

### Feature Requests
- *Feature request 1*
- *Feature request 2*

### Bugs
- *Bug 1*
- *Bug 2*

## Prioritization

**Current Sprint Focus:**
- *Item 1*
- *Item 2*

**Next Sprint:**
- *Item 1*
- *Item 2*

## Related Documents

- **[Work-Item Traceability System](../../0-agents/_core/work-item-traceability.md)** - Glossary, ID schema, metadata requirements
- **[Work-Item Registry](../../3-technical/3.2-implementation/status/work-items-registry.md)** - Master index of all work items
- **[Product Overview](../product-overview.md)** - Product vision and goals
- **[Requirements](../requirements/)** - Detailed PRDs
- **[Implementation Plans](../../3-technical/3.2-implementation/plans/README.md)** - Technical implementation plans
- **[Progress Tracking](../../3-technical/3.2-implementation/status/progress.md)** - Implementation status

---

*Update this backlog regularly as new features are identified and priorities change. When creating tasks in other domains (marketing, finance, ops), reference the epic ID from this backlog.*
