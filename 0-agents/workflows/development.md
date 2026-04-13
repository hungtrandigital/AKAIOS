# Development Workflow (Code Mode)

This workflow defines how implementation work is executed in this repository.

## Preconditions (never skip)

- Product inputs exist in `2-product-foundation/requirements/` with an active requirement doc such as `requirements/[feature-name]/README.md`
- Architecture inputs exist in `3-technical/3.1-system-foundation/`:
  - `infrastructure.md`
  - `design-standards/system-design.md`
  - `architecture/domain-specs.md`
  - `architecture/api-contracts/`
  - `design-standards/coding-standards.md`

If any are missing: stop and request @system-architecture to create/update them.

## Implementation Loop

1. Create/update an implementation plan in `3-technical/3.2-implementation/plans/` (check existing first).
2. Implement in `systems/[system-name]/` only.
3. Write tests for new code (happy path + edge cases + error cases).
4. Run local verification (lint/typecheck/tests/build) appropriate for the tech stack.
5. Update tracking docs:
	- `3-technical/3.2-implementation/status/progress.md` (code-related)
	- `8-governance/changelog.md` (always)
6. Request review:
	- @code-reviewer for code + docs quality gates
	- @docs-guardian for structure/link hygiene and domain-spec updates (implementation-level)

## Guardrails

- No new files without first checking for an existing home.
- No generic report files.
- No skipping tests or “fake green”.
- No architecture assumptions if docs are missing.
