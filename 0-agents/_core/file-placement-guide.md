# File Placement Guide — AI-First Startup Factory (v1.0)

**Purpose:** Authoritative reference for where every file type should be placed. This prevents sprawl, maintains single source of truth, and ensures work-item traceability.

**Use this guide:** ALWAYS consult this before creating ANY new file. When in doubt, ask @docs-guardian.

---

## Core Principle: Update Existing → Create New (Only as Last Resort)

**Default behavior:**
1. ✅ Check if a **canonical file already exists** in the suggested location
2. ✅ If yes → **UPDATE it** instead of creating new file
3. ✅ If no → Create new file **only after consulting @docs-guardian**

**Canonical files** (single source of truth, always update):
- `1-ideas/market-research/summaries.md` — All market research findings
- `1-ideas/finance/initial-financing-plan.md` — All financial hypotheses
- `1-ideas/marketing/initial-go-to-market-plan.md` — All GTM hypotheses
- `1-ideas/features/summaries.md` — All feature ideas
- `2-product-foundation/product-overview.md` — Product vision & positioning
- `2-product-foundation/product-backlog/backlog.md` — All epics
- `4-marketing/personas.md` — Customer personas
- `4-marketing/go-to-market.md` — Final GTM strategy
- `5-financing/plans.md` — Final financial planning
- `8-governance/risk-register.md` — All risks
- `8-governance/decision-log.md` — All architectural decisions

---

## File Type → Location Mapping

### 1. Market Research Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Market size (TAM/SAM/SOM) | `1-ideas/market-research/summaries.md` | **UPDATE** | Always add to summaries first |
| Competitor analysis | `1-ideas/market-research/summaries.md` | **UPDATE** | Create detailed report in `reports/` only if 10+ pages |
| Customer interviews | `1-ideas/market-research/summaries.md` | **UPDATE** | Store raw transcripts in `reports/[interview-name].md` |
| Industry trends | `1-ideas/market-research/summaries.md` | **UPDATE** | Link to external sources |
| Market research report | `1-ideas/market-research/reports/[report-name].md` | **CREATE** (after consulting docs-guardian) | Only if 5+ pages; consult docs-guardian for naming |

**Forbidden in market research:**
- ❌ `1-ideas/market-summary.md` — Use summaries.md instead
- ❌ `1-ideas/research-findings.md` — Use summaries.md instead
- ❌ `research-complete-report.md` — Use summaries.md + reports/ instead

---

### 2. Business Case & Financial Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Financing assumptions | `1-ideas/finance/initial-financing-plan.md` | **UPDATE** | Early-stage financial hypothesis |
| Unit economics | `1-ideas/finance/initial-financing-plan.md` | **UPDATE** | CAC, LTV, payback period, gross margin |
| Revenue projections | `1-ideas/finance/initial-financing-plan.md` | **UPDATE** | Always with Base + Conservative scenarios |
| Business case | `1-ideas/business-case-[feature].md` | **CREATE** (after consulting docs-guardian) | Use kebab-case: `business-case-user-auth.md` |
| GTM hypothesis | `1-ideas/marketing/initial-go-to-market-plan.md` | **UPDATE** | Early-stage GTM strategy |
| Pricing strategy | `1-ideas/marketing/initial-go-to-market-plan.md` | **UPDATE** | Willingness-to-pay, competitor pricing |
| Financial analysis | `5-financing/analysis/[analysis-name].md` | **CREATE** (after consulting docs-guardian) | For detailed financial analysis |
| Financial review | `5-financing/reviews/[review-name].md` | **CREATE** (after consulting docs-guardian) | For periodic financial reviews |
| Final financial plan | `5-financing/plans.md` | **UPDATE** | After product strategy is locked |

**Forbidden:**
- ❌ `3-technical/financial-model.md` — Use `5-financing/` instead
- ❌ `3-technical/projections.md` — Use `5-financing/` instead
- ❌ `1-ideas/COMPLETE_FINANCIAL_ANALYSIS.md` — Use canonical files instead
- ❌ `business-case.md` (no feature name) — Use `business-case-[feature].md` instead

---

