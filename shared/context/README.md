# Context & Scope Management

This directory stores finalized conversation context and project scope that has been clarified in Chat Mode. This context is shared across all modes and agents to ensure consistency and prevent scope drift.

## Purpose

When users discuss ideas in Chat Mode, the scope and context are finalized and stored here. Other modes (Ideas, Plan, Execution, Review) read this context to understand:
- What the project/feature is about
- Whether it's an internal tool or external product
- Target audience and purpose
- Project type and constraints
- Any other clarified requirements

## Files

### `current-scope.md`
**Primary context file** - Stores the current finalized scope and context.

**Structure:**
- Project/Feature Name
- Project Type (Internal Tool / External Product / Feature Addition / etc.)
- Target Audience
- Primary Goals
- Scope & Constraints
- Clarified Requirements
- Last Updated

**Who can modify:**
- **Chat Mode:** Can create and update when finalizing scope
- **Ideas Mode:** Can read and suggest updates if research reveals scope issues
- **Plan Mode:** Can read and suggest updates if planning reveals scope issues
- **Code Mode:** Can read to understand context
- **Review Mode:** Can read to validate against scope

## Workflow

1. **Chat Mode finalizes scope** → Updates `current-scope.md`
2. **Ideas/Plan Mode reads scope** → Uses context for research/planning
3. **If scope issues found** → Mode asks user and updates `current-scope.md`
4. **Code Mode reads scope** → Ensures implementation aligns with context

## Rules

- ✅ Always read `current-scope.md` before starting structured work
- ✅ If scope is unclear or missing, ask user to finalize in Chat Mode first
- ✅ If you find scope issues during work, ask user and update the file
- ✅ Keep scope concise and actionable
- ❌ Don't create duplicate scope files
- ❌ Don't modify scope without user confirmation

## Related Documents

- **[Chat Mode](../../0-agents/mode/chat.md)** - Where scope is finalized
- **[Ideas Mode](../../0-agents/mode/ideas.md)** - Reads scope for research
- **[Plan Mode](../../0-agents/mode/plan.md)** - Reads scope for planning
- **[Global Rules](../../0-agents/_core/global-rules.md)** - Repository rules

