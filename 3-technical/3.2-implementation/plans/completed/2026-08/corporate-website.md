---
id: PRD-SLICE-008
title: "AKAIUNSAN Corporate Website and CMS"
type: slice
domain: code
status: completed
parent_id: PRD-EPIC-003
related_ids: [MKT-TASK-002, CODE-TASK-024, CODE-TASK-025, CODE-TASK-026, CODE-TASK-027]
created: 2026-08-05
updated: 2026-08-05
priority: high
owner: @fullstack-engineer
phases: [ideas, plan, execution, code, review, completed]
folder: systems/corporate-website/
---

# AKAIUNSAN Corporate Website and CMS

## Outcome

Deliver a public bilingual corporate website led by building/condominium and factory/industrial cleaning, with apartment cleaning as a separate third path. Vietnamese preserves the established URLs and English is published under `/en`. The site is backed by an authenticated bilingual CMS with safe bootstrap/demo seeds, replaceable media assets, structured lead intake, and an editable service-recovery narrative.

## Scope

- Corporate Brand Guide and public design tokens.
- Public homepage plus service, solution, knowledge, about, and contact routes.
- Three lead flows: building survey, factory survey, and apartment booking.
- CMS modules for articles, services, solutions, incident-handling steps, FAQs, media, leads, and settings.
- D1 structured storage, R2 media storage, migrations, and non-destructive bootstrap seed.
- Demo seed for local/staging only.
- Search metadata, structured data, sitemap, responsive images, and accessibility.
- Generated placeholder imagery for apartment, condominium, and factory categories.
- Premium editorial motion, Vietnamese-capable display typography, and an ESG/responsible-operations direction.
- Locale-aware content, VI/EN translation groups, language switching, canonical/`hreflang` metadata, and a bilingual sitemap.
- Dedicated Docker and Cloudflare Tunnel review deployment.

## Seed Contract

- `bootstrap` creates missing system records and never overwrites edited content.
- `demo` is available only for local/staging preview.
- Production deployments run migrations but do not rerun demo content.
- After launch, the CMS database is the content source of truth.
- Source-seed edits do not overwrite existing production records; production copy changes are made through CMS or a reviewed migration.
- Public solution presentation preserves the strategic order `building → factory → apartment` independently of legacy CMS sort values.

## Acceptance Criteria

- Public pages work without authentication and are responsive.
- `/admin` requires authenticated identity for production write operations.
- Editors can create/update/publish articles and replace media without code changes.
- Lead submissions persist and appear in the admin workflow.
- Building, factory, and apartment leads remain distinguishable in the form, database, and Admin workflow.
- Lead source language remains visible in Admin, and editors can open or create the paired translation for structured content.
- The homepage explains issue capture, prioritization, ownership, resolution confirmation, and recurrence prevention.
- Seeded placeholder assets are visibly tagged in admin and never represented as real projects.
- Build, migration generation, and rendered-page tests pass.
- A deployable public version is saved and published through Sites.

## Tasks

- [x] `MKT-TASK-002` — Lock corporate brand guide and public messaging.
- [x] `CODE-TASK-024` — Implement D1 content model, migrations, and seed contract.
- [x] `CODE-TASK-025` — Implement public multi-route website.
- [x] `CODE-TASK-026` — Implement authenticated CMS, media, and lead workflows.
- [x] `CODE-TASK-027` — Validate, package, and deploy.

## Delivery

- Public review URL: https://akaiunsan.prismate.vn
- Public access is enabled.
- Owner email is configured in the production admin allowlist.
- Production D1 migrations and R2 bindings are packaged with the saved site version.
- Canonical design, style, function, seed, lead, media, and incident-handling decisions are documented in the Corporate Brand Guide and system README.

## Known Issues

- The supplied logo is currently available as a raster reference; final vector exports remain a brand-production follow-up.
- Final corporate domain, verified phone/email/address, and real project photography remain content handoff items.
- Transactional active-customer incident ticketing remains a follow-up capability; the current `incident` type manages the public process narrative in both languages.
