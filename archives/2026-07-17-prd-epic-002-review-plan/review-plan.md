# Code Review Plan — AKAIUNSAN (PRD-EPIC-002)

> Archived on 2026-07-17. This plan was superseded by the [active epic](../../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md) and [canonical review report](../../8-governance/reviews/prd-epic-002-code-review-2026-07-17.md).

**Reviewer:** `@code-reviewer` (or `@fullstack-engineer` if no dedicated role)
**Date:** 2026-07-17
**Scope:** All code written/modified for PRD-EPIC-002 (Phase 0 → 4 + Polish + Web Admin + RBAC)

## Scope (estimated ~9,500 LOC across 72 files)

| Area | Files | Lines (approx) |
|---|---|---|
| `@ak/shared` (TypeScript lib) | 19 | ~1,500 |
| Prisma schema (DB) | 1 | 515 |
| Attendance backend (Fastify) | 16 | ~2,000 |
| Payroll backend (Fastify) | 12 | ~1,500 |
| Web admin (Next.js) | 25 | ~2,000 |
| Seeds, scripts, docs | 7 | ~1,000 |
| **Total** | **80** | **~8,500** |

## Priority Matrix

| Tier | Area | Rationale |
|---|---|---|
| **P0 — Security / Correctness** | RBAC bypass, tax calc, photo upload, GPS validation, auth | Affects real payroll money + access control |
| **P1 — Reliability** | Error handling, input validation, transaction boundaries | Affects prod stability |
| **P2 — Performance** | N+1 queries, missing indexes, hot paths | Acceptable now, but flag for later |
| **P3 — Maintainability** | File size, naming, dead code, test coverage | Continuous improvement |

## Focus Areas (P0)

### 1. RBAC / Authorization
- Can `system_admin` permission check be bypassed? (e.g. `requirePermission` cache poisoning)
- Can `employee` access admin endpoints by direct URL?
- Does the `rbacCache` leak between requests?
- Is there a way to escalate to `system_admin` via the `PUT /v1/rbac/roles` endpoint?

### 2. Payroll / Tax Calculation
- BR-VN-TAX-001..005 correctness
- BHXH ceiling (29.4M)
- PIT brackets (7 tiers) — especially boundaries
- Tax mode interactions (`tncn_only` should NOT compute BHXH)
- Negative-gross handling (already in code: `net = max(0, …)`)
- Edge case: PIT with $0$ gross (should give 0)

### 3. Authentication
- JWT secret strength + rotation
- Refresh token reuse detection (BR-SEC-002) — what if reused?
- Cookie security (httpOnly, secure, sameSite)
- `X-Internal-API-Key` length and rotation
- 2FA flow (admin-login → verify-2fa) — is it actually implemented?

### 4. Attendance / GPS
- BR-ATT-001 GPS validation bypass (is the check actually used?)
- BR-ATT-005 photo required (is it enforced server-side?)
- Past check-in (BR-ATT-008) — is `assertNotTooFarInPast` wired into the route?
- Photo upload size limit (5MB enforced?)
- JPEG header check (`FF D8 FF`) — bypassable?

### 5. Input Validation
- All POST/PATCH routes use Zod schemas?
- IDOR (insecure direct object reference) — can user A read user B's data?
- Tenant isolation — can user A see user B's tenant data?

## Focus Areas (P1)

- All `await` operations in routes have try/catch or are inside Fastify's error handler?
- Database queries: any raw SQL?
- File organization: any file > 200 lines (per `0-agents/workflows/development-rules.md`)?
- Type safety: any `any` in critical paths?
- Test coverage: `coverage/` reports (currently no coverage config — only 2 todo items)

## Process

1. ✅ Created REVIEW_PLAN.md (this file)
2. **Parallel audit** — spawn 4 explore agents (security, tax, data flow, errors)
3. Aggregate findings into `REVIEW_REPORT.md`
4. **Apply critical fixes** — anything P0 with concrete fix
5. Re-test, re-deploy
6. Commit + push

## Out of Scope (deferred)

- Mobile app (Flutter) — needs `flutter create` first
- Visual UX / accessibility deep audit (Prismate style guide exists; we trust it)
- Performance load testing (need real traffic first)
- i18n (currently only `vi`)
- Dependency audit (npm audit)

## Reference

- Code style: [3-technical/3.1-system-foundation/design-standards/coding-standards.md](../../3-technical/3.1-system-foundation/design-standards/coding-standards.md)
- Dev rules: [0-agents/workflows/development-rules.md](../../0-agents/workflows/development-rules.md)
- Domain model: [3-technical/3.1-system-foundation/architecture/domain-specs.md](../../3-technical/3.1-system-foundation/architecture/domain-specs.md)
- Style guide: [docs/style-system/STYLE_GUIDE.md](../../docs/style-system/STYLE_GUIDE.md)
