# Chat Mode — AI-First Startup Factory

**Version:** v3.1  
**Purpose:** Define the scope, activities, and workflow for Chat Mode (default conversation mode)

## Overview

Chat Mode is the default conversation mode for general discussion, Q&A, and **idea finalization**. This mode allows agents to engage in natural conversation to understand and finalize ideas, clarify scope, and gather context before transitioning to structured work modes. Use Chat Mode to finalize ideas and scope, ask clarifying questions, and ensure you understand the user's intent before suggesting any research, planning, or execution.

## Agent Routing

Chat Mode is a routing layer, not a delivery layer.

- **Core owners:** `@product-strategist` for scope and task framing, `@docs-guardian` for structure and documentation guidance.
- **Specialist support:** pull from [../agents/agency-agents/](../agents/agency-agents/) when the conversation needs sharper domain framing, such as `product/`, `strategy/`, `engineering/`, `design/`, or `marketing/`.
- **Rule:** specialists can deepen the discussion, but they do not override task validation, mode boundaries, or canonical file placement.

## When to Use Chat Mode

Use Chat Mode when:
- **Idea finalization** - Understanding and finalizing ideas before research/planning
- **Scope clarification** - Determining project scope, audience, and objectives
- **General conversation** - Casual chat, questions, and answers
- **Clarifications** - Asking for explanations or understanding concepts
- **Brainstorming discussions** - Informal idea exchange without committing to documentation
- **Learning and exploration** - Understanding how things work, exploring concepts
- **No specific task** - When the user just wants to chat without triggering a structured workflow
- **Default mode** - When no other mode is explicitly specified

## Core Activities

### 1. Idea Finalization & Scope Clarification (PRIORITY)

**When user mentions an idea or concept, you MUST finalize scope before suggesting any actions:**

1. **Understand the Idea:**
   - What is the core concept or feature?
   - What problem does it solve?
   - Who is the target audience?

2. **Clarify Project Scope (CRITICAL):**
   - **Internal tool vs External product?** - Is this for internal use or external customers?
   - **Project type:** Internal tool, SaaS product, feature addition, infrastructure, etc.
   - **Target audience:** Internal team, external customers, specific user segment
   - **Business context:** Revenue-generating product, cost-saving tool, infrastructure improvement
   - **Timeline & urgency:** Is this urgent, planned, or exploratory?
   - **Tech stack preferences (optional):** Does user have preferences for programming languages, frameworks, or platforms?

3. **Ask Clarifying Questions (DO NOT ASSUME):**
   - "Is this an internal tool for your team, or an external product for customers?"
   - "What's the primary goal - efficiency, revenue, user experience?"
   - "Who will use this - internal team, external users, or both?"
   - "Is this part of an existing product or a new initiative?"
   - "What's the expected scope - MVP, full feature, or exploration?"
   - "Do you have any tech stack preferences? (e.g., Python, Node.js, React, etc.)" (Optional - only if relevant)

4. **Finalize Scope Before Action:**
   - **DO NOT** automatically start market research for internal tools
   - **DO NOT** assume external product needs without confirmation
   - **DO NOT** jump to planning/execution without understanding scope
   - **DO** ask questions until scope is clear
   - **DO** summarize understanding and confirm with user

### 2. Natural Conversation
- **Answer questions** - Provide helpful, accurate information
- **Explain concepts** - Clarify how things work in the factory
- **Discuss ideas** - Engage in brainstorming and discussion
- **Provide guidance** - Offer advice and recommendations

### 3. Information Sharing
- **Share knowledge** - Explain processes, workflows, and best practices
- **Reference documentation** - Point to relevant files and resources
- **Clarify structure** - Help understand the factory's organization
- **Explain agent roles** - Describe what different agents do

### 4. Exploration & Learning
- **Explore concepts** - Discuss ideas without committing to documentation
- **Understand workflows** - Learn how different modes and agents work
- **Review examples** - Look at existing files and structures

## Allowed Actions

✅ **You CAN:**
- Engage in natural conversation
- **Ask clarifying questions** to understand ideas and scope
- **Finalize scope** before suggesting any actions
- **Write to `shared/context/current-scope.md`** - This is the ONLY file Chat Mode can create/update. Use it to store finalized scope and context.
- Answer questions and provide explanations
- Reference existing files and documentation
- Discuss ideas and concepts
- Provide guidance and recommendations
- Explain how the factory works
- Help users understand structure and workflows
- Read files to answer questions
- Search for information to provide accurate answers (but NOT for research without scope confirmation)

## Forbidden Actions

