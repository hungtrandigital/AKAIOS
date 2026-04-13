# Agent Responsibility Matrix

## Purpose

This matrix is the routing contract across the three orchestration layers:
- `INDEX.md` defines canonical navigation and structure.
- `0-agents/mode/*.md` defines what kind of work is allowed.
- Core agent definitions define ownership, while `agency-agents` specialists deepen execution on narrower task types.

Use this document when deciding which core agent owns a task and which specialists should be pulled in without breaking factory governance.

## Routing Rules

1. A **core factory agent always owns routing, file placement, traceability, and final handoff**.
2. `agency-agents` specialists are **optional pull-ins for deeper execution**, not replacements for the core owner.
3. If ownership feels ambiguous, resolve it in this order: current mode owner → this matrix → specific core agent definition.

## Responsibility Matrix

| Core Agent | Owns | Typical Task Types | Recommended Specialist Pull-Ins (`agency-agents`) | Notes |
|-----------|------|--------------------|-----------------------------------------------|-------|
| `@boost` | Factory bootstrap and clean project initialization | folder scaffolding, README seeding, initial structure setup | [Studio Producer](../agents/agency-agents/project-management/project-management-studio-producer.md), [Project Shepherd](../agents/agency-agents/project-management/project-management-project-shepherd.md), [Workflow Architect](../agents/agency-agents/specialized/specialized-workflow-architect.md), [Technical Writer](../agents/agency-agents/engineering/engineering-technical-writer.md) | One-time structure-first setup for new projects |
| `@product-strategist` | Product validation gate and product direction | task validation, product overview, backlog, PRDs, prioritization | [Product Manager](../agents/agency-agents/product/product-manager.md), [Sprint Prioritizer](../agents/agency-agents/product/product-sprint-prioritizer.md), [Trend Researcher](../agents/agency-agents/product/product-trend-researcher.md), [Feedback Synthesizer](../agents/agency-agents/product/product-feedback-synthesizer.md) | Stops orphan tasks before execution starts |
| `@business-analyst` | Business cases and early-stage economics | TAM/SAM/SOM, unit economics, pricing logic, go/no-go framing | [Trend Researcher](../agents/agency-agents/product/product-trend-researcher.md), [Pipeline Analyst](../agents/agency-agents/sales/sales-pipeline-analyst.md), [Finance Tracker](../agents/agency-agents/support/support-finance-tracker.md), [Tracking Specialist](../agents/agency-agents/paid-media/paid-media-tracking-specialist.md) | Stays in `1-ideas/` until material is mature enough to centralize elsewhere |
| `@market-research` | Market, competitor, and customer research | competitor analysis, category scans, qualitative/quantitative studies | [Trend Researcher](../agents/agency-agents/product/product-trend-researcher.md), [Anthropologist](../agents/agency-agents/academic/academic-anthropologist.md), [Psychologist](../agents/agency-agents/academic/academic-psychologist.md), [Narratologist](../agents/agency-agents/academic/academic-narratologist.md) | Feeds business, product, marketing, and finance decisions |
| `@creative-director` | Brand system and creative direction | tone of voice, visual direction, campaign art direction, narrative coherence | [Brand Guardian](../agents/agency-agents/design/design-brand-guardian.md), [Visual Storyteller](../agents/agency-agents/design/design-visual-storyteller.md), [Inclusive Visuals Specialist](../agents/agency-agents/design/design-inclusive-visuals-specialist.md), [Whimsy Injector](../agents/agency-agents/design/design-whimsy-injector.md) | Owns taste and consistency, not implementation details |
| `@ui-ux-designer` | Product UX and interface design | user flows, wireframes, high-fidelity screens, design system work | [UI Designer](../agents/agency-agents/design/design-ui-designer.md), [UX Architect](../agents/agency-agents/design/design-ux-architect.md), [UX Researcher](../agents/agency-agents/design/design-ux-researcher.md), [Accessibility Auditor](../agents/agency-agents/testing/testing-accessibility-auditor.md) | Owns design outputs in `shared/assets/` |
| `@graphics-designer` | Graphic and illustration asset production | icons, illustrations, campaign graphics, exported visual assets | [Image Prompt Engineer](../agents/agency-agents/design/design-image-prompt-engineer.md), [Brand Guardian](../agents/agency-agents/design/design-brand-guardian.md), [Inclusive Visuals Specialist](../agents/agency-agents/design/design-inclusive-visuals-specialist.md), [Visual Storyteller](../agents/agency-agents/design/design-visual-storyteller.md) | Produces ready-to-use assets from approved direction |
| `@marketing-expert` | GTM execution and growth motion | messaging, content, launches, SEO, paid acquisition, performance loops | [Content Creator](../agents/agency-agents/marketing/marketing-content-creator.md), [Growth Hacker](../agents/agency-agents/marketing/marketing-growth-hacker.md), [SEO Specialist](../agents/agency-agents/marketing/marketing-seo-specialist.md), [AI Citation Strategist](../agents/agency-agents/marketing/marketing-ai-citation-strategist.md), [PPC Strategist](../agents/agency-agents/paid-media/paid-media-ppc-strategist.md), [Tracking Specialist](../agents/agency-agents/paid-media/paid-media-tracking-specialist.md), [Paid Social Strategist](../agents/agency-agents/paid-media/paid-media-paid-social-strategist.md) | Owns `4-marketing/` strategy and performance loop |
| `@finance-director` | Financial planning and defensible projections | scenario models, runway, burn, pricing sensitivity, fundraising support | [Accounts Payable Agent](../agents/agency-agents/specialized/accounts-payable-agent.md), [Finance Tracker](../agents/agency-agents/support/support-finance-tracker.md), [Executive Summary Generator](../agents/agency-agents/support/support-executive-summary-generator.md), [Proposal Strategist](../agents/agency-agents/sales/sales-proposal-strategist.md) | Central owner for `5-financing/` |
| `@system-architecture` | Technical architecture and domain modeling | tech stack selection, system design, domain specs, API contracts, NFRs | [Software Architect](../agents/agency-agents/engineering/engineering-software-architect.md), [Backend Architect](../agents/agency-agents/engineering/engineering-backend-architect.md), [Database Optimizer](../agents/agency-agents/engineering/engineering-database-optimizer.md), [Security Engineer](../agents/agency-agents/engineering/engineering-security-engineer.md), [SRE](../agents/agency-agents/engineering/engineering-sre.md) | Owns the architecture layer and ADR-worthy decisions |
| `@fullstack-engineer` | End-to-end implementation | frontend, backend, schema work, tests, technical docs, implementation plans | [Frontend Developer](../agents/agency-agents/engineering/engineering-frontend-developer.md), [Backend Architect](../agents/agency-agents/engineering/engineering-backend-architect.md), [Database Optimizer](../agents/agency-agents/engineering/engineering-database-optimizer.md), [AI Engineer](../agents/agency-agents/engineering/engineering-ai-engineer.md), [Data Engineer](../agents/agency-agents/engineering/engineering-data-engineer.md), [Rapid Prototyper](../agents/agency-agents/engineering/engineering-rapid-prototyper.md) | Primary owner once requirements and architecture are ready |
| `@devops` | Runtime, deployment, and reliability operations | CI/CD, IaC, monitoring, backups, incident readiness, cost controls | [DevOps Automator](../agents/agency-agents/engineering/engineering-devops-automator.md), [SRE](../agents/agency-agents/engineering/engineering-sre.md), [Incident Response Commander](../agents/agency-agents/engineering/engineering-incident-response-commander.md), [Git Workflow Master](../agents/agency-agents/engineering/engineering-git-workflow-master.md), [Security Engineer](../agents/agency-agents/engineering/engineering-security-engineer.md) | Owns `3-technical/3.3-devops/` |
| `@code-reviewer` | Quality gate before merge or release | code review, standards enforcement, security/perf review, doc review | [Code Reviewer](../agents/agency-agents/engineering/engineering-code-reviewer.md), [Security Engineer](../agents/agency-agents/engineering/engineering-security-engineer.md), [API Tester](../agents/agency-agents/testing/testing-api-tester.md), [Performance Benchmarker](../agents/agency-agents/testing/testing-performance-benchmarker.md), [Accessibility Auditor](../agents/agency-agents/testing/testing-accessibility-auditor.md) | Primary reviewer for code and implementation docs |
| `@docs-guardian` | Documentation hygiene and structural integrity | link fixes, plan lifecycle, archive decisions, canonical doc enforcement | [Technical Writer](../agents/agency-agents/engineering/engineering-technical-writer.md), [Workflow Architect](../agents/agency-agents/specialized/specialized-workflow-architect.md), [Compliance Auditor](../agents/agency-agents/specialized/compliance-auditor.md), [Legal Compliance Checker](../agents/agency-agents/support/support-legal-compliance-checker.md), [Jira Workflow Steward](../agents/agency-agents/project-management/project-management-jira-workflow-steward.md) | Protects single-source-of-truth discipline |
| `@refactor-agent` | Existing-project adoption into the factory | mapping current structure, override design, workflow adaptation, gradual cleanup | [Workflow Architect](../agents/agency-agents/specialized/specialized-workflow-architect.md), [Project Shepherd](../agents/agency-agents/project-management/project-management-project-shepherd.md), [Jira Workflow Steward](../agents/agency-agents/project-management/project-management-jira-workflow-steward.md), [Git Workflow Master](../agents/agency-agents/engineering/engineering-git-workflow-master.md), [Technical Writer](../agents/agency-agents/engineering/engineering-technical-writer.md) | Used for adopted or legacy projects, not greenfield bootstrap |

