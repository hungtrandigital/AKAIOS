# Product Requirements

## Purpose

This directory is the canonical home for product requirement documents after work has been validated by the backlog, ideas layer, or an existing implementation plan.

Use this folder to translate epics, slices, and feature decisions into implementation-ready requirements that can be handed to architecture, design, and engineering.

## Canonical Pattern

- Use one kebab-case folder per requirement: `requirements/[feature-name]/`
- Keep the main requirement document in `requirements/[feature-name]/README.md`
- Add support files only when they add real value, such as `user-flow.md`, `acceptance-criteria.md`, or `references.md`
- Update existing requirement folders before creating new ones
- Link each requirement back to its parent epic or backlog item

## Minimum Contents For Each Requirement

Each `requirements/[feature-name]/README.md` should cover:

- problem statement and user value
- linked epic or parent work-item ID
- core user stories
- acceptance criteria
- success metrics
- out-of-scope boundaries
- links to relevant market research, domain specs, and implementation plans

## Workflow

1. Confirm the work belongs to an existing epic, idea, or active plan.
2. Check whether a requirement folder already exists for the same feature.
3. Update the existing folder if it exists; otherwise create `requirements/[feature-name]/`.
4. Keep the canonical requirement in that folder's `README.md`.
5. Link the requirement to architecture docs and implementation tracking once the work progresses.

## Suggested Skeleton

```text
requirements/
├── README.md
└── [feature-name]/
    ├── README.md
    ├── user-flow.md                # optional
    ├── acceptance-criteria.md      # optional
    └── references.md               # optional
```

Do not pre-create empty feature folders. Create them only when a validated requirement actually exists.

## Related Documents

- **[Product Foundation](../README.md)** - Parent section for product strategy and backlog
- **[Product Backlog](../product-backlog/backlog.md)** - Source of epics and prioritization
- **[Market Research](../../1-ideas/market-research/README.md)** - Validation inputs
- **[Domain Specs](../../3-technical/3.1-system-foundation/architecture/domain-specs.md)** - Technical follow-through

---

*Keep requirements centralized, traceable, and lean. One requirement folder per real piece of work.*
