# AKAIUNSAN Corporate Website

Public corporate website, editorial CMS, Media Library, and lead-intake workflow for `PRD-EPIC-003` / `PRD-SLICE-008`.

- **Status:** Bilingual internal-review release
- **Languages:** Vietnamese at existing URLs; English under `/en`
- **Public review URL:** https://akaiunsan.prismate.vn
- **Brand source:** [`../../4-marketing/brand-guidelines.md`](../../4-marketing/brand-guidelines.md)

## Product Role

The website positions AKAIUNSAN as a professional cleaning-operations partner. It is designed to build confidence in how the service is scoped, supervised, accepted, and recovered when an issue occurs—not merely to display a list of cleaning tasks.

Audience and solution priority is fixed at:

1. **Building / condominium** (`building`)
2. **Factory / industrial zone** (`factory`)
3. **Apartment** (`apartment`)

The three needs remain separate in the hero selector, solution presentation, contact form, lead records, Media Library categories, and seed data. Public display code pins this order so older CMS sort values cannot place apartments ahead of the two B2B audiences. Any future category is displayed after these priorities unless the business direction is explicitly changed.

## Information Architecture

| Surface | Vietnamese route | English route | Purpose |
| --- | --- | --- | --- |
| Homepage | `/` | `/en` | Positioning, priority solutions, services, incident handling, ESG direction, process, knowledge, FAQ, and lead intake |
| Service detail | `/dich-vu/:slug` | `/en/services/:slug` | Explain service form, scope, and next action |
| Solution detail | `/giai-phap/:slug` | `/en/solutions/:slug` | Explain a building, factory, apartment, or future vertical solution |
| Knowledge index | `/kien-thuc` | `/en/insights` | SEO/editorial discovery |
| Knowledge article | `/kien-thuc/:slug` | `/en/insights/:slug` | Answer a concrete operating or procurement question |
| About | `/ve-chung-toi` | `/en/about` | Corporate operating philosophy and responsible-operations direction |
| Process | `/quy-trinh` | `/en/process` | Intake, survey, proposal, deployment, supervision, and feedback model |
| Contact | `/lien-he` | `/en/contact` | Three-path lead form and expectation setting |
| Content Studio | `/admin` | `/admin` | Protected bilingual management for content, images, leads, and settings |

The primary menu exposes the sitemap before navigation. **Services / Dịch vụ** groups the three delivery models, while **Solutions / Giải pháp** groups the three space-based customer paths. Group labels open their child menu instead of silently routing to the first detail page. Active child and active section states are visible on desktop and mobile.

### Homepage narrative order

1. Unobstructed campaign-art hero using the approved master-logo lockup, with conversion actions placed below the image.
2. Operating standard: defined scope, responsible supervision, and acceptance criteria.
3. Priority solution canvas: building, factory, apartment.
4. Service forms: recurring, periodic, and deep cleaning.
5. Service recovery / incident handling as a principal differentiator.
6. Responsible operations / ESG direction.
7. Intake-to-delivery process.
8. Operational knowledge, FAQ, and contact conversion.

## Design and Style Contract

The public channel uses an editorial, architectural, premium visual system. It must not inherit the blue internal-product interface or look like a generic cleaning marketplace.

### Core tokens

| Role | Token/value |
| --- | --- |
| Primary olive | `--green: #6C7D22` |
| Dark olive | `--green-dark: #4F601A` |
| Deep section color | `--green-deep: #1B2512` |
| Fresh highlight | `--lime: #C7DC50` |
| Soft selected surface | `--mint: #F0F2E4` |
| Page surface | `--paper: #F9F8F3` |
| Main text | `--ink: #20251B` |
| Supporting text | `--muted: #666B5A` |
| Heritage accent | `--red: #D0202B` |

- Display typography: `Manrope` with Vietnamese glyph support.
- Body and interface typography: `Be Vietnam Pro` with Vietnamese glyph support.
- Content shell: `1240px` maximum with responsive side padding.
- Normal sections: `76–104px` vertical rhythm; large gaps are reserved for the hero or a deliberate narrative break.
- Controls use clear focus states, readable contrast, and 10–12px radii; large cards use 16–24px radii.
- Typography follows named hierarchy levels. Do not invent one-off heading sizes or add decorative fonts.

The implemented motion system provides a reading-progress line, sticky-header state, one-time reveal and stagger effects, restrained hero parallax/pointer response, gentle route transitions, and hover motion based on shared duration/easing tokens. Process rows use a non-layout-shifting highlight and indicator rather than changing padding. It falls back to fully visible static content when reduced motion is preferred.

