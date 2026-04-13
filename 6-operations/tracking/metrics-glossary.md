# Operations Metrics Glossary

Definitions of all operational metrics tracked in `registry.md`.

---

## Headcount Metrics

**Total Headcount**
- Definition: Total number of employees currently employed (full-time + part-time + contractors included as FTE equivalent)
- Target: Scale with product roadmap (e.g., +20% YoY growth, or absolute targets)
- Healthy Range: Adjust based on revenue, burn rate, and growth stage
- Calculation: Sum of all current employees (excludes inactive/on-leave)
- Links: Payroll, Hiring Pipeline, Org Chart

**Open Headcount**
- Definition: Number of approved open positions (budgeted but not yet hired)
- Target: Depends on hiring plan (e.g., "hire 5 engineers by Q3")
- Healthy Range: Should not exceed 15% of total headcount (prevents under-staffing)
- Calculation: Approved roles - hired roles
- Links: Hiring Plan, Budget Forecast

**Headcount Burn (Monthly Cost)**
- Definition: Total monthly payroll cost (salary + benefits + taxes) for all employees
- Target: [Monthly budget from Finance]
- Healthy Range: Should not exceed 30-40% of monthly revenue (SaaS benchmark)
- Calculation: Sum of all salaries + benefits + payroll taxes + contractor fees
- Links: Finance Registry, Payroll Run, Budget Forecast

**Average Time to Hire**
- Definition: Average number of days from job posting to offer acceptance across all recent hires
- Target: [X weeks, industry standard: 4-6 weeks]
- Healthy Range: <6 weeks for most roles; <4 weeks for urgent fills
- Calculation: (Date offer accepted - Date job posted) / # of hires in period
- Links: Hiring Plan, Recruiting Pipeline

**Cost per Hire**
- Definition: Average total cost to hire one employee (recruiting fees, tools, assessments, sign-on bonus, etc.)
- Target: [Industry benchmark: $5K-$15K depending on role level]
- Healthy Range: <20% of first-year salary
- Calculation: (Recruiting fees + tools + assessments + sign-on bonuses) / # of hires
- Links: Hiring Plan, Finance Budget

