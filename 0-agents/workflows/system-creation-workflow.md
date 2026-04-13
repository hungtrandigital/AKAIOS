# System Creation Workflow

## Overview

This document defines the workflow for creating new systems in the `systems/` directory, including who decides system names and when directories are created.

## Decision Authority

### System Name Decision

**Primary Decision Maker:** **Human** (Product Owner/Stakeholder)

**Agent Support:**
- **@product-strategist** - Recommends system names based on product requirements
- **@system-architecture** - Validates technical naming conventions and system boundaries

### When System Name is Decided

1. **During Product Planning Phase** (Plan Mode)
   - When product requirements indicate need for new system
   - When product strategist identifies system boundaries
   - Documented in `2-product-foundation/requirements/[feature-name]/README.md`

2. **During Architecture Phase** (Plan Mode)
   - When system architect designs system boundaries
   - Documented in `3-technical/3.1-system-foundation/architecture/system-overview.md`

3. **Explicitly by Human**
   - Human can specify system name in `shared/context/current-scope.md`
   - Human can specify during chat conversation

## Workflow: Creating a New System

### Step 1: Identify Need for New System

**Triggered by:**
- Product requirements indicate new system needed
- Architecture design identifies new system boundary
- Human explicitly requests new system

**Agent:** @product-strategist or @system-architecture

**Action:**
- Identify that a new system is needed
- Propose system name (if not specified by human)
- Document in requirements or architecture docs

### Step 2: System Name Decision

**Decision Process:**

#### Option A: Human Specifies Name
- Human provides system name in:
  - `shared/context/current-scope.md` (System Name field)
  - Chat conversation
  - Product requirements

**Action:** Use human-specified name

#### Option B: Agent Recommends Name
- @product-strategist or @system-architecture proposes name
- **MUST ask human for approval** before creating directory

**Naming Guidelines:**
- Use kebab-case: `web-app`, `mobile-app`, `admin-dashboard`
- Be descriptive: `api-gateway`, `auth-service`, `notification-service`
- Avoid generic names: `app`, `system`, `backend` (too vague)

**Action:** 
```markdown
@human — SYSTEM NAME PROPOSAL

**Proposed System Name:** `web-app`
**Reasoning:** [Why this name]
**Alternative Options:** `customer-portal`, `main-app`

Please confirm or provide alternative name.
```

### Step 3: Create System Directory

**Who Creates:** 
- **@system-architecture** (during architecture phase) OR
- **@fullstack-engineer** (when starting implementation) OR
- **@boost** (during project initialization)

**When to Create:**
- After system name is confirmed by human
- Before writing code for the system
- During architecture phase (recommended) or implementation phase

**Action:**
1. Create directory: `systems/[system-name]/`
2. Copy template from `systems/TEMPLATE-SYSTEM/`
3. Create initial structure:
   ```
   systems/[system-name]/
   ├── README.md
   ├── docs/
   │   ├── architecture.md
   │   └── api-contracts.md
   ├── frontend/ (if applicable)
   ├── backend/ (if applicable)
   ├── tests/
   └── db/ (if applicable)
   ```

### Step 4: Update Documentation

**Agent:** @system-architecture or @docs-guardian

**Action:**
1. Update `systems/README.md` - Add system to Systems List
2. Update `3-technical/3.1-system-foundation/architecture/system-overview.md` - Add system to Systems List
3. Create system-specific architecture docs in `systems/[system-name]/docs/`

## Examples

### Example 1: Human Specifies Name

**Scenario:** Human says "I need a web application called 'customer-portal'"

**Workflow:**
1. Human specifies: `customer-portal` in chat or `current-scope.md`
2. @system-architecture creates `systems/customer-portal/` directory
3. @system-architecture updates system overview docs
4. @fullstack-engineer implements in `systems/customer-portal/`

### Example 2: Agent Recommends Name

**Scenario:** Product requirements indicate need for mobile app, but no name specified

