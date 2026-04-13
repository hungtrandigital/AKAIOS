# Cursor IDE Setup — AI-First Startup Factory

Use this setup to standardize Cursor across projects.

## Setup Steps

1. Copy `.cursor` folder:
   - From `IDE-SETUP/cursor/.cursor` → to project root `.cursor`
2. Copy rules file:
   - From `IDE-SETUP/cursor/.cursorrules` → to project root `.cursorrules`
3. Open in Cursor and reload window
4. Confirm Workspace Rules are enabled
5. Use slash commands:
   - `/chat`, `/ideas`, `/plan`, `/execution`, `/code`, `/review`, `/fix`, `/deliver`

## Notes
- Commands map to `0-agents/mode/*.md`
- Rules align with `0-agents/_core/global-rules.md`
- Keep source code under `systems/[system-name]/`
- End agent responses with orchestration handoff per `0-agents/workflows/orchestration-protocol.md`

## Troubleshooting
- If rules not applied, ensure `.cursorrules` exists at project root
- If settings not applied, verify `.cursor/settings.json` is present
- Disable extension conflicts with formatters; prefer Prettier
