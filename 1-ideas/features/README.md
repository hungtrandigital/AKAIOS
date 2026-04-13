# Features (Ideas)

## Purpose

This section is dedicated to documenting and analyzing feature ideas for **existing products**. Use this space to:
- Document new feature concepts for products already in development or production
- Analyze feature impact on existing product architecture and user experience
- Create business cases for feature additions
- Plan feature integration with existing systems

## When to Use This Section

Use this section when:
- You have an existing product and want to add new features
- You receive user feedback requesting new features
- You want to analyze competitor features for your product
- You need to prioritize feature additions

**Note:** For completely new product ideas, use [Market Research](../market-research/README.md) instead.

## Navigation

### Key Files

-- **[summaries.md](summaries.md)** - Executive summary of all feature ideas with status (ALWAYS UPDATE THIS FILE)
- **[analysis/](analysis/)** - Detailed feature analysis documents
- **Feature Documents:** `feature-[feature-name].md` - Individual feature idea documents
- **Business Cases:** `business-case-[feature-name].md` - Business case documents for features

## Workflow

1. **Review Existing Product** - Read product documentation:
   - [Product Overview](../../2-product-foundation/product-overview.md)
   - [Product Backlog](../../2-product-foundation/product-backlog/backlog.md)
   - [Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
   - [Requirements](../../2-product-foundation/requirements/)

2. **Document Feature Idea** - Create `feature-[feature-name].md` with:
   - Feature description and goals
   - User value and use cases
   - Integration points with existing features
   - Technical considerations

3. **Analyze Impact** - Create analysis document in `analysis/` covering:
   - Impact on existing features
   - Impact on domain model
   - Impact on user experience
   - Technical architecture considerations

4. **Create Business Case** - Document business case with:
   - User value and impact
   - Development effort estimation
   - Revenue impact (if applicable)
   - Competitive advantage
   - Risk assessment

5. **Update Summaries** - Always update `summaries.md` with new feature ideas and status

6. **Link to Backlog** - When ready, link feature to [Product Backlog](../../2-product-foundation/product-backlog/backlog.md)

## File Naming

- ✅ `feature-user-dashboard.md`
- ✅ `feature-payment-integration.md`
- ✅ `analysis-user-dashboard-impact.md`
- ✅ `business-case-user-dashboard.md`
- ❌ `FEATURE.md`
- ❌ `feature.md`
- ❌ `new-feature.md` (be specific)

## Related Sections

- **[2-product-foundation/](../../2-product-foundation/README.md)** - Product documentation and backlog
- **[3-technical/](../../3-technical/README.md)** - Technical architecture and domain specs
- **[Market Research](../market-research/README.md)** - For new product ideas (not features)

---

## Status & Lifecycle

Track status directly in `summaries.md` (columns: Name, Status, Link, Notes):
- **Draft:** Brainstorming or early write-up
- **In Review:** Sent to stakeholders for feedback
- **Approved:** Ready to move to backlog or plan mode (link the backlog item or plan)
- **Archived:** No longer pursuing; keep the link for history

When a feature is approved, link it to the product backlog entry. When archived, keep the summary entry and move any long-form doc to `archives/` if needed.

---

*Use this section for feature ideas for existing products. For new product ideas, use Market Research.*

