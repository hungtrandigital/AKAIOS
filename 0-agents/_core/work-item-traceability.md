# Work-Item Traceability System — AI-First Startup Factory

**Version:** v1.0 (2025-12-13)  
**Purpose:** Define a unified work-item taxonomy, ID system, and lifecycle tracking across all domains (product, code, marketing, financing, research, operations).

---

## Problem Statement

Without a centralized traceability system, work items (features, bugs, tasks, campaigns, financial plans) scatter across isolated folders and lose historical context:
- A marketing campaign starts in `1-ideas/` → moves to `4-marketing/go-to-market.md` → executes in `systems/marketing-assets/` → but no link back to product backlog or finance impact
- A bug is fixed in `systems/backend/` → updated in `8-governance/changelog.md` → but no connection to which epic it belongs to or why it happened
- Finance projections live in `5-financing/plans.md` → marketing goals in `4-marketing/go-to-market.md` → no shared glossary or ID to cross-reference

**Result:** Project becomes fragmented. 6 months later, "why did we build this?" or "what happened to that bug?" becomes archaeologically hard.

---

## Solution: HMVC for Project Management

Think of each **work item** (epic, feature slice, bug fix, marketing task, finance plan item) as a **module** with:
- **M**odel (definition): Who owns it? When did it start? What's its scope?
- **V**iew (visibility): Where is it documented? Can others find it?
- **C**ontroller (workflow): What phases did it pass through (ideas → plan → execution → review)?
- **Connector (backbone):** Central index linking all modules so you can navigate from any work item to its parent epic, related tasks, finance impact, etc.

---

## Part 1: Work-Item Taxonomy & Glossary

### Work-Item Types

| Type | Definition | Scope | Owner | Duration | Example |
|------|-----------|-------|-------|----------|---------|
| **Epic** | Major product feature or business initiative spanning multiple phases (ideas → plan → execution → review) | Cross-domain, months | Product / BizDev | 1–6 months | "Authorization System v2", "Q1 Marketing Push" |
| **Slice** (Feature Slice) | Vertical slice of an epic; deliverable in 1–2 weeks, crosses multiple layers if needed | Single domain or multi-layer, weeks | Feature owner / Tech lead | 1–2 weeks | "Login UI + backend auth API", "Payment processor integration" |
| **Task** | Small, isolated work item; does not cross domain boundaries materially | Single domain, <1 week | Domain owner | 1–3 days | "Refactor validation logic", "Update GTM blog post" |
| **Bug** (Fix) | Unplanned correction to existing code/content, triggered by issue discovery | Variable | Code / Ops / Marketing | Hours to days | "Login button CSS broken", "Typo in email template" |
| **Experiment** | Time-bound, hypothesis-driven work with early stop criteria | Optional; parallel track | Product / Growth | 1–4 weeks | "A/B test hero copy", "Test referral incentive" |
| **Research** | Investigation to reduce uncertainty before planning/execution (market, technical, competitive) | Discovery, pre-planning | Analyst / Researcher | 3–7 days | "Competitor feature audit", "API performance testing" |
| **Spike** | Technical proof-of-concept; result feeds into epic/slice planning | Technical, parallel | Tech lead / Architect | 3–5 days | "Prototype payment gateway integration", "Load-test database scaling" |

### Scope Matrix (Size ↔ Domain Breadth)

```
┌─────────────────────────────────────────────────────────────┐
│                      EPIC                                    │
│   (Cross-domain: Product + Code + Marketing + Finance)      │
│   Duration: 1–6 months | Owner: Product Strategist / BizDev │
└─────────────────────────────────────────────────────────────┘
           │
           ├─ SLICE #1 (Feature Slice)
           │  (Code + Test: 1–2 wks | Owner: Tech Lead)
           │  ├─ TASK: Implement API endpoint
           │  ├─ TASK: Write tests
           │  └─ BUG: Fix regression from slice #0
           │
           ├─ SLICE #2 (Go-to-Market Slice)
           │  (Marketing + Sales: 1–2 wks | Owner: Marketing Manager)
           │  ├─ TASK: Create campaign landing page
           │  ├─ TASK: Draft email sequence
           │  └─ EXPERIMENT: Test subject line A/B
           │
           └─ SPIKE (Technical)
              (Code: 3–5 days | Owner: Architect)
              └─ RESEARCH: Benchmark database options
```

---

