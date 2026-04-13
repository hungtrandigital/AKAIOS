# IDE Setup Templates

Use this folder to set up IDE-specific configurations without cluttering the project root. Copy the relevant subfolder into your project when needed.

## Cursor IDE
- Templates: `IDE-SETUP/cursor/.cursor/` + `IDE-SETUP/cursor/.cursorrules` + `IDE-SETUP/cursor/0-agents/`
- Slash commands: /chat (default), /boost, /ideas, /plan, /execution, /code, /review, /fix, /deliver (aligned to modes)
- Global rule: enforces reading INDEX, global rules, modes, and agent workflows
- Usage:
  1) Copy `IDE-SETUP/cursor/.cursor` to project root `.cursor`
  2) Copy `IDE-SETUP/cursor/.cursorrules` to project root as `.cursorrules`
  3) Copy `IDE-SETUP/cursor/0-agents/` to project root `0-agents/` (if not exists)
  4) Adjust `settings.json` if desired

## VS Code
- Templates: `IDE-SETUP/vscode/.vscode/` + `IDE-SETUP/vscode/0-agents/`
- Usage:
  1) Copy `IDE-SETUP/vscode/.vscode` to project root `.vscode` (if exists)
  2) Copy `IDE-SETUP/vscode/0-agents/` to project root `0-agents/` (if not exists)
  3) Adjust `settings.json` for your stack

## Notes
- IDE setup files are kept out of the project root to avoid clutter
- Each IDE user can copy the templates they need
- No direct links to project structure inside the IDE templates beyond the required agent/mode references
