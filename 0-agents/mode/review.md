# Review Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Quality assurance phase for code, designs, documentation, and process reviews

## Overview

Review Mode is for evaluating, validating, and improving deliverables before they're finalized or deployed.

**Rule:** DO NOT approve without thorough review.

## Agent Routing

- **Core owners:** `@code-reviewer`, `@docs-guardian`, `@creative-director`
- **Specialist support:** Pull from `agency-agents/` divisions (`engineering/`, `testing/`, `design/`)
- **Rule:** Findings centralized through factory review outputs

## When to Use Review Mode

Use when:
- **Code Review** - Before merge/deployment
- **Design Review** - Brand compliance and quality
- **Documentation Review** - Accuracy and completeness
- **Quality Assurance** - Standards validation

## Core Activities

### 1. Code Review

Check:
- [ ] Code follows coding standards
- [ ] No syntax or type errors
- [ ] Tests pass, coverage ≥90%
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Accessibility compliance (if frontend)

### 2. Design Review

Check:
- [ ] Aligns with brand guidelines
- [ ] WCAG 2.1 AA accessibility
- [ ] Quality production-ready
- [ ] Consistent with design system

### 3. Documentation Review

Check:
- [ ] Accurate and current
- [ ] Complete (all required sections)
- [ ] Links are valid

### 4. Run Automated Checks

- Linting
- Type checking
- Tests
- Accessibility (for frontend)

## Allowed Actions

✅ **You CAN:**
- Review code, designs, docs
- Provide feedback and recommendations
- Approve or reject deliverables
- Request improvements

## Forbidden Actions

❌ **You CANNOT:**
- Approve with critical issues (security, violations)
- Skip automated checks
- Approve without review
- Make changes directly (provide feedback)

## Output Locations

- **Reviews:** `8-governance/reviews/`
- **Assessments:** `8-governance/assessments/`
- **Changelog:** `8-governance/changelog.md`

## Mode Transition

Review Mode transitions to:
- **code** → When fixes needed
- **execution** → When design fixes needed
- **plan** → When planning gaps reveal
- **deliver** → When approved

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No]  
**Feature/Epic**: [Description]

**Files reviewed**:
- `[file-paths]`

**Review verdict**: [APPROVED/REJECTED/MINOR_CHANGES_REQUIRED]

**Key findings**:
- [X] Critical issues
- [X] Major issues
- [X] Minor issues

**Next recommended agent**: @fullstack-engineer (if rejected) OR @devops (if approved)  
**Next task**: "[Clear task]"  
**Priority**: [Critical/High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ All standards enforced
- ✅ Critical issues caught
- ✅ Feedback actionable
- ✅ No security vulnerabilities

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Code Reviewer Agent](../agents/core-agents/code-reviewer.md)**

---

**Remember:** Review Mode is the quality gate.