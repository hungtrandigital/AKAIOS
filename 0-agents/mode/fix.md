# Fix Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Issue resolution phase for bug fixes, debugging, and problem-solving

## Overview

Fix Mode is for analyzing and fixing issues—both quick fixes and complex problems. This mode focuses on problem-solving and resolution.

**Rule:** ALWAYS classify issue as Fast Fix or Hard Fix first.

## Agent Routing

- **Core owners:** `@fullstack-engineer`, `@devops`, `@docs-guardian`
- **Specialist support:** Pull from `agency-agents/` divisions (`engineering/`, `testing/`, `support/`)
- **Rule:** Bug fix, changelog, and file placement follow factory rules

## When to Use Fix Mode

Use when:
- **Fixing bugs** - Code bugs, errors, failures
- **Quick issues** - Simple fixes under 30 minutes
- **Complex issues** - Problems needing investigation
- **Test failures** - CI/CD or test issues
- **Emergency fixes** - Critical issues needing immediate resolution

## Core Activities

### 0. Classify Issue (ALWAYS START HERE)

**Fast Fix (Quick Issues):**
- Single file scope
- Clear root cause
- Under 30 minutes

**Hard Fix (Complex Issues):**
- Multi-file scope
- Unclear root cause
- Needs investigation

### 1. Investigate

- Reproduce the issue
- Identify root cause
- Use `debugging` skill for complex problems

### 2. Fix

- Implement fix
- Write tests to prevent regression

### 3. Verify

- Run tests
- Ensure all checks pass

### 4. Update Changelog

- Document fix in `8-governance/changelog.md`

## Allowed Actions

✅ **You CAN:**
- Fix code in `systems/[system-name]/`
- Write regression tests
- Update changelog
- Call @docs-guardian for domain specs if structure changes

## Forbidden Actions

❌ **You CANNOT:**
- Skip root cause analysis
- Leave failing tests
- Skip changelog update

## Output Locations

- **Fixed code:** `systems/[system-name]/`
- **Tests:** `systems/[system-name]/tests/`
- **Changelog:** `8-governance/changelog.md`

## Mode Transition

Fix Mode transitions to:
- **review** → When fix needs verification
- **plan** → When issue reveals planning gaps
- **code** → When implementation needed

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Issue Type**: [Fast Fix / Hard Fix]  
**Root Cause**: [What was the cause?]

**Files modified**:
- `systems/[system-name]/[paths]`
- `systems/[system-name]/tests/[paths]`
- `8-governance/changelog.md`

**Next recommended agent**: @code-reviewer (to verify) OR continue fix  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Root cause identified
- ✅ Tests pass after fix
- ✅ Changelog updated

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Primary Workflow](../workflows/primary-workflow.md)**

---

**Remember:** Fix Mode is for resolution—not new features.