### 3. Product & Feature Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Product overview | `2-product-foundation/product-overview.md` | **UPDATE** | Vision, mission, positioning |
| Epic definition | `2-product-foundation/product-backlog/backlog.md` | **UPDATE** | All epics live here; use metadata (id, parent_id, owner, phases) |
| Feature requirements | `2-product-foundation/requirements/[feature]/prd.md` | **CREATE** (after consulting docs-guardian) | One folder per feature; include user stories, acceptance criteria, success metrics |
| Feature idea | `1-ideas/features/summaries.md` | **UPDATE** | For ideas under exploration |
| Feature analysis | `1-ideas/features/analysis/[feature].md` | **CREATE** (after consulting docs-guardian) | Only for detailed feature analysis |

**Forbidden:**
- ❌ `2-product-foundation/epic-[name].md` (scattered) — Use backlog.md instead
- ❌ `features/` folder in root — Use `2-product-foundation/requirements/[feature]/` instead
- ❌ `features.md` (generic) — Use backlog.md instead

---

### 4. Technical Architecture Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Domain specs | `3-technical/3.1-system-foundation/architecture/domain-specs.md` | **UPDATE** | Data models, entities, relationships |
| API contracts | `3-technical/3.1-system-foundation/architecture/api-contracts/[api-name].md` | **CREATE** | One file per API/domain; consult docs-guardian for naming |
| System design | `3-technical/3.1-system-foundation/design-standards/system-design.md` | **UPDATE** | High-level system architecture |
| Design standards | `3-technical/3.1-system-foundation/design-standards/coding-standards.md` | **UPDATE** | Code conventions, patterns, best practices |
| Implementation plan | `3-technical/3.2-implementation/plans/[plan-name].md` | **CREATE** (with metadata) | For multi-step implementation work; must include id, parent_id, status |
| Architecture decision | `8-governance/decision-log.md` | **UPDATE** | ADR format; link to technical docs |

**Forbidden:**
- ❌ `3-technical/architecture.md` (scattered) — Use domain-specs.md or system-design.md instead
- ❌ `3-technical/api-spec.md` (generic) — Use `api-contracts/[api-name].md` instead
- ❌ `3-technical/implementation-plan.md` (scattered) — Use `3.2-implementation/plans/` with metadata instead

---

### 5. Code & Implementation Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Source code | `systems/[system-name]/` | CREATE | All code in unified `systems/` structure; one folder per system |
| Backend code | `systems/[system-name]/backend/` | CREATE | Organize by domain or feature |
| Frontend code | `systems/[system-name]/frontend/` | CREATE | Organize by component or page |
| Tests | `systems/[system-name]/tests/` | CREATE | Mirror source structure |
| Database files | `systems/[system-name]/db/` | CREATE | Migrations, seeds, schemas |
| Configuration | `3-technical/3.3-devops/` | CREATE | Config files, docker files, deployment |
| Local secrets | `3-technical/3.3-devops/local-config/` | CREATE | git-ignored; never commit secrets |
| Infrastructure | `3-technical/3.3-devops/` | CREATE | Server setup, deployment steps |

**Forbidden:**
- ❌ `backend/`, `frontend/` in root — Use `systems/[system]/` instead
- ❌ `src/` in root — Use `systems/[system]/` instead
- ❌ `3-technical/code/` or `3-technical/source/` — Use `systems/` instead

---

### 6. Marketing & Brand Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Customer personas | `4-marketing/personas.md` | **UPDATE** | Jobs-to-be-Done framework |
| Go-to-market strategy | `4-marketing/go-to-market.md` | **UPDATE** | Final GTM plan (after product strategy locked) |
| Marketing campaign | `4-marketing/campaigns/[campaign-name].md` | **CREATE** (after consulting docs-guardian) | One file per campaign |
| Brand guidelines | `4-marketing/brand-guidelines.md` | **CREATE** (after consulting docs-guardian) | Colors, fonts, voice, messaging |
| Content calendar | `4-marketing/content-calendar.md` | **CREATE** (after consulting docs-guardian) | Planning document |
| Marketing analytics | `7-operations-monitoring/marketing-analytics.md` | **UPDATE** | Metrics, KPIs, performance tracking |