## Part 2: Work-Item ID Schema

### ID Format

```
[DOMAIN]-[TYPE]-[SEQUENCE]
```

**Examples:**

| ID | Domain | Type | Domain Category | Meaning |
|---|--------|------|----------|---------|
| `PRD-EPIC-001` | Product | Epic | product | "Authorization System v2" epic |
| `PRD-SLICE-015` | Product | Slice | product | Feature slice #15 for product backlog |
| `CODE-BUG-042` | Code | Bug | code | Bug fix #42 in codebase |
| `CODE-TASK-103` | Code | Task | code | Code refactoring task #103 |
| `MKT-TASK-031` | Marketing | Task | marketing | Marketing task #31 (campaign email, blog post) |
| `MKT-EXPT-008` | Marketing | Experiment | marketing | Marketing experiment #8 (A/B test, growth test) |
| `FIN-TASK-012` | Finance | Task | finance | Finance task #12 (projection update, vendor negotiation) |
| `OPS-TASK-005` | Operations | Task | operations | Ops task #5 (hiring, process doc) |
| `RES-SPIKE-002` | Research | Spike | research | Technical research spike #2 |

### Domain List

| Domain | Short | Description | Canonical Index |
|--------|-------|-------------|----------|
| **Product** | PRD | Epics, feature slices, product research | `2-product-foundation/product-backlog/backlog.md` |
| **Code** | CODE | Implementation (slices, tasks, bugs) | `3-technical/3.2-implementation/plans/README.md` |
| **Marketing** | MKT | Campaigns, experiments, content tasks | `4-marketing/[TBD-marketing-backlog].md` |
| **Finance** | FIN | Budget, projection, financing tasks | `5-financing/[TBD-finance-backlog].md` |
| **Operations** | OPS | Hiring, process, legal, vendor tasks | `6-operations/[TBD-ops-backlog].md` |
| **Research** | RES | Technical spikes, market research, competitive analysis | `1-ideas/market-research/[TBD-research-index].md` |

---

## Part 3: Work-Item Metadata (Frontmatter)

Every work item **MUST** include metadata in YAML frontmatter. This enables:
- Cross-domain linking
- Phase tracking (which modes did it pass through?)
- Parent epic identification
- Status rollup (when all slices complete, epic is done)

### Mandatory Frontmatter

```yaml
---
# Identification
id: PRD-EPIC-001                           # Unique ID (DOMAIN-TYPE-SEQ)
title: "Authorization System v2"           # Human-readable title
type: epic                                 # epic | slice | task | bug | experiment | spike | research
domain: product                            # product | code | marketing | finance | operations | research
status: active | in-progress | completed   # Current state

# Relationship to parent
parent_id: -                               # If slice: PRD-EPIC-001. If task: PRD-SLICE-015. If - : no parent
related_ids: []                            # Linked work items (e.g., CODE-BUG-042, MKT-TASK-031)
backlog_item: "2-product-foundation/product-backlog/backlog.md#epic-1"  # Link to canonical backlog/requirement

# Lifecycle
created: 2025-12-13                        # Start date
started: 2025-12-15                        # When moved to in-progress
completed: -                               # When finished (YYYY-MM-DD or -)
priority: high | medium | low              # Priority

# Tracking
owner: @fullstack-engineer                 # GitHub handle or agent name
phases: [ideas, plan, code, review]        # Which modes did it pass through? (order matters)
folder: systems/backend/auth               # Where is the work located? (code, docs, assets)

# Links & context
requirements_doc: "2-product-foundation/requirements/auth-v2.md"  # If applicable
implementation_plan: "3-technical/3.2-implementation/plans/active/auth-v2.md"  # If applicable
related_domain_docs: []                    # E.g., [marketing/go-to-market.md, 5-financing/plans.md]

---
```

### Metadata in Planning Docs

When creating/updating a plan in `3-technical/3.2-implementation/plans/`, add:

```yaml
---
id: CODE-SLICE-015
title: "Implement Login UI + Auth API"
type: slice
domain: code
status: active
parent_id: PRD-EPIC-001
created: 2025-12-13
updated: 2025-12-13
priority: high
owner: @fullstack-engineer
phases: [plan, code, test, review]
folder: systems/backend/
---
```

### Metadata in Fix/Bug Reports

When fixing a bug, include:

