# INDEX — AI-First Startup Factory

**Version:** v3.3  
**Last Updated:** 2026-04-15
**Structure:** Factory Template + Specialist Agent Library

This document is the single source of truth for the repository structure. Always consult this file to understand where files belong.

Use `[project-root]/` below as a placeholder label for the repository root. It is not a literal folder name and should never be created as a directory.

## Directory Structure

```
[project-root]/
├── README.md
├── INDEX.md
├── 0-agents/
│   ├── _core/
│   │   ├── file-placement-guide.md
│   │   ├── global-rules.md
│   │   ├── hpo.md
│   │   └── work-item-traceability.md
│   ├── agents/
│   │   ├── core-agents/              # Core factory agents (13 agents)
│   │   ├── agency-agents/            # Vendored specialist library (150+ playbooks)
│   │   │   ├── README.md
│   │   │   ├── academic/
│   │   │   ├── design/
│   │   │   ├── engineering/
│   │   │   ├── game-development/
│   │   │   ├── integrations/
│   │   │   ├── marketing/
│   │   │   ├── paid-media/
│   │   │   ├── product/
│   │   │   ├── project-management/
│   │   │   ├── sales/
│   │   │   ├── spatial-computing/
│   │   │   ├── specialized/
│   │   │   ├── strategy/
│   │   │   ├── support/
│   │   │   └── testing/
│   │   ├── boost.md
│   │   ├── business-analyst.md
│   │   ├── code-reviewer.md
│   │   ├── creative-director.md
│   │   ├── devops.md
│   │   ├── docs-guardian.md
│   │   ├── finance-director.md
│   │   ├── fullstack-engineer.md
│   │   ├── graphics-designer.md
│   │   ├── market-research.md
│   │   ├── marketing-expert.md
│   │   ├── product-strategist.md
│   │   ├── refactor-agent.md
│   │   ├── system-architecture.md
│   │   ├── ui-ux-designer.md
│   │   └── skills/
│   ├── mode/
│   │   ├── chat.md
│   │   ├── boost.md
│   │   ├── code.md
│   │   ├── execution.md
│   │   ├── ideas.md
│   │   ├── plan.md
│   │   ├── deliver.md
│   │   ├── refactor.md
│   │   ├── review.md
│   │   └── fix.md
│   └── workflows/
│       ├── agent-responsibility-matrix.md
│       ├── creative.md
│       ├── development-rules.md
│       ├── development.md
│       ├── documentation-management.md
│       ├── financing.md
│       ├── marketing.md
│       ├── orchestration-protocol.md
│       ├── plan-management-workflow.md
│       ├── project-config/              # Project-specific agent overrides (created by Refactor Mode)
│       │   └── README.md
│       ├── system-creation-workflow.md
│       └── primary-workflow.md
├── 1-ideas/
│   ├── README.md
│   ├── market-research/
│   │   ├── README.md
│   │   ├── reports/
│   │   ├── plans/
│   │   ├── summaries.md
│   │   └── resources/
│   ├── features/
│   │   ├── README.md
│   │   ├── summaries.md
│   │   └── analysis/
│   ├── marketing/
│   │   ├── README.md
│   │   └── initial-go-to-market-plan.md
│   ├── finance/
│   │   ├── README.md
│   │   └── initial-financing-plan.md
│   ├── technical/
│   │   └── README.md
│   ├── operations/
│   │   └── README.md
│   ├── product/
│   │   └── README.md
│   └── executive-docs/
│       ├── README.md
│       └── executive-summary.md
├── 2-product-foundation/
│   ├── README.md
│   ├── product-overview.md
│   ├── product-backlog/
│   │   └── backlog.md
│   └── requirements/
│       └── README.md
├── 3-technical/
│   ├── README.md
│   ├── 3.1-system-foundation/
│   │   ├── README.md
│   │   ├── infrastructure.md
│   │   ├── architecture/
│   │   │   ├── README.md
│   │   │   ├── domain-specs.md
│   │   │   ├── api-contracts/
│   │   │   └── system-overview.md
│   │   └── design-standards/
│   │       ├── README.md
│   │       ├── coding-standards.md
│   │       └── system-design.md
│   ├── 3.2-implementation/
│   │   ├── README.md
│   │   ├── domain-specs.md
│   │   ├── api-contract.md
│   │   ├── status/
│   │   │   ├── README.md
│   │   │   ├── progress.md
│   │   │   └── work-items-registry.md
│   │   ├── history/
│   │   │   ├── README.md
│   │   │   ├── history.log.md
│   │   │   └── epics/
│   │   │       └── README.md
│   │   └── plans/
│   │       ├── README.md
│   │       ├── plan.md
│   │       ├── plan-overview.md
│   │       ├── active/
│   │       │   └── README.md
│   │       ├── completed/
│   │       │   └── README.md
│   │       ├── archived/
│   │       │   └── README.md
│   │       └── epics/
│   │           └── README.md
│   └── 3.3-devops/
│       ├── README.md
│       ├── server-steps.md
│       ├── windows-docker-deployment.md
│       ├── windows-docker.ps1
│       └── local-config/
│           └── README.md
├── systems/                    # Source code for all software systems
│   ├── README.md
│   ├── shared/                 # Shared code across systems
│   │   ├── README.md
│   │   ├── libraries/
│   │   ├── packages/
│   │   └── services/
│   └── TEMPLATE-SYSTEM/        # Template for new systems
│       └── README.md
├── 4-marketing/
│   ├── README.md
│   ├── go-to-market.md
│   ├── history/
│   ├── personas.md
│   ├── performance/
│   └── templates/
├── 5-financing/
│   ├── README.md
│   ├── plans.md
│   ├── analysis/
│   │   └── README.md
│   ├── history/
│   ├── preparation/
│   │   └── README.md
│   ├── pitches/
│   │   └── README.md
│   ├── projections/
│   │   └── README.md
│   ├── reviews/
│   │   └── README.md
│   ├── templates/
│   └── tracking/
├── 6-operations/
│   ├── README.md
│   ├── history/
│   ├── strategy.md
│   ├── team/
│   │   ├── README.md
│   │   └── team-structure.md
│   ├── processes/
│   │   └── README.md
│   ├── legal/
│   │   └── README.md
│   ├── hr/
│   │   └── README.md
│   ├── templates/
│   ├── tracking/
│   └── vendor-contracts/
│       └── README.md
├── 7-operations-monitoring/
│   ├── README.md
│   ├── system-monitoring/
│   │   └── README.md
│   ├── marketing-analytics.md
│   └── incident-response.md
├── 8-governance/
│   ├── README.md
│   ├── project-versions.md
│   ├── changelog.md
│   ├── decision-log.md
│   ├── risk-register.md
│   ├── audits/
│   │   ├── README.md
│   │   ├── file-placement/
│   │   ├── documentation/
│   │   └── placement/
│   ├── assessments/
│   ├── reviews/
│   └── quarterly-retrospective/
│       └── README.md
├── shared/
│   ├── README.md
│   ├── context/
│   │   ├── README.md
│   │   └── current-scope.md
│   ├── templates/
│   │   ├── README.md
│   │   ├── refactoring-plan-template.md
│   │   ├── report-template.md
│   │   └── specs-template.md
│   └── assets/
│       └── README.md
├── archives/
│   └── README.md
├── IDE-SETUP/
│   ├── README.md
│   ├── cursor/
│   │   ├── README.md
│   │   ├── .cursor/
│   │   ├── .cursorrules
│   │   └── settings.json
│   └── vscode/
│       └── .vscode/
└── refactoring/
    └── README.md
```

