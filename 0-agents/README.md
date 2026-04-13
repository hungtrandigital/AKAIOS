# 0. AI Agents & Workflows

## Purpose

This section is the operating system of the repository. It defines how work is routed, which agent layer owns which decision, and how specialized execution should be pulled into the canonical factory structure.

## The Agent Stack

### 1. Core Factory Agents

The markdown agents in [agents/](agents/) are the **governance, routing, and leader layer**. They own:
- task validation
- file placement and documentation discipline
- product, architecture, implementation, review, and refactor workflow ownership
- specialist selection, skill activation, and final synthesis back into canonical files

These are the agents that keep work aligned with `INDEX.md`, mode rules, and governance requirements.
Each core agent definition now includes a **Specialist Routing** section for task-type mapping and a **Leader Orchestration** section that explains how the core agent keeps ownership while pulling in `agency-agents` specialists plus local skills.

### 2. Specialist Library

[agents/agency-agents/README.md](agents/agency-agents/README.md) is the **vendored specialist library**. It is now plain repository content and no longer carries nested Git metadata or upstream GitHub automation files inside this repo. It contains 150+ domain playbooks grouped into divisions such as:
- `academic/`
- `design/`
- `engineering/`
- `marketing/`
- `paid-media/`
- `product/`
- `project-management/`
- `sales/`
- `specialized/`
- `support/`
- `testing/`

Use this library to deepen execution inside a mode, not to replace factory governance.

### 3. Skills

[agents/skills/](agents/skills/) contains reusable methods such as planning, debugging, research, frontend development, databases, and sequential thinking. Skills are the repeatable techniques; agents are the role owners who decide when and how those techniques are applied.

## Navigation

### Core Configuration

- **[_core/](_core/)** - Global rules, placement logic, traceability, and optimization settings
  - [file-placement-guide.md](_core/file-placement-guide.md)
  - [global-rules.md](_core/global-rules.md)
  - [hpo.md](_core/hpo.md)
  - [work-item-traceability.md](_core/work-item-traceability.md)

### Core Agents

- **[agents/core-agents/](agents/core-agents/)** - Canonical factory agent definitions (factory owners)
  - [core-agents/boost.md](agents/core-agents/boost.md)
  - [core-agents/business-analyst.md](agents/core-agents/business-analyst.md)
  - [core-agents/code-reviewer.md](agents/core-agents/code-reviewer.md)
  - [core-agents/creative-director.md](agents/core-agents/creative-director.md)
  - [core-agents/devops.md](agents/core-agents/devops.md)
  - [core-agents/docs-guardian.md](agents/core-agents/docs-guardian.md)
  - [core-agents/finance-director.md](agents/core-agents/finance-director.md)
  - [core-agents/fullstack-engineer.md](agents/core-agents/fullstack-engineer.md)
  - [core-agents/graphics-designer.md](agents/core-agents/graphics-designer.md)
  - [core-agents/market-research.md](agents/core-agents/market-research.md)
  - [core-agents/marketing-expert.md](agents/core-agents/marketing-expert.md)
  - [core-agents/product-strategist.md](agents/core-agents/product-strategist.md)
  - [core-agents/refactor-agent.md](agents/core-agents/refactor-agent.md)
  - [core-agents/system-architecture.md](agents/core-agents/system-architecture.md)
  - [core-agents/ui-ux-designer.md](agents/core-agents/ui-ux-designer.md)

### Specialist Library

- **[agents/agency-agents/](agents/agency-agents/)** - Imported specialist agent playbooks for deep domain execution

### Skills

- **[agents/skills/](agents/skills/)** - Local skill library used by the factory agents

### Modes

- **[mode/](mode/)** - Operating modes that decide what work is allowed and where outputs belong
  - [README.md](mode/README.md)
  - [chat.md](mode/chat.md)
  - [boost.md](mode/boost.md)
  - [ideas.md](mode/ideas.md)
  - [plan.md](mode/plan.md)
  - [execution.md](mode/execution.md)
  - [code.md](mode/code.md)
  - [review.md](mode/review.md)
  - [fix.md](mode/fix.md)
  - [deliver.md](mode/deliver.md)
  - [refactor.md](mode/refactor.md)

### Workflows

- **[workflows/](workflows/)** - Cross-agent coordination and operating rules
  - [agent-responsibility-matrix.md](workflows/agent-responsibility-matrix.md)
  - [primary-workflow.md](workflows/primary-workflow.md)
  - [orchestration-protocol.md](workflows/orchestration-protocol.md)
  - [development.md](workflows/development.md)
  - [development-rules.md](workflows/development-rules.md)
  - [creative.md](workflows/creative.md)
  - [marketing.md](workflows/marketing.md)
  - [financing.md](workflows/financing.md)
  - [documentation-management.md](workflows/documentation-management.md)
  - [plan-management-workflow.md](workflows/plan-management-workflow.md)
  - [system-creation-workflow.md](workflows/system-creation-workflow.md)
  - [project-config/](workflows/project-config/) - Project-specific overrides for adopted projects

## Operating Rules

1. Start with a **mode**, not a random agent.
2. Let a **core factory agent** own routing, placement, governance, and final synthesis.
3. Pull in **`agency-agents` specialists** for deeper execution inside that mode.
4. Pair **skills** with specialist pull-ins whenever a task matches them.
5. Specialists never override `INDEX.md`, file placement, traceability, or docs-guardian rules.

## Related Sections

- **[1-ideas/](../1-ideas/README.md)** - Research and idea capture
- **[2-product-foundation/](../2-product-foundation/README.md)** - Product strategy and backlog
- **[3-technical/](../3-technical/README.md)** - Architecture, implementation tracking, and DevOps
- **[4-marketing/](../4-marketing/README.md)** - Marketing strategy and performance
- **[5-financing/](../5-financing/README.md)** - Financial planning and projections
- **[refactoring/](../refactoring/README.md)** - Refactor-mode outputs for applying this factory elsewhere

---

*Use the factory agents to keep the repo disciplined. Use `agency-agents` to go deeper without fragmenting the structure.*
