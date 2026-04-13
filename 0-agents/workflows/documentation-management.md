# Documentation Management & Archiving Protocol — AI-First Startup Factory (v2.1)

This file is the strict policy enforced by the Docs Guardian agent and all other agents.  
It ensures the repository always remains clean, up-to-date, and reflects current reality — no outdated plans, no duplicate specs, no garbage after 10–20 years.

## Core Rule: Latest & Unique
There is exactly ONE canonical, up-to-date version of every document at any time.  
Everything else is either historical (archived) or temporary (will be moved/deleted).

## Anti-Sprawl Defaults (mandatory)

- **Update canonical docs first** (no new file if an existing home exists).
- **Index/log second**: after updating content, update only the trackers needed:
  - `8-governance/changelog.md` (always)
  - `3-technical/3.2-implementation/status/progress.md` (when code-related)
  - `3-technical/3.2-implementation/plans/README.md` (only if a new plan is truly required)
- **Small-scope changes do not create plans** (see Fix Mode).
- Research must land in an existing summary/index file first (e.g., `1-ideas/market-research/summaries.md`).

## Lifecycle & Movement Rules

| Document Type                          | Current location (active)                 | When executed/completed → move to                                  | Leave behind                                                                 |
|----------------------------------------|-------------------------------------------|--------------------------------------------------------------------|------------------------------------------------------------------------------|
| Initial idea, rough research           | 1-ideas/                                  | archives/1-ideas-YYYY-MM-DD/                                       | Markdown link pointing to final versions                                     |
| Initial financing / GTM plan           | 1-ideas/finance/initial-financing-plan.md etc.| → 5-financing/plans.md or 4-marketing/go-to-market.md              | Delete or replace with link: `→ Final version: [5-financing/plans.md]`       |
| Product overview, requirements         | 2-product-foundation/                     | Stays forever (updated in place)                                   | —                                                                            |
| Domain specs, API contracts, architecture | 3-technical/3.1-system-foundation/       | Stays forever (updated in place)                                   | —                                                                            |
| Sprint / feature plans                 | 3-technical/3.2-implementation/plans/active/ or plans/epics/ | When completed → plans/completed/YYYY-MM/ | After 3 months → plans/archived/YYYY-MM-DD/ (by @docs-guardian) |
| History logs, old epics                | 3-technical/3.2-implementation/history/   | Monthly → archives/implementation/YYYY-MM/                         | Keep only latest month active                                                |
| Marketing campaigns, ad copies         | 4-marketing/                              | Campaign ended → archives/marketing/YYYY-campaign-name/            | Keep performance summary in 7-operations-monitoring/                         |
| Pitch decks, old financial models      | 5-financing/                              | After new version approved → archives/financing/YYYY-MM-DD/        | Keep only latest deck only                                                     |
| Completed retrospectives               | 8-governance/quarterly-retrospective/     | Next quarter starts → archives/governance/                          | Keep only current + last quarter active                                       |

## Docs Guardian Agent Responsibilities (automatic)

Every time any agent finishes a task, Docs Guardian must run these checks:

1. Scan for outdated documents:
   - Any file containing words “initial”, “draft”, “old”, “v1”, “backup”
   - Any plan file older than current sprint/quarter that is not in archives/

2. Move outdated files:
   - Create folder archives/YYYY-MM-DD-description/(date = today)
   - Move file(s) there
   - Replace original file with a single line:
     → Archived 2025-12-09: [../archives/2025-12-09-description/filename.md]

3. Update links (automatic & mandatory)
   After every move, deletion, or rename, the responsible agent (usually Docs Guardian) must immediately update the following places to keep navigation perfect:

   - ./INDEX.md → Quick Links section
     - Remove old path
     - Add new path or archived link
     - Keep alphabetical order inside each category

   - All README.md files that previously linked to the old document
     - Replace direct links with the new/current location
     - Example before:
       [User Authentication Plan](3-technical/3.2-implementation/plans/user-auth-plan.md)
     - Example after archiving:
       User Authentication Plan → Archived 2025-12-09: [../archives/2025-12-09-user-auth-plan/user-auth-plan.md]

   - 8-governance/changelog.md
     Add one line (date in YYYY-MM-DD):
     2025-12-09 │ Archived │ 3-technical/3.2-implementation/plans/user-auth-plan.md → archives/2025-12-09-user-auth-plan/

   - 3-technical/3.2-implementation/status/progress.md (if code-related)
     Update “Completed items” table with link to archived plan

   - Any Mermaid diagrams or cross-references in active documents
     Point to the new canonical location

   Failure to update links within the same session will trigger Docs Guardian to revert the change and notify human.