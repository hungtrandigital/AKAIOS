# ADR-003: Skip Vietnam Labor Compliance Calculations at MVP

**Status:** Accepted
**Date:** 2026-07-16
**Decider:** @user
**Related:** [Domain Specs — Payroll rules](../../3-technical/3.1-system-foundation/architecture/domain-specs.md#3-payroll-bounded-context), [ADR-001](adr-001-tech-stack.md)

## Context

The payroll system needs to compute monthly pay. Vietnamese labor law requires the system to handle:
- BHXH (social insurance): 8% employee + 17.5% employer
- BHYT (health insurance): 1.5% employee + 3% employer
- BHTN (unemployment insurance): 1% employee + 1% employer
- PIT (personal income tax): progressive 5/10/15/20/25% based on brackets
- OT rates: 150% weekday, 200% weekend, 300% holiday

These are mandatory for any payroll that produces real payslips in Vietnam.

User chose to **skip compliance calculations in MVP**. BO will continue handling compliance manually outside the system, using the system only for attendance tracking and gross/net payroll (gross = before compliance deductions, net = after user-entered deductions like advance).

## Decision

MVP payroll engine computes:
- Base salary (pro-rated by days worked)
- Overtime amounts (weekday 1.5x, weekend 2x, holiday 3x) — these are non-compliance OT rates
- Allowances (configurable, no compliance implications)
- Late penalty (optional)
- **Deductions: only `advance` and `otherDeductions` (manually entered by BO)**
- **Net = Gross − Advance − OtherDeductions**

System does NOT compute BHXH, BHYT, BHTN, PIT in MVP.

## Rationale

- Compliance rules change yearly (BHXH ceiling adjusts, PIT brackets adjust) — wrong calculation is worse than no calculation (employee gets wrong payslip → reconciliation nightmare)
- BO already has experience with compliance via Excel + existing payroll tools — adding manual step is acceptable
- MVP scope discipline: ship attendance + simple payroll first; add compliance as separate epic after pilot validates the rest
- Reduces payroll engine complexity → higher test coverage → lower bug risk

## Consequences

**Positive:**
- Faster MVP delivery (~2 weeks saved vs building compliance engine)
- Lower risk of incorrect compliance → legal liability
- Payroll engine testable in isolation without compliance test data
- Easier to evolve: add compliance as separate module later without rewriting core

**Negative / Risks:**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| BO must manually compute BHXH/PIT outside system | Extra manual step | Document Excel template that pairs with system export; automate later |
| Payslip from system not legally complete | Confusion for employees | Add "compliance calculated separately" footer in payslip + email explanation |
| Compliance changes yearly | Maintenance burden when added later | Make compliance engine a separate module, pluggable into payroll engine; version-tag the rules table |

## Future Work (Epic 3 candidate)

After MVP validates, add compliance engine as separate epic:
1. Tax bracket config table (effective from/to dates)
2. BHXH ceiling config (currently 20× base salary)
3. Family deduction config (currently 11M VND/person/month for PIT)
4. Compliance calculation step in payroll engine
5. Payslip shows full breakdown: gross → BHXH → BHYT → BHTN → PIT → net
6. Quarterly BHXH declaration export

## Rollback Path

To add compliance mid-project (if user requests):
1. Create `systems/payroll/src/compliance/` module
2. Add `ComplianceRule` Prisma model (effectiveFrom, effectiveTo, type, params)
3. Add `PayrollLine.bhxhNhanVien`, `PayrollLine.bhxhDN`, etc. fields (migration)
4. Insert calc step between gross and net
5. Update API endpoints to return compliance breakdown
6. Estimated effort: 2-3 weeks

ADR supersedes none. Superseded by none.