```yaml
---
id: CODE-BUG-042
title: "Login button CSS broken on mobile"
type: bug
domain: code
status: in-progress
parent_id: PRD-EPIC-001          # Which epic does this bug belong to?
created: 2025-12-10
started: 2025-12-13
priority: high
owner: @frontend-engineer
phases: [fix, review]
folder: systems/frontend/
---
```

This way, 6 months later, you can ask: "What bugs occurred during Auth v2?" → grep `parent_id: PRD-EPIC-001` → find all related bugs + who fixed them.

---

## Part 4: Centralized Work-Item Index

Create a **master index** that aggregates all work items across domains, so you can see:
- All active work (code, marketing, finance, ops, research)
- Which slices belong to which epic
- Which tasks belong to which slice
- Cross-domain dependencies (e.g., "finance impact of this feature")

### New Doc: Work-Item Registry

**Location:** `3-technical/3.2-implementation/status/work-items-registry.md`  
(Or could be `shared/context/work-items-registry.md` for visibility)

**Structure:**

```markdown
# Work-Item Registry — Master Index

[Automatically generated or manually updated monthly]

## Active Epics

| ID | Title | Domain | Status | Owner | Created | Slices | Related Items |
|----|-------|--------|--------|-------|---------|--------|---------------|
| PRD-EPIC-001 | Authorization System v2 | product | in-progress | @product-strategist | 2025-12-01 | 3 | MKT-TASK-031, FIN-TASK-012 |
| PRD-EPIC-002 | [Epic Name] | product | active | @product-strategist | YYYY-MM-DD | N | - |

## Active Slices (by Epic)

### PRD-EPIC-001: Authorization System v2

| ID | Title | Domain | Status | Owner | Created | Bugs | Tasks |
|----|-------|--------|--------|-------|---------|------|-------|
| PRD-SLICE-015 | Feature slice 1 | product | in-progress | @tech-lead | 2025-12-05 | CODE-BUG-042, CODE-BUG-043 | CODE-TASK-103 |

## Active Tasks (by Domain)

### Code
| ID | Title | Parent | Owner | Status | Created |
|----|-------|--------|-------|--------|---------|
| CODE-TASK-103 | Refactor auth module | PRD-SLICE-015 | @backend-engineer | in-progress | 2025-12-10 |

### Marketing
| ID | Title | Parent | Owner | Status | Created |
|----|-------|--------|-------|--------|---------|
| MKT-TASK-031 | Create GTM campaign | PRD-EPIC-001 | @marketing-manager | planned | 2025-12-01 |

### Finance
| ID | Title | Parent | Owner | Status | Created |
|----|-------|--------|-------|--------|---------|
| FIN-TASK-012 | Project finance impact | PRD-EPIC-001 | @business-analyst | planned | 2025-12-01 |

## Recent Bugs (by Epic)

| ID | Title | Epic | Status | Owner | Created | Fixed |
|----|-------|------|--------|-------|---------|-------|
| CODE-BUG-042 | Login button CSS broken | PRD-EPIC-001 | completed | @frontend-engineer | 2025-12-10 | 2025-12-11 |

## Research & Spikes

| ID | Title | Domain | Status | Owner | Created | Feeds Into |
|----|-------|--------|--------|-------|---------|-----------|
| RES-SPIKE-002 | Benchmark auth providers | research | completed | @architect | 2025-12-05 | PRD-EPIC-001 |
```

---

## Part 5: Work-Item Lifecycle & Phase Tracking

Every work item follows a **phase journey**. The `phases` field in metadata tracks which modes it passed through.

### Standard Lifecycle (not all items follow all phases)

```
ideas → plan → execution → code → review → completed
```

**Mapping to Modes:**

| Phase | Mode | Activities | Output |
|-------|------|-----------|--------|
| **ideas** | ideas | Brainstorm, market research, competitive analysis, spike investigation | Doc in `1-ideas/`, links added to `1-ideas/summaries.md` |
| **plan** | plan | Requirement writing, architecture, roadmap, budget projection | Plan in `*-backlog.md` or `plans/active/` with metadata |
| **execution** | execution, code | Design, content creation, code implementation | Assets in `systems/`, docs updated, tests added |
| **review** | review, fix | Code review, QA, bug fixes, refinement | Review comments, bugs opened/closed, fixes merged |
| **completed** | - | Move to archive/history | Plan moved to `plans/completed/[YYYY-MM]/`, status = completed |