## Quick Links

### Critical Files (Read First)
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Quick start guide for using this factory
- **[IDE-SETUP/cursor/.cursorrules](IDE-SETUP/cursor/.cursorrules)** - Cursor rules for this project
- **[0-agents/_core/global-rules.md](0-agents/_core/global-rules.md)** - Non-negotiable repository rules
- **[0-agents/_core/file-placement-guide.md](0-agents/_core/file-placement-guide.md)** - Where files belong
- **[0-agents/_core/work-item-traceability.md](0-agents/_core/work-item-traceability.md)** - Work item ID schema and metadata

### AI Agents & Workflows
- **[0-agents/](0-agents/)** - Core factory agents, specialist library, skills, modes, and workflows
- **[Mode Overview](0-agents/mode/README.md)** - Mode selection and routing rules
- **[Modes](0-agents/mode/)** - All available modes (chat, ideas, plan, execution, code, review, fix, boost, deliver, refactor)
- **[Core Agents](0-agents/agents/core-agents/)** - Core factory agent definitions
- **[Specialist Library](0-agents/agents/agency-agents/README.md)** - Imported domain specialist playbooks
- **[Active Agent Leadership Plan](3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md)** - Current initiative to standardize core agents as reusable leader agents
- **[Workflows](0-agents/workflows/)** - Agent coordination workflows
- **[Agent Responsibility Matrix](0-agents/workflows/agent-responsibility-matrix.md)** - Core-agent ownership and specialist pull-in routing
- **[Primary Workflow](0-agents/workflows/primary-workflow.md)** - Default execution workflow
- **[Orchestration Protocol](0-agents/workflows/orchestration-protocol.md)** - Agent handoff protocol
- **[Marketing Workflow](0-agents/workflows/marketing.md)** - Marketing discovery, GTM, execution, and measurement workflow

