# 2. Product Foundation

## Purpose

This section contains all product-related documentation, including product overview, backlog management, and requirements. This is where ideas from [1-ideas/](../1-ideas/README.md) are transformed into concrete product specifications.

## Navigation

### Key Documents

- **[Product Overview](product-overview.md)** - High-level product definition and vision
- **[Product Backlog](product-backlog/backlog.md)** - Epics, user stories, and feature backlog
- **[requirements/README.md](requirements/README.md)** - Canonical requirements index and folder rules

## Workflow

1. **Define Product** - Start with [product-overview.md](product-overview.md)
2. **Create Backlog** - Build epics and stories in [product-backlog/](product-backlog/)
3. **Write Requirements** - Document feature or epic requirements in `requirements/[feature-name]/README.md`
4. **Link to Technical** - Connect requirements to [3-technical/](../3-technical/README.md) domain specifications

## Requirements Structure

- Keep [requirements/README.md](requirements/README.md) as the index and operating guide for this area.
- Use one kebab-case folder per requirement: `requirements/[feature-name]/`
- Keep the canonical requirement doc in `requirements/[feature-name]/README.md`
- Add extra files only when the scope justifies them, such as `user-flow.md`, `acceptance-criteria.md`, or `references.md`
- Update existing requirement folders before creating new ones

## Quick Links

- Product Overview: `product-overview.md`
- Backlog: `product-backlog/backlog.md`
- Requirements Index: `requirements/README.md`
- Technical Domain Specs: `../3-technical/3.1-system-foundation/architecture/domain-specs.md`

## Related Sections

- **[1-ideas/](../1-ideas/README.md)** - Source of product ideas and market research
- **[3-technical/3.1-system-foundation/architecture/domain-specs.md](../3-technical/3.1-system-foundation/architecture/domain-specs.md)** - Technical specifications derived from requirements
- **[3-technical/3.2-implementation/](../3-technical/3.2-implementation/README.md)** - Implementation tracking

---

*This section bridges the gap between ideas and technical implementation.*