Detailed brand, copy, photography, and motion rules live in the [Corporate Brand Guide](../../4-marketing/brand-guidelines.md). The internal AKAIOS style guide does not govern this public site.

## Content Model and SEO

Content Studio manages five structured content types:

| Type | Public use |
| --- | --- |
| `service` | Service forms and service detail pages |
| `solution` | Audience/space-specific solution pages |
| `incident` | Editable steps in the public service-recovery narrative |
| `article` | SEO and operational knowledge content |
| `faq` | Frequently asked questions and homepage FAQ |

Every content record supports a locale, translation key, slug, title, eyebrow, summary, body, structured `meta`, image, draft/published status, SEO title/description, sort order, and publication timestamps. Updating an existing record stores a revision snapshot before the change and revalidates affected public routes. Content Studio can open an existing counterpart or create the missing VI/EN member of a translation group.

The SEO strategy favors useful, decision-oriented articles over generic volume. Priority clusters are building/condominium operations, industrial cleaning and safety, incident handling, responsible operations/ESG, and apartment cleaning. The implementation includes route metadata, Open Graph imagery, sitemap generation, Organization structured data, internal linking, and meaningful image alt text.

Vietnamese remains the default language and preserves all established URLs. English content is published under `/en`, with locale-aware CMS queries, paired translation keys, page-level canonical/`hreflang` metadata, and bilingual sitemap entries. English and Vietnamese must not be mixed within one published page.

## Lead Intake and Processing

### Lead types

| Type | Public label | Expected next action |
| --- | --- | --- |
| `building` | Tòa nhà | Confirm scope and arrange a building survey |
| `factory` | Nhà xưởng | Confirm operating/safety context and arrange a site survey |
| `apartment` | Căn hộ | Confirm size, requested date, and booking details |

Legacy form values using `project` are accepted and normalized to `building`. Existing legacy lead records remain readable in Admin.

### Submission flow

1. The customer chooses one of the three needs; building is the default.
2. The form captures name, phone, location, property type/scale, estimated area, frequency, optional email, and additional context.
3. A hidden honeypot absorbs simple bot submissions. Name and phone are validated server-side; all input lengths are bounded before persistence.
4. A valid request is stored in D1 as `new` and immediately appears in Content Studio.
5. The request stores its source locale (`vi` or `en`) so Admin can preserve the customer's communication context.
6. The UI confirms receipt without claiming an unsupported response-time SLA.

### Lead status workflow

| Status | Meaning |
| --- | --- |
| `new` | Received and awaiting first review |
| `contacted` | Customer and request details have been confirmed |
| `surveying` | Survey or operational discovery is in progress |
| `quoted` | Scope and commercial proposal have been issued |
| `won` | Customer has accepted and handoff to service operations can begin |
| `closed` | Lead will not proceed or no further sales action is required |

Content Studio currently changes lead status; it does not yet assign owners, schedule surveys, or send automated customer notifications. Those are future workflow capabilities and should not be implied in public copy.

## Service Recovery and Incident Handling

Routine cleaning is the baseline for building and industrial contracts. The website therefore gives issue handling a prominent, content-managed section using this four-step operating model:

1. **Capture context:** time, location, reporter, effect, and relevant field evidence.
2. **Prioritize:** safety and operational disruption before ordinary appearance issues.
3. **Coordinate:** name one responsible coordinator, the next action, and a visible status.
4. **Close the loop:** confirm the result, record the cause, and update frequency, checklist, materials, training, supervision, or SOP when recurrence is likely.

The `incident` CMS type edits this public operating narrative. It is not a transactional incident-ticket system, and the general lead form is not a replacement for an active-customer escalation channel. If a customer portal is added later, incident records should include site, severity, owner, timestamps, evidence, action log, resolution confirmation, and prevention follow-up.

Do not publish numeric response SLAs until staffing coverage, escalation rules, and evidence collection can support them consistently.

## Media and Asset Handling

- Cloudflare R2 (`MEDIA`) stores uploaded production images; D1 stores metadata and content relationships.
- Media records keep title, alt text, category, source type, source/license reference, placeholder state, and MIME type.
- Uploads accept JPG, PNG, WebP, and AVIF up to 10MB.
- The local demo includes three category-specific and four article-specific ImageGen assets. They are registered as `ai-generated` in Admin and can be replaced with licensed stock or real project photography later.
- AI-generated or stock assets must not be described publicly as completed AKAIUNSAN projects.
- Approved real photography should replace assets through Media Library without changing public page URLs.
- The supplied corporate logo is the master. Never recreate its symbol in CSS, independently typeset the company name as a wordmark, or substitute an approximate mark.
- `public/images/brand-campaign-background-v6.png` is the user-retouched campaign background approved for the bilingual homepage. It contains no logo or embedded copy: the persistent header owns the master lockup, while the hero copy remains accessible HTML layered over the clean left panel. Version `v5` remains available as a rollback asset.

