# Review Mode — AI-First Startup Factory

**Version:** v3.1  
**Purpose:** Define the scope, activities, and workflow for Review Mode

## Overview

Review Mode is the quality assurance phase where agents evaluate, validate, and improve deliverables from other modes. This mode focuses on ensuring quality, correctness, compliance, and alignment with standards before deliverables are finalized or deployed.

## Agent Routing

Review Mode is led by the factory review owners and can borrow specialist reviewers by domain.

- **Core owners:** `@code-reviewer`, `@docs-guardian`, `@creative-director`.
- **Specialist support:** use [../agents/agency-agents/](../agents/agency-agents/) divisions such as `engineering/`, `testing/`, `design/`, and `specialized/` for targeted QA, accessibility, security, compliance, or evidence gathering.
- **Rule:** findings are centralized through the factory review outputs and governance docs, even when specialist reviewers are involved.

## When to Use Review Mode

Use Review Mode when:
- **Code Review** - Reviewing code changes before merge/deployment
- **Design Review** - Reviewing designs for brand compliance and quality
- **Documentation Audit** - Reviewing documentation for accuracy and completeness
- **Quality Assurance** - Validating deliverables meet standards
- **Retrospectives** - Conducting quarterly retrospectives and lessons learned
- **Compliance Check** - Ensuring compliance with standards, regulations, policies

## Core Activities

### 1. Code Review
- **Code Quality:** Review code for quality, readability, maintainability
- **Standards Compliance:** Ensure code follows `development-rules.md` and `coding-standards.md`
- **Security:** Check for security vulnerabilities
- **Performance:** Review performance implications
- **Test Coverage:** Verify test coverage 100% for new code
- **Accessibility:** Check accessibility compliance (WCAG 2.1 AA for frontend)

### 2. Design Review
- **Brand Compliance:** Ensure designs align with brand guidelines
- **Accessibility:** Verify designs meet accessibility standards
- **Quality:** Review design quality and consistency
- **Usability:** Evaluate user experience and usability

### 3. Documentation Review
- **Accuracy:** Verify documentation is accurate and up-to-date
- **Completeness:** Ensure all required documentation exists
- **Link Validation:** Check all links are valid
- **Structure:** Verify documentation follows structure guidelines

### 4. Process Review
- **Retrospectives:** Conduct quarterly retrospectives in `8-governance/quarterly-retrospective/`
- **Decision Validation:** Review ADRs and decisions
- **Risk Assessment:** Review and update risk register
- **Compliance:** Ensure compliance with policies and regulations

### 5. Quality Assurance
- **Standards Compliance:** Verify deliverables meet all standards
- **Requirements Validation:** Ensure deliverables meet requirements
- **Testing Validation:** Verify tests are comprehensive and passing

## Allowed Actions

✅ **You CAN:**
- Review code, designs, documentation, plans
- Provide feedback and recommendations
- Request changes or improvements
- Approve or reject deliverables
- Update quality standards and guidelines
- Conduct retrospectives and lessons learned
- Update risk register based on findings
- Fix documentation issues (broken links, outdated content)

## Forbidden Actions

❌ **You CANNOT:**
- Approve code with critical issues (security, architecture violations)
- Skip automated checks (linting, type checking, tests)
- Approve without review (must review all deliverables)
- Ignore standards (must enforce all standards)
- Make changes directly (provide feedback, let creator fix)
- Approve "good enough" code (must meet all standards)
- Skip security checks (security is non-negotiable)

## Review Criteria

### Code Review Must Check:
- [ ] Code follows coding standards
- [ ] No syntax or type errors
- [ ] Tests pass and coverage ≥90%
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Accessibility compliance (if frontend)
- [ ] Error handling is proper
- [ ] Documentation is complete

### Design Review Must Check:
- [ ] Aligns with brand guidelines
- [ ] Meets accessibility standards (WCAG 2.1 AA)
- [ ] Quality is production-ready
- [ ] Consistent with design system
- [ ] Usable and intuitive

### Documentation Review Must Check:
- [ ] Accurate and current
- [ ] Complete (all required sections)
- [ ] Links are valid
- [ ] Follows structure guidelines
- [ ] Properly formatted

## Output Locations

Review Mode outputs go to:
- **Code Review Comments:** In PR/comments or review document
- **Review Reports:** `8-governance/reviews/`
- **Assessments & Audits:** `8-governance/assessments/`, `8-governance/audits/`
- **Retrospectives:** `8-governance/quarterly-retrospective/[quarter].md`
- **Risk Updates:** `8-governance/risk-register.md`
- **Changelog:** `8-governance/changelog.md` (for review actions)

## Mode Transition

Review Mode typically transitions to:
- **Code Mode** - When reviews require code fixes or improvements
- **Execution Mode** - When reviews require design or content fixes
- **Plan Mode** - When reviews reveal planning gaps
- **Review Mode** (continue) - When re-reviewing after fixes

## Review Workflow

1. **Receive Deliverable** - Get code/design/documentation to review
2. **Run Automated Checks** - Linting, type checking, tests, accessibility
3. **Manual Review** - Review against standards and requirements
4. **Document Findings** - Create review report with findings
5. **Make Decision** - APPROVED / REJECTED / MINOR_CHANGES_REQUIRED
6. **Provide Feedback** - Give specific, actionable feedback
7. **Follow Up** - Ensure issues are addressed in re-review

## Orchestration Handoff Format

When in Review Mode, use this format:

```markdown
**Current mode**: review  
**Task completed**: [Yes/No]  
**Review verdict**: [APPROVED/REJECTED/MINOR_CHANGES_REQUIRED]

**Files reviewed**:
- `[file-paths]`

**Review summary**:
- [X] Critical issues found
- [X] Major issues found
- [X] Minor issues found
- [X] All tests passing
- [X] Coverage: [X%]

**Next recommended agent**: 
- If REJECTED: @fullstack-engineer OR @ui-ux-designer (to fix)
- If APPROVED: @devops OR @docs-guardian (to proceed)
- If MINOR_CHANGES: @fullstack-engineer OR @ui-ux-designer (to address)

**Next task**: "[Clear task description based on review outcome]"  
**Priority**: [Critical/High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

Review Mode is successful when:
- ✅ All deliverables meet quality standards
- ✅ Critical issues are caught before production
- ✅ Security vulnerabilities are identified and fixed
- ✅ Code quality consistently improves
- ✅ Standards are enforced consistently
- ✅ Feedback is actionable and constructive
- ✅ Review process is efficient and thorough

## Related Documents

- **[Code Reviewer Agent](../agents/code-reviewer.md)** - Primary agent for code review
- **[Docs Guardian Agent](../agents/docs-guardian.md)** - Documentation review
- **[Creative Director Agent](../agents/creative-director.md)** - Design review
- **[Development Rules](../workflows/development-rules.md)** - Code quality standards
- **[Primary Workflow](../workflows/primary-workflow.md)** - Overall workflow context
- **[Global Rules](../_core/global-rules.md)** - Repository rules and constraints

---

**Remember:** Review Mode is about ensuring quality and compliance.  
Be thorough. Be fair. Be constructive.
