# Factory Usage Guide — AI-First Startup Factory

**Version:** v1.0

This guide explains how to use this factory repository for your projects.

---

## Quick Start

### 1. Pick Your Mode

When you start working, **first pick the right mode**:

| What you want to do | → | Use Mode |
|-------------------|---|---------|
| Ask questions, clarify scope | → | `/chat` |
| Research, validate ideas | → | `/ideas` |
| Create specs, roadmaps | → | `/plan` |
| Write code, build features | → | `/code` |
| Create designs, content | → | `/execution` |
| Bug fixes | → | `/fix` |
| Review code, QA | → | `/review` |
| Full autonomous delivery | → | `/deliver` |
| New project setup | → | `/boost` |

### 2. Follow the Workflow

Each mode has a defined workflow. Read the mode file first.

### 3. Use Agents

- **Core Agents** (`core-agents/`) → Own the work
- **Agency Agents** (`agency-agents/`) → Deep specialized execution

---

## Understanding the Factory

### Three Layers

```
┌─────────────────────────────────────┐
│         MODE LAYER                   │  ← What work is allowed
│   (chat, ideas, plan, code...)      │
├─────────────────────────────────────┤
│       CORE AGENTS LAYER              │  ← Who owns the work
│   (fullstack-engineer, product...)   │
├─────────────────────────────────────┤
│      AGENCY AGENTS LAYER             │  ← Who does deep work
│   (150+ specialized playbooks)       │
├─────────────────────────────────────┤
│         SKILLS LAYER                 │  ← How to do the work
│   (planning, debugging, research...)  │
└─────────────────────────────────────┘
```

---

## Mode Reference

### Chat Mode (`/chat`)
- **Purpose:** Q&A, scope clarification
- **Output:** `shared/context/current-scope.md` (only file allowed)
- **Rule:** DO NOT create files until scope is finalized

### Ideas Mode (`/ideas`)
- **Purpose:** Research, validation
- **Output:** `1-ideas/*/`
- **Rule:** Update existing files before creating new

### Plan Mode (`/plan`)
- **Purpose:** Specs, roadmaps, architecture
- **Output:** `2-product-foundation/`, `3-technical/3.1-system-foundation/`
- **Rule:** ALL technical docs must exist before Code Mode

### Execution Mode (`/execution`)
- **Purpose:** Designs, creative deliverables
- **Output:** `shared/assets/`, `4-marketing/`
- **Rule:** Must have approved plans from Plan Mode first

### Code Mode (`/code`)
- **Purpose:** Implementation, tests, infrastructure
- **Output:** `systems/[system-name]/`
- **Rule:** Must have specs from Plan Mode first

### Review Mode (`/review`)
- **Purpose:** QA, code review
- **Output:** `8-governance/reviews/`
- **Rule:** Must review ALL deliverables

### Fix Mode (`/fix`)
- **Purpose:** Bug fixes, debugging
- **Output:** Fixed code in `systems/`
- **Rule:** Always classify as Fast Fix or Hard Fix first

### Deliver Mode (`/deliver`)
- **Purpose:** Autonomous full delivery
- **Output:** Varies by task
- **Rule:** Requires plan/guide first

### Boost Mode (`/boost`)
- **Purpose:** Project setup/initialization
- **Output:** Full directory structure
- **Rule:** One-time use only

---

## Agent Reference

### Core Agents (Owners)

| Agent | Specialty | Output |
|-------|-----------|--------|
| `@fullstack-engineer` | Code implementation | `systems/[system-name]/` |
| `@code-reviewer` | Code quality | `8-governance/reviews/` |
| `@system-architecture` | Technical architecture | `3-technical/3.1-system-foundation/` |
| `@product-strategist` | Product requirements | `2-product-foundation/` |
| `@business-analyst` | Business cases | `1-ideas/` |
| `@marketing-expert` | Marketing strategy | `4-marketing/` |
| `@creative-director` | Brand/creative | `shared/assets/` |
| `@ui-ux-designer` | UI/UX design | `shared/assets/` |
| `@graphics-designer` | Graphics | `shared/assets/` |
| `@devops` | Infrastructure | `3-technical/3.3-devops/` |
| `@docs-guardian` | Documentation | All docs |
| `@market-research` | Research | `1-ideas/market-research/` |
| `@finance-director` | Financial planning | `5-financing/` |

### Agency Agents (Specialists)

Pull from these when core agents need deeper expertise:

- **Engineering:** Frontend, Backend, Database, AI, DevOps
- **Design:** UI, UX, Graphics, Accessibility
- **Marketing:** SEO, Content, Social, Paid Media
- **Product:** PM, Research, Prioritization
- **Testing:** API, Performance, Security

---

## File Structure

```
PROJECT/
├── 0-agents/                 # Factory operating system
│   ├── _core/               # Global rules
│   ├── agents/
│   │   ├── core-agents/     # 13 core agents
│   │   ├── agency-agents/    # 150+ specialists
│   │   └── skills/          # Methods
│   ├── mode/                # 10 modes
│   └── workflows/           # Coordination
├── 1-ideas/                 # Research, ideas
├── 2-product-foundation/     # Requirements, specs
├── 3-technical/             # Architecture, implementation
│   ├── 3.1-system-foundation/
│   ├── 3.2-implementation/
│   └── 3.3-devops/
├── 4-marketing/             # Marketing assets
├── 5-financing/             # Financial plans
├── 6-operations/            # Team, legal
├── 7-operations-monitoring/ # Analytics, monitoring
├── 8-governance/            # Reviews, decisions, risks
├── shared/                  # Reusable assets
└── systems/                 # Project code
```

---

## Common Workflows

### New Feature Workflow

```
1. /chat        → Clarify scope
2. /ideas       → Research and validate
3. /plan        → Create specs and architecture
4. /execution   → Create designs (if needed)
5. /code        → Implement
6. /review      → Review code
7. /deliver     → Deploy
```

### Bug Fix Workflow

```
1. /fix         → Investigate and fix
2. /review      → Verify fix
3. /deliver     → Deploy
```

---

## Key Rules

1. **Pick mode first** — Don't skip this step
2. **No code without specs** — Plan Mode must complete first
3. **No designs without plans** — Execution needs Plan Mode output
4. **Update changelog** — Always after changes
5. **Use orchestration handoff** — At end of every session

---

## Commands Reference

| Command | Action |
|---------|--------|
| `/chat` | Activate Chat Mode |
| `/ideas` | Activate Ideas Mode |
| `/plan` | Activate Plan Mode |
| `/execution` | Activate Execution Mode |
| `/code` | Activate Code Mode |
| `/review` | Activate Review Mode |
| `/fix` | Activate Fix Mode |
| `/deliver` | Activate Deliver Mode |
| `/boost` | Activate Boost Mode |

---

## Getting Help

- **Mode questions:** Read `0-agents/mode/README.md`
- **Agent questions:** Read `0-agents/agents/core-agents/[agent].md`
- **Structure questions:** Read `INDEX.md`
- **Workflow questions:** Read `0-agents/workflows/primary-workflow.md`

---

**Remember:** 
- Mode first, then agents
- Follow the workflow
- Use handoff format
