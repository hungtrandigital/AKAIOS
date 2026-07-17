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
| Status | Open |
| Probability | High |
| Impact | High |
| Risk level | Critical |
| Owner | @security-engineer / @fullstack-engineer |
| Review date | 2026-07-18 |

Authentication bypasses, missing authorization gates, raw-ID cross-tenant mutations, and over-broad employee responses can expose or corrupt attendance, identity, salary, and bank data.

**Mitigation:** Block deployment; remediate `CODE-BUG-002`, `003`, `004`, `006`, `007`, `008`, and `012`; add adversarial role/tenant integration tests; if seed credentials were used in any environment, rotate those credentials and active tokens after the fixes are deployed.

**Contingency:** If exposure is suspected, disable external API access, revoke all sessions, preserve audit evidence, assess affected tenants and records, and follow the incident-response process before restoring service.

### RISK-002 — Incorrect attendance and payroll outcomes

| Field | Value |
|---|---|
| Category | Technical / Financial / Operational |
| Date identified | 2026-07-17 |
| Status | Open |
| Probability | High |
| Impact | High |
| Risk level | Critical |
| Owner | @fullstack-engineer / Business Owner |
| Review date | 2026-07-18 |

Geofence bypass, time-zone errors, missing worked-time persistence, non-atomic state changes, calculation defects, invalid overrides, and executable out-of-scope deductions can produce materially wrong payroll.

**Mitigation:** Remediate `CODE-BUG-009` through `018`; define shared attendance/payroll contracts; add state-transition, concurrency, month-boundary, and invariant tests; keep BHXH/PIT disabled for the MVP.

**Contingency:** Freeze approval/payment, reconcile attendance and payroll against source records with dual control, correct affected lines through an audited process, and recalculate only after the repaired gate passes.

### RISK-003 — No reproducible releasable deployment

| Field | Value |
|---|---|
| Category | Technical / Operational |
| Date identified | 2026-07-17 |
| Status | Open |
| Probability | High |
| Impact | High |
| Risk level | Critical |
| Owner | @devops / @fullstack-engineer |
| Review date | 2026-07-18 |

Broken Compose paths, incomplete production images, and unresolved application failures still prevent a reproducible installation and trustworthy release decision.

The 2026-07-17 remediation batch adds a verified fresh-database migration, fixes aggregate seed orchestration, and makes the CI gates execute real quality, integration, and browser checks. Risk remains open because Docker/Compose is not yet repaired and the browser gate correctly exposes unresolved authentication and web-admin defects.

**Mitigation:** Finish `CODE-BUG-005` and remotely verify `CODE-BUG-019`; retain the fresh-database aggregate seed as regression evidence for fixed `CODE-BUG-021`; validate immutable builds from the lockfile; run production-image smoke tests and a real CI integration gate.

**Contingency:** Keep the pilot blocked and retain the last known-good environment. Do not perform manual schema or container workarounds that cannot be reproduced from the repository.

## Risk Status Summary

| Status | Count |
|---|---:|
| Open | 3 |
| Mitigated | 0 |
| Closed | 0 |
| Accepted | 0 |

## Review Schedule

- Daily while the rejected release gate is being remediated.
- Reassess after each critical-fix batch and before any pilot or production deployment.
- Close or downgrade only with linked verification evidence.

## Related Documents

- [PRD-EPIC-002 code review](reviews/prd-epic-002-code-review-2026-07-17.md)
- [PRD-EPIC-002 active plan](../3-technical/3.2-implementation/plans/active/PRD-EPIC-002.md)
- [Work-item registry](../3-technical/3.2-implementation/status/work-items-registry.md)
- [Decision log](decision-log.md)

---

*Last updated: 2026-07-17*
