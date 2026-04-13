# Project-Specific Agent Configuration

## Purpose

This directory contains project-specific agent overrides created by **Refactor Mode**. These overrides adapt Factory agents to work with your existing project structure.

## When This Directory Is Created

This directory is created automatically by Refactor Mode when:
- Your project structure differs from Factory standards
- Agents need to work with existing folders instead of Factory folders
- Custom naming conventions need to be supported

## Contents

Agent override files are created here as needed:
- `fullstack-engineer-override.md` - Code location overrides
- `docs-guardian-override.md` - Documentation path overrides
- `product-strategist-override.md` - Product path overrides
- `system-architecture-override.md` - Architecture path overrides
- etc.

## How Overrides Work

1. **Refactor Mode** analyzes your project structure
2. Identifies where agents need path overrides
3. Creates override files in this directory
4. Agents read overrides and adapt their behavior
5. Factory standard agents remain as reference

## Override File Format

Each override file follows this format:

```markdown
# [Agent Name] - Project Override

## Path Overrides

**Factory Standard:** `[factory-path]`
**Project Override:** `[project-path]`

## Updated Paths

- **Path 1:** `[project-path-1]`
- **Path 2:** `[project-path-2]`

## Notes

- [Why this override is needed]
- [Any special considerations]
```

## Related Documents

- **[Refactor Mode](../../mode/refactor.md)** - Mode that creates these overrides
- **[Refactor Agent](../../agents/refactor-agent.md)** - Agent responsible for creating overrides
- **[Global Rules](../_core/global-rules.md)** - Base rules that overrides extend

---

*This directory is created automatically by Refactor Mode. Do not manually create override files unless instructed by Refactor Agent.*
