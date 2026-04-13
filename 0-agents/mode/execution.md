# Execution Mode — AI-First Startup Factory

**Version:** v3.2
**Purpose:** Strategic and creative execution phase for designs, marketing assets, and content deliverables

## Overview

Execution Mode is for creating actual deliverables—designs, graphics, marketing assets, and content—based on approved plans and brand guidelines.

**Rule:** DO NOT execute without approved plans from Plan Mode.

## Agent Routing

- **Core owners:** `@ui-ux-designer`, `@graphics-designer`, `@marketing-expert`, `@creative-director`
- **Specialist support:** Pull from `agency-agents/` divisions (`design/`, `marketing/`, `paid-media/`)
- **Rule:** Specialists shape quality but outputs land in canonical folders

## When to Use Execution Mode

Use when:
- **UI/UX designs** - Wireframes, prototypes, high-fidelity mockups
- **Graphics** - Illustrations, icons, visual assets
- **Marketing assets** - Ad creatives, social media graphics
- **Content** - Copy, landing pages, email sequences
- **Pitch materials** - Pitch deck visuals

## Core Activities

### 0. Read Plans (ALWAYS START HERE)

**Before execution:**
1. Read `shared/context/current-scope.md`
2. Read plans from Plan Mode:
   - Product requirements from `2-product-foundation/requirements/`
   - Marketing strategy from `4-marketing/go-to-market.md`
   - Brand guidelines from `shared/assets/`
3. Verify deliverables align with plans

### 1. Execute Deliverables

**Design:**
- Follow brand guidelines
- Ensure WCAG 2.1 AA accessibility
- Use design system

**Marketing:**
- Follow GTM strategy
- Match brand voice
- Track performance metrics

**Creative:**
- Get Creative Director approval for brand work
- Document brand usage guidelines

## Allowed Actions

✅ **You CAN:**
- Create designs in `shared/assets/`
- Create marketing assets in `4-marketing/`
- Create pitch materials in `5-financing/pitches/`
- Update progress and changelog
- Get Creative Director approval

## Forbidden Actions

❌ **You CANNOT:**
- Execute without approved plans (return to Plan Mode first)
- Skip Creative Director approval for brand work
- Create technical deliverables (use Code Mode)

## Output Locations

- **Designs:** `shared/assets/`
- **Marketing:** `4-marketing/`
- **Pitch Materials:** `5-financing/pitches/`
- **Progress:** `3-technical/3.2-implementation/status/progress.md`
- **Changelog:** `8-governance/changelog.md`

## Mode Transition

Execution Mode transitions to:
- **review** → When deliverables need approval
- **code** → When design assets need implementation
- **plan** → When plans need clarification

## Orchestration Handoff Format

```markdown
### ORCHESTRATION HANDOFF

**Task completed**: [Yes/No/Partial]  
**Feature/Epic**: [Description]

**Deliverable Type**: [Design/Content/Creative Asset]

**Files created/modified**:
- `shared/assets/[paths]` OR
- `4-marketing/[paths]` OR
- `5-financing/pitches/[paths]`

**Brand Alignment**: [Yes/No]  
**Creative Director Approved**: [Pending/Approved]

**Next recommended agent**: @creative-director (if approval needed) OR @code-reviewer (to review)  
**Next task**: "[Clear task]"  
**Priority**: [High/Medium/Low]

**Blockers/Issues**: [None / List any blockers]
```

## Success Criteria

- ✅ Plans read before execution
- ✅ Brand guidelines followed
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Creative Director approval for brand work

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[UI/UX Designer Agent](../agents/core-agents/ui-ux-designer.md)**
- **[Creative Director Agent](../agents/core-agents/creative-director.md)**

---

**Remember:** Execution Mode is for deliverables—not implementation.