**Employee Turnover (Annual %)**
- Definition: Percentage of employees who left the company in a year
- Target: <10% (healthy SaaS is 10-15%)
- Healthy Range: <15% (indicator of culture, compensation, growth fit)
- Calculation: (# employees who left in year / average headcount) × 100
- Links: HR Policy, Exit Survey Data
- Red Flags: >20% indicates culture or compensation problems

---

## Hiring & Recruiting Metrics

**Hiring Pipeline**
- Definition: Count of candidates actively in recruiting process (offer stage + closing)
- Target: Maintain 2-3 candidates per open role
- Healthy Range: Ensures consistent hiring momentum
- Calculation: Sum of candidates at offer + final round stage
- Links: Hiring Plan templates

**Recruiting Source Quality**
- Definition: Percentage of hires from each source (referrals, LinkedIn, recruiting firm, job boards)
- Target: [Ideal: 40% referrals, 30% direct, 30% recruiter]
- Healthy Range: Depends on market; internal referrals usually have higher retention
- Calculation: (# hires from source / total hires) × 100 for each source
- Links: Hiring Plan

**Interview-to-Offer Rate**
- Definition: Percentage of candidates who receive offers after completing interviews
- Target: [Healthy: 10-20%]
- Healthy Range: Too high (>30%) suggests low bar; too low (<5%) suggests unrealistic requirements
- Calculation: (# offers / # candidates interviewed) × 100
- Links: Hiring metrics

**Offer Acceptance Rate**
- Definition: Percentage of offers accepted by candidates
- Target: [Healthy: 80%+]
- Healthy Range: <70% suggests offer competitiveness or role clarity issues
- Calculation: (# offers accepted / # offers extended) × 100
- Links: Compensation, Hiring Plan

---

## Payroll & Compensation Metrics

**Payroll Run (Monthly)**
- Definition: Total approved payroll for all employees in a calendar month
- Target: [Monthly budget from Finance]
- Healthy Range: Should match Finance forecast ±5%
- Calculation: Sum of salaries due in month + benefits + taxes
- Links: Finance Registry, Budget

**Benefits Costs (Monthly)**
- Definition: Health insurance, 401k match, professional development, equipment costs per month
- Target: [Monthly budget from Finance]
- Healthy Range: Should be 20-30% of payroll (benchmark: health 10-15%, other 5-10%)
- Calculation: Sum of all benefits costs divided by 12 months
- Links: Finance Budget, Vendor Contracts

**Equity Dilution (Annual)**
- Definition: Percentage of company equity allocated to employees in option pool (annual refresh)
- Target: [Depends on growth stage: Early 10-15%, Growth 5-8%]
- Healthy Range: Allows competitive packages without over-diluting founders
- Calculation: (Shares granted this year / total outstanding shares) × 100
- Links: Finance, Fundraising metrics

**Compensation Benchmarking**
- Definition: Percentile of salaries vs. market (e.g., "50th percentile = median market rate")
- Target: [Typically 50th-75th percentile for competitive markets]
- Healthy Range: 50th = market rate; 75th = premium (attracts talent)
- Calculation: Internal salary ranges vs. industry surveys (Glassdoor, Levels.fyi, Radford)
- Links: Hiring Plan, HR Policy

---

## Organizational Health Metrics

**Compliance Audit Status**
- Definition: Result of external compliance audit (SOC 2, ISO 27001, annual legal review, etc.)
- Target: Passing / No findings
- Healthy Range: Should audit annually; no critical findings
- Calculation: Pass/fail; critical/major/minor findings count
- Links: Legal, Finance (if audit-related)

**Employee Satisfaction / Engagement**
- Definition: Average score from annual anonymous employee survey (eNPS or similar)
- Target: [Healthy: eNPS >30, or satisfaction >4/5]
- Healthy Range: >30 indicates positive culture; <0 is red flag
- Calculation: (Promoters - Detractors) / Total responses × 100 for eNPS
- Links: HR Policy, Culture initiatives

**Internal Tool Stack**
- Definition: Count and status of internal tools (CMS, bug tracking, communication, design tools, etc.)
- Target: [Optimized for role; e.g., Engineering needs GitHub, Jira, Notion; Marketing needs HubSpot, Canva]
- Healthy Range: <1 tool per person on average
- Calculation: Sum of active internal + external tools + monthly spend
- Links: Vendor Registry, Budget

**Vendor Count & Management**
- Definition: Total number of active vendor relationships (SaaS tools, contractors, agencies, services)
- Target: <30 active vendors (consolidation reduces management overhead)
- Healthy Range: Review quarterly; consolidate overlapping services
- Calculation: Sum of active vendor contracts
- Links: Vendor Registry, Finance Budget

---

## Retention & Development Metrics

**Voluntary Turnover Rate (%)**
- Definition: Percentage of employees who left voluntarily (vs. involuntary/layoff)
- Target: <5% annually (healthy)
- Healthy Range: <10% acceptable; >15% indicates retention risk
- Calculation: (# voluntary departures / avg headcount) × 100
- Links: Exit surveys, HR Policy

**Internal Promotion Rate (%)**
- Definition: Percentage of open roles filled by internal promotion vs. external hire
- Target: [Healthy: 30-50% for growth companies]
- Healthy Range: Shows career ladder; <20% suggests limited growth
- Calculation: (# internal promotions / # total roles filled) × 100
- Links: Career framework, Hiring Plan

**Average Tenure (Months)**
- Definition: Average length of employment for current team
- Target: [Varies by role; healthy: 2-4 years for senior, 1-2 years for junior]
- Healthy Range: Indicates team stability; <12mo suggests instability
- Calculation: Sum of tenure / # employees
- Links: Headcount, Turnover metrics

**Training Hours per Employee (Annual)**
- Definition: Average professional development hours per employee per year
- Target: [Industry standard: 20-40 hours/year]
- Healthy Range: Supports growth and skill development
- Calculation: Sum of training hours / # employees
- Links: Culture initiatives, Professional development budget

---

## Infrastructure & Operational Metrics

**IT Infrastructure Uptime (%)**
- Definition: Percentage of time internal systems (email, Slack, code repo, wiki) are accessible
- Target: 99.5%+ (allows <3.6 hours downtime/month)
- Healthy Range: >99% acceptable; <99% impacts productivity
- Calculation: (Total hours - downtime hours) / total hours × 100
- Links: DevOps, Infrastructure

**Data Backup & Disaster Recovery Status**
- Definition: Are backups current, tested, and recovery time target (RTO) documented?
- Target: Daily backups; RTO <4 hours
- Healthy Range: Tested monthly; zero recovery failures
- Calculation: Last successful backup date; recovery test results
- Links: Security policy, Compliance

**Office/Facility Utilization (%)**
- Definition: Percentage of office spaces in use (for in-office operations)
- Target: [Depends on remote policy; hybrid: 50-70%]
- Healthy Range: Informs real estate decisions
- Calculation: Occupied spaces / total capacity
- Links: Office operations, Budget

---

## Cross-Domain Health Metrics

**Ops-to-Finance Alignment**
- Headcount Burn vs. Finance Forecast: Should be ±5% variance
- Hiring Pipeline vs. Finance Budget: Total planned hires should stay within approved budget
- Vendor Costs vs. Finance Budget: Active vendor spend should match approved amount

**Ops-to-Product Alignment**
- Headcount Growth vs. Product Roadmap: Team size should support capacity for roadmap
- Hiring Timeline vs. Product Sprint Planning: Key hires should land before dependent features

**Ops-to-Marketing Alignment**
- Candidate Pipeline Source Quality: How many candidates come from referrals vs. organic?
- Employer Brand Perception: Net Promoter Score from candidates about company

---

## Healthy Benchmarks (SaaS/Tech)

| Metric | Healthy Range | Yellow Flag | Red Flag |
|--------|---|---|---|
| Turnover Rate | <10% annually | 10-15% | >15% |
| Time to Hire | 4-6 weeks | 6-8 weeks | >8 weeks |
| Cost per Hire | <20% of annual salary | 20-30% | >30% |
| Headcount Burn | <30% of MRR | 30-40% | >40% |
| Employee eNPS | >30 | 0-30 | <0 |
| Payroll Variance | ±5% | ±5-10% | >10% |
| IT Uptime | >99% | 98-99% | <98% |

---

## Acronyms & Quick Reference

- **eNPS**: Employee Net Promoter Score (−100 to +100; >30 is healthy)
- **FTE**: Full-Time Equivalent (e.g., 2 part-time = 1 FTE)
- **ROI**: Return on Investment (used in hiring: value created by hire vs. cost)
- **SOC 2**: Security compliance standard for service providers
- **RTO**: Recovery Time Objective (how quickly systems must come back online)
- **YTD**: Year-to-Date

---

**Related Documents**
- Registry: `../tracking/registry.md` (current metrics + initiatives)
- Strategy: `../strategy.md` (org structure, culture framework)
- Changelog: `../history/changelog.md` (major changes)
- Hiring Plans: `../templates/hiring-plan-template.md`
- HR Policies: `../hr/compensation-policy.md`, `../hr/time-off-policy.md`

---

*Update glossary as new metrics are tracked. Archive annual benchmarks to `archives/YYYY/ops-metrics-benchmark.md`.*
