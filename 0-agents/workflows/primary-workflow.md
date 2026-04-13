# Primary Workflow — AI-First Startup Factory

**Version:** v3.2

This workflow is the **default operating system** for all work in this repository. AI must follow this sequence—no skipping, no guessing.

---

## Step 1: Pick the Right Mode (ALWAYS START HERE)

**DO NOT assume the mode. Ask the user or wait for them to specify.**

| User Wants | → | Use Mode |
|----------|---|---------|
| Q&A, clarify scope | → | **[chat](mode/chat.md)** |
| Research, validate ideas | → | **[ideas](mode/ideas.md)** |
| Specs, roadmaps, architecture | → | **[plan](mode/plan.md)** |
| Code, tests, infrastructure | → | **[code](mode/code.md)** |
| Designs, marketing assets | → | **[execution](mode/execution.md)** |
| Bug fixes, debugging | → | **[fix](mode/fix.md)** |
| Reviews, QA | → | **[review](mode/review.md)** |
| Full autonomous delivery | → | **[deliver](mode/deliver.md)** |
| New project setup | → | **[boost](mode/boost.md)** |
| Adapt existing project | → | **[refactor](mode/refactor.md)** |

**Rule:** Wait for user to specify mode. If unclear, ask.

---

## Step 2: Product & Business Inputs (only if building something new)

- **@business-analyst** → Market research, unit economics, realistic assumptions (with sources)
- **@product-strategist** → Requirements, acceptance criteria, success metrics

**Output must include:** measurable KPIs, leading indicators, explicit assumptions (no single-point projections)

---

## Step 3: Architecture (before code — REQUIRED)

**@system-architecture** creates:
- Tech stack selection
- Domain specs
- API contracts
- NFRs (Non-Functional Requirements)
- ADRs (Architecture Decision Records)

**Gate:** If any mandatory architecture doc is missing → STOP and request it (do not guess)

---

## Step 4: Plan the Work (before code changes)

- Check existing plans in `3-technical/3.2-implementation/plans/`
- Create/update implementation plan with metadata (status, type, priority, dates, epic, system)
- Keep plan task-oriented and test-first

---

## Step 5: Implement & Verify

- **@fullstack-engineer** → Implement in `systems/[system-name]/`
- Run compile/lint/tests locally (no "green by cheating")
- Use `debugging` + `sequential-thinking` skills when diagnosing

---

## Step 6: Review & Governance

- **@code-reviewer** → Approve/reject with explicit blockers
- **@docs-guardian** → Verify docs structure, links, domain specs

**Always update after changes:**
- `8-governance/changelog.md`
- `3-technical/3.2-implementation/status/progress.md` (if code-related)

---

## Step 7: Handoff

End every session with the **Orchestration Handoff Format** from the current mode file:

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Files created/modified**:
- `[path1]`
- `[path2]`

**Next recommended agent**: @agent-name  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List]
```

---

## Mode Files

All mode files share the same structure:
- [chat.md](mode/chat.md) - Conversation, scope finalization
- [ideas.md](mode/ideas.md) - Research, validation
- [plan.md](mode/plan.md) - Specifications, roadmaps
- [execution.md](mode/execution.md) - Designs, creative deliverables
- [code.md](mode/code.md) - Implementation, tests
- [review.md](mode/review.md) - QA, reviews
- [fix.md](mode/fix.md) - Bug fixes, debugging
- [boost.md](mode/boost.md) - Project initialization
- [deliver.md](mode/deliver.md) - Autonomous delivery
- [refactor.md](mode/refactor.md) - Adapt existing projects

---

## Summary

| Step | Action | Key Output |
|------|--------|------------|
| 1 | **Pick Mode** | Wait for user specification |
| 2 | Business Inputs | KPIs, requirements |
| 3 | Architecture | Domain specs, API contracts |
| 4 | Plan | Implementation plan |
| 5 | Implement | Code in `systems/[system-name]/` |
| 6 | Review | Approval/rejection |
| 7 | Handoff | Standard format |

---

**Remember:** 
- Step 1 is ALWAYS first—wait for mode specification
- No skipping steps
- Use standardized handoff format from mode files