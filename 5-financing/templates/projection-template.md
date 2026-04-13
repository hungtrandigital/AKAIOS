# Financial Projection Template

Use this template for detailed financial projections in `5-financing/projections/[projection-name].md`.

---

## Projection Overview

**ID:** FIN-TASK-XXX  
**Name:** [e.g., "Q1 2026 Cash Flow Forecast", "3-Year Revenue Model"]  
**Type:** Cash Flow | Revenue | Expense | Unit Economics | Scenario  
**Period:** [YYYY-MM to YYYY-MM]  
**Owner:** @[name]  
**Created:** YYYY-MM-DD  
**Updated:** YYYY-MM-DD  
**Confidence:** High / Medium / Low  

---

## Data Source Validation (MANDATORY)

**Before building projections, validate data quality:**

### Required Market Research Data
- [ ] TAM/SAM/SOM with sources and methodology
- [ ] Pricing benchmarks from competitor analysis (public data)
- [ ] CAC/CPA benchmarks by channel (industry reports, comparable companies)
- [ ] Churn/retention benchmarks by segment (ChartMogul, Recurly, industry reports)
- [ ] LTV estimates from comparable companies or cohort data
- [ ] Growth rates from similar products (public companies, case studies)
- [ ] Cost benchmarks (infrastructure, payroll, SaaS tools by stage)

### Data Gap Handling
- ⚠️ **If data missing**: Use conservative placeholder + flag as "HIGH UNCERTAINTY"
- ⚠️ **Document gaps**: List missing data and impact on projection confidence
- ⚠️ **Request data**: Ask @market-research to gather specific missing benchmarks
- ⚠️ **Re-validate**: Update projection once real data arrives

**Action:** Do NOT proceed with projections until data sources are validated.

---

## Assumptions

**Revenue Assumptions:**
- Customer Acquisition Rate: [X% monthly] → **Source:** [Benchmark/comparable company]
- Average Revenue Per User (ARPU): $[amount] → **Source:** [Competitor pricing analysis]
- Churn Rate: [X% monthly] → **Source:** [Industry benchmark by segment]
- Growth Rate: [X% month-over-month] → **Source:** [Comparable company data]

**Expense Assumptions:**
- Headcount: [X FTE; $X salary burden] → **Source:** [Ops registry + market data]
- Cloud/Infrastructure: $[monthly] → **Source:** [AWS/GCP pricing, benchmark by MAU]
- Marketing CAC: $[per customer] → **Source:** [Channel benchmarks, Marketing registry]
- Other Fixed Costs: $[per month] → **Source:** [Vendor contracts, Ops data]

**Macro Assumptions:**
- Funding available: $[amount] on [date]
- No major pivots assumed
- Market growth rate: [X%] → **Source:** [Industry report]

**Assumption Validation:**
- [ ] All assumptions cited with sources
- [ ] CAC validated against industry benchmarks
- [ ] Churn validated against segment averages
- [ ] Growth rate compared to comparable companies
- [ ] Headcount plan synced with Operations registry
- [ ] Marketing spend synced with Marketing registry

---

## Projections (12-Month / 3-Year)

### Revenue

| Month | Customers | MRR | Churn | Net New | ARR |
|-------|-----------|-----|-------|---------|-----|
| YYYY-MM | - | $- | -% | - | $- |

*Notes: Growth driver, seasonality, assumptions*

### Expenses

| Month | Payroll | Infra | Marketing | Other | Total |
|-------|---------|-------|-----------|-------|-------|
| YYYY-MM | $- | $- | $- | $- | $- |

*Notes: Major changes, one-time costs*

### Cash Flow

| Month | Beginning Balance | Revenue | Expenses | Net | Ending Balance |
|-------|-------------------|---------|----------|-----|-----------------|
| YYYY-MM | $- | $- | $- | $- | $- |

*Notes: Runway if no new funding*

---

## Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Monthly Burn Rate | $- | Fixed + variable |
| Current Runway | [X months] | With current balance |
| Break-Even Point | [Date] | If assumptions hold |
| CAC Payback | [X months] | Time to recover acquisition cost |
| LTV:CAC Ratio | [X:1] | Healthy >3:1 |

**Benchmark Validation:**

| Metric | Our Model | Industry Benchmark | Status | Notes |
|--------|-----------|-------------------|--------|-------|
| LTV:CAC Ratio | [X:1] | >3:1 (healthy SaaS) | ✅ Pass / ⚠️ Flag | [Explanation if flagged] |
| CAC Payback | [X months] | <12mo (good), <18mo (acceptable) | ✅ Pass / ⚠️ Flag | [Explanation if flagged] |
| Gross Margin | [X%] | >70% (SaaS standard) | ✅ Pass / ⚠️ Flag | [Explanation if flagged] |
| Annual Churn | [X%] | B2B: 5-7%, SMB: 10-15% | ✅ Pass / ⚠️ Flag | [Source + segment] |
| Burn Multiple | [X×] | <1.5× (efficient), <2× (acceptable) | ✅ Pass / ⚠️ Flag | [Explanation if flagged] |
| Rule of 40 | [Growth% + Margin%] | >40% (healthy) | ✅ Pass / ⚠️ Flag | [Stage-dependent] |

**Benchmark Sources:**
- LTV:CAC, CAC Payback: [OpenView SaaS Benchmarks / SaaS Capital / Public S-1s]
- Churn: [ChartMogul / Recurly benchmarks by vertical]
- Burn Multiple: [Bessemer efficiency score]
- Gross Margin: [Public SaaS companies, typically 70-85%]

**Flagged Metrics:**
- List any metrics that don't meet benchmarks
- Explain why (stage, market, strategy)
- Note mitigation plan if concerning
| MRR Growth Rate | [X%] | Month-over-month |

---

## Scenarios

### Best Case (Upside)
- Assumptions: [1 +X%, 2 +Y%, 3 +Z%]
- Outcome: [Revenue, runway, impact]

### Base Case (Expected)
- Assumptions: [As stated above]
- Outcome: [Revenue, runway, impact]

### Downside (Risk)
- Assumptions: [1 -X%, 2 -Y%, 3 -Z%]
- Outcome: [Revenue, runway, impact]

---

## Sensitivities

Which assumptions drive the most impact?

| Assumption | +10% Impact | -10% Impact | Rank |
|-----------|------------|------------|------|
| Customer Acquisition | +$- | -$- | 1 |
| ARPU | +$- | -$- | 2 |
| Churn Rate | +$- | -$- | 3 |

---

## Actions & Decisions

**Decision Required:** [What decision does this projection inform?]
- Option 1: [Implication]
- Option 2: [Implication]
- Recommendation: [Which path and why]

---

## Links

- Registry Entry: `../tracking/registry.md`
- Finance Plans: `../plans.md`
- Metrics Glossary: `../tracking/metrics-glossary.md`
- Related Initiatives: [FIN-TASK-XXX, FIN-TASK-YYY]

---

*Update quarterly or when material changes occur. Archive completed projections to archives/ with actual vs. forecast comparison.*