**Forbidden:**
- ❌ `marketing-plan.md` (generic) — Use go-to-market.md or campaigns/ instead
- ❌ `1-ideas/go-to-market.md` (early stage) → `4-marketing/go-to-market.md` (final)
- ❌ `marketing/` scattered — Centralize in `4-marketing/` only

---

### 7. Operations & Team Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Team structure | `6-operations/team/team-structure.md` | **UPDATE** | Org chart, roles, responsibilities |

#### Operations Guardrail
- Place all organizational docs (org chart, roles, responsibilities, hiring plans) under `6-operations/team/`.
- Do not place org docs at the root of `6-operations/`; use `team/` for structure-specific materials.

#### Folder Naming Conventions
- Use kebab-case for all folder and file names (e.g., `executive-docs`, `market-research`).
- Prefer kebab-case everywhere (e.g., `executive-docs`, `market-research`).
- Numeric prefixes are discouraged for `1-ideas/` categories; use clear names like `market-research/`, `features/`, `finance/`, `marketing/`, `product/`, `technical/`, `operations/`, `executive-docs/`.
- Avoid mixing numbered and non-numbered names arbitrarily. Keep canonical names consistent with `INDEX.md`.
| HR policies | `6-operations/hr/policies.md` | **CREATE** (after consulting docs-guardian) | Company policies |
| Legal templates | `6-operations/legal/templates/` | **CREATE** | Contracts, NDAs, ToS |
| Vendor contracts | `6-operations/vendor-contracts/[vendor].md` | **CREATE** | Contract tracking |
| Incident response | `7-operations-monitoring/incident-response.md` | **UPDATE** | Incident handling procedures |

**Forbidden:**
- ❌ `operations/` in root — Use `6-operations/` and `7-operations-monitoring/`
- ❌ `team.md` (scattered) — Use team-structure.md instead

---

### 8. Governance & Documentation Files

| Content Type | Canonical Location | Action | Notes |
|--------------|-------------------|--------|-------|
| Risk register | `8-governance/risk-register.md` | **UPDATE** | All risks (product, technical, business, market) |
| Decision log | `8-governance/decision-log.md` | **UPDATE** | ADR format; all architecture & strategy decisions |
| Changelog | `8-governance/changelog.md` | **UPDATE** | All changes (features, fixes, refactoring) |
| Project versions | `8-governance/project-versions.md` | **UPDATE** | Release notes, version history |
| Quarterly retrospective | `8-governance/quarterly-retrospective/[YYYY-Q#].md` | **CREATE** | One file per quarter |
| Archived document | `archives/[original-name].v[YYYY-MM-DD].md` | **MOVE** | When document is deprecated; keep for reference |

**Forbidden:**
- ❌ `governance.md` (generic) — Use risk-register.md or decision-log.md instead
- ❌ Creating new files in root that belong in `8-governance/`
- ❌ Deleting old docs — Move to `archives/` instead

---

### 9. Work-Item Traceability Metadata

**MANDATORY for ALL work items (epics, slices, tasks, bugs, plans):**

Every plan, task, bug, epic, and experiment MUST include YAML frontmatter:

```yaml
---
id: [DOMAIN]-[TYPE]-[SEQUENCE]       # E.g., PRD-EPIC-001, CODE-TASK-042, MKT-TASK-031
parent_id: [parent epic ID or -]      # E.g., PRD-EPIC-001 (for slices/tasks/bugs) or - (for epics)
related_ids: [comma-separated IDs]    # E.g., CODE-TASK-001, MKT-TASK-031 (cross-domain links)
phases: [ideas | plan | code | review | completed] # Current phase
owner: @[agent-name]                  # E.g., @product-strategist, @fullstack-engineer
folder: [relative path]               # E.g., 2-product-foundation/product-backlog/
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [planned | active | in-progress | completed | blocked]
priority: [high | medium | low]
---
```

**Master index:** `3-technical/3.2-implementation/status/work-items-registry.md`

---

## Special Cases & Routing Rules

### When Content Could Go Multiple Places

