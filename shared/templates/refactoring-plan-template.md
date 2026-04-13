# Refactoring Plan Template

Use this template when creating a refactoring plan in Refactor Mode.

## Structure Mapping

| Part | Objective | Current Folder | Suggested Action | Priority | Notes |
|------|-----------|----------------|------------------|----------|-------|
| Ideas | Store and analyze ideas | `[current-location]` or `not-available` | `[action]` | High/Medium/Low | [notes] |
| Product | Product requirements | `[current-location]` or `not-available` | `[action]` | High/Medium/Low | [notes] |
| Technical Docs | Technical documentation | `[current-location]` or `not-available` | `[action]` | High/Medium/Low | [notes] |
| Source Code | Source code storage | `[current-location]` | `[action]` | High | [notes] |
| Marketing | Marketing materials | `[current-location]` or `not-available` | `[action]` | Medium/Low | [notes] |
| Operations | Team, legal, HR | `[current-location]` or `not-available` | `[action]` | Medium/Low | [notes] |
| Governance | Versions, decisions, risks | `[current-location]` or `not-available` | `[action]` | Medium/Low | [notes] |

### Suggested Actions

- `Keep [current-folder]` - Keep as-is, update agents to work here
- `Create [factory-folder]` - Create new folder following Factory structure
- `Map [current-folder] → [factory-folder]` - Map current to Factory, keep both
- `Human decision - recommend [option]` - Requires human input

## Naming Conventions

### Current Naming Conventions

- **Files:** [camelCase/kebab-case/snake_case/PascalCase]
- **Folders:** [camelCase/kebab-case/snake_case/PascalCase]
- **Documentation:** [README.md/readme.md/README.txt/etc.]

### Factory Standard

- **Files:** kebab-case
- **Folders:** kebab-case
- **Documentation:** README.md

### Decision

- **Action:** [Keep current / Adopt Factory / Hybrid]
- **Rationale:** [Why this decision was made]

## Documentation Gaps

### Missing Documentation

- [ ] Root `README.md`
- [ ] `INDEX.md` for navigation
- [ ] Product overview
- [ ] Technical architecture docs
- [ ] [Other gaps found]

## Agent Adaptations Required

### @fullstack-engineer

**Current code location:** `[current-location]`  
**Factory standard:** `systems/[system-name]/`  
**Action:** Update to work with `[current-location]` instead of `systems/[system-name]/`

**Changes:**
- [ ] Update code location paths
- [ ] Update test location paths
- [ ] Update documentation paths
- [ ] [Other specific changes]

### @docs-guardian

**Current docs location:** `[current-location]`  
**Factory standard:** `3-technical/`  
**Action:** Update to check `[current-location]` instead of `3-technical/`

**Changes:**
- [ ] Update documentation paths
- [ ] Update archive paths
- [ ] Update link checking paths
- [ ] [Other specific changes]

### @product-strategist

**Current product location:** `[current-location]`  
**Factory standard:** `2-product-foundation/`  
**Action:** Update to work with `[current-location]` instead of `2-product-foundation/`

**Changes:**
- [ ] Update requirements paths
- [ ] Update backlog paths
- [ ] [Other specific changes]

### [Other agents as needed]

## Implementation Priority

### Must-Have (Critical for agents to work)

- [ ] Create essential missing folders
- [ ] Update critical agent paths
- [ ] Create root `README.md`
- [ ] Create `INDEX.md` based on current structure

### Should-Have (Improves organization)

- [ ] Create additional Factory folders
- [ ] Update remaining agent paths
- [ ] Fill documentation gaps
- [ ] Create project-specific agent configs

### Nice-to-Have (Future improvements)

- [ ] Gradually standardize naming conventions
- [ ] Create additional documentation
- [ ] Optimize structure further

## Confirmed Decisions

*[Fill in after Step 4: Review and Confirm Structure]*

- [Decision 1]
- [Decision 2]
- [Decision 3]

---

*This plan will be updated after human review and confirmation.*
