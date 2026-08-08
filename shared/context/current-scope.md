# Current Project Scope

**Last Updated:** 2026-08-05
**Status:** Finalized for V1

## Project/Feature Overview

**Name:** AKAIUNSAN Corporate Website and CMS
**Type:** External corporate website plus internal editorial CMS
**Target Audience:** Apartment residents, condominium project managers, factory/industrial-zone operators, and AKAIUNSAN content editors

### System Information

**System Name:** `corporate-website`
**System Location:** `systems/corporate-website/`

## Scope & Context

### Primary Goals

- Generate qualified apartment booking and project/factory survey leads.
- Establish a consistent public corporate brand distinct from the AKAIOS internal product UI.
- Let staff maintain articles, services, imagery, FAQs, and leads without code changes.

### Key Requirements

- Vietnamese-first multi-route public website.
- Scalable taxonomy for services, building types, and service areas.
- Authenticated CMS with D1 persistence and R2 media storage.
- Safe bootstrap and demo seeds that never overwrite production edits.
- AI/stock placeholder imagery replaceable from the Media Library.
- SEO foundations, structured metadata, sitemap, and responsive performance.

### Constraints & Limitations

- Real project photography and customer proof are not yet available.
- Generated/stock imagery cannot be presented as completed AKAIUNSAN projects.
- Final logo vector files remain pending; implementation uses a temporary digital rendition based on the supplied master artwork.

### Clarified Details

- Initial categories: apartment, condominium project, and factory/industrial zone.
- Separate apartment booking and B2B survey lead forms.
- Public brand palette is green/red; blue remains associated with AKAIOS internal software.
- Content is seeded for preview and subsequently managed in the CMS.

### Tech Stack

- Vinext/React frontend in a dedicated Docker container, published for review through Cloudflare Tunnel.
- Cloudflare D1 for structured content and leads.
- Cloudflare R2 for uploaded media.
- Password-protected public review Admin with an HttpOnly session; direct demo identity is limited to loopback requests.

---

**Traceability:** `PRD-EPIC-003` / `PRD-SLICE-008`.