❌ **You CANNOT:**
- **Create files** - Chat Mode is for conversation only, EXCEPT `shared/context/current-scope.md` which you MUST update when finalizing scope
- **Modify files** - No file modifications in Chat Mode, EXCEPT `shared/context/current-scope.md` for scope finalization
- **Execute structured workflows** - Use appropriate mode (ideas/plan/execution/review) for structured work
- **Make commitments** - Don't commit to creating deliverables in Chat Mode
- **Skip to execution** - If user wants to create/modify files, transition to appropriate mode
- **Auto-research without scope** - DO NOT automatically start market research, competitive analysis, or planning when user mentions an idea
- **Assume scope** - DO NOT assume internal vs external, product vs tool, without asking
- **Jump to structured work** - DO NOT transition to ideas/plan/execution/code mode until scope is finalized
- **Skip scope documentation** - DO NOT finalize scope without updating `shared/context/current-scope.md`

## Output Locations

Chat Mode has **ONE allowed output file**:

### `shared/context/current-scope.md`
**Purpose:** Store finalized scope and context from conversation

**When to update:**
- After finalizing scope through clarifying questions
- When user confirms project type, audience, goals, and constraints
- Before transitioning to structured modes (ideas/plan/execution)

**What to include:**
- Project/Feature name and type (Internal Tool / External Product / etc.)
- Target audience
- Primary goals
- Key requirements
- Constraints and limitations
- Any other clarified details

**Format:** Use the template structure in `shared/context/current-scope.md`

**If user wants to create or modify other files:**
- Transition to appropriate mode (ideas/plan/execution/review)
- Ask user which mode they want to use
- Or suggest the appropriate mode based on the task

## Mode Transition

Chat Mode can transition to:
- **Boost Mode** - When user wants to initialize new project or restructure existing codebase
- **Ideas Mode** - When scope is finalized AND user wants to explore/research/validate ideas (especially for external products)
- **Plan Mode** - When scope is finalized AND user wants to create plans or specifications
- **Execution Mode** - When scope is finalized AND user wants to create designs, marketing assets, or content
- **Code Mode** - When scope is finalized AND user wants to write code or configure infrastructure
- **Review Mode** - When user wants to review existing work

**Transition Requirements:**
1. **Scope must be finalized** - You understand:
   - Internal tool vs external product
   - Target audience and purpose
   - Project type and context
2. **User explicitly requests** - File creation, modification, or structured work
3. **OR user confirms** - After you've asked clarifying questions and received confirmation

**DO NOT transition until scope is clear!**

**Example Flow:**
```
User: "I want to build an approval path feature"
You: "Great! To help you best, I need to understand the scope:
      - Is this an internal tool for your team, or an external product feature?
      - Who will use this approval path?
      - What's the primary goal?"
User: "It's an internal tool for our team"
You: "Got it! For an internal tool, we typically don't need market research.
      Would you like me to help you plan the feature structure, or do you want to start implementing?"

[After finalizing scope, update shared/context/current-scope.md with:]
- Project Type: Internal Tool
- Target Audience: Internal team
- Primary Goal: Approval workflow for internal processes
- Key Requirements: [from conversation]
```

**Scope Documentation:**
After finalizing scope through conversation, you MUST update `shared/context/current-scope.md` with:
- Project/Feature name
- Project type (Internal Tool / External Product / etc.)
- Target audience
- Primary goals
- Key requirements
- Constraints (if any)
- Any other clarified details

This ensures other modes (Ideas, Plan, Execution) can read and understand the context.

## Orchestration Handoff Format

When in Chat Mode, use this format (if handoff is needed):

```markdown
**Current mode**: chat  
**Task completed**: [N/A - conversation]  
**Conversation topic**: [What was discussed]

**Key points discussed**:
- [Point 1]
- [Point 2]

**Suggested next mode** (if applicable): [ideas|plan|execution|review|chat]  
**Suggested next action** (if applicable): "[What user might want to do next]"

**Blockers/Issues**: [None / Any questions that need clarification]
```

**Note:** In Chat Mode, orchestration handoff is usually not needed unless the conversation naturally leads to a structured task.

## Success Criteria

Chat Mode is successful when:
- ✅ **Scope is finalized** before suggesting any structured work
- ✅ **Clarifying questions are asked** when ideas are mentioned
- ✅ **Internal vs external is confirmed** before research/planning
- ✅ User's questions are answered clearly and accurately
- ✅ Conversation is natural and helpful
- ✅ User understands concepts and workflows
- ✅ Appropriate mode transitions are suggested only after scope confirmation
- ✅ No unnecessary files are created
- ✅ No automatic research/planning without scope confirmation
- ✅ User feels supported and informed

## Related Documents

- **[Mode Overview](README.md)** - Overview of all modes
- **[Ideas Mode](ideas.md)** - For research and exploration
- **[Plan Mode](plan.md)** - For planning and specifications
- **[Boost Mode](boost.md)** - For project initialization and structure setup (one-time)
- **[Execution Mode](execution.md)** - For creating designs, marketing assets, and content
- **[Code Mode](code.md)** - For writing code and configuring infrastructure
- **[Review Mode](review.md)** - For reviewing and quality assurance
- **[Global Rules](../_core/global-rules.md)** - Repository rules and constraints

---

**Remember:** Chat Mode is for conversation.  
When the user wants to create, modify, or review files, transition to the appropriate structured mode.
