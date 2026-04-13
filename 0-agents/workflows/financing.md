# Financing Workflow — AI-First Startup Factory

## Purpose

This workflow coordinates market research → business analysis → financial projection to ensure all financial models are realistic, validated, and defensible.

## Agent Roles

| Agent | Responsibility | Output Location |
|-------|---------------|-----------------|
| @market-research | Gather market data, benchmarks, pricing, cost data | `1-ideas/market-research/` |
| @business-analyst | Build business cases, initial financial models, unit economics | `1-ideas/finance/`, business cases in `1-ideas/` |
| @finance-director | Detailed projections, scenario modeling, benchmark validation | `5-financing/projections/`, `5-financing/plans.md` |
| @product-strategist | Validate financial assumptions align with product strategy | `2-product-foundation/` |
| @docs-guardian | Maintain financial documentation structure | All domains |

---

## Workflow Steps

### Phase 1: Market Research (Data Gathering)

**Agent:** @market-research  
**Mode:** ideas

**Inputs:**
- Product concept or feature idea
- Target market hypothesis
- Competitor list (if known)

**Tasks:**
1. Define research objectives (including financial data requirements)
2. Conduct market research:
   - Market size (TAM/SAM/SOM) with methodology and sources
   - Competitor pricing analysis (public data from websites)
   - Customer acquisition data (CAC/CPA benchmarks by channel)
   - Retention/churn benchmarks by segment (industry reports)
   - Unit economics data (LTV:CAC ratios from comparable companies)
   - Growth rates (historical data from public companies)
   - Cost benchmarks (infrastructure, payroll, SaaS tools by stage)
3. Document findings in `1-ideas/market-research/reports/[topic]-[YYYY-MM].md`
4. Update `1-ideas/market-research/summaries.md` with key findings

**Outputs:**
- Market research reports with sourced data
- Pricing benchmarks
- Cost benchmarks
- Growth rate data
- Summary in `summaries.md`

**Quality Checklist:**
- [ ] TAM/SAM/SOM with calculation methodology and sources
- [ ] Pricing benchmarks from ≥3 competitors (public data)
- [ ] CAC benchmarks by channel (industry reports, comparable companies)
- [ ] Churn benchmarks by segment (ChartMogul, Recurly, industry reports)
- [ ] LTV data from comparable companies or cohort analysis
- [ ] Growth rates from ≥3 similar products (public companies, case studies)
- [ ] Cost benchmarks for infrastructure, payroll, tools (Glassdoor, AWS pricing)
- [ ] All data points dated and sourced
- [ ] Ranges provided where single-point estimates not available

**Handoff:**
```markdown
### ORCHESTRATION HANDOFF
**Current mode**: ideas  
**Task completed**: Yes  
**Next recommended agent**: @business-analyst  
**Next task**: "Build business case and initial financial model using market research data"  
**Priority**: High
```

---

### Phase 2: Business Analysis (Initial Modeling)

**Agent:** @business-analyst  
**Mode:** ideas

**Inputs:**
- Market research reports from Phase 1
- Product requirements from @product-strategist
- `shared/context/current-scope.md`

**Tasks:**
1. Validate market research data quality
   - Check all required data points present
   - Flag data gaps and request additional research if needed
2. Build business case in `1-ideas/business-case-[feature].md`:
   - Problem & opportunity size
   - Expected revenue/cost savings (Year 1-3)
   - Success metrics & leading indicators
   - Quality standards and coverage requirements
   - Go/No-Go recommendation with confidence score
3. Build initial financial model in `1-ideas/finance/initial-financing-plan.md`:
   - Unit economics (CAC, LTV, payback, gross margin)
   - Revenue model (Base + Conservative scenarios)
   - Expense model (headcount, infrastructure, marketing)
   - Runway calculation
4. Validate assumptions against benchmarks:
   - LTV:CAC >3:1 or flagged
   - CAC payback <18 months or flagged
   - Churn rate matches industry segment average
   - Growth rate realistic vs. comparables

