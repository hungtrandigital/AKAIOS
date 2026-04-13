# Boost Mode — AI-First Startup Factory

**Version:** v3.2  
**Purpose:** Define the scope, activities, and workflow for Boost Mode (project initialization)

## Overview

Boost Mode is a one-time initialization mode for setting up a new project or reorganizing an existing messy codebase into the factory template structure. This mode creates the complete directory structure, analyzes existing files, migrates them to correct locations, and applies naming conventions.

**Command:** Use `/boost` in Cursor IDE to activate this mode.

**When to Use:** Only for initial project setup or major restructuring. Not for regular development work.

## Agent Routing

Boost Mode is led by the structure layer and can use specialists to improve scaffolding quality.

- **Core owners:** `@boost`, `@docs-guardian`, and `@refactor-agent` when structure cleanup overlaps with adoption work.
- **Specialist support:** use [../agents/agency-agents/](../agents/agency-agents/) divisions such as `project-management/`, `engineering/`, and `specialized/` for workflow architecture, technical writing, and repo hygiene.
- **Rule:** Boost creates or aligns the skeleton; it does not change the governance model or bypass `INDEX.md`.

## What Boost Mode Creates

**For a completely new project (only `0-agents/` exists), Boost Mode will create:**

1. **`INDEX.md`** - Complete structure definition (if doesn't exist)
2. **All directories** - Complete directory structure with all sub-levels (up to 4-5 levels deep)
3. **All README.md files** - One README.md for every directory that should have one
4. **Placeholder files** - Essential placeholder files for project initialization

**Structure depth:** Boost Mode creates structure up to 4-5 levels deep:
- Level 1: Main sections (1-ideas/, 2-product-foundation/, etc.)
- Level 2: Subdirectories (market-research/, 3.1-system-foundation/, etc.)
- Level 3: Sub-subdirectories (architecture/, design-standards/, plans/, etc.)
- Level 4: Sub-sub-subdirectories (active/, completed/, archived/, epics/, etc.)
- Level 5: Final level (specific directories like analysis/, templates/, etc.)

**Structure source:** The complete structure is defined in `INDEX.md` or the structure template below. This is the single source of truth for what Boost Mode creates.

## When to Use Boost Mode

**For a completely new project (only `0-agents/` exists), Boost Mode will create:**

1. **`INDEX.md`** - Complete structure definition (if doesn't exist)
2. **All directories** - Complete directory structure with all sub-levels (up to 4-5 levels deep)
3. **All README.md files** - One README.md for every directory that should have one (see complete list in Step 1)
4. **Placeholder files** - Essential placeholder files for project initialization

**Structure depth:** Boost Mode creates structure up to 4-5 levels deep:
- Level 1: Main sections (1-ideas/, 2-product-foundation/, etc.)
- Level 2: Subdirectories (market-research/, 3.1-system-foundation/, etc.)
- Level 3: Sub-subdirectories (architecture/, design-standards/, plans/, etc.)
- Level 4: Sub-sub-subdirectories (active/, completed/, archived/, epics/, etc.)
- Level 5: Final level (specific directories like file-placement/, documentation/, etc.)

**Structure source:** The complete structure is defined in the "Structure Template" section below. This is the single source of truth for what Boost Mode creates.

## When to Use Boost Mode

Use Boost Mode when:
- **Initial project setup** - Setting up a new project from scratch
- **Project restructuring** - Reorganizing a messy codebase into Factory structure
- **Migration** - Moving files from scattered locations to proper structure
- **Structure compliance** - Ensuring project follows Factory directory structure

**DO NOT use Boost Mode for:**
- Regular development work
- Adding new features
- Daily file operations
- Code changes

## Core Activities

### 0. Read Current State (ALWAYS START HERE)

**Before starting any boost operations:**
1. **Check if `INDEX.md` exists:**
   - **If EXISTS:** Read `INDEX.md` to understand the complete target structure
   - **If NOT EXISTS:** You will create it in Step 1 using the structure template below
2. **Read `0-agents/_core/global-rules.md`** - Understand non-negotiable rules, especially:
   - Section 1: Repository Context & Navigation (INDEX.md reading, file-placement-guide.md)
   - Section 4: AI Agent Behaviour (file creation checks)
   - Rule 10.1: Task Validation Gate (tasks must link to epic/idea/plan)
   - Rule 11: Work-Item Traceability System (all work items must have metadata)
3. **Read `0-agents/_core/file-placement-guide.md`** - Understand detailed file placement rules and directory-specific guidance
4. **Read `0-agents/_core/work-item-traceability.md`** - Understand work-item metadata requirements and ID schema
5. **Scan current codebase** - Identify existing files and structure
6. **Check if `0-agents/` exists** - This directory should already exist and must NOT be modified
7. **Identify scattered files** - Find files in wrong locations

**Action:** Always understand current state before creating structure or migrating files. Boost is not just structure setup—it also ensures traceability system is in place and follows the new structure compliance rules.

### 1. Create Directory Structure

**Action:**
1. **Check if `INDEX.md` exists:**
   - **If NOT EXISTS:** Create `INDEX.md` first using the structure template (see "Structure Template" section below)
   - **If EXISTS:** Use it as reference (already read in Step 0)
2. **Follow global-rules checks** - Complete mandatory checks from `0-agents/_core/global-rules.md` (already done in Step 0):
   - Section 1: Read INDEX.md FIRST and read README.md before taking action (already required)
   - Section 4: File creation checks (already done)
3. Read `0-agents/_core/file-placement-guide.md` for detailed placement rules (already done in Step 0)
4. **Create all required directories and subdirectories** as defined in `INDEX.md` (or structure template if INDEX.md was just created)
5. For multi-system projects: Create `systems/` directory with structure for each system
6. All projects use unified `systems/[system-name]/` structure
7. **Create all required `README.md` files** for every directory in the structure:
   - Root: `README.md`
   - Main sections: `1-ideas/README.md`, `2-product-foundation/README.md`, `3-technical/README.md`, `systems/README.md`, `4-marketing/README.md`, `5-financing/README.md`, `6-operations/README.md`, `7-operations-monitoring/README.md`, `8-governance/README.md`, `shared/README.md`, `archives/README.md`
   - Subdirectories with README.md:
     - `1-ideas/market-research/README.md`
     - `1-ideas/marketing/README.md`
     - `1-ideas/technical/README.md`
     - `1-ideas/operations/README.md`
     - `1-ideas/finance/README.md`
     - `1-ideas/product/README.md`
     - `1-ideas/executive-docs/README.md`
     - `3-technical/3.1-system-foundation/README.md`
     - `3-technical/3.1-system-foundation/architecture/README.md`
     - `3-technical/3.1-system-foundation/design-standards/README.md`
     - `3-technical/3.2-implementation/README.md`
     - `3-technical/3.2-implementation/plans/README.md`
     - `3-technical/3.3-devops/README.md`
     - `5-financing/analysis/README.md`
     - `5-financing/preparation/README.md`
     - `6-operations/team/README.md`
     - `6-operations/processes/README.md`
     - `6-operations/legal/README.md`
     - `8-governance/audits/README.md`
   - Use README.md templates (see "README.md Templates" section below)
   - Document purpose, scope, and naming conventions
   - Include navigation links to parent and related directories
   - **Verification loop:** After structure creation, diff the directory tree against `INDEX.md` and ensure every directory listed above has a README. If a README is missing or placeholder-only, create/refresh it using the template so Boost exits with all READMEs ready.
8. **Create placeholder files** as needed:
   - `8-governance/changelog.md`
   - `8-governance/project-versions.md`
   - `8-governance/decision-log.md`
   - `8-governance/risk-register.md`
   - `2-product-foundation/product-overview.md`
   - `2-product-foundation/product-backlog/backlog.md`
   - `3-technical/3.1-system-foundation/infrastructure.md`
   - `3-technical/3.1-system-foundation/architecture/domain-specs.md`
   - `3-technical/3.1-system-foundation/design-standards/coding-standards.md`
   - `3-technical/3.1-system-foundation/design-standards/system-design.md`
   - `3-technical/3.2-implementation/status/progress.md`
   - `3-technical/3.2-implementation/status/work-items-registry.md` (master index for traceability)
   - `3-technical/3.2-implementation/history/history.log.md`
   - `4-marketing/go-to-market.md`
   - `4-marketing/personas.md`
   - `5-financing/plans.md`
   - `6-operations/team/team-structure.md`
   - `7-operations-monitoring/marketing-analytics.md`
   - `7-operations-monitoring/incident-response.md`
   - `1-ideas/market-research/summaries.md`

**Complete Directory List to Create (all levels):**
- Root: `README.md`, `INDEX.md`, `.cursorrules`
- `1-ideas/` + all subdirectories (market-research/, features/, marketing/, technical/, operations/, finance/, product/, executive-docs/)
- `2-product-foundation/` + subdirectories (product-backlog/, requirements/)
- `3-technical/` + all subdirectories (3.1-system-foundation/ with architecture/ and design-standards/, 3.2-implementation/ with status/, history/, plans/ with active/, completed/, archived/, epics/, 3.3-devops/ with local-config/)
- `systems/` + subdirectories (shared/ with libraries/, packages/, services/, [system-name]/ with docs/, frontend/, backend/, tests/, db/)
- `4-marketing/` + subdirectories (history/, performance/, templates/)
- `5-financing/` + subdirectories (analysis/, preparation/, reviews/, pitches/, projections/)
- `6-operations/` + subdirectories (team/, processes/, legal/, hr/, vendor-contracts/)
- `7-operations-monitoring/` + subdirectories (system-monitoring/)
- `8-governance/` + subdirectories (audits/ with file-placement/, documentation/, placement/, assessments/, reviews/, quarterly-retrospective/, scripts/)
- `shared/` + subdirectories (templates/, assets/)
- `archives/`

**Important:**
- **DO NOT** modify or move anything in `0-agents/` directory
- **DO NOT** overwrite existing files without user confirmation
- Create directories even if they will be empty initially
- **Global-rules Section 1 already requires reading README.md** before taking action in any folder

**Output:**
- List all directories created (all levels)
- List all README.md files created (one for each directory that should have one)
- List all placeholder files created
- Confirm structure matches target in `INDEX.md` (or structure template)

**Complete Directory List to Create:**
- Root: `README.md`, `INDEX.md`, `.cursorrules`
- `1-ideas/` + all subdirectories (market-research/, features/, marketing/, technical/, operations/, finance/, product/, executive-docs/)
- `2-product-foundation/` + subdirectories (product-backlog/, requirements/)
- `3-technical/` + all subdirectories (3.1-system-foundation/ with architecture/ and design-standards/, 3.2-implementation/ with status/, history/, plans/ with active/, completed/, archived/, epics/, 3.3-devops/ with local-config/)
- `systems/` + subdirectories (shared/ with libraries/, packages/, services/, [system-name]/ with docs/, frontend/, backend/, tests/, db/)
- `4-marketing/` + subdirectories (history/, performance/, templates/)
- `5-financing/` + subdirectories (analysis/, preparation/, reviews/, pitches/, projections/)
- `6-operations/` + subdirectories (team/, processes/, legal/, hr/, vendor-contracts/)
- `7-operations-monitoring/` + subdirectories (system-monitoring/)
- `8-governance/` + subdirectories (audits/ with file-placement/, documentation/, placement/, assessments/, reviews/, quarterly-retrospective/, scripts/)
- `shared/` + subdirectories (templates/, assets/)
- `archives/`

**Output:**
- List all directories created (all levels)
- List all README.md files created (one for each directory that should have one)
- List all placeholder files created
- Confirm structure matches target in `INDEX.md` (or structure template)

### 2. Analyze Current Codebase

**Action:**
1. Scan entire codebase (excluding `0-agents/`, `.git/`, `node_modules/`, build artifacts)
2. Identify all files and their current locations
3. Categorize files by type:
   - **Code files:** Source code (`.js`, `.ts`, `.py`, `.tsx`, `.jsx`, etc.)
   - **Documentation:** Markdown files, text files, docs
   - **Configuration:** Config files (`.json`, `.yaml`, `.toml`, `.env`, etc.)
   - **Assets:** Images, fonts, media files
   - **Tests:** Test files
   - **Database:** SQL files, migrations, seeds

4. For each file, determine:
   - **Current location**
   - **Proposed target location** (based on content analysis, `INDEX.md`, and `file-placement-guide.md`)
   - **Proposed new filename** (if renaming needed to follow naming conventions)
   - **Content overlap check** - Verify no overlap with existing files in target directory (README.md already read per global-rules Section 1)
   - **Reasoning** for the placement

**Output:** Create detailed analysis report with tables for each file category.

### 2.5. Scan Code Quality and Suggest Refactoring (OPTIONAL - If code exists)

**Action:**
If source code files exist in the codebase, perform code quality analysis:

1. **Scan code structure:**
   - Analyze code organization and file structure
   - Identify code patterns and anti-patterns
   - Check for code duplication
   - Identify large files or functions (>300 lines)
   - Check for proper separation of concerns

2. **Analyze code quality:**
   - Check for unused imports/variables
   - Identify hardcoded values that should be configurable
   - Check for missing error handling
   - Identify potential security issues (if obvious)
   - Check for accessibility issues (if frontend code)

3. **Suggest refactoring opportunities:**
   - **Code organization:** Suggest better file/folder structure
   - **Code patterns:** Suggest improvements (e.g., extract functions, split large files)
   - **Best practices:** Suggest adherence to coding standards
   - **Dependencies:** Identify unused or outdated dependencies
   - **Testing:** Identify missing tests or test coverage gaps

4. **Create refactoring suggestions report:**
   - List refactoring opportunities by priority (High/Medium/Low)
   - Provide specific file locations and line numbers (if applicable)
   - Suggest concrete improvements with reasoning
   - Note: These are suggestions only - user decides what to implement

**Output Format:**
```markdown
## Code Quality & Refactoring Suggestions

### High Priority
| File | Issue | Suggestion | Reasoning |
|------|-------|------------|-----------|
| `[path]/utils.[ext]` | Large file (500+ lines) | Split into smaller modules by functionality (e.g., `utils/date.[ext]`, `utils/format.[ext]`, `utils/validation.[ext]`) | Better maintainability, easier testing |
| `[path]/[component].[ext]` | Hardcoded values | Extract to configuration file or constants | Follows best practices, easier to maintain |

### Medium Priority
| File | Issue | Suggestion | Reasoning |
|------|-------|------------|-----------|
| `[path]/[api-file].[ext]` | Missing error handling | Add proper error handling (try-catch, error responses) | Better error handling improves UX and reliability |

### Low Priority
| File | Issue | Suggestion | Reasoning |
|------|-------|------------|-----------|
| `[path]/[file].[ext]` | Unused imports/dependencies | Remove unused imports or dependencies | Clean up codebase, reduce bundle size |

### Code Organization Suggestions
- Consider grouping related utilities in subdirectories by functionality
- Consider separating API routes by domain (e.g., by resource or feature)
- Consider extracting shared types/interfaces to dedicated directory
- Consider organizing components by feature rather than by type

**Note:** 
- Replace `[path]`, `[file]`, `[ext]` with actual file paths, names, and extensions found in the codebase
- These are suggestions for future improvement. Boost Mode focuses on structure setup and file migration. Code refactoring can be done later in Code Mode or Fix Mode.
```

**Important:**
- This step is **optional** and only runs if source code files exist
- Focus on **structural improvements** and **obvious issues**
- Do NOT modify code - only suggest improvements
- User decides which suggestions to implement (not part of migration plan)

### 3. User Confirmation for Uncertain Items

**Action:**
1. Present analysis report to user
2. Highlight files in "Uncertain Files" category
3. For each uncertain file:
   - Show file content preview (first 10-20 lines)
   - Ask: "Where should this file go?"
   - Provide 2-3 suggested options with reasoning
   - Wait for user confirmation before proceeding

**Output:**
- List of files requiring user decision
- User's decisions recorded

### 4. Create Migration Plan

**Action:**
1. Create detailed migration plan based on analysis and user confirmations
2. **For each file to move:**
   - Verify no content overlap with existing files (README.md already read per global-rules Section 1)
3. Group operations by type:
   - **Move operations:** Files to move to new locations (with README.md verification)
   - **Rename operations:** Files to rename (following naming conventions from directory README.md)
   - **Refactor operations:** Files that need content updates (e.g., update links)
   - **Create operations:** New files to create (e.g., missing README.md)

4. **Ensure traceability compliance** (MANDATORY):
   - Identify all epic definitions (should be in `2-product-foundation/product-backlog/backlog.md`)
   - Identify all work items (tasks, slices, bugs, plans)
   - Ensure each work item will have required metadata (YAML frontmatter with `id`, `parent_id`, `related_ids`, `phases`, `owner`, `folder`)
   - Check that `3-technical/3.2-implementation/status/work-items-registry.md` will be updated as source of truth
   - Verify task validation gate can be enforced (every task must link to epic/idea/plan)

5. Check for conflicts:
   - Will moving/renaming break any imports/references?
   - Are there duplicate files?
   - Will this overwrite existing files?
   - Is there content overlap with existing files in target directories?

6. **Include refactoring suggestions** (if Step 2.5 was performed):
   - Reference the code quality report
   - Note that refactoring suggestions are separate from migration
   - User can implement refactoring suggestions later in Code Mode or Fix Mode

7. Present migration plan to user for approval before executing

**Output:** Detailed migration plan with phases, potential issues, reference to refactoring suggestions (if available), and **traceability compliance checklist**.

### 5. Execute Migration

**Action:**
1. Execute migration plan step by step
2. For each operation:
   - **Before moving:** Check if target exists, ask user if overwrite needed
   - **Move/Rename:** Perform the file operation
   - **Update references:** Fix imports, links, and references in affected files
   - **Verify:** Check that the file is in the correct location

3. Handle special cases:
   - **Code files:** Update import paths in all affected files
   - **Documentation:** Update cross-references and links
   - **Configuration:** Ensure paths in config files are updated
   - **Tests:** Move test files alongside their source files

**Important:**
- **DO NOT** delete files - only move/rename them
- **DO NOT** modify file contents unless necessary for path updates
- **DO** create backup notes of original locations (in a migration log)

### 6. Apply Naming Conventions

**Action:**
Ensure all files follow naming conventions:

**Documentation Files (Markdown):**
- Use **kebab-case**: `product-overview.md`, `go-to-market.md`
- Use descriptive names: `initial-financing-plan.md` not `plan.md`
- Version indicators: `initial-*` for early versions, final versions in proper sections

**Code Files:**
- **Frontend:** PascalCase for components (`Button.tsx`), camelCase for utilities (`apiClient.ts`)
- **Backend:** camelCase for files (`userService.ts`, `database.ts`)
- **Tests:** Match source file name with `.test.` or `.spec.` suffix

**Directory Names:**
- **kebab-case:** `market-research/`, `product-backlog/`
- **Numbered prefixes:** `1-ideas/`, `2-product-foundation/`, `3-technical/`

**Output:**
- List of files renamed to comply with conventions
- List of files that couldn't be renamed (with reasons)

### 7. Update Cross-References

**Action:**
1. Scan all markdown files for broken links
2. Update relative paths in:
   - README.md files
   - Documentation files
   - Code comments (if they reference docs)

3. Update import statements in code files if paths changed
4. Update `INDEX.md` if structure changed

**Output:**
- List of files with updated links
- List of broken links that couldn't be auto-fixed (require manual review)

### 8. Generate Final Report

**Action:**
Create comprehensive final report with:
- Summary (total files analyzed, moved, renamed, created, references updated)
- Directory structure created
- Files migrated (by category)
- Naming convention updates
- Reference updates
- **Code quality & refactoring suggestions** (if Step 2.5 was performed)
- **Traceability System Status:**
  - ✅ Work-Item Registry (`3-technical/3.2-implementation/status/work-items-registry.md`) is in place
   - ✅ Epic definitions exist in `2-product-foundation/product-backlog/backlog.md`
  - ✅ All work items have required metadata (id, parent_id, related_ids, phases, owner, folder)
  - ✅ Task Validation Gate can be enforced (product-strategist will validate incoming tasks)
  - ✅ Global rules are understood and applicable to new project
- Issues & warnings
- Next steps (including optional refactoring work and project-specific setup in Plan Mode)
- Verification checklist

**Output:** Complete migration report saved to `8-governance/changelog.md` or appropriate location. If code quality analysis was performed, also save refactoring suggestions to `3-technical/3.2-implementation/plans/refactoring-suggestions.md` (for future reference).

## Allowed Actions

✅ **You CAN:**
- **Read `INDEX.md`** - Always read to understand target structure
- **Read `0-agents/_core/global-rules.md`** - Understand rules, especially file creation checks, task validation gate and traceability system (Section 1 already requires reading README.md)
- **Read `0-agents/_core/file-placement-guide.md`** - Understand detailed file placement rules
- **Read `0-agents/_core/work-item-traceability.md`** - Understand metadata and ID schema requirements
- Create directory structure as defined in `INDEX.md`
- Create README.md files with proper routing
- Analyze existing files and categorize them
- **Scan code quality** (if source code exists) and suggest refactoring opportunities
- Move files to correct locations (README.md already read per global-rules Section 1)
- Rename files to follow naming conventions
- Update import paths and links
- Create migration reports and refactoring suggestions reports
- Ask user for confirmation when uncertain
- **Verify traceability system setup** - Ensure epic definitions, work-items-registry, and metadata requirements are understood

## Forbidden Actions

❌ **You CANNOT:**
- Modify or move anything in `0-agents/` directory
- Delete files (only move/rename)
- Modify file contents unless updating paths/links
- **Implement refactoring suggestions** - Only suggest, user implements later
- **Modify code structure** - Only suggest improvements
- Overwrite existing files without user confirmation
- Skip user confirmation for uncertain files
- Proceed without migration plan approval
- Modify `.git/` or version control files
- Delete `.gitignore` or other root config files

## Output Locations

Boost Mode outputs go to:
- **Directory Structure:** All directories as defined in `INDEX.md`
- **Migration Report:** `8-governance/changelog.md` or dedicated migration log
- **Refactoring Suggestions:** `3-technical/3.2-implementation/plans/refactoring-suggestions.md` (if code analysis was performed)
- **Files:** Moved to correct locations according to `INDEX.md` structure

## Mode Transition

Boost Mode typically transitions to:
- **Chat Mode** - When boost is complete and user needs guidance
- **Plan Mode** - When structure is ready and user wants to create project-specific epics and roadmap (MUST complete before Code Mode)
- **Ideas Mode** - When structure is ready and user wants to start ideation

**IMPORTANT:** After Boost completes structure setup, @product-strategist must establish initial epics in Plan Mode before any code work begins. This ensures the traceability system is initialized and the Task Validation Gate can function.

**After Boost:**
- Project structure is complete and matches Factory template
- All files are in correct locations
- Naming conventions are applied
- References are updated
- `0-agents/` rules are understood and will be enforced
- **NEXT STEP:** Transition to Plan Mode to create project-specific epics and roadmap

## Pre-Boost Checklist

Before starting boost, ensure:
- ✅ `0-agents/` directory exists (will not be modified)
- ✅ User understands this is a one-time setup operation
- ✅ User is ready to review and approve migration plan
- ✅ User is aware of Task Validation Gate and Work-Item Traceability requirements
- ✅ User understands Plan Mode must follow Boost Mode to establish initial epics

**Note:** `INDEX.md` may not exist yet. Boost mode will create it using the structure template if it doesn't exist.

**Structure Definition:**
- **Structure template** is defined in boost mode (see "Structure Template" section below)
- **File-placement-guide.md** provides placement rules, NOT structure definition
- **INDEX.md** (when created) becomes the single source of truth for structure
- **Boost mode creates ALL sub-levels** defined in the structure template (up to 4-5 levels deep)
- **Boost mode creates README.md** for every directory listed in Step 1

## Success Criteria

Boost Mode is successful when:
- ✅ All required directories exist (matching `INDEX.md`)
- ✅ All README.md files created with proper routing
- ✅ All files are in appropriate locations
- ✅ All files follow naming conventions
- ✅ All references/links are updated and working
- ✅ No files were lost or deleted
- ✅ User has clear report of all changes
- ✅ Project structure matches target structure in `INDEX.md`
- ✅ **Task Validation Gate is understood by user and team** (product-strategist will enforce)
- ✅ **Work-Item Traceability System is understood** (metadata requirements, ID schema, registry)
- ✅ **User is ready to transition to Plan Mode** to establish initial epics

## Orchestration Handoff Format

When in Boost Mode, use this format:

```markdown
**Current mode**: boost  
**Task completed**: [Yes/No/Partial]  
**Phase**: [Structure Creation / Analysis / Migration / Naming / References / Complete]

**Directories created**: [List]
**Files analyzed**: [Count]
**Files moved**: [Count]
**Files renamed**: [Count]
**References updated**: [Count]

**Next recommended agent**: @docs-guardian (to verify structure) OR transition to Chat Mode  
**Next task**: "[Clear task description]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers or files requiring user decision]
```

## Structure Template (For Creating INDEX.md)

If `INDEX.md` does not exist, create it using this template structure:

Use `[project-root]/` as a placeholder label for the repository root in all template trees below. It is not a literal directory name.

```markdown
# INDEX — AI-First Startup Factory

**Version:** v3.0  
**Last Updated:** [Current Date]

This document is the single source of truth for the repository structure. Always consult this file to understand where files belong.

## Quick Links

### Core Directories
- **[0-agents/](0-agents/)** - AI agent definitions, modes, workflows, and skills (DO NOT MODIFY)
- **[1-ideas/](1-ideas/)** - Market research, initial financing plans, initial go-to-market plans
- **[2-product-foundation/](2-product-foundation/)** - Product overview, backlog, requirements
- **[3-technical/](3-technical/)** - System foundation, implementation, DevOps
- **[systems/](systems/)** - All code for all systems (single-system or multi-system projects)
- **[4-marketing/](4-marketing/)** - Go-to-market strategy, personas, performance, templates
- **[5-financing/](5-financing/)** - Financing plans, pitches, projections
- **[6-operations/](6-operations/)** - Team structure, legal, HR, vendor contracts
- **[7-operations-monitoring/](7-operations-monitoring/)** - System monitoring, marketing analytics, incident response
- **[8-governance/](8-governance/)** - Project versions, changelog, decision log, risk register, retrospectives
- **[shared/](shared/)** - Shared templates and assets
- **[archives/](archives/)** - Archived documents

## Complete Directory Structure

```
[project-root]/
├── README.md
├── INDEX.md (this file)
├── .cursorrules
├── 0-agents/ (already exists - DO NOT MODIFY)
│   ├── _core/
│   ├── agents/
│   ├── mode/
│   └── workflows/
├── 1-ideas/
│   ├── README.md
│   ├── market-research/
│   │   ├── README.md
│   │   ├── reports/
│   │   ├── summaries.md
│   │   ├── templates/
│   │   └── resources/
│   ├── marketing/
│   │   ├── README.md
│   │   └── initial-go-to-market-plan.md
│   ├── technical/
│   │   ├── README.md
│   ├── operations/
│   │   ├── README.md
│   ├── finance/
│   │   ├── README.md
│   │   └── initial-financing-plan.md
│   ├── product/
│   │   ├── README.md
│   │   └── features/
│   │       ├── README.md
│   │       ├── summaries.md
│   │       └── analysis/
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
│   │   │   └── api-contracts/
│   │   └── design-standards/
│   │       ├── README.md
│   │       ├── coding-standards.md
│   │       └── system-design.md
│   ├── 3.2-implementation/
│   │   ├── README.md
│   │   ├── domain-specs.md
│   │   ├── api-contract.md
│   │   ├── status/
│   │   │   └── progress.md
│   │   ├── history/
│   │   │   ├── epics/
│   │   │   └── history.log.md
│   │   └── plans/
│   │       ├── README.md
│   │       ├── active/
│   │       ├── completed/
│   │       ├── archived/
│   │       └── epics/
│   └── 3.3-devops/
│       ├── README.md
│       ├── local-config/
│       └── server-steps.md
├── systems/
│   ├── README.md
│   ├── shared/
│   │   ├── libraries/
│   │   ├── packages/
│   │   └── services/
│   └── [system-name]/
│       ├── README.md
│       ├── docs/
│       ├── frontend/
│       ├── backend/
│       ├── tests/
│       └── db/
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
│   ├── preparation/
│   │   └── README.md
│   ├── reviews/
│   ├── pitches/
│   └── projections/
├── 6-operations/
│   ├── README.md
│   ├── team/
│   │   └── README.md
│   ├── processes/
│   │   └── README.md
│   ├── legal/
│   │   └── README.md
│   ├── hr/
│   └── vendor-contracts/
├── 7-operations-monitoring/
│   ├── README.md
│   ├── system-monitoring/
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
│   ├── quarterly-retrospective/
│   └── scripts/
├── shared/
│   ├── README.md
│   ├── templates/
│   └── assets/
└── archives/
    └── README.md
```

## File Placement Rules

### Code Files
- **All code** goes in `systems/[system-name]/`
- **Single-system projects:** One directory in `systems/` (e.g., `systems/web-app/`)
- **Multi-system projects:** Multiple directories in `systems/` (e.g., `systems/web-app/`, `systems/mobile-app/`)
- **Shared code:** Place in `systems/shared/` for code used across systems

### Documentation Files
- **Market research:** `1-ideas/market-research/reports/`
- **Product requirements:** `2-product-foundation/requirements/` with canonical per-feature docs in `requirements/[feature-name]/README.md`
- **Architecture docs:** `3-technical/3.1-system-foundation/architecture/`
- **Implementation plans:** `3-technical/3.2-implementation/plans/`
- **Marketing docs:** `4-marketing/`
- **Financial docs:** `5-financing/`

### Initial vs Final Documents
- **Initial plans** live in `1-ideas/[department]/` (e.g., `finance/initial-financing-plan.md`, `marketing/initial-go-to-market-plan.md`)
- **Final versions** move to proper sections:
   - `finance/initial-financing-plan.md` → `5-financing/plans.md`
   - `marketing/initial-go-to-market-plan.md` → `4-marketing/go-to-market.md`
- When moving, leave a Markdown link pointing to the new location

## Naming Conventions

- **Files & Folders:** kebab-case (`product-overview.md`, `market-research/`)
- **Dates:** YYYY-MM-DD format
- **Versioned files:** `filename.v2025-12-09.md` (only in `archives/`)
- **All documents:** Markdown (.md)
- **Code files:** Follow language conventions (PascalCase for React components, camelCase for utilities)

## Important Notes

- **DO NOT modify `0-agents/`** - This directory contains agent definitions and must remain untouched
- **Every folder has a README.md** - Read it before taking action in that folder
- **Single source of truth** - Never duplicate information across folders
- **Update INDEX.md and changelog.md** after structural changes

---

**Remember:** When in doubt about file placement, consult this INDEX.md file first.
```

## README.md Templates

When creating README.md files for directories, use these templates:

### Root README.md Template
```markdown
# [Project Name] — AI-First Startup Factory

Welcome to the [Project Name] repository, organized using the AI-First Startup Factory structure.

## Quick Start

1. **Read [INDEX.md](INDEX.md)** - Understand the complete directory structure
2. **Follow [0-agents/_core/global-rules.md](0-agents/_core/global-rules.md)** - Repository rules and conventions
3. **Select the correct mode** - See [0-agents/mode/](0-agents/mode/) for available modes
4. **Use the right agent workflow** - See [0-agents/agents/](0-agents/agents/) for agent definitions

## Repository Structure

This repository follows the Factory template structure:
- **[0-agents/](0-agents/)** - AI agent definitions, modes, workflows, and skills
- **[1-ideas/](1-ideas/)** - Market research, initial plans
- **[2-product-foundation/](2-product-foundation/)** - Product overview, backlog, requirements
- **[3-technical/](3-technical/)** - System foundation, implementation, DevOps
- **[systems/](systems/)** - All code for all systems
- **[4-marketing/](4-marketing/)** - Go-to-market strategy
- **[5-financing/](5-financing/)** - Financing plans and projections
- **[6-operations/](6-operations/)** - Team, legal, HR
- **[7-operations-monitoring/](7-operations-monitoring/)** - Monitoring and analytics
- **[8-governance/](8-governance/)** - Project governance and documentation

For complete structure details, see [INDEX.md](INDEX.md).

## Important Rules

- **DO NOT modify `0-agents/`** - This directory contains agent definitions
- **Always read folder README.md** before taking action in that folder
- **Update INDEX.md and changelog.md** after structural changes
- **Follow naming conventions** - kebab-case for files and folders
```

### Section README.md Template (e.g., 1-ideas/README.md)
```markdown
# [Section Name] — [Purpose]

[Brief description of what this section contains]

## Contents

- **[Subdirectory 1/](subdirectory-1/)** - [Description]
- **[Subdirectory 2/](subdirectory-2/)** - [Description]

## Purpose

[Explain the purpose and scope of this section]

## Navigation

- **Related Section:** [../related-section/](../related-section/)
- **Parent:** [../](../)

---

See [INDEX.md](../INDEX.md) for complete repository structure.
```

### Subdirectory README.md Template
```markdown
# [Subdirectory Name] — [Purpose]

[Brief description of what this subdirectory contains]

## Contents

- **[File or subdirectory]** - [Description]

## Purpose

[Explain the purpose and scope]

## Naming Conventions

- [Any specific naming conventions for this directory]

## Navigation

- **Parent:** [../](../)
- **Related:** [../../related/](../../related/)

---

See [INDEX.md](../INDEX.md) for complete repository structure.
```

## Structure Template (For Creating INDEX.md)

If `INDEX.md` does not exist, create it using this template structure:

```markdown
# INDEX — AI-First Startup Factory

**Version:** v3.0  
**Last Updated:** [Current Date]

This document is the single source of truth for the repository structure. Always consult this file to understand where files belong.

## Quick Links

### Core Directories
- **[0-agents/](0-agents/)** - AI agent definitions, modes, workflows, and skills (DO NOT MODIFY)
- **[1-ideas/](1-ideas/)** - Market research, initial financing plans, initial go-to-market plans
- **[2-product-foundation/](2-product-foundation/)** - Product overview, backlog, requirements
- **[3-technical/](3-technical/)** - System foundation, implementation, DevOps
- **[systems/](systems/)** - All code for all systems (single-system or multi-system projects)
- **[4-marketing/](4-marketing/)** - Go-to-market strategy, personas, performance, templates
- **[5-financing/](5-financing/)** - Financing plans, pitches, projections
- **[6-operations/](6-operations/)** - Team structure, legal, HR, vendor contracts
- **[7-operations-monitoring/](7-operations-monitoring/)** - System monitoring, marketing analytics, incident response
- **[8-governance/](8-governance/)** - Project versions, changelog, decision log, risk register, retrospectives
- **[shared/](shared/)** - Shared templates and assets
- **[archives/](archives/)** - Archived documents

## Complete Directory Structure

```
[project-root]/
├── README.md
├── INDEX.md (this file)
├── .cursorrules
├── 0-agents/ (already exists - DO NOT MODIFY)
│   ├── _core/
│   ├── agents/
│   ├── mode/
│   └── workflows/
├── 1-ideas/
│   ├── README.md
│   ├── market-research/
│   │   ├── README.md
│   │   ├── reports/
│   │   ├── summaries.md
│   │   ├── templates/
│   │   └── resources/
│   ├── marketing/
│   │   ├── README.md
│   │   └── initial-go-to-market-plan.md
│   ├── technical/
│   │   ├── README.md
│   ├── operations/
│   │   ├── README.md
│   ├── finance/
│   │   ├── README.md
│   │   └── initial-financing-plan.md
│   ├── product/
│   │   ├── README.md
│   │   └── features/
│   │       ├── README.md
│   │       ├── summaries.md
│   │       └── analysis/
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
│   │   │   └── api-contracts/
│   │   └── design-standards/
│   │       ├── README.md
│   │       ├── coding-standards.md
│   │       └── system-design.md
│   ├── 3.2-implementation/
│   │   ├── README.md
│   │   ├── domain-specs.md
│   │   ├── api-contract.md
│   │   ├── status/
│   │   │   └── progress.md
│   │   ├── history/
│   │   │   ├── epics/
│   │   │   └── history.log.md
│   │   └── plans/
│   │       ├── README.md
│   │       ├── active/
│   │       ├── completed/
│   │       ├── archived/
│   │       └── epics/
│   └── 3.3-devops/
│       ├── README.md
│       ├── local-config/
│       └── server-steps.md
├── systems/
│   ├── README.md
│   ├── shared/
│   │   ├── libraries/
│   │   ├── packages/
│   │   └── services/
│   └── [system-name]/
│       ├── README.md
│       ├── docs/
│       ├── frontend/
│       ├── backend/
│       ├── tests/
│       └── db/
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
│   ├── preparation/
│   │   └── README.md
│   ├── reviews/
│   ├── pitches/
│   └── projections/
├── 6-operations/
│   ├── README.md
│   ├── team/
│   │   └── README.md
│   ├── processes/
│   │   └── README.md
│   ├── legal/
│   │   └── README.md
│   ├── hr/
│   └── vendor-contracts/
├── 7-operations-monitoring/
│   ├── README.md
│   ├── system-monitoring/
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
│   ├── quarterly-retrospective/
│   └── scripts/
├── shared/
│   ├── README.md
│   ├── templates/
│   └── assets/
└── archives/
    └── README.md
```

## File Placement Rules

### Code Files
- **All code** goes in `systems/[system-name]/`
- **Single-system projects:** One directory in `systems/` (e.g., `systems/web-app/`)
- **Multi-system projects:** Multiple directories in `systems/` (e.g., `systems/web-app/`, `systems/mobile-app/`)
- **Shared code:** Place in `systems/shared/` for code used across systems

### Documentation Files
- **Market research:** `1-ideas/market-research/reports/`
- **Product requirements:** `2-product-foundation/requirements/` with canonical per-feature docs in `requirements/[feature-name]/README.md`
- **Architecture docs:** `3-technical/3.1-system-foundation/architecture/`
- **Implementation plans:** `3-technical/3.2-implementation/plans/`
- **Marketing docs:** `4-marketing/`
- **Financial docs:** `5-financing/`

### Initial vs Final Documents
- **Initial plans** live in `1-ideas/[department]/` (e.g., `finance/initial-financing-plan.md`, `marketing/initial-go-to-market-plan.md`)
- **Final versions** move to proper sections:
   - `finance/initial-financing-plan.md` → `5-financing/plans.md`
   - `marketing/initial-go-to-market-plan.md` → `4-marketing/go-to-market.md`
- When moving, leave a Markdown link pointing to the new location

## Naming Conventions

- **Files & Folders:** kebab-case (`product-overview.md`, `market-research/`)
- **Dates:** YYYY-MM-DD format
- **Versioned files:** `filename.v2025-12-09.md` (only in `archives/`)
- **All documents:** Markdown (.md)
- **Code files:** Follow language conventions (PascalCase for React components, camelCase for utilities)

## Important Notes

- **DO NOT modify `0-agents/`** - This directory contains agent definitions and must remain untouched
- **Every folder has a README.md** - Read it before taking action in that folder
- **Single source of truth** - Never duplicate information across folders
- **Update INDEX.md and changelog.md** after structural changes

---

**Remember:** When in doubt about file placement, consult this INDEX.md file first.
```

## README.md Templates

When creating README.md files for directories, use these templates:

### Root README.md Template
```markdown
# [Project Name] — AI-First Startup Factory

Welcome to the [Project Name] repository, organized using the AI-First Startup Factory structure.

## Quick Start

1. **Read [INDEX.md](INDEX.md)** - Understand the complete directory structure
2. **Follow [0-agents/_core/global-rules.md](0-agents/_core/global-rules.md)** - Repository rules and conventions
3. **Select the correct mode** - See [0-agents/mode/](0-agents/mode/) for available modes
4. **Use the right agent workflow** - See [0-agents/agents/](0-agents/agents/) for agent definitions

## Repository Structure

This repository follows the Factory template structure:
- **[0-agents/](0-agents/)** - AI agent definitions, modes, workflows, and skills
- **[1-ideas/](1-ideas/)** - Market research, initial plans
- **[2-product-foundation/](2-product-foundation/)** - Product overview, backlog, requirements
- **[3-technical/](3-technical/)** - System foundation, implementation, DevOps
- **[systems/](systems/)** - All code for all systems
- **[4-marketing/](4-marketing/)** - Go-to-market strategy
- **[5-financing/](5-financing/)** - Financing plans and projections
- **[6-operations/](6-operations/)** - Team, legal, HR
- **[7-operations-monitoring/](7-operations-monitoring/)** - Monitoring and analytics
- **[8-governance/](8-governance/)** - Project governance and documentation

For complete structure details, see [INDEX.md](INDEX.md).

## Important Rules

- **DO NOT modify `0-agents/`** - This directory contains agent definitions
- **Always read folder README.md** before taking action in that folder
- **Update INDEX.md and changelog.md** after structural changes
- **Follow naming conventions** - kebab-case for files and folders
```

### Section README.md Template (e.g., 1-ideas/README.md)
```markdown
# [Section Name] — [Purpose]

[Brief description of what this section contains]

## Contents

- **[Subdirectory 1/](subdirectory-1/)** - [Description]
- **[Subdirectory 2/](subdirectory-2/)** - [Description]

## Purpose

[Explain the purpose and scope]

## Navigation

- **Parent:** [../](../)
- **Related:** [../other-section/](../other-section/)

---

See [INDEX.md](../INDEX.md) for complete repository structure.
```

### Subdirectory README.md Template
```markdown
# [Subdirectory Name] — [Purpose]

[Brief description of what this subdirectory contains]

## Contents

- **[File or subdirectory]** - [Description]

## Purpose

[Explain the purpose and scope]

## Naming Conventions

- [Any specific naming conventions for this directory]

## Navigation

- **Parent:** [../](../)
- **Related:** [../../related/](../../related/)

---

See [INDEX.md](../../INDEX.md) for complete repository structure.
```

## Related Documents

- **[Boost Agent](../agents/boost.md)** - Primary agent for boost operations
- **[INDEX.md](../../INDEX.md)** - Target directory structure reference (create if doesn't exist)
- **[Global Rules](../_core/global-rules.md)** - Repository rules, including Task Validation Gate (rule 10.1) and Work-Item Traceability (rule 11)
- **[Work-Item Traceability System](../_core/work-item-traceability.md)** - Complete glossary, ID schema, metadata requirements, lifecycle tracking
- **[Product Strategist Agent](../agents/product-strategist.md)** - Who enforces Task Validation Gate and owns epic definition
- **[Orchestration Protocol](../workflows/orchestration-protocol.md)** - Includes Task Validation Gate as section 0 (ALWAYS FIRST)
- **[Docs Guardian Agent](../agents/docs-guardian.md)** - Structure verification (post-boost)

---

**Remember:** Boost Mode is a one-time setup operation.  
When in doubt, ask the user. Better to ask than to make a wrong assumption.
