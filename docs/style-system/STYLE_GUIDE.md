# AKAIUNSAN — Design System & Style Guide

**Version:** v1.0
**Last updated:** 2026-07-16
**Source of truth:** [`systems/payroll/web-admin/app/globals.css`](../../systems/payroll/web-admin/app/globals.css)
**Status:** Frozen — any change must be reflected here first

This document is the single source of truth for AKAIUNSAN's UI design. **Future developers: read this before adding new screens or components.** The patterns below have been adapted from the Prismate-OS design language (see [`prismate-reference-main.css`](./prismate-reference-main.css) and [`prismate-reference-login.css`](./prismate-reference-login.css)) and refined for AKAIUNSAN.

---

## Table of Contents

1. [Brand](#1-brand)
2. [Design Tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Colors — Semantic Use](#5-colors--semantic-use)
6. [Components](#6-components)
7. [Page Patterns](#7-page-patterns)
8. [Do / Don't](#8-do--dont)
9. [How to Add a New Screen](#9-how-to-add-a-new-screen)
10. [Reference Files](#10-reference-files)

---

## 1. Brand

### Logo & Mark

- **Full logo** (horizontal): [`systems/payroll/web-admin/public/logo.svg`](../../systems/payroll/web-admin/public/logo.svg) — use in headers, login cards, emails
- **Mark only** (favicon-style): [`systems/payroll/web-admin/public/logo-icon.svg`](../../systems/payroll/web-admin/public/logo-icon.svg) — use in TopNav, small UI slots, app icons
- **Favicon**: [`systems/payroll/web-admin/public/favicon.svg`](../../systems/payroll/web-admin/public/favicon.svg) — used as `<link rel="icon">`

The mark is a 14px-radius gradient rounded square (`#0289f7` → `#0070cc`) with the white "AK" letterform. Do not recreate, recolor, or stretch the mark. Use the SVG files.

```html
<!-- Header (large) -->
<img src="/logo.svg" alt="AKAIUNSAN" height="36" />

<!-- Inline / TopNav (small) -->
<img src="/logo-icon.svg" alt="AK" height="28" />
```

### Brand tone

- **Professional, clean, trustworthy** — handling payroll for 200+ employees
- **Vietnamese-first** — UI strings in `vi-VN`, code in English
- **No decorative animation** — motion is functional (loading, transitions) not aesthetic

---

## 2. Design Tokens

All tokens are CSS variables in `:root` of `globals.css`. Use them everywhere — **never hardcode** colors, fonts, or sizes.

### Color scale (Prismate adapted)

| Token | Hex | Use |
| --- | --- | --- |
| `--blue-50` | `#f7fbfd` | Light tints, hover backgrounds |
| `--blue-100` | `#edf6fd` | Active link background |
| `--blue-500` | `#0289f7` | Primary accent, focus ring, links |
| `--blue-600` | `#007be0` | Hover on primary buttons |
| `--blue-700` | `#0070cc` | Active/pressed state |
| `--gray-50` | `#f8f8f8` | Page background |
| `--gray-100` | `#f3f3f3` | Muted backgrounds, table header |
| `--gray-200` | `#ededed` | Borders (default) |
| `--gray-300` | `#e2e2e2` | Form borders, dividers |
| `--gray-500` | `#999999` | Subtle text, hint placeholders |
| `--gray-600` | `#7c7c7c` | Muted body text |
| `--gray-700` | `#525252` | Strong secondary text |
| `--gray-900` | `#171717` | Default body text |
| `--green-600` | `#30a66d` | Success — present, paid, approved |
| `--red-600` | `#cc2929` | Danger — absent, failed, override |
| `--orange-500` | `#e86c13` | Warning — late, paused |
| `--amber-500` | `#e79913` | Warning variants |

### Semantic colors (use these names, not raw scale)

| Token | Maps to | Use |
| --- | --- | --- |
| `--bg-page` | `--gray-50` | Page background |
| `--bg-card` | `--neutral-white` | Card, modal, input |
| `--bg-muted` | `--gray-100` | Muted sections, table header |
| `--bg-hover` | `--gray-100` | Row hover |
| `--fg-default` | `--gray-900` | Body text |
| `--fg-muted` | `--gray-600` | Secondary text |
| `--fg-subtle` | `--gray-500` | Hint, placeholder |
| `--border-default` | `--gray-200` | Default border |
| `--border-strong` | `--gray-300` | Form input border |
| `--accent` | `--blue-500` | Primary CTA, links, focus |
| `--accent-hover` | `--blue-600` | Primary CTA hover |
| `--accent-light` | `--blue-50` | Active link bg |
| `--success` | `--green-600` | Positive status |
| `--danger` | `--red-600` | Negative status |
| `--warning` | `--orange-500` | Caution status |

### Shadow scale

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Card (default) |
| `--shadow-sm` | `0 1px 3px ..., 0 1px 2px ...` | Card hover |
| `--shadow-md` | `0 4px 8px ...` | Elevated (KPI on hover) |
| `--shadow-lg` | `0 12px 24px ...` | Modal, login card |
| `--shadow-focus` | `0 0 0 3px rgba(2,137,247,0.18)` | Input focus ring |

### Radius scale

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `4px` | Code, badges |
| `--radius-md` | `6px` | Buttons, inputs |
| `--radius-lg` | `8px` | Cards, modals |
| `--radius-xl` | `12px` | Login card |
| `--radius-pill` | `999px` | Badges, avatars |

### Motion

| Token | Value | Use |
| --- | --- | --- |
| `--motion-fast` | `120ms` | Hover, color shift |
| `--motion-base` | `200ms` | Card, button transitions |
| `--motion-slow` | `320ms` | Modal, drawer |

All ease curve: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard).

### Layout

| Token | Value | Use |
| --- | --- | --- |
| `--topnav-height` | `56px` | Top nav |
| `--content-max-width` | `1280px` | Page container |
| `--space-1` … `--space-8` | 4/8/12/16/24/32/48/64 | 8px scale |

---

## 3. Typography

### Font

```css
--font-sans: 'InterVariable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace;
```

Inter Variable loads from Google Fonts CDN in `globals.css`. Don't switch fonts — Inter is the brand font and matches Prismate's choice.

### Scale

| Token | px | Use |
| --- | --- | --- |
| `--font-size-xs` | 11 | Hint, helper, micro labels |
| `--font-size-sm` | 13 | Body, table cells, buttons |
| `--font-size-base` | 14 | Default |
| `--font-size-md` | 16 | Section titles |
| `--font-size-lg` | 18 | Page subtitles |
| `--font-size-xl` | 20 | Page titles (small) |
| `--font-size-2xl` | 24 | Page titles (default) |
| `--font-size-3xl` | 32 | KPI values, hero |
| `--font-size-4xl` | 40 | Marketing/landing |

### Style

- **Tight tracking on big titles** (`letter-spacing: -0.02em` to `-0.03em`)
- **UPPERCASE labels** for table headers / status badges: `font-size-xs`, `letter-spacing: 0.04em`, `font-weight: 600`
- **Italic only for hint/metadata** — never for emphasis (use color/weight)
- **No underlines** except for actual links (`a:hover` doesn't show underline by default)

### Vietnamese diacritics

All UI strings use full diacritics (`Đăng nhập`, `Bảng lương`, `Nhân viên`). Avoid abbreviations like `NV` (only OK in employee codes `NV0001`).

---

## 4. Spacing & Layout

### 8px grid

Use the scale (`--space-1` through `--space-8`). Never use 5px, 7px, 13px, 15px etc.

| Token | px | Use |
| --- | --- | --- |
| `--space-1` | 4 | Tight stack, badge padding |
| `--space-2` | 8 | Inline gap, small stack |
| `--space-3` | 12 | Form gap, button gap |
| `--space-4` | 16 | Default padding, card body |
| `--space-5` | 24 | Page padding, card padding (large) |
| `--space-6` | 32 | Section gap |
| `--space-7` | 48 | Page section gap |
| `--space-8` | 64 | Marketing hero |

### Page layout

```tsx
<div className="page">
  <div className="page-header">  {/* title left, actions right */}
    <h1 className="page-title">…</h1>
    <p className="page-subtitle">…</p>
  </div>
  <div className="page-card">    {/* bordered, rounded-lg */}
    <div className="page-card-head">…</div>
    <div className="page-card-body">…</div>
  </div>
</div>
```

`.page` is centered, max-width 1280px, padded 24px.
`.page-card` has a subtle 1px border + 8px radius + xs shadow.

---

## 5. Colors — Semantic Use

### Status badges

```tsx
<span className="badge badge-success">Đã duyệt</span>
<span className="badge badge-warning">Đi trễ</span>
<span className="badge badge-danger">Vắng</span>
<span className="badge badge-info">Đang tính</span>
<span className="badge badge-neutral">Inactive</span>
<span className="badge badge-dark">Đã khóa</span>
```

Color mapping (no hardcoding — always use the class):

| Status | Class | Use |
| --- | --- | --- |
| ✅ Present / Approved / Paid / Active | `badge-success` | Positive outcomes |
| ⚠️ Late / Paused / Pending | `badge-warning` | Attention needed |
| ❌ Absent / Failed / Rejected | `badge-danger` | Negative states |
| ℹ️ Calculated / Info / Health | `badge-info` | Neutral informational |
| ⊘ Inactive / Draft / Off | `badge-neutral` | Disabled, archived |
| 🔒 Locked / Done | `badge-dark` | Final states |

### Buttons

```tsx
<button className="btn btn-primary">Save</button>          // Main CTA
<button className="btn btn-secondary">Cancel</button>       // Secondary action
<button className="btn btn-danger">Delete</button>          // Destructive
<button className="btn btn-ghost">Edit</button>            // Subtle action (e.g. row action)
<button className="btn btn-primary btn-lg">Submit</button>   // Large (login CTA)
<button className="btn btn-ghost btn-sm">Edit</button>      // Small (table row)
<button className="btn btn-primary btn-block">…</button>    // Full-width
```

One primary per view. Secondary for cancel. Danger only for destructive.

---

## 6. Components

### TopNav (every authenticated page)

```tsx
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'

export default function MyPage() {
  const { user } = useAuth()
  return (
    <>
      <TopNav
        userEmail={user?.email || user?.phone}
        userName={user?.fullName}
        role={user?.role}
      />
      <div className="page">…</div>
    </>
  )
}
```

The TopNav auto-highlights the active link based on `usePathname()`.

### KPI card (executive dashboard)

```tsx
<div className="kpi-grid">
  <div className="kpi-card kpi-accent">  {/* variants: kpi-success, kpi-warning, kpi-danger */}
    <div className="kpi-card-head">
      <div className="kpi-card-icon">👥</div>
      <div>Nhân viên active</div>
    </div>
    <div className="kpi-card-value">{value}</div>
    <div className="kpi-card-sub">{subText}</div>
  </div>
</div>
```

### Page card (data container)

```tsx
<div className="page-card">
  <div className="page-card-head">
    <h3 className="page-card-title">Title</h3>
    <button>Action</button>
  </div>
  <div className="page-card-body">…</div>
</div>
```

### Table (data list)

```tsx
<div className="table-wrap">
  <table className="table">
    <thead><tr><th>Col</th></tr></thead>
    <tbody>
      <tr><td>…</td></tr>
    </tbody>
  </table>
</div>
```

Tables are borderless between rows except a single bottom border on the header. Rows have hover background `--bg-muted`.

### Form field

```tsx
<div className="form-group">
  <label className="form-label">Email</label>
  <div className="form-field has-icon">  {/* has-icon = icon on left */}
    <svg className="form-icon">…</svg>
    <input type="email" />
  </div>
  <div className="form-help">Hint text</div>
</div>
```

### Status badges (KPI variants)

See section 5.

### Modal (override, etc.)

```tsx
<div className="modal-overlay" onClick={onClose}>
  <div className="modal" onClick={e => e.stopPropagation()}>
    <div className="modal-head">
      <h3 className="modal-title">…</h3>
      <button className="modal-close">✕</button>
    </div>
    <form>
      <div className="modal-body">…</div>
      <div className="modal-foot">
        <button className="btn btn-secondary">Cancel</button>
        <button className="btn btn-primary">Save</button>
      </div>
    </form>
  </div>
</div>
```

### Alerts

```tsx
<div className="alert alert-error">⚠️ Something went wrong</div>
<div className="alert alert-success">✓ Saved successfully</div>
<div className="alert alert-info">ℹ️ Informational message</div>
```

---

## 7. Page Patterns

### Standard authenticated page

```tsx
'use client'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'

export default function PageName() {
  const { user } = useAuth()
  return (
    <>
      <TopNav
        userEmail={user?.email || user?.phone}
        userName={user?.fullName}
        role={user?.role}
      />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🎯 Page Title</h1>
            <p className="page-subtitle">One-line context</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-primary">Primary action</button>
          </div>
        </div>

        {/* Content */}
        <div className="page-card">…</div>
      </div>
    </>
  )
}
```

### Login (no TopNav)

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">AK</div>
          <h1 className="login-brand-title">AKAIUNSAN</h1>
          <p className="login-brand-sub">Đăng nhập BO Admin</p>
        </div>
        <div className="login-body">…</div>
      </div>
    </div>
  )
}
```

### Dashboard (KPI + lists)

```tsx
<div className="page">
  <div className="page-header">…</div>

  <div className="kpi-grid">  {/* 4-col auto-fit */}
    <div className="kpi-card kpi-accent">…</div>
    <div className="kpi-card kpi-success">…</div>
    <div className="kpi-card kpi-warning">…</div>
    <div className="kpi-card kpi-danger">…</div>
  </div>

  <div className="page-card">  {/* Single primary card */}
    <div className="page-card-head">…</div>
    <div className="page-card-body">…</div>
  </div>
</div>
```

---

## 8. Do / Don't

### Do ✅

- Use semantic color tokens (`--accent`, `--success`) — never raw `var(--blue-500)` outside `globals.css`
- Use the 8px spacing scale (`--space-2`, `--space-3`...) — never arbitrary pixel values
- Show one primary action per page; secondary for cancel; danger only for destructive
- Use Prisma status enum values directly: `'present'`, `'late'`, `'absent'`, `'on_leave'`, `'holiday'`, `'half_day'`, `'early_leave'`
- Show real-time data with TanStack Query `staleTime` and `refetchInterval` (attendance page: 30s)
- Disable buttons + show `<span className="spinner" />` while loading
- Translate all UI strings to Vietnamese; keep code comments in English

### Don't ❌

- Don't use inline `style={{ color: '#0289f7' }}` — use classes (`btn-primary`, `badge-info`)
- Don't use `padding: 13px` — round to nearest `--space-N`
- Don't use generic class names like `.big-text-blue` — use semantic (`.page-title`, `.badge-info`)
- Don't use Emoji in production copy (use as visual icons only, never as content text)
- Don't fetch data in `useEffect` — use TanStack Query `useQuery`
- Don't store auth tokens in cookies if httpOnly is not set — use `localStorage` + Bearer header (we do this)
- Don't add a 5th custom shade of blue — use the 9-step scale (50, 100, 200, 300, 400, 500, 600, 700, 800, 900)
- Don't create new top-level routes — extend existing pages (e.g. add tabs to `/employees` not new `/employees/profile`)

### Accessibility

- All inputs have `<label>` — never placeholder-only
- All buttons have visible text or `aria-label`
- All icons in `form-field` are `pointer-events: none` (already in CSS)
- Color contrast: `--fg-default` on `--bg-card` = 13.4:1 (AAA); `--fg-muted` on `--bg-card` = 5.7:1 (AA)
- Focus rings: `:focus { box-shadow: var(--shadow-focus); }` — don't override

---

## 9. How to Add a New Screen

1. **Plan:** Add the route to [`openapi.yaml`](../../3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml) if new endpoints
2. **Backend:** Add the route in `systems/attendance/backend/src/routes/<resource>.ts` + service if needed
3. **Frontend:**
   - Create `app/<resource>/page.tsx` (see template in section 7)
   - Use `<TopNav>` (NOT the legacy layout)
   - Wrap content in `<div className="page">`
   - Use `useAuth()` to get current user, `useQuery` for data
   - If forms needed: use `.form-group` / `.form-field` / `form-label` / `form-help` classes
   - If lists: use `.page-card` + `.table` for the listing
   - If modals: use `.modal-overlay` / `.modal` / `.modal-head` / `.modal-body` / `.modal-foot`
4. **Verify:**
   - `pnpm typecheck` from repo root
   - Run web admin: `pnpm dev` from `systems/payroll/web-admin`
   - Click through happy path + 1 error path
5. **Update this guide** if you added a new component pattern not documented here

---

## 10. Reference Files

| File | Purpose |
| --- | --- |
| [`../../systems/payroll/web-admin/app/globals.css`](../../systems/payroll/web-admin/app/globals.css) | **Authoritative design tokens + utility classes** |
| [`prismate-reference-main.css`](./prismate-reference-main.css) | Source CSS from Prismate-OS (61KB) — for comparison |
| [`prismate-reference-login.css`](./prismate-reference-login.css) | Prismate-OS login page CSS — informs our login page design |
| [`prismate-pwa-icon-reference.svg`](./prismate-pwa-icon-reference.svg) | Reference SVG icon from Prismate (for style comparison) |
| [`../../systems/payroll/web-admin/public/logo.svg`](../../systems/payroll/web-admin/public/logo.svg) | AKAIUNSAN horizontal logo (current) |
| [`../../systems/payroll/web-admin/public/logo-icon.svg`](../../systems/payroll/web-admin/public/logo-icon.svg) | AK mark (current) |
| [`../../systems/payroll/web-admin/public/favicon.svg`](../../systems/payroll/web-admin/public/favicon.svg) | Favicon (current) |
| [`../../systems/payroll/web-admin/components/TopNav.tsx`](../../systems/payroll/web-admin/components/TopNav.tsx) | TopNav component |
| [`../../systems/payroll/web-admin/components/AuthProvider.tsx`](../../systems/payroll/web-admin/components/AuthProvider.tsx) | Auth context |
| [`../../systems/payroll/web-admin/components/AttendanceOverrideModal.tsx`](../../systems/payroll/web-admin/components/AttendanceOverrideModal.tsx) | Modal pattern example |

---

## Maintenance

When you add a new pattern (e.g. a new badge type, a new modal size, a new component), add it here **and** in `globals.css` together. Do not introduce patterns that aren't documented — every new component should be reusable across pages, so it deserves a name and a section here.

**Style drift prevention:** PRs that change visual design without updating this guide should be flagged in review. Run `git diff docs/style-system/` when this file is changed; the corresponding `globals.css` change should be in the same commit.

---

*Last reviewed: 2026-07-16 · Owner: `@ui-ux-designer` (or `@fullstack-engineer` if no dedicated role) · Frozen until Phase 6*