**Outputs:**
- Business case document
- Initial financial model with Base + Conservative scenarios
- Assumption validation notes
- Data gap identification (if any)

**Quality Checklist:**
- [ ] All assumptions sourced (market research, benchmarks, or flagged as estimate)
- [ ] Unit economics validated against industry benchmarks
- [ ] LTV:CAC ratio >3:1 or flagged with explanation
- [ ] CAC payback <18 months or flagged with explanation
- [ ] Base + Conservative scenarios modeled
- [ ] Top 2-3 sensitivity drivers identified
- [ ] Cross-validated with Operations (headcount plan) and Marketing (CAC targets)

**Handoff Decision:**

**If initial model is sufficient** (early-stage, low complexity):
```markdown
### ORCHESTRATION HANDOFF
**Current mode**: ideas  
**Task completed**: Yes  
**Next recommended agent**: @product-strategist  
**Next task**: "Review business case and prioritize in product backlog"  
**Priority**: High
```

**If detailed projection needed** (fundraising, complex modeling):
```markdown
### ORCHESTRATION HANDOFF
**Current mode**: ideas  
**Task completed**: Partial  
**Next recommended agent**: @finance-director  
**Next task**: "Build detailed financial projection with scenarios and sensitivity analysis"  
**Priority**: High

**Finance Director Handoff:**
- Market research data validated: Yes
- Unit economics assumptions documented with sources
- Growth assumptions backed by comparable company data
- Request: 3-year projection with Base/Best/Downside scenarios
```

---

### Phase 3: Detailed Financial Projection (Optional)

**Agent:** @finance-director  
**Mode:** plan

**Inputs:**
- Initial financial model from Phase 2
- Market research data from Phase 1
- Operations data (`6-operations/tracking/registry.md`)
- Marketing data (`4-marketing/performance/registry.md`)
- Product roadmap (`2-product-foundation/product-backlog/backlog.md`)

**Tasks:**
1. Validate data quality (use checklist in finance-director agent)
2. Create detailed projection using `5-financing/templates/projection-template.md`:
   - File: `5-financing/projections/[type]-[period]-[YYYY-MM].md`
   - Add YAML frontmatter (FIN-TASK-XXX, parent epic, owner, confidence)
3. Build comprehensive models:
   - Revenue model (subscription tiers, usage, expansion revenue)
   - Expense model (detailed headcount plan, infrastructure scaling, marketing by channel)
   - Cash flow model (monthly granularity, payment timing)
   - Unit economics model (cohort-based LTV, CAC by channel, payback)
4. Validate assumptions against benchmarks:
   - Compare every key metric to industry standards
   - Use OpenView, SaaS Capital, Bessemer, ChartMogul, etc.
   - Flag outliers with explanation
5. Model 3 scenarios:
   - **Base Case (50% confidence):** Median assumptions
   - **Best Case (10% confidence):** +20-30% on revenue, -10-15% on costs
   - **Downside (20% confidence):** -30-40% on revenue, +10-20% on costs
6. Sensitivity analysis:
   - Identify top 3-5 drivers (e.g., CAC, churn, ARPU, growth rate)
   - Calculate ±20% impact on runway and profitability
7. Cross-domain validation:
   - Headcount plan matches Operations registry
   - Marketing spend matches Marketing registry
   - Product roadmap timeline aligns with revenue assumptions
8. Update financial documents:
   - Link projection in `5-financing/plans.md`
   - Add FIN-TASK-XXX entry to `5-financing/tracking/registry.md`
   - Update key metrics in registry
   - Log change in `5-financing/history/changelog.md`

**Outputs:**
- Detailed financial projection file
- 3 scenarios (Base/Best/Downside) with probabilities
- Sensitivity analysis table
- Benchmark comparison table
- Runway and funding needs summary
- Updated financial registry and plans