## Clear Boundaries

### Domain Specs Updates

**@system-architecture updates when:**
- New system architecture designed
- Architecture patterns change
- System boundaries change
- Design decisions affect domain model

**@docs-guardian updates when:**
- Code implementation adds new entities/services
- Functionality changes affect business logic
- API endpoints modified
- Database schemas change
- Project structure reorganized

**Trigger:** If @docs-guardian detects architecture-level changes, notify @system-architecture to update.

### Documentation

**@fullstack-engineer creates:**
- README.md
- .env.example
- QUICKSTART.md
- DOCKER.md
- API.md (if applicable)

**@code-reviewer reviews:**
- All documentation created by @fullstack-engineer
- Uses same checklist for review

**@docs-guardian maintains:**
- Documentation structure
- Archives outdated docs
- Fixes broken links

### Plans

**Agents create/update:**
- @fullstack-engineer: implementation plans, code tasks, fix plans attached to active work
- @product-strategist: product overview, backlog, PRDs, prioritization updates
- @boost: initial structure setup plans for new projects
- @refactor-agent: adaptation/refactor plans for existing projects

**All agents:**
- Check existing plans first
- Add metadata
- Update index
- Pull specialists only when the core owner still remains accountable for the final output

**@docs-guardian:**
- Archives old plans
- Maintains index
- Detects duplicates

