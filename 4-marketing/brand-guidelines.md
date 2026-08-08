# AKAIUNSAN Corporate Brand Guide

- **Version:** 1.4
- **Last updated:** 2026-08-06
- **Applies to:** Public website, proposals, social channels, recruitment, and customer-facing collateral
- **Does not replace:** `docs/style-system/STYLE_GUIDE.md`, which governs the internal AKAIOS product UI

## Brand Architecture

- **AKAIUNSAN** is the corporate master brand presented to customers and candidates.
- **AKAIOS** is the internal operations product and may retain its blue product interface.
- Public channels use the supplied AKAIUNSAN master logo and the system defined here. The company name must not be independently typeset as a substitute for the logo in campaign imagery, hero artwork, social assets, or other branded compositions. Never approximate the symbol in CSS or redraw it from memory.

## Positioning

AKAIUNSAN provides professional cleaning operations for buildings and condominium projects, factories and industrial zones, and apartments. The public promise is:

> **Chuẩn mực quốc tế. Tận tâm trong từng chi tiết. Sạch chuẩn mỗi ngày.**
> **Global Standards. Local Care. Consistently Clean.**

The brand should feel clean, dependable, disciplined, and human. Communications should emphasize operating consistency, trained people, clear scope, and transparent quality control rather than decorative claims. The phrase **Global Standards** must always be supported nearby by credible operating evidence: training, SOPs, area checklists, service-level response commitments, field supervision, and periodic reporting.

## Audiences

1. Building and condominium project managers seeking an on-site cleaning team and dependable issue handling.
2. Factory and industrial-zone operators seeking safe, shift-based cleaning operations.
3. Apartment residents seeking recurring or scheduled cleaning.

## Approved Website Direction

The website is an external corporate channel, not a generic household-cleaning marketplace. It must present AKAIUNSAN as an operations partner with the following fixed priority:

1. **Building / condominium operations** — the lead audience and first solution shown.
2. **Factory / industrial-zone operations** — the second B2B solution.
3. **Apartment cleaning** — a separate, simpler booking need shown third.

These are three distinct audience paths in navigation, solution cards, lead intake, seed data, and reporting. New solution categories may be added later, but they follow the three strategic categories unless an approved brand decision changes the order.

The approved visual direction is premium, editorial, image-led, and operational. It combines disciplined typography, architectural composition, restrained motion, and credible process detail. It must not look like a coupon marketplace, a generic cleaning template, or an internal enterprise dashboard.

Responsible operations and ESG are supporting narratives. The principal proof remains operating clarity: defined scope, accountable supervision, acceptance criteria, and complete issue handling.

The internal review build may use polished aspirational copy and placeholder imagery without repeating disclaimers in every section. Before external launch, claims, contact information, project images, licenses, and any quantitative proof must pass the publication checklist.

### Stakeholder visual references

Use these references to study composition, hierarchy, interaction density, and visual freshness; do not copy their assets or layouts literally:

