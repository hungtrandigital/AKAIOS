# Refactor Mode

**Version:** v3.1

## Purpose

**Refactor Mode** is a special mode designed for teams that already have source code and want to adopt the Factory's standardized processes and structure **without major refactoring**. This mode analyzes the current project structure, maps it to Factory standards, and adapts agents and workflows to work with the existing structure while gradually improving organization.

## Agent Routing

Refactor Mode is led by the structure-governance layer and may use specialists for more opinionated restructuring guidance.

- **Core owners:** `@refactor-agent`, `@docs-guardian`, `@product-strategist`.
- **Specialist support:** use [../agents/agency-agents/](../agents/agency-agents/) divisions such as `project-management/`, `engineering/`, and `specialized/` when adapting the factory to another codebase.
- **Rule:** refactoring work adapts the operating model to the project; it does not weaken the canonical documentation rules inside this template.

## When to Use

Use Refactor Mode when:
- ✅ You have an **existing project** with source code
- ✅ You want to **adopt Factory processes** without major restructuring
- ✅ You want to **gradually improve** organization and documentation
- ✅ You want to **preserve your current structure** as much as possible
- ✅ You want agents to **work with your existing folders** instead of forcing new structure

## Key Principles

1. **Respect Existing Structure** - Don't force major changes
2. **Map, Don't Replace** - Map current structure to Factory concepts
3. **Adapt Agents** - Update agents to work with your structure
4. **Gradual Improvement** - Suggest improvements, don't mandate
5. **Documentation First** - Add missing documentation without moving code

## Workflow

### Step 1: Analyze Current Project

**Agent:** @refactor-agent

**Actions:**
1. Scan project directory structure
2. Identify existing folders and their purposes
3. Detect naming conventions
4. Find existing documentation
5. Identify source code locations
6. Map current structure to Factory concepts

**Output:**
- Current structure analysis
- Naming convention detection
- Documentation gaps
- Source code organization

### Step 2: Define Current Structure & Naming Conventions

**Agent:** @refactor-agent

**Actions:**
1. Document current folder structure
2. Document naming conventions (kebab-case, camelCase, etc.)
3. Identify patterns (e.g., `docs/`, `src/`, `app/`, etc.)
4. Map to Factory concepts:
   - Ideas → `1-ideas/` or current location
   - Product → `2-product-foundation/` or current location
   - Technical docs → `3-technical/` or current location
   - Source code → `systems/` or current location
   - Marketing → `4-marketing/` or current location
   - etc.

**Output:**
- Structure mapping document
- Naming convention document
- Current vs. Factory comparison

### Step 3: Create Refactoring Plan

**Agent:** @refactor-agent

**Location:** `refactoring/plan.md`

**Plan Format:**
```markdown
# Refactoring Plan

## Structure Mapping

| Part | Objective | Current Folder | Suggested Action | Priority |
|------|-----------|----------------|------------------|----------|
| Ideas | Store and analyze ideas | `not-available` | Create `1-ideas/` | High |
| Technical Docs | Technical documentation | `docs/technical/` | Keep, update agents to work here | Medium |
| Source Code | Source code storage | `flat with backend/, frontend/, app/` | Human decision - recommend `systems/` or keep current | High |
| Product | Product requirements | `requirements/` | Map to `2-product-foundation/` or keep | Medium |
| Marketing | Marketing materials | `not-available` | Create `4-marketing/` | Low |

## Naming Conventions

- **Current:** camelCase for files
- **Factory Standard:** kebab-case
- **Action:** Keep current, update agents to accept both

## Documentation Gaps

- [ ] Missing `README.md` in root
- [ ] Missing `INDEX.md`
- [ ] Missing product overview
- [ ] Missing technical architecture docs

## Agent Adaptations Required

- Update @fullstack-engineer to work with `backend/`, `frontend/`, `app/` structure
- Update @docs-guardian to check `docs/technical/` instead of `3-technical/`
- Update @product-strategist to work with `requirements/` folder
```

**Output:**
- `refactoring/plan.md` with detailed mapping
- Priority-based action items
- Agent adaptation requirements

### Step 4: Review and Confirm Structure

**Agent:** @refactor-agent + Human

**Actions:**
1. Present refactoring plan to human
2. Get confirmation on:
   - Structure mapping
   - Naming conventions to keep
   - Folders to create
   - Folders to keep as-is
3. Document decisions

**Output:**
- Confirmed structure mapping
- Approved refactoring plan

### Step 5: Update Agents, Flows, Global Rules, and Core Files

**Agent:** @refactor-agent