## Handoff Patterns

### Product → Architecture → Implementation

1. @product-strategist → Creates requirements
2. @system-architecture → Creates architecture (domain-specs, API contracts)
3. @fullstack-engineer → Implements code, optionally pulling engineering specialists for narrow domains
4. @code-reviewer → Reviews code
5. @docs-guardian → Updates domain specs (if implementation changes)

### Implementation → Review → Maintenance

1. @fullstack-engineer → Completes implementation, updates progress/changelog
2. @code-reviewer → Reviews code and documentation
3. @docs-guardian → Updates domain specs, maintains documentation, and fixes canonical links

## Conflict Resolution

### If Responsibility Unclear

**Check this matrix first**, then:
1. Check agent's Core Responsibilities section
2. Check agent's Forbidden Actions section
3. If still unclear, ask human

### Common Conflicts

**Domain Specs Update:**
- Architecture change? → @system-architecture
- Implementation change? → @docs-guardian

**Documentation:**
- Creating? → @fullstack-engineer
- Reviewing? → @code-reviewer
- Maintaining? → @docs-guardian

**Plans:**
- Creating/updating? → Agent working on feature/fix
- Archiving? → @docs-guardian

## Related Documents

- **[Agent Definitions](../agents/)** - Full agent definitions
- **[Orchestration Protocol](orchestration-protocol.md)** - Agent coordination
- **[Global Rules](../_core/global-rules.md)** - Repository-wide rules

---

**Use this matrix to clarify responsibilities and avoid overlap confusion.**
