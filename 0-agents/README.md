# 0. AI Agents & Workflows

## Purpose

This section is the operating system of the repository. It defines how work is routed, which agent layer owns which decision, and how specialized execution should be pulled into the canonical factory structure.

## The Agent Stack

### 1. Core Factory Agents

The markdown agents in [agents/](agents/) are the **governance and routing layer**. They own:
- task validation
- file placement and documentation discipline
- product, architecture, implementation, review, and refactor workflow ownership

These are the agents that keep work aligned with `INDEX.md`, mode rules, and governance requirements.
Each core agent definition now includes a **Specialist Routing** section that points to the relevant `agency-agents` specialists for common task types.

### 2. Specialist Library

[agents/agency-agents/README.md](agents/agency-agents/README.md) is the **vendored specialist library**. It is now plain repository content and no longer a nested Git repo. It contains 150+ domain playbooks grouped into divisions such as:
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

[agents/skills/](agents/skills/) contains reusable methods such as planning, debugging, research, frontend development, databases, and sequential thinking. Skills are the repeatable techniques; agents are the role owners.

## Navigation

### Core Configuration

- **[_core/](_core/)** - Global rules, placement logic, traceability, and optimization settings
  - [file-placement-guide.md](_core/file-placement-guide.md)
  - [global-rules.md](_core/global-rules.md)
  - [hpo.md](_core/hpo.md)
  - [work-item-traceability.md](_core/work-item-traceability.md)

### Core Agents

- **[agents/](agents/)** - Canonical factory agent definitions
  - [boost.md](agents/boost.md)
  - [business-analyst.md](agents/business-analyst.md)
  - [code-reviewer.md](agents/code-reviewer.md)
  - [creative-director.md](agents/creative-director.md)
  - [devops.md](agents/devops.md)
  - [docs-guardian.md](agents/docs-guardian.md)
  - [finance-director.md](agents/finance-director.md)
  - [fullstack-engineer.md](agents/fullstack-engineer.md)
  - [graphics-designer.md](agents/graphics-designer.md)
  - [market-research.md](agents/market-research.md)
  - [marketing-expert.md](agents/marketing-expert.md)
  - [product-strategist.md](agents/product-strategist.md)
  - [refactor-agent.md](agents/refactor-agent.md)
  - [system-architecture.md](agents/system-architecture.md)
  - [ui-ux-designer.md](agents/ui-ux-designer.md)

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
2. Let a **core factory agent** own routing, placement, and governance.
3. Pull in **`agency-agents` specialists** for deeper execution inside that mode.
4. Activate **skills** whenever a task matches them.
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