### Phase Transition Rules

- **Fast fix (small bug):** ideas → fix → review → completed (skip plan if trivial)
- **Feature slice:** ideas → plan → code → review → completed
- **Epic:** ideas → plan → execution (via slices) → review → completed
- **Marketing campaign:** plan → execution → review → completed (ideas may be parallel)
- **Research spike:** ideas → execution → completed (feeds into epic planning)

---

## Part 6: Attachment & Traceability Rules (MANDATORY)

### Rule 1: Every Work Item Must Have a Parent (or Be an Epic)

```
Every task, bug, slice → must declare parent_id (epic or slice)
Every slice → must declare parent_id (epic)
Every epic → parent_id = - (no parent)
Every cross-domain task (marketing for a feature) → must declare which PRD-EPIC it serves
```

**Enforcement:**
- Plan creation fails if `parent_id` is missing
- Bug report templates auto-include `parent_id` field
- Marketing tasks in `4-marketing/` must link to product epic via `parent_id` or `related_ids`

### Rule 2: Every Work Item Update Must Update Parent Status

**When a slice completes:**
→ Epic's status automatically rolls up to "in-progress" or "completed" (if all slices done)

**When a bug fixes a slice issue:**
→ Update the related SLICE's `related_ids` list to track which bugs occurred

**When marketing task finishes for a feature:**
→ Update the EPIC's `related_domain_docs` to reference the marketing doc

### Rule 3: History Lives in Parent, Not in Sibling Docs

**Anti-pattern (currently happening):**
- Bug is fixed in `systems/backend/auth.py` → documented in `8-governance/changelog.md` → but no link back to epic

**Pattern (new):**
- Bug is fixed in `systems/backend/auth.py` → documented in `8-governance/changelog.md` **AND** listed in the parent EPIC's or SLICE's metadata as `related_ids: [CODE-BUG-042]`
- When viewing the epic doc, you see: "During execution of PRD-EPIC-001, bugs CODE-BUG-042, CODE-BUG-043 were discovered and fixed"

### Rule 4: Small Fixes (Fast Fix) Still Attach to Parent

**Currently (wrong):**
- Small bug found → agent fixes it → updates changelog → no plan created → but epic history lost

**New (correct):**
- Small bug found → agent identifies which epic it belongs to (e.g., PRD-EPIC-001)
- Searches `3-technical/3.2-implementation/plans/epics/auth-v2/` for the slice plan
- Updates that slice plan's `related_ids: [CODE-BUG-042]` + adds bug description to "Known Issues" section
- Updates `8-governance/changelog.md` with link to the epic plan
- **Result:** 6 months later, viewing `PRD-EPIC-001` shows all bugs found + fixed during its lifecycle

---

## Part 7: Implementation (How to Use This System)

### For Product Managers / BizDev

**Creating an epic:**
1. Write PRD in `2-product-foundation/requirements/`
2. Create entry in `2-product-foundation/product-backlog/backlog.md` with ID (PRD-EPIC-001)
3. Include mandatory metadata in backlog entry
4. Add related domain tasks: MKT-TASK-XXX, FIN-TASK-XXX

### For Engineers

**Creating a feature slice:**
1. Check `3-technical/3.2-implementation/plans/epics/[epic-name]/` for owning epic plan
2. Create plan: `3-technical/3.2-implementation/plans/active/[slice-name].md` with metadata
3. Set `parent_id: PRD-EPIC-001` (or whichever epic)
4. When work completes, move to `plans/completed/[YYYY-MM]/` and update epic's `related_ids`

**Fixing a bug:**
1. Identify which epic it belongs to (ask: "Why did this bug happen? During what feature?")
2. Update epic/slice plan with `related_ids: [CODE-BUG-042]` and describe in "Known Issues" section
3. After fix, update changelog with link to epic plan: `Related to PRD-EPIC-001`

### For Marketing

**Creating a marketing task:**
1. Determine which product epic it serves (e.g., PRD-EPIC-001)
2. Add to `4-marketing/[TBD-marketing-backlog].md` with ID (MKT-TASK-031) and `parent_id: PRD-EPIC-001`
3. Execute in `systems/marketing-assets/` or `4-marketing/go-to-market.md`
4. When complete, update epic's `related_domain_docs: [4-marketing/go-to-market.md]`

### For Finance

