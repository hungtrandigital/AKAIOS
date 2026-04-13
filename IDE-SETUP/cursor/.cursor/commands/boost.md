# boost

Use **Boost Mode** for one-time project initialization and structure setup.

## Steps
1) Read `INDEX.md` to understand target structure
2) Follow `0-agents/mode/boost.md`
3) Use `0-agents/agents/boost.md` for detailed workflow
4) Create complete directory structure as defined in `INDEX.md`
5) Analyze existing files and categorize them
6) Get user confirmation for uncertain files
7) Create migration plan and get approval
8) Execute migration (move/rename files)
9) Apply naming conventions
10) Update cross-references and links
11) Generate final migration report

## Important
- **One-time operation** - Only use for initial setup or major restructuring
- **DO NOT modify `0-agents/`** - This directory must remain untouched
- **Always ask user** - For uncertain files or when overwriting existing files
- **Preserve content** - Only move/rename, never delete files

## Output locations
- Complete directory structure (as defined in `INDEX.md`)
- All files migrated to correct locations
- Migration report in `8-governance/changelog.md`

## Handoff
Use the orchestration format in `0-agents/mode/boost.md` (`Current mode: boost`, phase, directories created, files moved, next agent).

