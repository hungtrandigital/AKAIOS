# Operations Strategy

Comprehensive strategy for organizational structure, culture, compliance, and vendor management. Single source of truth for how Operations runs the company.

---

## Executive Summary

**Purpose:** Define how we organize the company, build culture, ensure compliance, and manage vendors.

**Current State:** [X employees, Y open roles, Z active vendors, [compliance status]]

**This Quarter's Focus:** [Hiring X engineers, consolidating vendors, implementing [policy]]

---

## Part 1: Organizational Structure

### Team Chart

```
CEO / Founder
├── Head of Engineering
│   ├── Backend Lead
│   ├── Frontend Lead
│   └── DevOps Lead
├── Head of Product
│   ├── Senior PM (Product 1)
│   └── PM (Product 2)
├── Head of Marketing
│   ├── Growth Lead
│   └── Content Lead
├── Head of Finance / CFO
│   ├── Accountant
│   └── Finance Manager
└── Head of Operations / COO
    ├── HR Manager
    ├── Legal / Compliance Officer
    └── Infrastructure / Vendor Manager
```

**Notes:**
- Total approved headcount: X (includes contractors as 0.5 FTE each)
- Open headcount: Y
- Reporting structure: All department heads report to CEO; individual contributor structure TBD at department level

### Department Mandates

| Department | Owner | Key Responsibilities | Success Metrics |
|------------|-------|----------------------|-----------------|
| Engineering | Head of Engineering | Product delivery, code quality, team growth | Velocity, quality, hiring pipeline |
| Product | Head of Product | Roadmap definition, customer feedback, prioritization | Feature adoption, user satisfaction |
| Marketing | Head of Marketing | Brand, demand generation, content, campaigns | CAC, LTV, brand awareness |
| Finance | CFO | Fundraising, budgeting, financial planning, reporting | Burn rate, runway, forecast accuracy |
| Operations | COO | Hiring, compliance, culture, vendor management, infrastructure | Headcount, turnover, compliance status |

### Org Chart Review Cadence

- **Monthly 1:1s:** All managers with direct reports; 30 min
- **Quarterly Reviews:** Org design assessment; identify bottlenecks, over/under-staffed teams
- **Annual Refresh:** Complete org redesign discussion; plan next fiscal year structure
- **Trigger Review:** If major change (acquisition, pivot, major hire/departure)

---

## Part 2: Culture & People Framework

### Company Values

**[VALUE 1: e.g., "Bias to Action"]**
- Definition: We move fast and learn from mistakes rather than over-planning
- How we hire for it: Look for examples of shipping under uncertainty
- How we reward it: Celebrate speed + learnings; give autonomy to experiment

**[VALUE 2: e.g., "Customer Obsession"]**
- Definition: Every decision is driven by user/customer needs
- How we hire for it: Ask about user research, customer conversations in interviews
- How we reward it: Highlight customer wins in all-hands; tie exec comp to customer metrics

**[VALUE 3: e.g., "Default to Transparency"]**
- Definition: Share information openly; no information gatekeeping
- How we hire for it: Ask about communication preferences and info-sharing in interviews
- How we reward it: Share financial metrics, roadmap, and challenges in all-hands

**[VALUE 4: e.g., "Ownership Mentality"]**
- Definition: Each person acts like they own the company; goes beyond job description
- How we hire for it: Look for accountability in past projects; ask about times they took initiative
- How we reward it: Equity vesting; clear career path; autonomy to make decisions

### Hiring Philosophy

**Who We Hire:**
- Candidates who demonstrate our values in interviews
- People who can grow 2-3 levels above their starting role
- A mix of experience (50% senior, 50% junior) for knowledge transfer
- Diverse backgrounds; we actively recruit from underrepresented groups

**Who We Don't Hire:**
- Resume-only candidates; we always interview
- People who don't align with our values (even if technically skilled)
- Single-skill specialists; we want adaptable people
- Candidates who bad-mouth previous employers (signals culture fit issues)

