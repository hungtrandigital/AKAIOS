# Cursor IDE Templates

This directory contains Cursor IDE templates for the AI-First Startup Factory.

## Contents
- `settings.json` — Workspace settings template
- `rules/` — Cursor rules (global)
- `commands/` — Slash commands (/chat (default), /boost, /ideas, /plan, /execution, /code, /review, /fix, /deliver, /refactor)
- `MODES.md` — Quick reference for all available modes
- `../.cursorrules` — Template to copy to project root when using Cursor

## How to use (per project)
1. Copy `IDE-SETUP/cursor/.cursor` into your project root as `.cursor`
2. Copy `IDE-SETUP/cursor/.cursorrules` to project root as `.cursorrules`
3. (Optional) Adjust `.cursor/settings.json` for your workspace
4. In Cursor, enable Workspace Rules and reload window
5. Use slash commands from `/.cursor/commands` to switch modes (/chat, /plan, /execution, ...)

## Notes
- Commands align with modes in `0-agents/mode/*.md`
- Rules align with `0-agents/_core/global-rules.md`
- Keep code in `systems/[system-name]/` (all projects)
 - For AI agents, always end responses with orchestration handoff from `0-agents/workflows/orchestration-protocol.md`
