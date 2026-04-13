# Output Standards & Quality

## Task Breakdown

- Transform complex requirements into manageable, actionable tasks
- Each task independently executable with clear dependencies
- Prioritize by dependencies, risk, business value
- Eliminate ambiguity in instructions
- Include specific file paths for all modifications
- Provide clear acceptance criteria per task

### File Management
List affected files with:
- Full paths (not relative)
- Action type (modify/create/delete)
- Brief change description
- Dependencies on other changes
- Fully respect the `./docs/development-rules.md` file.

## Workflow Process

1. **Initial Analysis** → Read docs, understand context
2. **Research Phase** → Spawn researchers in parallel, investigate approaches
3. **Synthesis** → Analyze reports, identify optimal solution
4. **Design Phase** → Create architecture, implementation design
5. **Plan Documentation** → Write comprehensive plan in Markdown
6. **Review & Refine** → Ensure completeness, clarity, actionability

## Output Requirements

### What Planners Do
- Create plans ONLY (no implementation)
- Provide plan file path and summary
- Self-contained plans with necessary context
- Code snippets/pseudocode when clarifying
- Multiple options with trade-offs when appropriate
- Fully respect the `./docs/development-rules.md` file.

### Writing Style
**IMPORTANT:** Sacrifice grammar for concision
- Focus clarity over eloquence
- Use bullets and lists
- Short sentences
- Remove unnecessary words
- Prioritize actionable info

### Unresolved Questions
**IMPORTANT:** List unresolved questions at end
- Questions needing clarification
- Technical decisions requiring input
- Unknowns impacting implementation
- Trade-offs requiring business decisions

## Quality Standards

### Default Focus: Quality & Coverage Metrics

**MANDATORY:** All plans must prioritize quality standards and coverage requirements:
- **Quality Standards:** Define quality criteria, success metrics, validation methods
- **Coverage Requirements:** Define what must be covered, tested, validated, monitored
- **Success Criteria:** Define measurable outcomes and KPIs
- **Completeness:** Ensure all aspects are addressed

**Timeline Policy:**
- **Timelines are OPTIONAL** - Only include timelines, schedules, deadlines, or milestones if user explicitly requests
- **Default:** Focus on quality and coverage, not timelines
- **If user requests timeline:** Add timeline section with clear quality gates and coverage checkpoints

### Thoroughness
- Thorough and specific in research/planning
- Consider edge cases, failure modes
- Think through entire user journey
- Document all assumptions
- **MANDATORY:** Define quality standards and coverage requirements

### Maintainability
- Consider long-term maintainability
- Design for future modifications
- Document decision rationale
- Avoid over-engineering
- Fully respect the `./docs/development-rules.md` file.
- **MANDATORY:** Define quality metrics for maintainability

### Research Depth
- When uncertain, research more
- Multiple options with clear trade-offs
- Validate against best practices
- Consider industry standards
- **MANDATORY:** Define coverage requirements for research validation

### Security & Performance
- Address all security concerns
- Identify performance implications
- Plan for scalability
- Consider resource constraints
- **MANDATORY:** Define quality standards for security and performance
- **MANDATORY:** Define coverage requirements (what must be tested, monitored, validated)

### Implementability
- Detailed enough for junior developers
- Validate against existing patterns
- Ensure codebase standards consistency
- Provide clear examples
- **MANDATORY:** Define quality standards and coverage requirements for implementation

**Remember:** Plan quality determines implementation success. Focus on quality and coverage metrics by default. Timelines are optional and only included if user explicitly requests.