**Actions:**
1. **Update Core Files in `0-agents/_core/`:**
   - Update `file-placement-guide.md` - Map all Factory paths to current project paths
   - Update `global-rules.md` - Add project-specific rules and path rules
   - Update `hpo.md` - Update all output paths in HPO table
   
2. **Update All Agent Files:**
   - Scan and update all files in `0-agents/agents/`
   - Update path references to match current structure
   - Create agent override files in `0-agents/workflows/project-config/`
   
3. **Update All Mode Files:**
   - Scan and update all files in `0-agents/mode/`
   - Update output locations and path references
   
4. **Update All Workflow Files:**
   - Scan and update all files in `0-agents/workflows/`
   - Update path references and workflow steps
   
5. **Update Skills (if applicable):**
   - Scan `0-agents/agents/skills/` if it exists
   - Update any path references in skills

**Output:**
- Updated `0-agents/_core/file-placement-guide.md`
- Updated `0-agents/_core/global-rules.md`
- Updated `0-agents/_core/hpo.md`
- Updated all agent files
- Updated all mode files
- Updated all workflow files
- Project-specific agent configs
- Updated skills (if applicable)

### Step 6: Develop Implementation Plan

**Agent:** @refactor-agent

**Actions:**
1. Create detailed implementation plan:
   - What to create (new folders, READMEs)
   - What to update:
     - Core files (`file-placement-guide.md`, `global-rules.md`, `hpo.md`)
     - All agent files
     - All mode files
     - All workflow files
     - Skills (if applicable)
   - What to keep (existing structure)
   - Timeline (if requested)
2. Prioritize actions:
   - Must-have (critical for agents to work):
     - Update core files first
     - Update critical agent paths
     - Update critical mode output locations
   - Should-have (improves organization):
     - Update remaining agents and modes
     - Update workflows
     - Fill documentation gaps
   - Nice-to-have (future improvements):
     - Standardize naming gradually
     - Optimize structure further

**Output:**
- `refactoring/implementation-plan.md`
- Detailed task breakdown with core files updates
- Priority matrix

### Step 7: Execute (Deliver Mode)

**Agent:** @fullstack-engineer, @docs-guardian

**Actions:**
1. **Update Core Files:**
   - Update `0-agents/_core/file-placement-guide.md` with current paths
   - Update `0-agents/_core/global-rules.md` with project-specific rules
   - Update `0-agents/_core/hpo.md` with current output paths
   
2. **Update All Agent Files:**
   - Update path references in all agent files
   - Create agent override files in `0-agents/workflows/project-config/`
   
3. **Update All Mode Files:**
   - Update output locations in all mode files
   - Update path references
   
4. **Update All Workflow Files:**
   - Update path references in workflow files
   - Update workflow steps
   
5. **Create Missing Structure:**
   - Create missing folders and READMEs
   - Create INDEX.md based on current structure
   
6. **Update Documentation:**
   - Fill documentation gaps
   - Update existing documentation
   
7. **Verify:**
   - Verify agents can work with current structure
   - Verify all paths are correct
   - Verify file-placement-guide is accurate

**Output:**
- Updated core files (`file-placement-guide.md`, `global-rules.md`, `hpo.md`)
- Updated all agent files
- Updated all mode files
- Updated all workflow files
- New folders and documentation
- Working Factory setup adapted to current structure

## Output Locations

- **Refactoring Plan:** `refactoring/plan.md`
- **Implementation Plan:** `refactoring/implementation-plan.md`
- **Structure Analysis:** `refactoring/structure-analysis.md`
- **Agent Configs:** `0-agents/workflows/project-config/`
- **Updated Documentation:** Current project structure

## Forbidden Actions

- ❌ **Forcing structure changes** → Respect existing structure
- ❌ **Moving source code** → Keep code where it is
- ❌ **Renaming existing files** → Keep current naming unless explicitly approved
- ❌ **Breaking existing workflows** → Adapt, don't break
- ❌ **Creating duplicate structure** → Map to existing, don't duplicate

## Success Criteria

- ✅ Agents can work with current structure
- ✅ Documentation gaps filled
- ✅ INDEX.md created based on current structure
- ✅ Factory processes adapted to current structure
- ✅ No major code restructuring required
- ✅ Team can continue working with familiar structure

## Related Documents

- **[Refactor Agent](../agents/refactor-agent.md)** - Agent responsible for refactoring analysis
- **[Boost Mode](boost.md)** - For new projects (different use case)
- **[Deliver Mode](deliver.md)** - For executing refactoring plan

---

*Use Refactor Mode to gradually adopt Factory standards while preserving your existing project structure.*