### Ideas & Research
- **[1-ideas/](1-ideas/)** - Early-stage ideas and research
  - **[Market Research](1-ideas/market-research/)** - For new product validation
  - **[Finance Ideas](1-ideas/finance/)** - Early financing strategies
  - **[Marketing Ideas](1-ideas/marketing/)** - Early go-to-market strategies
  - **[Technical Ideas](1-ideas/technical/)** - Early technical concepts
  - **[Features](1-ideas/features/)** - Ideas for existing products

### Product
- **[Product Foundation](2-product-foundation/)** - Product definition and backlog
- **[Product Overview](2-product-foundation/product-overview.md)**
- **[Product Backlog](2-product-foundation/product-backlog/backlog.md)** - Epic definitions and backlog
- **[Product Requirements](2-product-foundation/requirements/README.md)** - Canonical requirements index and folder pattern

### Technical
- **[Technical Overview](3-technical/)** - All technical documentation
- **[System Foundation](3-technical/3.1-system-foundation/)** - Architecture, design, standards
- **[Implementation](3-technical/3.2-implementation/)** - Implementation plans and tracking
- **[Work Items Registry](3-technical/3.2-implementation/status/work-items-registry.md)** - Master index of all work
- **[DevOps](3-technical/3.3-devops/)** - Infrastructure and deployment
- **[Windows Docker UAT](3-technical/3.3-devops/windows-docker-deployment.md)** - Exact-SHA PowerShell deployment and seed-only rebuild guide
- **[Systems (Code)](systems/)** - All source code for software systems

### Marketing & Finance & Operations
- **[Marketing](4-marketing/)** - Go-to-market strategy, personas, performance, and campaign briefs
- **[Financing](5-financing/)** - Financial planning, projections, pitches
- **[Operations](6-operations/)** - Team structure, legal, HR, vendors
- **[Operations & Monitoring](7-operations-monitoring/)** - System monitoring and analytics

### Governance
- **[Governance](8-governance/)** - Project versions, decisions, risks, retrospectives
- **[Code Reviews](8-governance/reviews/README.md)** - Canonical quality-gate reports and verdicts
- **[Changelog](8-governance/changelog.md)** - All project changes
- **[Decision Log](8-governance/decision-log.md)** - Architectural decisions (ADR format)
- **[Risk Register](8-governance/risk-register.md)** - Project risks
- **[Quarterly Retrospectives](8-governance/quarterly-retrospective/)** - Periodic reviews

### Shared Resources
- **[Shared Templates](shared/templates/)** - Reusable document templates
- **[Archives](archives/)** - Historical documents
- **[IDE Setup](IDE-SETUP/)** - Cursor/VSCode configuration

---

*Regenerate this file periodically using: `tree -a > INDEX.md`*
