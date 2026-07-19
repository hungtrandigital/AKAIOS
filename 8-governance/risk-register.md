# Risk Register

## Overview

This register tracks systemic project risks. Individual implementation defects remain in the canonical work-item registry and review report.

## Risk Assessment Matrix

| Probability | Impact | Risk Level |
|---|---|---|
| High | High | Critical |
| High | Medium | High |
| Medium | High | High |
| Medium | Medium | Medium |
| Low | High | Medium |
| Low | Medium | Low |
| Any | Low | Low |

## Open Risks

### RISK-001 — Workforce and payroll data compromise

| Field | Value |
|---|---|
| Category | Security / Financial |
| Date identified | 2026-07-17 |
| Status | Mitigated |
| Probability | Low |
| Impact | High |
| Risk level | Medium |
| Owner | @security-engineer / @fullstack-engineer |
| Review date | 2026-07-18 |

The rejected review found authentication bypasses, missing authorization gates, raw-ID cross-tenant mutations, and over-broad employee responses that could expose or corrupt attendance, identity, salary, and bank data.

**Mitigation:** `CODE-BUG-002`, `003`, `004`, `006`, `007`, `008`, and `012` are fixed with password verification, inactive-account enforcement, encrypted TOTP, Redis OTP abuse controls, refresh-token CAS rotation, explicit audited project membership, tenant-scoped queries, safe DTOs, and adversarial role/tenant tests. Before pilot, rotate any seed credentials and active tokens that reached a shared environment and require the immutable remote CI/review gate.

**Contingency:** If exposure is suspected, disable external API access, revoke all sessions, preserve audit evidence, assess affected tenants and records, and follow the incident-response process before restoring service.

### RISK-002 — Incorrect attendance and payroll outcomes

| Field | Value |
|---|---|
| Category | Technical / Financial / Operational |
| Date identified | 2026-07-17 |
| Status | Mitigated |
| Probability | Medium |
| Impact | High |
| Risk level | High |
| Owner | @fullstack-engineer / Business Owner |
| Review date | 2026-07-18 |

The rejected review found geofence bypass, time-zone errors, missing worked-time persistence, non-atomic state changes, calculation defects, invalid overrides, and executable out-of-scope deductions that could produce materially wrong payroll.

**Mitigation:** `CODE-BUG-009` through `018` are fixed. Shared attendance/payroll contracts, decimal-safe calculations, period serialization, transactional state changes, month-boundary/Vietnam-calendar handling, override audit fields, and concurrency/invariant tests pass locally. BHXH/PIT remains disabled under ADR-003. The pilot must reconcile any legacy manual allowance overrides and compare the first payroll against source records before payment.

**Contingency:** Freeze approval/payment, reconcile attendance and payroll against source records with dual control, correct affected lines through an audited process, and recalculate only after the repaired gate passes.

### RISK-003 — No reproducible releasable deployment

| Field | Value |
|---|---|
| Category | Technical / Operational |
| Date identified | 2026-07-17 |
| Status | Mitigated |
| Probability | Medium |
| Impact | High |
| Risk level | High |
| Owner | @devops / @fullstack-engineer |
| Review date | 2026-07-18 |

Broken Compose paths, incomplete production images, and unresolved application failures previously prevented a reproducible installation and trustworthy release decision.

The 2026-07-19 remediation gate passes all five migrations on a fresh database, the aggregate and RBAC seeds, live-service integration, 7/7 browser E2E, production package builds, three production image builds, Compose, and Caddy. After generated Next.js/mobile outputs were excluded, the largest BuildKit application-context transfer was under 0.7 MB, down from roughly 962 MB. The residual risk is the absence of an immutable remediation commit and matching remote Actions run.

**Mitigation:** `CODE-BUG-005`, `019`, and `021` are fixed. Preserve the locally validated tree in a commit, run every Actions job for that exact SHA, publish the SHA-pinned re-review, build with the committed lockfile, record resolved image IDs/digests, tag the exact release SHA, and use only committed migrations for deployment.

**Contingency:** Keep the pilot blocked and retain the last known-good environment. Do not perform manual schema or container workarounds that cannot be reproduced from the repository.

## Risk Status Summary

| Status | Count |
|---|---:|
| Open | 0 |
| Mitigated | 3 |
| Closed | 0 |
| Accepted | 0 |

## Review Schedule

- Reassess when the remediation commit and remote CI result are available.
- Reassess before pilot, first payroll approval/payment, and production scale-out.
- Close or downgrade only with linked verification evidence.

## Related Documents

- [PRD-EPIC-002 code review](reviews/prd-epic-002-code-review-2026-07-17.md)
- [PRD-EPIC-002 active plan](../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [Work-item registry](../3-technical/3.2-implementation/status/work-items-registry.md)
- [Decision log](decision-log.md)

---

*Last updated: 2026-07-18*
