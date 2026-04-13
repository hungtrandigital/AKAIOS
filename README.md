# Project Factory - Structure-First Template Repository

**Version:** Template v1.1

## Overview

This repository is a structure-first startup factory template. It is meant to be aligned and documented before real project execution begins, then reused across future projects with the same operating model.

The template combines three layers:
- **Canonical repository structure** defined in [INDEX.md](INDEX.md)
- **Core factory agents** in [0-agents/agents/](0-agents/agents/) for routing, governance, and domain ownership
- **Specialist playbooks** in [0-agents/agents/agency-agents/README.md](0-agents/agents/agency-agents/README.md) for deep execution across engineering, design, marketing, product, sales, testing, and operations

## Why Use This Template?

This structure helps you:
- **Stabilize the project skeleton first** before shipping product work
- **Keep one source of truth** for documents, plans, and execution outputs
- **Route work through modes** instead of ad hoc prompting
- **Reuse the same operating system** across new projects with minimal drift

## Operating Model

1. **Read [INDEX.md](INDEX.md)** to understand the canonical folder structure.
2. **Read [0-agents/README.md](0-agents/README.md)** to understand the agent stack.
3. **Choose a mode** from [0-agents/mode/README.md](0-agents/mode/README.md).
4. **Let core factory agents own routing and governance**.
5. **Pull in `agency-agents` specialists** when a mode needs deeper domain execution.

## Quick Navigation

### Top-Level Sections

- **[0-agents/](0-agents/)** - Dual-layer agent system: core factory agents, imported specialists, skills, modes, and workflows
- **[1-ideas/](1-ideas/README.md)** - Research, idea capture, and early validation
- **[2-product-foundation/](2-product-foundation/README.md)** - Product overview, backlog, and requirements
- **[3-technical/](3-technical/README.md)** - Architecture, implementation tracking, and DevOps
- **[systems/](systems/README.md)** - Source code for all future software systems
- **[4-marketing/](4-marketing/README.md)** - Canonical GTM strategy, personas, templates, and performance tracking
- **[5-financing/](5-financing/README.md)** - Financial planning, analysis, pitches, and projection tracking
- **[6-operations/](6-operations/README.md)** - Team, HR, legal, vendor, and operating process documentation
- **[7-operations-monitoring/](7-operations-monitoring/README.md)** - Monitoring, analytics, and incident handling
- **[8-governance/](8-governance/README.md)** - Changelog, decision log, risks, reviews, and retrospectives
- **[shared/](shared/README.md)** - Shared context, templates, and assets
- **[archives/](archives/README.md)** - Archived or deprecated material
- **[refactoring/](refactoring/README.md)** - Refactor-mode outputs for adapting the factory to other projects

### Agent Entry Points

- **[INDEX.md](INDEX.md)** - Canonical directory map and quick links
- **[0-agents/README.md](0-agents/README.md)** - Agent system overview
- **[0-agents/mode/README.md](0-agents/mode/README.md)** - Mode selection and routing
- **[0-agents/workflows/primary-workflow.md](0-agents/workflows/primary-workflow.md)** - Default workflow

## Getting Started

1. Read [INDEX.md](INDEX.md) and confirm the repository structure before adding or moving anything.
2. Use [0-agents/mode/README.md](0-agents/mode/README.md) to choose the right mode for the task.
3. Start in [0-agents/README.md](0-agents/README.md) to understand which core agents and specialist agents should lead.
4. Use [refactoring/README.md](refactoring/README.md) when applying this operating model to an existing external project.
5. Keep all new work inside the canonical folders instead of inventing parallel structures.

---

*This is the reusable factory template. Align the structure first, then execute the project inside it.*
