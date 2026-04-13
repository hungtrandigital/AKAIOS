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

### Epic 1: [Epic Name]

**Work-Item Metadata:**
```yaml
id: PRD-EPIC-001
title: "[Epic Name]"
type: epic
domain: product
status: planned | active | in-progress | completed
created: YYYY-MM-DD
updated: YYYY-MM-DD
priority: high | medium | low
owner: @product-strategist or @product-manager
phases: [ideas, plan, execution, code, review]
related_domain_tasks: [MKT-TASK-031, FIN-TASK-012]
```

**Status:** *Not Started / In Progress / Completed*  
**Priority:** *High / Medium / Low*

**Description:**
*Brief description of the epic, vision, and success criteria*

**User Stories (Feature Slices):**
- [ ] Story 1 (PRD-SLICE-001): *Description*
  - [ ] Task 1 (CODE-TASK-001): Implement backend API
  - [ ] Task 2 (CODE-TASK-002): Write tests
- [ ] Story 2 (PRD-SLICE-002): *Description*
- [ ] Story 3 (PRD-SLICE-003): *Description*

**Related Documents:**
- [PRD Link](../requirements/)
- [Technical Spec Link](../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- [Implementation Plan](../../3-technical/3.2-implementation/plans/epics/[epic-slug]/plan.md)
- [Cross-Domain Tasks](../../3-technical/3.2-implementation/status/work-items-registry.md)

**Known Issues (Bugs Found During Execution):**
- CODE-BUG-042: [Bug description] → Fixed YYYY-MM-DD by @engineer-name
- CODE-BUG-043: [Bug description] → Open / In Progress

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

