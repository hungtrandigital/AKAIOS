# Boost Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** One-time project initialization and structure setup for new or messy repositories

## Overview

Boost Mode is for setting up a new project or reorganizing an existing codebase into the factory template structure. Creates directory structure, analyzes files, migrates them to correct locations.

**When to use:** Only for initial setup or major restructuring. Not regular development.

## Agent Routing

- **Core owners:** `@boost`, `@docs-guardian`, `@refactor-agent`
- **Specialist support:** Pull from `agency-agents/` divisions (`project-management/`, `engineering/`)
- **Rule:** Creates skeleton; does not change governance model

## When to Use Boost Mode

Use when:
- **New project setup** - Only `0-agents/` exists
- **Restructuring** - Existing messy codebase
- **Template adoption** - Factory template implementation

## Core Activities

### 1. Create Directory Structure

1. Read `INDEX.md` for target structure
2. Create all directories (up to 4-5 levels deep)
3. Create README.md for each directory
4. Create placeholder files

### 2. Analyze Existing Codebase

- Scan files not in `0-agents/`
- Categorize by type (code, docs, config, tests)
- Identify target locations

### 3. Plan Migration (if restructuring)

- Report analysis to user
- Get confirmation before moving files

### 4. Execute Migration

- Move files to correct locations
- Update references
- Apply naming conventions

## Allowed Actions

✅ **You CAN:**
- Create directory structure
- Migrate files to correct locations
- Apply naming conventions
- Create placeholder files

## Forbidden Actions

❌ **You CANNOT:**
- Modify anything in `0-agents/`
- Create without reading INDEX.md first
- Delete files (only move)

## Output Locations

- **Structure:** All directories per `INDEX.md`
- **Placeholders:** Essential files per template
- **Migration log:** Document changes

## Mode Transition

Boost Mode transitions to:
- **chat** → When setup complete
- **ideas** → When ready for research
- **plan** → When ready for specs

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Phase**: [Structure Creation / Analysis / Migration / Complete]

**Directories created**: [Count]
**Files analyzed**: [Count]
**Files moved**: [Count]

**Next recommended agent**: @docs-guardian (to verify) OR continue chat  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ INDEX.md exists and followed
- ✅ All directories created per structure
- ✅ README.md created for each directory
- ✅ Files migrated correctly

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[INDEX.md](../../INDEX.md)** - Structure definition

---

**Remember:** Boost Mode is one-time setup—not regular development.