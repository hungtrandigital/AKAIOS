# 1. Ideas — Warehouse

## Purpose

This section is dedicated to brainstorming, research, and early-stage planning. Use this space to:
- Document initial concepts and ideas for **new products**
- Conduct market research and analysis for **new products**
- Plan financing strategies
- Develop go-to-market strategies
- Document and analyze **features** for existing products

## Navigation

### Subsections

- **[Market Research](market-research/README.md)** - Market analysis, reports, and research templates (for new products)
- **[marketing/](marketing/)** - Marketing-related early-stage ideas
  - [Initial Go-to-Market Plan](marketing/initial-go-to-market-plan.md) - Initial market entry strategy (initial version)
    - → **Final version:** [4-marketing/go-to-market.md](../4-marketing/go-to-market.md)
- **[finance/](finance/)** - Finance-related early-stage ideas
  - [Initial Financing Plan](finance/initial-financing-plan.md) - Early-stage financing strategy (initial version)
    - → **Final version:** [5-financing/plans.md](../5-financing/plans.md)
- **[technical/](technical/)** - Technical-related early-stage ideas
- **[operations/](operations/)** - Operations-related early-stage ideas
- **[product/](product/)** - Product-related ideas
  - [Features](features/README.md) - Feature ideas and analysis for existing products
- **[executive-docs/](executive-docs/)** - Executive summaries and strategic documents

## Workflow

### For New Product Ideas:
1. Start with market research to validate your ideas
2. Develop financing plans based on research findings
3. Create go-to-market strategies aligned with your market understanding
4. Link findings to product foundation documents in [2-product-foundation/](../2-product-foundation/README.md)

### For Features (Existing Products):
1. Review existing product documentation ([2-product-foundation/](../2-product-foundation/README.md), [3-technical/](../3-technical/README.md))
2. Document feature idea in [Features](features/README.md)
3. Analyze feature impact on existing product (architecture, user experience, business)
4. Create business case for feature addition
5. Link to product backlog in [2-product-foundation/product-backlog/backlog.md](../2-product-foundation/product-backlog/backlog.md)

## Warehouse Flow

Treat `1-ideas/` as an ideas warehouse with lightweight status tracking:
- **Draft/In-Progress:** Work inside the right domain folder (`market-research/`, `marketing/`, `finance/`, `product/features/`, etc.) and update the relevant `summaries.md` with status = Draft.
- **In Review:** When requesting feedback, mark status = In Review in `summaries.md` and add a short reviewer note.
- **Approved/Hand-off:** Mark status = Approved and link to where the work will continue (e.g., `4-marketing/go-to-market.md`, `5-financing/plans.md`, or a backlog item).
- **Archived:** Move deprecated ideas to `archives/` (maintain links in `summaries.md` with status = Archived).

### Standard Ideas Status Table (applies to every department)

Use the same table schema in each `1-ideas/` subfolder to keep tracking consistent:

| Item | Status | Priority | Stage | Owner | Last Updated | Link |
| --- | --- | --- | --- | --- | --- | --- |
| example-item | Draft | Medium | Draft / In Review / Ready / Archived | @owner | YYYY-MM-DD | [path-to-doc.md](path-to-doc.md) |

Stages: `Draft` (initial write-up), `In Review` (feedback), `Ready` (approved to hand off to backlog/plan/final doc), `Archived` (not pursuing). One row per idea/work item; update `Last Updated` whenever status or content changes; create new docs only after docs-guardian approves placement/naming. **Sort rows newest-first by `Last Updated` so the latest work is at the top.**

Always prefer updating existing files and `summaries.md` entries over creating new documents. Consult `@docs-guardian` if unsure about placement or naming.

## Related Sections

- **[2-product-foundation/](../2-product-foundation/README.md)** - Transform ideas into product requirements
- **[4-marketing/](../4-marketing/README.md)** - Expand on go-to-market strategies
- **[5-financing/](../5-financing/README.md)** - Detailed financial planning

---

*Use this section for early-stage ideation and validation before moving to product definition.*