- [Cleaning Service App](https://dribbble.com/shots/19583449-Cleaning-Service-App)
- [BlueSpring Cleaning Service](https://dribbble.com/shots/26104238-BlueSpring-Cleaning-Service-Package-Website-Mobile-Responsive)
- [Housing Services App](https://dribbble.com/shots/13941291-Housing-Services-App)
- [GoClean128 Webflow template](https://webflow.com/templates/html/goclean128-small-business-website-template)
- [Garden View home page](https://gardenviewtemplate.webflow.io/home-pages/home-v1)

## Voice and Copy

- The current release is bilingual: Vietnamese remains the default at existing URLs and English uses `/en`. Each page uses one language consistently and retains complete Vietnamese glyph support.
- Direct, respectful, and specific.
- Prefer **vệ sinh thường xuyên** or **vệ sinh hằng ngày** over the English word “daily”.
- Use **Đặt lịch vệ sinh** for apartment leads.
- Use **Yêu cầu khảo sát** for condominium and factory leads.
- Avoid unverifiable superlatives, invented performance figures, and generic “number one” claims.
- Prefer operationally useful headings such as **Kiến thức cho quyết định vận hành**. Avoid vague editorial slogans such as “Đọc để đặt đúng câu hỏi” when they do not explain user value.

## Logo

Use the supplied corporate logo as the master artwork. Prepare vector and transparent exports before final production handoff:

- Full-color horizontal logo.
- White/reversed logo for dark backgrounds.
- One-color logo.
- Symbol-only favicon and social avatar.

Do not stretch, recolor, redraw, add effects, or place the logo on visually noisy imagery. Maintain clear space of at least the height of the letter “A” around the full lockup.

When a composition needs a prominent company identifier, place the supplied master lockup as artwork. A separately typeset `AKAIUNSAN` may appear only as ordinary textual content where semantics require the company name, never as a visual wordmark or logo replacement.

On the website homepage, the persistent header is the single logo lockup within the opening viewport. The hero background directly below it must contain neither a repeated logo nor embedded copy; the established eyebrow, three-line headline, supporting paragraph, and actions remain accessible HTML over its clean left panel.

## Color System

The digital palette draws on the supplied illuminated olive-lime architectural reference: fresh, controlled, and slightly warmer than a conventional cleaning-services green. Green is approved for the public brand because it supports cleanliness and responsible-operations cues without relying on the blue used by internal AKAIOS products. Final logo values must still be sampled from the vector master when available.

| Token | Value | Use |
| --- | --- | --- |
| Olive green | `#6C7D22` | Primary actions, links, brand headings |
| Dark olive | `#4F601A` | Hover states and strong accents |
| Charcoal olive | `#1B2512` | Hero, dark sections, footer |
| Fresh lime | `#C7DC50` | Controlled highlights and ESG accents |
| Soft olive | `#F0F2E4` | Section backgrounds and selected states |
| Warm white | `#F9F8F3` | Primary page background |
| Charcoal | `#20251B` | Main text |
| Muted text | `#666B5A` | Supporting copy |
| Border | `#DCDECD` | Dividers, cards, form controls |
| Corporate red | `#D0202B` | Small brand accent only |

Recommended visual ratio: 60–65% warm white, 20–25% charcoal olive, 10–15% olive/soft olive, and under 5% lime or red. Lime is a highlight, not a large text color; red remains a restrained heritage accent.

## Typography

- Display family: `Manrope`, 500–800, using its Vietnamese glyph set for modern, controlled editorial headlines.
- Body and interface family: `Be Vietnam Pro`, 400–700, with system sans-serif fallbacks.
- Headings: compact line height, controlled weight contrast, and restrained negative tracking.
- Body: 400–500 weight with comfortable Vietnamese diacritic rendering and UTF-8 content throughout.
- Labels: concise, sentence case; avoid excessive uppercase.
- Hero display: 64–76px desktop, 48–56px tablet, and 38–44px mobile; weight 650–700, line height 0.98–1.05, and maximum measure 620–720px. Short campaign lines may be locked to three deliberate lines with tight vertical rhythm.
- Hero supporting copy: 19–21px with a readable line height and no more than approximately 680px measure.
- Supporting type scale: section heading 40–56px, card heading 24–43px, body 16–18px, controls 14–16px, and labels 10–12px. Use responsive clamps while keeping these relationships consistent; body copy must never be reduced merely to create more visual contrast with headings.
- Keep one display family and one body/interface family throughout the public site. Do not introduce a third decorative font.
- Preserve a clear ratio between display, section, card, body, and label sizes. Adjacent headings at the same hierarchy level must use the same token rather than visually similar arbitrary values.
- Limit paragraph measure to roughly 55–70 characters and avoid oversized headings that force awkward Vietnamese diacritic wrapping.

## Responsible Operations / ESG Direction

The public narrative may connect professional cleaning with responsible operations through three pillars:

- **Environment:** controlled water and chemical use, reusable materials, and waste separation support.
- **Social:** training, PPE, safe shifts, and respect for both service staff and building users.
- **Governance:** documented SOPs, acceptance criteria, feedback logs, and traceable reporting.

Use ESG as an operating-design lens. When the site becomes public, quantified environmental or social claims must be supported by a defined measurement method and evidence source.

## Service Recovery / Incident Handling

For condominium and industrial cleaning, routine execution is the baseline. The differentiating operational story is how AKAIUNSAN handles exceptions and service issues:

- Capture time, location, impact, reporter, and relevant field evidence at one intake point.
- Prioritize safety risks and operational disruption before normal quality or appearance issues.
- Assign a responsible coordinator and maintain a visible next action and status.
- Confirm the result before closure; review root cause and update frequency, checklist, materials, training, or SOP when recurrence is likely.

Do not publish numeric response-time SLAs until staffing, escalation coverage, and evidence collection can reliably support them.

## Photography

Photography must look operational and credible rather than staged or luxurious.

### Categories

- Building / condominium: shared areas, lobbies, corridors, lift halls, and supervised teams.
- Factory: production-adjacent areas, PPE, floor machines, safety markings, and shift discipline.
- Apartment: bright lived-in spaces, careful surface cleaning, respectful staff presence.
- People and process: supervisors checking work, team briefings, equipment preparation.

### Temporary assets

AI-generated and commercially licensed stock images are permitted until real project photography is available. They must be tagged in the Media Library as `ai-generated` or `stock`, marked as placeholders, and never presented as completed AKAIUNSAN projects.

Avoid visible third-party logos, generated company-name treatments, unsafe work practices, implausibly sterile spaces, or uniforms that conflict with the corporate palette. If a concept image needs AKAIUNSAN identification, composite the approved master logo rather than asking an image model to typeset the name.

## Digital UI Rules

- Use an 8px spacing grid. Normal section rhythm is 76–104px on desktop and 64–80px on mobile; 120px is reserved for a deliberate hero or major narrative break. Do not create large empty bands between related sections.
- Default content width: 1200–1280px.
- Buttons and inputs: 10–12px radius.
- Cards: 16–24px radius depending on scale.
- Motion is subtle and functional; respect reduced-motion preferences.
- Motion language follows a quiet-luxury rhythm: 700–900ms section reveals, staggered by 90ms; restrained image parallax; slow light sweeps; and gentle 420–620ms hover responses using one shared ease curve. Avoid bounce, elastic easing, autoplay video, layout-shifting hover states, or decorative motion without hierarchy value.
- Approved effects include a thin reading-progress indicator, sticky-header state, one-time section reveals, staggered lists, restrained hero image parallax, subtle pointer response on large screens, image zoom, and line/arrow movement on hover.
- Effects must support hierarchy and responsiveness. Disable parallax and reveal transitions when `prefers-reduced-motion` is active.
- Every interactive state must remain keyboard accessible and meet readable contrast requirements.
- Public pages use reusable, structured content blocks; editors do not control arbitrary colors, fonts, or spacing.

## Core Components

- Corporate header with a prominent quote CTA.
- Grouped primary navigation: service models and space-based solutions expose their child pages before navigation; category labels must never silently route to an arbitrary first child. Current-page and current-section states remain visible.
- Split hero with clear audience and service language.
- Service and solution cards.
- Scope checklist.
- Operating process steps.
- Incident-handling and service-recovery flow.
- Proof/statistics band using verified values only.
- FAQ accordion.
- Article cards and related-content links.
- Three lead paths in this order: building survey, factory survey, and apartment booking.
- Dark forest footer with corporate contact details.

## Content and SEO Direction

SEO is a structured publishing capability, not a reason to produce high-volume generic articles. The website should maintain:

- Dedicated service and solution pages with one clear search intent per URL.
- Operational articles that help building managers, factory operators, and apartment customers make a decision.
- Priority topic clusters: building/condominium operations, industrial cleaning and safety, incident handling/service recovery, responsible operations/ESG, and apartment cleaning.
- Descriptive metadata, internal links, sitemap coverage, structured data, meaningful alt text, and a purpose-built social preview.
- Locale-specific Vietnamese/English URLs with canonical links and `hreflang`; do not publish mixed-language duplicate pages.

Articles should answer practical questions about scope, frequency, procurement, safety, acceptance criteria, supervision, reporting, and handling exceptions. Every article needs a relevant next action rather than a generic sales CTA.

## Asset Governance

Every media item records source type, license/source reference, alt text, category, focal point, and placeholder status. Replacing a placeholder creates a new media version and updates content relationships without changing public page URLs.
