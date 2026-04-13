# Agent Modes — AI-First Startup Factory

**Version:** v3.2

## Overview

Modes define three things:
- what kind of work is allowed
- where outputs must land in the repository
- which agent layer should lead the task

Modes are the routing layer. They decide when to use the core factory agents, when to pull in `agency-agents` specialists, and when to stop work that does not fit the current phase.

## Agent Sourcing Model

### Core Factory Agents

Use the agents in [../agents/](../agents/) as the **owners of routing, governance, placement, and canonical documentation**.

### Specialist Library

Use [../agents/agency-agents/](../agents/agency-agents/) as the **deep execution library** when a task needs more domain depth than the core roster alone provides.

### Skills

Use [../agents/skills/](../agents/skills/) as the **method layer** for planning, debugging, research, design, and implementation.

### Non-Negotiable Rule

Specialists can deepen the work. They do **not** override:
- `INDEX.md`
- file placement rules
- task validation gates
- docs-guardian governance
- mode boundaries

## Mode Matrix

| Mode | Purpose | Canonical Outputs | Core Owners | Common Specialist Pairings |
|------|---------|-------------------|-------------|-----------------------------|
| **[Chat](chat.md)** | Clarify scope, explain the system, route work | Conversation only, plus `shared/context/current-scope.md` when scope is finalized | `@product-strategist`, `@docs-guardian` | `product/`, `strategy/`, `engineering/`, `marketing/` |
| **[Ideas](ideas.md)** | Research, validation, early business and feature exploration | `1-ideas/`, `8-governance/risk-register.md` | `@market-research`, `@business-analyst`, `@product-strategist` | `product/`, `marketing/`, `paid-media/`, `academic/`, `support/` |
| **[Plan](plan.md)** | Requirements, architecture, implementation planning, GTM and finance planning | `2-product-foundation/`, `3-technical/3.1-system-foundation/`, `4-marketing/go-to-market.md`, `5-financing/plans.md` | `@product-strategist`, `@system-architecture`, `@marketing-expert`, `@business-analyst`, `@creative-director` | `engineering/`, `product/`, `project-management/`, `marketing/`, `paid-media/` |
| **[Execution](execution.md)** | Creative and strategic deliverables | `shared/assets/`, `4-marketing/`, `5-financing/pitches/` | `@ui-ux-designer`, `@graphics-designer`, `@marketing-expert`, `@creative-director` | `design/`, `marketing/`, `paid-media/`, `sales/` |
| **[Code](code.md)** | Technical implementation, tests, infra, technical docs | `systems/[system-name]/`, `3-technical/3.3-devops/`, technical docs | `@fullstack-engineer`, `@devops`, `@system-architecture` | `engineering/`, `testing/`, `specialized/`, `spatial-computing/` |
| **[Review](review.md)** | QA, compliance, design/code/doc reviews | `8-governance/reviews/`, `8-governance/assessments/`, `8-governance/audits/`, `8-governance/risk-register.md` | `@code-reviewer`, `@docs-guardian`, `@creative-director` | `engineering/`, `testing/`, `design/`, `specialized/` |
| **[Fix](fix.md)** | Bug fixing, incident repair, debugging | `systems/[system-name]/`, tests, `8-governance/changelog.md` | `@fullstack-engineer`, `@devops`, `@docs-guardian` | `engineering/`, `testing/`, `support/` |
| **[Boost](boost.md)** | Structure setup for a clean/new repository | `INDEX.md`, section READMEs, scaffold structure | `@boost`, `@docs-guardian` | `project-management/`, `engineering/`, `specialized/` |
| **[Deliver](deliver.md)** | End-to-end autonomous delivery | Varies by task; must still use canonical folders | Core owner varies by task | Any division needed for completion |
| **[Refactor](refactor.md)** | Adapt the factory to an existing external project | `refactoring/`, updated configs, updated docs | `@refactor-agent`, `@docs-guardian`, `@product-strategist` | `project-management/`, `engineering/`, `specialized/` |

## Transition Rules

- **Chat → Ideas** when scope is clear and research is needed.
- **Chat → Plan** when the user wants canonical specs, strategies, or structure changes.
- **Chat → Boost** when initializing or cleaning a template-style repo.
- **Chat → Refactor** when adapting the factory to another existing project.
- **Ideas → Plan** when the idea is validated enough to become canonical work.
- **Plan → Execution** when creative or content deliverables are needed.
- **Plan → Code** when technical docs are complete and implementation can start.
- **Execution → Review** when assets need approval.
- **Execution → Code** when design outputs are ready for implementation.
- **Code → Review** when implementation is ready for QA.
- **Review → Fix** when defects or gaps are found.
- **Any → Fix** when a concrete issue interrupts the current flow.
- **Chat → Deliver** when the user wants full autonomous delivery across modes.

## General Rules

- When in any mode, use the standardized Orchestration Handoff Format from that mode's file.
- A mode controls both **scope** and **placement**.
- Core agents own canonical repo updates.
- Specialists from `agency-agents` are selected inside the mode, not instead of the mode.
- Chat is the default mode when no structured work is requested.

## Mode Declaration

When in any mode, the orchestration handoff should align with the standardized format in each mode file.

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Files created/modified**:
- `[path1]`
- `[path2]`

**Next recommended agent**: @agent-name  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List]
```

## Related Documents

- **[Global Rules](../_core/global-rules.md)** - Repository-wide rules and validation gates
- **[Primary Workflow](../workflows/primary-workflow.md)** - Default execution workflow
- **[Orchestration Protocol](../workflows/orchestration-protocol.md)** - Agent coordination rules
- **[0-agents Overview](../README.md)** - Agent stack and navigation

---

**Remember:** modes decide the lane, core agents keep the structure clean, and `agency-agents` specialists increase depth inside that lane.
