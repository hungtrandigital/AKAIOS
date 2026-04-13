---
name: planning
description: Use when you need to plan technical solutions that are scalable, secure, and maintainable.
license: MIT
---

# Planning

Create detailed technical implementation plans through research, codebase analysis, solution design, and comprehensive documentation.

## When to Use

Use this skill when:
- Planning new feature implementations
- Architecting system designs
- Evaluating technical approaches
- Creating implementation roadmaps
- Breaking down complex requirements
- Assessing technical trade-offs

## Core Responsibilities & Rules

Always honoring **YAGNI**, **KISS**, and **DRY** principles.
**Be honest, be brutal, straight to the point, and be concise.**

### 1. Research & Analysis
Load: `references/research-phase.md`
**Skip if:** Provided with researcher reports

### 2. Codebase Understanding
Load: `references/codebase-understanding.md`
**Skip if:** Provided with scout reports

### 3. Solution Design
Load: `references/solution-design.md`

### 4. Plan Creation & Organization
Load: `references/plan-organization.md`

### 5. Task Breakdown & Output Standards
Load: `references/output-standards.md`

## Workflow Process

1. **Initial Analysis** → Read codebase docs, understand context
2. **Research Phase** → Spawn researchers, investigate approaches
3. **Synthesis** → Analyze reports, identify optimal solution
4. **Design Phase** → Create architecture, implementation design
5. **Plan Documentation** → Write comprehensive plan
6. **Review & Refine** → Ensure completeness, clarity, actionability

## Output Requirements

- DO NOT implement code - only create plans
- Respond with plan file path and summary
- Ensure self-contained plans with necessary context
- Include code snippets/pseudocode when clarifying
- Provide multiple options with trade-offs when appropriate
- Fully respect `0-agents/workflows/development-rules.md` and the repository structure in `INDEX.md`.
- **MANDATORY:** Focus on quality standards and coverage requirements by default
- **MANDATORY:** Define quality metrics, success criteria, and coverage requirements
- **Timeline:** Only include timelines, schedules, or deadlines if user explicitly requests

**Plan Directory Structure (AI Factory)**

Plans live in `3-technical/3.2-implementation/plans/` and must follow the plan lifecycle rules in `0-agents/_core/global-rules.md`.

Recommended structure inside an active plan file/folder:
- Plan document: `3-technical/3.2-implementation/plans/active/[feature-name].md`
- Supporting notes: keep them inside the plan document unless @docs-guardian approves additional files

## Quality Standards

- Be thorough and specific
- Consider long-term maintainability
- Research thoroughly when uncertain
- Address security and performance concerns
- Make plans detailed enough for junior developers
- Validate against existing codebase patterns

**Remember:** Plan quality determines implementation success. Be comprehensive and consider all solution aspects.
