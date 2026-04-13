# fix

Use **Fix Mode** for issue resolution, bug fixes, and problem-solving.

## Steps
1) Read `INDEX.md` for structure
2) Read `shared/context/current-scope.md` for project context
3) Follow `0-agents/mode/fix.md`
4) Classify issue: Fast Fix (small) or Hard Fix (complex)
5) Activate skills: `debugging`, `problem-solving`, `sequential-thinking` (from `0-agents/agents/skills/`)
6) Find root cause (not just symptoms)
7) Implement fix in `systems/[system-name]/`
8) Run tests using project's package manager
9) Update changelog in `8-governance/changelog.md`
10) Request @code-reviewer if fix is significant

## Issue Classification

**Fast Fix (Small Issues):**
- Simple, isolated problem
- Clear root cause
- Quick solution
- Single file or small scope

**Hard Fix (Complex Issues):**
- Complex, multi-faceted problem
- Unclear root cause
- Requires investigation and planning
- Multiple files or systems involved
- May need implementation plan in `3-technical/3.2-implementation/plans/`

## Output locations
- `systems/[system-name]/` (fixed code)
- `systems/[system-name]/tests/` (new or updated tests)
- `3-technical/3.2-implementation/plans/[fix-name].md` (if complex fix)
- `8-governance/changelog.md` (document the fix)
- Documentation updates (if fix affects docs)

## Handoff
Use the orchestration format in `0-agents/mode/fix.md` (`Current mode: fix`, issue type, root cause, files modified, fix summary, next agent).