**Hiring Process (See hiring-plan-template.md for details)** — Draft each role's JD using `../templates/jd-template.md` and link OPS-TASK-XXX + parent PRD-EPIC-XXX in the registry.
1. Phone screen (fit + basics)
2. Technical assessment (for technical roles)
3. 2-3 rounds of interviews (technical, culture, leadership)
4. Reference check
5. Offer + negotiation

**Offer Standards:**
- Salary: [Percentile]: [X]th percentile of market rate (Levels.fyi, Glassdoor)
- Equity: [X%] for senior hires, [X%] for junior; 4-year vest, 1-year cliff
- Sign-on bonus: [Only if necessary; max 10% of annual salary]
- Benefits: See compensation-policy.md

### Onboarding Standards (See onboarding-checklist-template.md for full details)

**Day 1:**
- All systems set up (laptop, email, Slack, GitHub)
- 1:1 with manager: role expectations, first week plan
- Office/team tour
- Handbook review + sign-off

**Week 1:**
- Daily check-ins with manager or buddy
- Product demo
- Team introductions
- First task assigned

**Month 1:**
- Continue daily check-ins (transition to 3x/week by week 3)
- First code/work contribution shipped
- 30-day review with manager (on track?)

**30/60/90-Day Reviews:**
- 30-day: Is ramp on track? Any concerns?
- 60-day: Can they contribute independently?
- 90-day: Probation period end (if applicable); confirm long-term fit

### Performance Management

**1:1 Frequency:** Bi-weekly or weekly (depending on role/tenure)

**1:1 Format:**
- Manager listens 60% of time
- Discuss: What's working, challenges, career goals, feedback from others
- Outcomes: Action items, decisions, growth areas

**Annual Review Cycle:**
- Self-assessment (employee fills out mid-year + year-end)
- Manager assessment (360 feedback collected)
- Calibration session (all managers align on ratings)
- Review conversation (45-60 min)
- Outcome: Rating, comp adjustment (if applicable), growth plan

**Review Ratings:** 
- Exceeds (top 10%)
- Meets (solid 70%)
- Developing (15%)
- Below (rare; usually results in PIP or exit)

**Compensation Review:**
- Annual (typically Q1 or Q4)
- Based on: Market rate, performance, internal equity, company performance
- Process: HR + manager + CFO align; communicate transparently
- Adjustments: Typical range is 3-8% for meets; 8-15% for exceeds

### Career Ladder & Growth

**Individual Contributor Track:** IC1 → IC2 → IC3 → IC4 → IC5 (Principal/Staff)

**Manager Track:** Manager → Senior Manager → Director → VP → C-Suite

**Frameworks:**
- Engineering: [Levels.fyi aligned; ic3 = senior, ic4 = staff engineer]
- Product: [Junior PM → Senior PM → Director → VP Product]
- [Other departments TBD as they grow]

**Promotion Criteria:**
- Demonstrates proficiency in current level + 1 level above
- Clear skills/impact in new role
- 360 feedback positive
- Manager recommends
- Calibration meeting approval

**Career Conversations:**
- Quarterly: Manager asks "Where do you want to go in your career?"
- Annual: Formal growth plan (skills to develop, projects to own, timeline)
- As-needed: If employee interested in new role or direction

### Compensation Philosophy

- **Competitive:** 50th-75th percentile of market (geographic + role level)
- **Transparent:** Salary bands published; formula shared
- **Equitable:** Men and women paid same for same role; no pay based on negotiation skill
- **Inclusive:** Benefits accessible to all employee types (full-time, part-time, remote)

See `../hr/compensation-policy.md` for salary bands and benefits details.

---

## Part 3: Compliance & Legal Framework

### Data & Security

**Data Classification:**
- **Sensitive:** Customer data, financial data, code → Encrypted at rest/in transit; limited access; audit logs
- **Confidential:** Product strategy, investor data, employee data → Encryption; NDA required; limited access
- **Internal:** Meeting notes, internal processes → No encryption; available to all employees
- **Public:** Marketing materials, product docs → No restrictions; public-facing

