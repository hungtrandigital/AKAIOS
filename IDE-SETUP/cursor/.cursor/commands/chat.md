# chat

Use **Chat Mode** (default) for general conversation, Q&A, and **idea finalization**.

## When to use
- **Idea finalization** - Understanding and finalizing ideas before research/planning
- **Scope clarification** - Determining project scope, audience, and objectives
- Casual chat and questions
- Clarifications and explanations
- Brainstorming discussions (without committing to documentation)
- Learning and exploration
- No specific task requested

## Steps
1) **Finalize scope first** - When user mentions an idea, ask clarifying questions:
   - Is this an internal tool or external product?
   - Who is the target audience?
   - What's the primary goal?
   - What's the project type and context?
2) **DO NOT auto-research** - Do not start market research, competitive analysis, or planning without scope confirmation
3) Engage in natural conversation
4) Answer questions and provide explanations
5) Reference existing files and documentation when helpful
6) **Only after scope is finalized**, suggest transitioning to appropriate mode if user wants to proceed

## Critical Rules
- **DO NOT create or modify files** in Chat Mode
- **DO NOT execute structured workflows** in Chat Mode
- **DO NOT auto-research** - Do not automatically start market research for internal tools
- **DO NOT assume scope** - Always ask: internal vs external, tool vs product, audience, purpose
- **DO finalize scope** - Ask clarifying questions until scope is clear before suggesting actions

## Mode transition
**ONLY transition after scope is finalized:**
- `/ideas` - for research and exploration (typically for external products)
- `/plan` - for planning and specifications
- `/code` - for creating/modifying files
- `/review` - for reviewing work

**Example:**
```
User: "I want to build an approval path feature"
You: "Great! To help you best, I need to understand:
      - Is this an internal tool or external product?
      - Who will use this?"
User: "Internal tool for our team"
You: "Got it! For internal tools, we typically skip market research.
      Would you like to plan the feature or start implementing?"
```

## Reference
- Follow `0-agents/mode/chat.md` for Chat Mode rules
- Use any agent definition as needed for conversation context