## Persistence, Seeds, and Editing Rules

- Cloudflare D1 (`DB`) stores content, revisions, media metadata, settings, and leads.
- `bootstrap` inserts only missing Vietnamese and English system records using conflict-ignore behavior. It never overwrites CMS edits.
- `demo` is local/staging-only and must never run against production.
- Once a production record exists, changing source seed data does not update it. Make production content changes through Content Studio or a deliberate reviewed migration.
- Public code pins the three strategic solution priorities independently of existing database sort values. Other editorial ordering remains CMS-controlled.
- Seed data must be realistic enough to demonstrate all layouts and workflows, but it remains replaceable and must not contain invented client names, project claims, or performance metrics.

## Admin Access and Security

- Local development uses a development-only editor identity.
- The Docker review deployment requires `ADMIN_PREVIEW_PASSWORD` and issues an 8-hour HttpOnly session cookie.
- Loopback development at `127.0.0.1`/`localhost` keeps the direct local editor identity; deployments without a preview password retain the Sign in with ChatGPT plus `ADMIN_EMAILS` path.
- All Admin read/write APIs enforce the same allowlist.
- Content slugs accept lowercase ASCII kebab-case; content type and lead status values are allowlisted.
- Content edits create revision snapshots with editor email before updating the current record.

## Local Development

```bash
npm install
npm run db:generate
npm run db:bootstrap
npm run db:demo
npm run dev
```

## Local Docker Deployment

Build the production bundle, then start the Cloudflare-compatible local runtime on `http://localhost:3010`:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

The container applies D1 migrations and the idempotent local demo seed before startup. It then serves the built Worker bundle directly with `workerd` through Miniflare's programmatic API; production does not run Vite, HMR, or `wrangler dev`. D1 and R2 local state remains under `.wrangler/state/v3` in the dedicated `akaiunsan-corporate-local-state` volume, separate from every AKAIOS service and volume.

Docker probes the homepage every 15 seconds. After five consecutive failures, the healthcheck terminates PID 1 and the `unless-stopped` policy restarts the container. Set `HEALTHCHECK_RESTART_AFTER` to a positive integer only when an environment needs a different failure threshold; invalid values safely fall back to five.

Check status and logs:

```bash
docker compose -f docker-compose.local.yml ps
docker compose -f docker-compose.local.yml logs -f corporate-website
```

Stop the local container without deleting the built image:

```bash
docker compose -f docker-compose.local.yml down
```

### Cloudflare Tunnel deployment

The public review environment uses the dedicated `akaiunsan-corporate` tunnel and remains separate from the AKAIOS stack. Keep these values in the ignored `.env.tunnel` file:

```dotenv
CLOUDFLARE_TUNNEL_TOKEN=replace-with-the-tunnel-token
ADMIN_PREVIEW_PASSWORD=replace-with-a-strong-review-password
```

Start or rebuild the website and connector together:

```bash
docker compose --env-file .env.tunnel -f docker-compose.local.yml -f docker-compose.tunnel.yml up -d --build
```

The published application route is `akaiunsan.prismate.vn` → `http://corporate-website:3000`. Public Admin requests require the review password and an HttpOnly session cookie; loopback access at `127.0.0.1:3010/admin` keeps the direct local editor workflow.

## Validation

```bash
npx tsc --noEmit
npm test
```

Before a public release, also verify priority order, responsive layout, keyboard focus, reduced-motion behavior, contact details, media rights, public claims, lead persistence, protected Admin access, and the live deployment response.

## Change Guardrails

When changing the website:

- Preserve the priority `building → factory → apartment` unless an approved business decision changes it.
- Update the Brand Guide whenever visual tokens, type hierarchy, motion language, logo handling, or public voice changes.
- Update this README whenever routes, locales, translation behavior, content types, seed behavior, Admin modules, lead states, or incident handling changes.
- Keep demo/placeholder warnings in Admin metadata rather than repeating them across the internal-review UI.
- Add new content and solution categories through the structured CMS model; do not hardcode one-off public pages when an existing content type fits.
- Do not add public claims, customer logos, response SLAs, ESG figures, or project photography without an evidence/source record.