**Quality Checklist:**
- [ ] All assumptions sourced (market research, benchmarks, or flagged)
- [ ] Revenue model validated against comparable growth rates
- [ ] CAC validated against industry benchmarks by channel
- [ ] Churn rate validated against segment average
- [ ] LTV:CAC ratio >3:1 or flagged with explanation
- [ ] CAC payback <18 months or flagged with explanation
- [ ] Gross margin >70% or explained if lower
- [ ] Headcount plan synced with Operations registry
- [ ] Marketing spend synced with Marketing registry
- [ ] 3 scenarios modeled (Base/Best/Downside)
- [ ] Sensitivity analysis completed (top 3-5 drivers)
- [ ] Runway calculated for all scenarios
- [ ] Funding needs and timing identified
- [ ] Cross-domain validation completed
- [ ] Projection linked in Financial Registry with FIN-TASK-XXX
- [ ] Benchmark comparison table included

**Handoff:**
```markdown
### ORCHESTRATION HANDOFF
**Current mode**: plan  
**Task completed**: Yes  
**Financial Task**: [Projection type]

**Files created/modified**:
- `5-financing/projections/[projection-file].md`
- `5-financing/plans.md` - UPDATED
- `5-financing/tracking/registry.md` - UPDATED
- `5-financing/history/changelog.md` - UPDATED

**Data validation**:
- ✅ All assumptions sourced from market research
- ✅ Benchmarks validated against [sources]
- ✅ Cross-domain validation completed
- ⚠️ **Data gaps:** [List any missing data or high-uncertainty assumptions]

**Key Findings**:
- Runway: [X months] (base case), [Y months] (downside)
- Funding need: $[amount] by [date]
- Top risks: [Risk 1], [Risk 2], [Risk 3]

**Next recommended agent**: @product-strategist | @human  
**Next task**: "Review financial projection and make Go/No-Go decision"  
**Priority**: High
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      PHASE 1: MARKET RESEARCH                   │
│                      @market-research (ideas)                   │
├─────────────────────────────────────────────────────────────────┤
│ Inputs:                                                         │
│  • Product concept/feature idea                                 │
│  • Target market hypothesis                                     │
│  • Competitor list                                              │
│                                                                 │
│ Outputs:                                                        │
│  ✓ TAM/SAM/SOM (sourced)                                       │
│  ✓ Pricing benchmarks (≥3 competitors)                         │
│  ✓ CAC benchmarks by channel                                   │
│  ✓ Churn benchmarks by segment                                 │
│  ✓ LTV data from comparables                                   │
│  ✓ Growth rates (≥3 similar products)                          │
│  ✓ Cost benchmarks (infra, payroll, tools)                     │
│                                                                 │
│ Location: 1-ideas/market-research/                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 2: BUSINESS ANALYSIS                   │
│                    @business-analyst (ideas)                    │
├─────────────────────────────────────────────────────────────────┤
│ Inputs:                                                         │
│  • Market research reports (Phase 1)                            │
│  • Product requirements                                         │
│  • Current scope                                                │
│                                                                 │
│ Tasks:                                                          │
│  1. Validate market research data quality                       │
│  2. Build business case                                         │
│  3. Build initial financial model                               │
│  4. Validate assumptions vs. benchmarks                         │
│                                                                 │
│ Outputs:                                                        │
│  ✓ Business case (1-ideas/business-case-[feature].md)         │
│  ✓ Initial financial model (Base + Conservative)               │
│  ✓ Unit economics validation                                   │
│  ✓ Go/No-Go recommendation                                     │
│                                                                 │
│ Location: 1-ideas/                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ├─────── Simple case ─────────────────────┐
                         │                                         │
                         └─── Complex case ───┐                   ▼
                                              ▼         @product-strategist
┌─────────────────────────────────────────────────────────────────┐
│              PHASE 3: DETAILED FINANCIAL PROJECTION             │
│                    @finance-director (plan)                     │
├─────────────────────────────────────────────────────────────────┤
│ Inputs:                                                         │
│  • Initial financial model (Phase 2)                            │
│  • Market research data (Phase 1)                               │
│  • Operations data (headcount, costs)                           │
│  • Marketing data (CAC, channel mix)                            │
│  • Product roadmap                                              │
│                                                                 │
│ Tasks:                                                          │
│  1. Validate data quality (checklist)                           │
│  2. Build detailed revenue/expense/cash flow models             │
│  3. Validate assumptions vs. benchmarks                         │
│  4. Model 3 scenarios (Base/Best/Downside)                      │
│  5. Sensitivity analysis (top 3-5 drivers)                      │
│  6. Cross-domain validation                                     │
│  7. Update financial registry and plans                         │
│                                                                 │
│ Outputs:                                                        │
│  ✓ Detailed projection (5-financing/projections/[file].md)    │
│  ✓ 3 scenarios with probabilities                              │
│  ✓ Sensitivity analysis table                                  │
│  ✓ Benchmark comparison table                                  │
│  ✓ Runway & funding needs summary                              │
│  ✓ Updated registry (FIN-TASK-XXX)                             │
│                                                                 │
│ Location: 5-financing/                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                @product-strategist or @human
                   (Go/No-Go decision)
```