**Security Standards:**
- [ ] All laptops encrypted (FileVault on Mac, BitLocker on Windows)
- [ ] VPN required for remote access to internal systems
- [ ] 2FA enabled on all accounts (email, GitHub, Slack, etc.)
- [ ] Password manager required (1Password or LastPass)
- [ ] Annual security training required
- [ ] Vulnerability disclosure program in place
- [ ] Third-party pen test annually

**Data Breach Protocol:**
1. Isolate affected system (disconnect from network)
2. Alert security lead + legal
3. Assess scope (what data, how many people, when discovered)
4. Notify customers/regulators if required by law (within 72 hours for GDPR)
5. Post-mortem after containment
6. Notify customers transparently about steps taken

### Compliance & Audit

**Annual Audits:**
- [ ] SOC 2 Type II (if required by customers; annual external audit)
- [ ] Data protection audit (GDPR if EU customers, CCPA if CA customers)
- [ ] Payroll audit (ensure correct taxes, benefits, deductions)
- [ ] Financial audit (if required by investors/lenders)

**Compliance Calendar:**
- Q1: [Payroll audit, tax filings]
- Q2: [Insurance renewal, SOC 2 prep]
- Q3: [SOC 2 audit if scheduled]
- Q4: [Year-end financial audit, benefits audit]

**Responsible Parties:**
- Data protection: Legal + Engineering
- Payroll compliance: Finance + HR
- Financial: Finance + External Auditor
- SOC 2: Engineering + Security lead + Legal

### Employment Law

**Contracts:**
- [ ] Written offer letter for every hire (includes role, comp, start date, reporting structure)
- [ ] Employee handbook provided (signed acknowledgment required)
- [ ] NDA signed (if role has access to confidential info)
- [ ] IP assignment agreement signed (company owns IP created during employment)

**At-Will Employment:**
- Employees can leave at any time; company can terminate at any time
- Exception: Can't fire for illegal reasons (race, religion, gender, age, disability, etc.)
- Severance: [Negotiate case-by-case or set policy; e.g., "1 week per year of service"]

**Documentation:**
- [ ] Keep written records of performance feedback, warnings, etc. (for termination defense)
- [ ] Document HR decisions (hiring, promotion, termination) with clear reasons
- [ ] Maintain employee files (offers, reviews, disciplinary action)
- [ ] Comply with state retention laws (typically 3+ years)

### Benefits & Policies

**Benefits (See compensation-policy.md for details):**
- Health insurance (medical, dental, vision)
- 401k matching
- Paid time off (vacation, sick, holidays)
- Parental leave
- Professional development budget
- Equipment budget (laptop, peripherals)