**Creating a finance impact task:**
1. Link to product epic or slice (e.g., PRD-EPIC-001)
2. Create in `5-financing/[TBD-finance-backlog].md` with ID (FIN-TASK-012) and `parent_id: PRD-EPIC-001`
3. Update `5-financing/plans.md` with projections, linked to epic
4. When complete, update epic's `related_domain_docs: [5-financing/plans.md]`

---

## Part 8: Benefits of This System

### For Navigation (6 months later)
- "Show me all work done for Auth v2" → Find PRD-EPIC-001 → See all CODE-SLICE-*, CODE-BUG-*, MKT-TASK-*, FIN-TASK-* via `related_ids`
- "Why was this bug fixed?" → Find CODE-BUG-042 in epic's `related_ids` → see parent epic PRD-EPIC-001
- "What happened in December?" → Check `8-governance/changelog.md` entries linked to epic plans

### For Accountability & Traceability
- Every piece of work (code, marketing, finance) is traceable to a product epic or requirement
- Status rolls up: if all slices of an epic complete, epic is done
- Decisions recorded: if a feature was deprioritized, that decision is in the epic/slice plan

### For New Team Members
- Read index to see active epics
- Click epic → see all related slices, tasks, bugs, experiments
- Understand context: "This feature impacts marketing (MKT-TASK-031) and finance (FIN-TASK-012)"

### For Preventing Sprawl
- No more orphan docs: every task has a parent epic
- No more fragmented history: all work for an epic lives in one place (with links to implementation/marketing/finance)
- No more "lost bugs": bugs are tracked in the epic they belong to, not just in changelog

---

## Part 9: Adoption Roadmap

### Phase 1 (Week 1): Set Up Infrastructure
- [ ] Create this glossary document (`0-agents/_core/work-item-traceability.md`)
- [ ] Add ID schema to `2-product-foundation/product-backlog/backlog.md`
- [ ] Create `3-technical/3.2-implementation/status/work-items-registry.md`
- [ ] Update `0-agents/_core/global-rules.md` to mandate metadata in plans

### Phase 2 (Week 2–3): Backfill Existing Items
- [ ] Audit active epics in `2-product-foundation/product-backlog/backlog.md` → assign IDs
- [ ] Audit active plans in `3-technical/3.2-implementation/plans/active/` → add metadata
- [ ] Audit `4-marketing/`, `5-financing/` → identify work items → assign IDs
- [ ] Create initial registry entries

### Phase 3 (Week 4+): Enforce New Work
- [ ] All new plans require metadata (enforced in plan template)
- [ ] All new bugs linked to epic via parent_id
- [ ] All cross-domain tasks (marketing/finance for a product epic) link back
- [ ] Registry updated monthly

---

## Part 10: Tools & Templates

### Plan Template (Update Existing)

Include in `3-technical/3.2-implementation/plans/active/`:

```markdown
---
id: CODE-SLICE-015
title: "Implement Feature X"
type: slice
domain: code
status: active
parent_id: PRD-EPIC-001
created: 2025-12-13
priority: high
owner: @engineer-name
phases: [plan, code, review]
---

# [Feature X] Implementation Plan

## Overview
[Description]

## Known Issues & Bugs
- CODE-BUG-042: [Description]

## Related Work Items
- Parent: PRD-EPIC-001
- Related: MKT-TASK-031 (GTM), FIN-TASK-012 (Finance impact)

## Status & Progress
[Your current plan content]
```

### Bug Report Template (Update Fix Mode)

```markdown
---
id: CODE-BUG-042
title: "Login button broken on mobile"
type: bug
domain: code
parent_id: PRD-EPIC-001
created: 2025-12-10
priority: high
---

## Issue Description
[Your bug description]

## Root Cause
[Analysis]

## Fix
[What was changed]

## Related Epic/Slice
Parent: PRD-EPIC-001 (Authorization System v2)
```

---

## Final Notes

This system is **HMVC for project management:**
- **Model:** Work-item metadata (ID, parent, owner, phases)
- **View:** Canonical indexes (backlog, work-items-registry, epic plans)
- **Controller:** Phase rules + attachment enforcement (modes, global-rules)
- **Backbone:** Central index + parent linking

Result: Every piece of work is **traceable, contextualized, and historicized**. No fragments. No archaeological digs.

---

**Next:** Update `0-agents/_core/global-rules.md` and mode docs to enforce this metadata + implement registry indexing + backfill existing items.