| Scenario | Decision | Example |
|----------|----------|---------|
| Feature idea + financial projections | Split: idea → `1-ideas/features/summaries.md`; finance → `1-ideas/finance/initial-financing-plan.md` | Subscription feature: idea in features, unit economics in financing-plan |
| Product spec + technical spec | Split: product → `2-product-foundation/requirements/[feature]/`; tech → `3-technical/3.1-system-foundation/architecture/` | Authentication feature: product requirements in `/requirements/user-auth/`, domain specs in `domain-specs.md` |
| Risk (product + technical) | Single entry in `8-governance/risk-register.md` with cross-domain tags | "API rate-limiting bug causes revenue impact" — one risk entry, tags [technical, revenue] |
| Timeline in planning | Include in plan file only if user explicitly requests; default is scope-based not time-based | Feature requirements focus on what + quality metrics, not deadlines |

---

## File Naming Conventions

### Documentation (Markdown)

| Content | Pattern | Example | Notes |
|---------|---------|---------|-------|
| Feature/epic | `[feature-name].md` or in `backlog.md` | `user-authentication.md` or `backlog.md` epic | Use backlog.md when possible |
| Business case | `business-case-[feature].md` | `business-case-user-auth.md` | Always kebab-case |
| Plan/slice | `[plan-name].md` with metadata | `payment-gateway-integration.md` | Must have YAML frontmatter |
| Report | kebab-case, descriptive | `competitor-analysis-2025-12.md` | Include date if dated; avoid generic "report.md" |
| Analysis | `[analysis-topic].md` | `tam-sam-som-analysis.md` | Descriptive, kebab-case |

### Code Files

| Language | Pattern | Example |
|----------|---------|---------|
| TypeScript/Frontend | PascalCase (components), camelCase (utilities) | `UserAuth.tsx`, `authService.ts` |
| Python/Backend | snake_case | `user_auth.py`, `database.py` |
| Tests | match source + `.test.` or `.spec.` | `UserAuth.test.tsx`, `user_auth_test.py` |
| Configuration | kebab-case or UPPERCASE | `.env.example`, `docker-compose.yml` |

---

## Checklist Before Creating New File

Before creating ANY new file, answer these questions:

- [ ] **Is there a canonical file?** (Check mapping above)
  - If YES → Update it instead ✅
  - If NO → Continue
- [ ] **Should this be in the defined structure?** (Check INDEX.md)
  - If NO → Discuss with @docs-guardian
  - If YES → Continue
- [ ] **Does the filename follow conventions?** (kebab-case, descriptive, not generic)
  - If NO → Rename before creating
  - If YES → Continue
- [ ] **Will this file link to work-item traceability?** (If it's a plan/task/bug)
  - If YES → Include metadata frontmatter
  - If NO → Continue
- [ ] **Have I consulted @docs-guardian?** (For new files not in canonical list)
  - If NO → Do it now before creating
  - If YES → Proceed ✅

---

## Integration with Work-Item Traceability System

**Every work item (epic, slice, task, bug) MUST:**
1. Have a unique ID (PRD-EPIC-001, CODE-TASK-042, etc.)
2. Declare parent_id (which epic it belongs to)
3. Have metadata frontmatter (owner, phases, status, priority)
4. Be registered in `3-technical/3.2-implementation/status/work-items-registry.md`
5. Link to related cross-domain items (marketing tasks for product epic, etc.)

**Placement rules:**
- Epics → `2-product-foundation/product-backlog/backlog.md`
- Slices → `3-technical/3.2-implementation/plans/active/[slice-name].md`
- Tasks → Respective domain folder + reference parent epic
- Bugs → In epic's "Known Issues" section + registry
- Plans → `3-technical/3.2-implementation/plans/` with metadata

---

## Enforcement

**Docs Guardian checks:**
- ✅ File placement follows this guide
- ✅ Filename follows conventions
- ✅ Canonical files are updated, not duplicated
- ✅ Work-item metadata is present (if applicable)
- ✅ Cross-references link correctly

**When in doubt:** Ask @docs-guardian. Better to ask than create sprawl.

---

**Last updated:** 2025-12-13  
**Related:** `0-agents/_core/global-rules.md`, `0-agents/_core/work-item-traceability.md`, `INDEX.md`