**Policies:**
- Code of conduct (respectful workplace, no discrimination)
- Time-off policy (accrual, requesting, carryover limits)
- Remote work policy (who can WFH, schedule requirements)
- Expense policy (what's reimbursable, approval process)
- Social media policy (confidentiality, representation)

**Mandatory Training:**
- Anti-harassment + discrimination (annual)
- Security + data protection (annual)
- Code of conduct (at hire)

---

## Part 4: Vendor & Infrastructure Management

### Vendor Strategy

**Philosophy:**
- Consolidate overlapping tools (reduce overhead, improve integration)
- Use industry-standard tools (avoid custom builds unless competitive advantage)
- Evaluate quarterly (cost, usage, alternatives)
- Negotiate discounts (volume, annual commitment)

**Active Vendor Categories:**

| Category | Tools | Cost/mo | Owner | Review Date |
|----------|-------|---------|-------|------------|
| Communication | Slack | $X | @Ops Lead | Quarterly |
| Code Repo | GitHub | $X | @Eng Lead | Quarterly |
| Project Mgmt | Linear / Jira | $X | @PM Lead | Quarterly |
| Design | Figma | $X | @Design Lead | Quarterly |
| CRM / Marketing | HubSpot | $X | @Marketing Lead | Quarterly |
| Analytics | Amplitude / Mixpanel | $X | @Product | Quarterly |
| [TBD] | [TBD] | $X | @[Owner] | Quarterly |

**Total Vendor Cost/Month:** $X  
**Annual Vendor Budget:** $X

**Consolidation Targets:**
- Reduce from [current] vendors to ≤30 by [date]
- Migrate [Old Tool] to [New Tool] by [date]
- Sunset [Unused Tool] by [date]

### Infrastructure & Operations

**On-Premises:**
- [ ] Office space: [Address, capacity, lease end]
- [ ] Parking: [Available spots, policy]
- [ ] WiFi: [Provider, uptime SLA]
- [ ] Furniture: [Desks, chairs, meeting rooms]

**Cloud Infrastructure:**
- [ ] Production servers: [Provider, region, uptime SLA]
- [ ] Backup & disaster recovery: [Provider, RTO <4 hours]
- [ ] Email: [Provider: GSuite, Outlook, etc.]
- [ ] File storage: [Provider: Google Drive, OneDrive, Notion]

**IT Support:**
- [ ] Help desk: [Internal team, ticket system]
- [ ] Device management: [Mobile device management, endpoint protection]
- [ ] Network security: [Firewall, VPN, intrusion detection]
- [ ] IT budget: $X annually

**Monitoring & Alerts:**
- [ ] Infrastructure monitoring: [Datadog, New Relic, etc.]
- [ ] Uptime monitoring: [StatusPage, Pingdom]
- [ ] Alert escalation: [On-call rotation, escalation policy]

---

## Part 5: Scale Planning

### Next 12 Months (H2 2025 - H1 2026)

**Hiring Plan:**
- Q4 2025: Hire [X: Engineering, Y: Marketing, Z: Operations]
- Q1 2026: Hire [X: Engineering, Y: Product, Z: Operations]
- Target end-of-H1 2026 headcount: [X]

**Culture Initiatives:**
- [ ] Team offsite (culture building, strategy alignment)
- [ ] Expanded benefits (parental leave, professional dev)
- [ ] Career framework rollout (job levels, promotion criteria)

**Compliance & Infrastructure:**
- [ ] SOC 2 Type II audit completion
- [ ] Enhanced security training rollout
- [ ] Vendor consolidation (reduce to <30 vendors)

**People Development:**
- [ ] Implement manager training program (communication, feedback)
- [ ] Roll out 360 feedback process
- [ ] Create mentorship matching program

### 2-Year Vision

**Headcount:** X → [2X] (double)  
**Culture:** Maintain startup nimbleness + add structure (management layers, clear levels)  
**Compliance:** SOC 2 + GDPR ready + financial audit-ready  
**Infrastructure:** Scale to support [2X headcount, 10X product scale]  

---

## Parking Lot

| Initiative | Reason on Hold | Owner | Estimated Start |
|------------|-----------------|-------|-----------------|
| [Office Expansion] | Waiting for Q4 fundraise | @COO | 2026 Q1 |
| [Equity Program Redesign] | Waiting for legal review | @HR Lead | 2026 Q1 |

---

## Related Documents

- **Hiring Plan Template:** `../templates/hiring-plan-template.md`
- **Onboarding Checklist:** `../templates/onboarding-checklist-template.md`
- **JD Template:** `../templates/jd-template.md`
- **Registry (Active Initiatives):** `../tracking/registry.md`
- **Metrics Glossary:** `../tracking/metrics-glossary.md`
- **Changelog:** `../history/changelog.md`
- **HR Policies:** `../hr/compensation-policy.md`, `../hr/time-off-policy.md`, `../hr/code-of-conduct.md`
- **Vendor Contracts:** `../vendor-contracts/`

---

*Update this strategy quarterly (Q1, Q2, Q3, Q4). Archive annual snapshots to `archives/YYYY/ops-strategy-snapshot.md`. Keep as working document.*
