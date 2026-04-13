# Chat Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Default conversation mode for Q&A, scope finalization, and routing to structured modes

## Overview

Chat Mode is the default conversation mode for general discussion, Q&A, and idea finalization. This mode allows agents to understand and finalize ideas, clarify scope, and gather context before transitioning to structured work modes.

**Rule:** DO NOT transition to structured modes until scope is finalized.

## Agent Routing

- **Core owners:** `@product-strategist`, `@docs-guardian`
- **Specialist support:** Pull from `agency-agents/` divisions (`product/`, `strategy/`, `engineering/`, `design/`, `marketing/`)
- **Rule:** Specialists can deepen discussion but do not override task validation or mode boundaries

## When to Use Chat Mode

Use when:
- **Idea finalization** - Understanding and finalizing ideas before research/planning
- **Scope clarification** - Determining project scope, audience, and objectives
- **General conversation** - Casual chat, questions, and answers
- **Clarifications** - Asking for explanations or understanding concepts
- **No specific task** - When user just wants to chat without triggering structured workflow
- **Default mode** - When no other mode is explicitly specified

## Core Activities

### 0. Read Context (ALWAYS START HERE)

**Before starting conversation:**
1. Check if `shared/context/current-scope.md` exists and has content
2. Understand any existing scope before asking questions

### 1. Scope Finalization (PRIORITY)

**When user mentions an idea or concept, you MUST finalize scope:**

1. **Understand the Idea:**
   - What is the core concept or feature?
   - What problem does it solve?
   - Who is the target audience?

2. **Clarify Project Scope (CRITICAL):**
   - **Internal tool vs External product?**
   - **Project type:** Internal tool, SaaS product, feature addition, infrastructure
   - **Target audience:** Internal team, external customers
   - **Business context:** Revenue-generating, cost-saving, infrastructure improvement

3. **Ask Clarifying Questions (DO NOT ASSUME):**
   - "Is this an internal tool for your team, or an external product for customers?"
   - "What's the primary goal - efficiency, revenue, user experience?"
   - "Who will use this?"

4. **Finalize Scope Before Action:**
   - DO NOT automatically start market research for internal tools
   - DO NOT assume external product needs without confirmation
   - DO ask questions until scope is clear
   - DO summarize and confirm with user

### 2. Natural Conversation

- Answer questions truthfully
- Explain concepts clearly
- Provide guidance and recommendations

## Allowed Actions

✅ **You CAN:**
- Engage in natural conversation
- Ask clarifying questions to understand ideas and scope
- Finalize scope before suggesting actions
- Write to `shared/context/current-scope.md` (ONLY file allowed)
- Answer questions and provide explanations
- Reference existing files and documentation

## Forbidden Actions

❌ **You CANNOT:**
- Create files other than `shared/context/current-scope.md`
- Execute structured workflows (use ideas/plan/execution/review mode)
- Auto-research without scope confirmation
- Jump to structured work until scope is finalized
- Skip scope documentation

## Output Locations

**ONE allowed output:**
- `shared/context/current-scope.md` - Store finalized scope and context

**Format:** Update with:
- Project/Feature name
- Project type (Internal Tool / External Product)
- Target audience
- Primary goals
- Key requirements
- Constraints (if any)

## Mode Transition

Chat Mode transitions to:
- **ideas** → When scope finalized AND user wants research
- **plan** → When scope finalized AND user wants specs
- **execution** → When scope finalized AND user wants designs/assets
- **code** → When scope finalized AND user wants implementation

**Requirement:** Scope must be finalized before transition.

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Files created/modified**:
- `shared/context/current-scope.md` (if scope finalized)

**Next recommended agent**: @product-strategist (if scope finalized) OR continue chat  
**Next task**: "[What user might want to do next]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / Any questions that need clarification]
```

## Success Criteria

Chat Mode is successful when:
- ✅ Scope is finalized before suggesting structured work
- ✅ Clarifying questions are asked when ideas are mentioned
- ✅ Internal vs external is confirmed before research/planning
- ✅ No unnecessary files are created
- ✅ No automatic research without scope confirmation

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Primary Workflow](../workflows/primary-workflow.md)** - Default workflow
- **[Global Rules](../_core/global-rules.md)** - Repository rules

---

**Remember:** Chat Mode is for conversation. When user wants to create/modify files, transition to appropriate mode.