**Workflow:**
1. @product-strategist analyzes requirements
2. @product-strategist proposes: `mobile-app` or `ios-app` + `android-app`
3. @product-strategist asks human: "Should this be `mobile-app` (shared code) or separate `ios-app` and `android-app`?"
4. Human confirms: `mobile-app`
5. @system-architecture creates `systems/mobile-app/` directory
6. Continue with implementation

### Example 3: Architecture Phase

**Scenario:** System architect identifies need for API gateway

**Workflow:**
1. @system-architecture designs architecture
2. Identifies need for API gateway system
3. @system-architecture proposes name: `api-gateway`
4. @system-architecture asks human for confirmation
5. After confirmation, @system-architecture creates `systems/api-gateway/`
6. @system-architecture documents in `system-overview.md`

## Naming Conventions

### System Names Must:
- ✅ Use **kebab-case**: `web-app`, `mobile-app`, `admin-dashboard`
- ✅ Be **descriptive**: `auth-service`, `notification-service`, `payment-gateway`
- ✅ Be **unique**: No duplicate names in `systems/`
- ✅ Follow **domain language**: Use business/domain terms when appropriate

### System Names Should NOT:
- ❌ Use generic names: `app`, `system`, `backend`, `frontend`
- ❌ Use camelCase: `webApp` (use `web-app`)
- ❌ Use PascalCase: `WebApp` (use `web-app`)
- ❌ Use spaces: `web app` (use `web-app`)
- ❌ Use underscores: `web_app` (use `web-app`)

## Responsibilities Matrix

| Action | Primary Agent | When | Requires Human Approval |
|--------|--------------|------|------------------------|
| **Propose system name** | @product-strategist or @system-architecture | During planning/architecture | ✅ Yes |
| **Confirm system name** | Human | Always | N/A |
| **Create system directory** | @system-architecture or @fullstack-engineer | After name confirmed | ❌ No (after approval) |
| **Update system docs** | @system-architecture or @docs-guardian | After directory created | ❌ No |
| **Initialize system structure** | @system-architecture or @fullstack-engineer | After directory created | ❌ No |

## Escalation

**When to Escalate to Human:**
- System name is unclear or ambiguous
- Multiple systems might be needed vs. one system
- Naming conflicts with existing systems
- System boundaries are unclear

**Escalation Format:**
```markdown
@human — SYSTEM CREATION DECISION REQUIRED

**Context:** [Why system is needed]
**Proposed Name:** `[name]`
**Alternative Options:** 
- `[option-1]` - [reasoning]
- `[option-2]` - [reasoning]

**Question:** [Specific question for human]

Please provide:
1. Confirmed system name
2. Any constraints or preferences
```

## Integration with Existing Workflows

### Product Strategist Workflow
- When writing requirements, identify if new system is needed
- Propose system name in requirements document
- Ask human for confirmation before proceeding

### System Architect Workflow
- When designing architecture, identify system boundaries
- Propose system names for each system
- Create system directories after human confirmation
- Document in `system-overview.md`

### Fullstack Engineer Workflow
- When starting implementation, check if system directory exists
- If not exists, ask @system-architecture to create it
- Implement code in `systems/[system-name]/`

## Checklist: Creating a New System

- [ ] System need identified (by product strategist or system architect)
- [ ] System name proposed (by agent) or specified (by human)
- [ ] Human confirms system name
- [ ] System directory created: `systems/[system-name]/`
- [ ] Template structure copied from `TEMPLATE-SYSTEM/`
- [ ] `systems/README.md` updated with new system
- [ ] `system-overview.md` updated with new system
- [ ] System-specific docs created in `systems/[system-name]/docs/`
- [ ] Ready for implementation

## Related Documents

- **[Product Strategist Agent](../agents/product-strategist.md)** - Product requirements and system identification
- **[System Architecture Agent](../agents/system-architecture.md)** - Architecture design and system boundaries
- **[Fullstack Engineer Agent](../agents/fullstack-engineer.md)** - Implementation in systems
- **[Systems README](../../systems/README.md)** - Systems directory structure
- **[System Overview](../../3-technical/3.1-system-foundation/architecture/system-overview.md)** - Multi-system architecture

---

**Remember:** System name is a business/product decision. Always get human confirmation before creating system directories.
