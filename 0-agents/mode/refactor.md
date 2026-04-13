# Refactor Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Adapt the Factory to existing projects without major restructuring

## Overview

Refactor Mode is for teams with existing source code who want to adopt Factory processes without major refactoring. Analyzes current structure, maps to Factory standards, adapts agents to work with existing structure.

**Key Principles:**
1. **Respect existing structure** - Don't force major changes
2. **Map, don't replace** - Map current to Factory concepts
3. **Adapt agents** - Update agents to work with existing structure
4. **Gradual improvement** - Suggest, don't mandate

## Agent Routing

- **Core owners:** `@refactor-agent`, `@docs-guardian`, `@product-strategist`
- **Specialist support:** Pull from `agency-agents/` divisions (`project-management/`, `engineering/`)
- **Rule:** Adapts operating model to project; does not weaken documentation rules

## When to Use Refactor Mode

Use when:
- Have **existing project** with source code
- Want to **adopt Factory processes** without major restructuring
- Want to **preserve current structure** as much as possible
- Want agents to **work with existing folders** instead of forcing new structure

## Core Activities

### 1. Analyze Current Project

1. Scan project directory structure
2. Identify existing folders and purposes
3. Detect naming conventions
4. Find existing documentation
5. Map structure to Factory concepts

### 2. Create Structure Mapping

1. Create `structure-mapping.md`
2. Map current folders to Factory concepts
3. Identify gaps vs Factory structure

### 3. Adapt Agents

1. Update agent paths to match existing structure
2. Create agent overrides in `0-agents/workflows/project-config/`

### 4. Document Decisions

1. Document mapping in `8-governance/decision-log.md`
2. Suggest gradual improvements

## Allowed Actions

✅ **You CAN:**
- Analyze existing project structure
- Map folders to Factory concepts
- Create agent overrides
- Suggest gradual improvements

## Forbidden Actions

❌ **You CANNOT:**
- Force major restructuring
- Move existing code files
- Change governance model

## Output Locations

- **Mapping:** `refactoring/structure-mapping.md`
- **Decisions:** `8-governance/decision-log.md`
- **Agent overrides:** `0-agents/workflows/project-config/`

## Mode Transition

Refactor Mode transitions to:
- **chat** → When adaptation complete
- **ideas** → When ready for research
- **plan** → When ready for specs

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Phase**: [Analysis/Mapping/Adaptation/Complete]

**Structure mapping created**: [Yes/No]
**Agent overrides**: [Count]

**Next recommended agent**: @docs-guardian (to verify) OR continue chat  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Existing structure respected
- ✅ Mapping documented
- ✅ Agents adapted to work with existing structure
- ✅ Governance rules maintained

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Refactor Agent](../agents/core-agents/refactor-agent.md)**

---

**Remember:** Refactor Mode adapts—not replaces—existing structure.