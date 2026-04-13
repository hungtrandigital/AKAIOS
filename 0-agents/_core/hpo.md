# ORCHESTRATION PROTOCOL — AI-First Startup Factory (v2.1 2025-12-09)

This is the master coordination protocol.  
All AI agents (Claude, Cursor, Aider, Grok, DevGPT, Roo Code, etc.) must obey this 100% when working alone or in swarm.

────────────────────────────────────
CORE PRINCIPLES
1. Never work on the same file in parallel without explicit coordination
2. Always hand off with clear @mention syntax
3. Every agent ends its turn by updating INDEX.md + changelog.md
4. No phase may be skipped — review mode is mandatory

────────────────────────────────────
PHASE SEQUENCE & AGENT MATRIX

| Phase                  | Mode       | Primary Agent             | Supporting Agents                     | Output Location                               | Hand-off To               |
|-----------------------|------------|---------------------------|---------------------------------------|-----------------------------------------------|---------------------------|
| 0. Bootstrap          | —          | Human / docs-guardian     | —                                     | —                                             | @market-research          |
| 1. Market Research    | ideas      | market-research           | business-analyst                      | 1-ideas/market-research/                  | @product-strategist       |
| 2. Product Strategy   | ideas/plan | product-strategist        | creative-director, business-analyst   | 2-product-foundation/                         | @system-architecture      |
| 3. System Architecture| plan       | system-architecture       | ui-ux-designer                        | 3-technical/3.1-system-foundation/            | @fullstack-engineer       |
| 4. Implementation     | execution  | fullstack-engineer        | devops, code-reviewer                 | systems/[system-name]/ + 3.2-implementation/     | @code-reviewer            |
| 5. Review & Polish    | review     | code-reviewer             | docs-guardian, graphics-designer      | Comments + doc fixes                          | @marketing-expert         |
| 6. Marketing Assets   | execution  | marketing-expert          | creative-director, graphics-designer  | 4-marketing/                                  | @product-strategist (loop)|
| 7. Financing & Pitch  | plan       | business-analyst          | marketing-expert                      | 5-financing/                                  | Human approval            |
| 8. Monitoring Setup   | execution  | devops                    | fullstack-engineer                    | 7-operations-monitoring/                      | Launch ready              |

────────────────────────────────────
HAND-OFF MESSAGE TEMPLATE (copy-paste exactly)

@next-agent

**Phase completed**: [Name of phase just finished]  
**Mode**: execution (or ideas/plan/review)  
**Key outputs**:
- • [./relative/path/to/file1.md](link)
- • [./relative/path/to/file2.md](link)
**Progress updated**: 3-technical/3.2-implementation/status/progress.md  
**Changelog entry added**

**Next phase**: [Name of next phase]  
**Your mission**: [1–2 crystal-clear sentences]

Begin.

────────────────────────────────────
SWARM RULES
• Max 3 agents active simultaneously (unless human says otherwise)
• If stuck >10 min → ping @docs-guardian
• Emergency review command:
  @code-reviewer @docs-guardian EMERGENCY REVIEW — [reason]
• Docs-guardian has final veto on structure & documentation quality

────────────────────────────────────
MODE SWITCH COMMANDS (human or any agent may issue)
• SWITCH TO ideas     → stop everything, only brainstorm
• SWITCH TO plan       → freeze code, focus on specs/roadmaps
• SWITCH TO execution  → resume building
• SWITCH TO review     → mandatory audit before next phase

────────────────────────────────────
FORBIDDEN ACTIONS (instant termination)
• Writing code outside systems/[system-name]/
• Modifying anything inside 0-agents/ without human + docs-guardian approval
• Duplicating content instead of linking
• Skipping INDEX.md or changelog.md updates
• Jumping phases without hand-off message

────────────────────────────────────
FINAL NOTE TO ALL AGENTS

You are not building features.  
You are building a $100M company, one disciplined hand-off at a time.

Precision > speed.  
Structure > everything.

Execute.