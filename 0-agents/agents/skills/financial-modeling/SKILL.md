---
name: financial-modeling
description: Use when building financial projections, validating assumptions, modeling scenarios, and benchmarking against industry standards for startup financial planning.
license: MIT
---

# Financial Modeling

Financial modeling, projection validation, scenario analysis, and benchmark comparison for startup financial planning.

## When to Use

Use this skill when:
- Building financial projections (revenue, expense, cash flow)
- Validating financial assumptions from market research
- Modeling funding scenarios and runway calculations
- Preparing pitch materials with financial models
- Evaluating unit economics and profitability paths

## Capabilities

### Financial Projection Modeling
- Build revenue models (subscription, usage, transactional)
- Build expense models (headcount, infrastructure, marketing, SaaS tools)
- Build cash flow models (runway, funding needs, break-even)
- Build unit economics models (CAC, LTV, payback, gross margin)

### Assumption Validation
- Validate assumptions against industry benchmarks
- Compare metrics to public company data (S-1 filings, earnings)
- Cross-reference with market research data
- Flag outlier assumptions for review

### Scenario Analysis
- Model base case (50% confidence, median assumptions)
- Model best case (90th percentile, optimistic assumptions)
- Model downside case (10th percentile, conservative assumptions)
- Identify top 3-5 sensitivity drivers
- Calculate impact of ±20% change in key drivers

### Benchmark Research
- SaaS benchmarks: OpenView, SaaS Capital, Bessemer Cloud Index
- CAC/LTV: Industry reports, public S-1s, SaaS Mag, ProfitWell
- Churn: ChartMogul, Recurly by vertical
- Efficiency: Burn multiple, Rule of 40, CAC payback period
- Gross margin: Public SaaS companies (typically 70-85%)

### Financial Health Checks
- LTV:CAC ratio (healthy >3:1, flag <2:1)
- CAC payback period (good <12mo, flag >18mo)
- Burn multiple (efficient <1.5×, flag >2×)
- Gross margin (SaaS standard >70%, explain if lower)
- Rule of 40 (growth rate + profit margin >40%)

## Input Requirements

- Market research data (TAM/SAM/SOM, pricing, benchmarks)
- Operations data (headcount plan, payroll, vendor costs)
- Marketing data (CAC, channel mix, conversion rates)
- Product data (roadmap, feature launch timing)
- Historical data (actuals, if available)

## Output Format

- Projection files in `5-financing/projections/[name].md`
- 3 scenarios (base/best/downside) with probabilities
- Sensitivity analysis table (top drivers with ±20% impact)
- Benchmark comparison table (metric vs industry standard)
- Runway and funding needs summary
- Go/No-Go recommendations with confidence levels

## Benchmark Standards

### SaaS Financial Metrics (Industry Standards)
- **LTV:CAC Ratio:** >3:1 (healthy), 2-3:1 (acceptable), <2:1 (red flag)
- **CAC Payback:** <12 months (excellent), 12-18 months (acceptable), >18 months (concerning)
- **Gross Margin:** >75% (excellent), 70-75% (good), <70% (needs improvement)
- **Net Revenue Retention:** >110% (excellent), 100-110% (good), <100% (churn problem)
- **Burn Multiple:** <1.5× (efficient), 1.5-2× (acceptable), >2× (inefficient)
- **Rule of 40:** Growth% + Margin% >40% (healthy), 20-40% (acceptable), <20% (struggling)

### Growth Stage Benchmarks
- **Seed:** High burn, CAC experimentation, focus on PMF
- **Series A:** CAC payback <18mo, LTV:CAC >2:1, gross margin >60%
- **Series B:** CAC payback <12mo, LTV:CAC >3:1, gross margin >70%, path to profitability
- **Growth:** Rule of 40 >40%, efficient growth, unit economics proven

## Validation Checklist

Before finalizing any financial projection:
- [ ] All assumptions sourced (market research, benchmarks, or flagged as estimate)
- [ ] Revenue model validated against comparable company growth rates
- [ ] CAC validated against industry benchmarks by channel
- [ ] Churn rate validated against industry average for segment
- [ ] LTV:CAC ratio >3:1 or flagged with explanation
- [ ] CAC payback <18 months or flagged with explanation
- [ ] Gross margin >70% or explained if lower
- [ ] Headcount plan synced with Operations registry
- [ ] Marketing spend synced with Marketing registry
- [ ] 3 scenarios modeled (base/best/downside)
- [ ] Sensitivity analysis completed (top 3-5 drivers)
- [ ] Runway calculated for all scenarios
- [ ] Funding needs and timing identified
- [ ] Cross-domain validation completed (Ops, Marketing, Product)
- [ ] Projection linked in Financial Registry with FIN-TASK-XXX

## Integration with Agents

### Finance Director
- **Primary user** of this skill
- Activates for all projection modeling and validation tasks
- Uses benchmark research and validation checklists
- Applies scenario analysis and sensitivity testing

### Business Analyst
- Uses this skill when building initial financial models in `1-ideas/finance/`
- Validates unit economics in business cases
- Applies benchmark standards to opportunity sizing

### Market Research
- Provides input data for financial modeling
- Uses benchmark research to validate market sizing (TAM/SAM/SOM)
- Validates pricing assumptions against competitor data

## Related Skills
- **`research`** - Market data gathering for assumption validation
- **`problem-solving`** - Complex scenario analysis and sensitivity testing
- **`planning`** - Strategic financial planning and roadmap alignment

## Example Outputs

### Revenue Projection with Scenarios
```markdown
## Revenue Projection — Base Case
- Assumption: 20% MoM customer growth (validated vs. [SaaS benchmark])
- ARPU: $50/mo (validated vs. [competitor pricing])
- Churn: 5% monthly (validated vs. [ChartMogul B2B SaaS average])
- Result: $120K MRR by Month 12

## Best Case (+30% revenue)
- Assumption: 30% MoM growth, 3% churn
- Result: $180K MRR by Month 12

## Downside (-40% revenue)
- Assumption: 10% MoM growth, 8% churn
- Result: $60K MRR by Month 12

## Sensitivity
- Customer growth rate: ±10% → ±$30K MRR impact
- Churn rate: ±2% → ±$15K MRR impact
- ARPU: ±$10 → ±$20K MRR impact
```

### Benchmark Validation Table
```markdown
| Metric | Our Model | Industry Benchmark | Status |
|--------|-----------|-------------------|--------|
| LTV:CAC | 4.2:1 | >3:1 (healthy) | ✅ Pass |
| CAC Payback | 14 months | <18mo (acceptable) | ✅ Pass |
| Gross Margin | 68% | >70% (SaaS standard) | ⚠️ Below standard; explain |
| Churn (annual) | 5% | 5-7% (B2B SaaS) | ✅ Pass |
| Burn Multiple | 1.8× | <2× (acceptable) | ✅ Pass |
```

## References
- OpenView SaaS Benchmarks: https://www.openviewpartners.com/
- SaaS Capital: https://www.saas-capital.com/
- Bessemer Cloud Index: https://www.bvp.com/atlas/
- ChartMogul Benchmarks: https://chartmogul.com/
- ProfitWell SaaS Metrics: https://www.profitwell.com/

---

*This skill ensures all financial projections are realistic, validated, and defensible.*