---

## Critical Quality Gates

### Gate 1: Market Research Data Quality
**Owner:** @market-research  
**Criteria:**
- [ ] TAM/SAM/SOM calculated with methodology and sources
- [ ] Pricing benchmarks from ≥3 competitors (public data)
- [ ] CAC benchmarks by channel with sources
- [ ] Churn benchmarks by segment with sources
- [ ] LTV data from comparables
- [ ] Growth rates from ≥3 similar products
- [ ] Cost benchmarks for infrastructure, payroll, tools
- [ ] All data points dated and sourced

**If gate fails:** @finance-director flags data gaps → @market-research gathers missing data → re-validate

---

### Gate 2: Assumption Validation
**Owner:** @business-analyst or @finance-director  
**Criteria:**
- [ ] LTV:CAC ratio >3:1 or flagged with explanation
- [ ] CAC payback <18 months or flagged with explanation
- [ ] Churn rate matches industry segment average (±2%)
- [ ] Growth rate realistic vs. comparable companies
- [ ] Gross margin >70% (SaaS) or explained
- [ ] Headcount plan synced with Operations
- [ ] Marketing spend synced with Marketing

**If gate fails:** Adjust assumptions or flag as high-risk → escalate to @product-strategist or @human

---

### Gate 3: Scenario & Sensitivity Analysis
**Owner:** @finance-director  
**Criteria:**
- [ ] Base Case (50% confidence) with median assumptions
- [ ] Best Case (10% confidence) with +20-30% revenue, -10-15% costs
- [ ] Downside (20% confidence) with -30-40% revenue, +10-20% costs
- [ ] Top 3-5 sensitivity drivers identified
- [ ] ±20% impact calculated for each driver
- [ ] Runway calculated for all scenarios

**If gate fails:** Re-model scenarios → ensure realistic ranges → re-validate

---

## Handoff Summary

| From | To | Trigger | Deliverable |
|------|----|---------| ------------|
| @market-research | @business-analyst | Market research complete | Market research reports with sourced financial data |
| @business-analyst | @product-strategist | Simple case (early-stage) | Business case + initial financial model |
| @business-analyst | @finance-director | Complex case (fundraising, detailed modeling) | Initial financial model + validated assumptions |
| @finance-director | @product-strategist or @human | Detailed projection complete | 3 scenarios, sensitivity, benchmarks, funding needs |

---

## Related Documents

- **[Market Research Agent](../agents/market-research.md)** - Market research guidelines
- **[Business Analyst Agent](../agents/business-analyst.md)** - Business analysis workflow
- **[Finance Director Agent](../agents/finance-director.md)** - Financial projection workflow
- **[Financial Modeling Skill](../agents/skills/financial-modeling.md)** - Modeling and validation standards
- **[Projection Template](../../5-financing/templates/projection-template.md)** - Standard projection format
- **[Responsibility Matrix](./agent-responsibility-matrix.md)** - Agent responsibilities

---

**This workflow ensures all financial projections are realistic, validated, and defensible.**
