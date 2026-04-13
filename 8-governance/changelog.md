# Changelog

## Overview

This document provides a detailed changelog of all changes made to the project. All notable changes are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Operations domain structure: templates (hiring plan, onboarding, JD), tracking registry (OPS-TASK-XXX), metrics glossary, strategy, and changelog
- Role-specific JD copies: Senior Backend Engineer, Product Manager with OPS linkage and parent epics
- Hiring plans seeded and linked from registry (dates, owners, pipeline, metrics)
- **Market research types:** Quick vs Deep research with planning workflow for deep research
- **Market research plans directory:** `1-ideas/market-research/plans/` for deep research planning
- **Research methods framework:** Qualitative (interviews, focus groups, case studies), Quantitative (surveys, market sizing, cohort analysis), Competitive (feature analysis, pricing, positioning), Trends (Google Trends, VC data, regulatory analysis)
- **TAM/SAM/SOM Accuracy Protocol:** Mandatory methodology, sourcing, triangulation, sensitivity analysis, and benchmark/capacity checks embedded in market-research agent
- **Cursor IDE setup:** Updated `IDE-SETUP/cursor` README and `.cursor/settings.json` with standardized install steps, rules paths, Prettier formatter, and whitespace hygiene

### Changed
- Updated all references to the semantic product foundation paths (`2-product-foundation/product-overview.md`, `2-product-foundation/product-backlog/backlog.md`) across core rules, traceability, workflows, status/registry docs, and ideas/governance docs after the directory rename.
- Archived the deprecated `2-product-foundation/2.2-product-backlog/` directory to `archives/2025-12-15-deprecated-product-backlog/` to keep the active structure clean.
- Added Backlog Scale Rules to `2-product-foundation/product-backlog/backlog.md` to cap active items, enforce metadata, and define grooming/archival cadence.
- Marketing domain: campaign brief template, performance registry, metrics glossary, GTM changelog, README quick links, Parking Lot section
- Finance domain: projection template, tracking registry, metrics glossary, domain plans scale rules, README quick links
- **Market-research agent v4.0:** Enhanced with quick vs deep research types, planning workflow, detailed methods (qualitative/quantitative/competitive/trends), decision matrix for research type selection
- Detached standalone Git metadata from `0-agents/agents/agency-agents/` so the imported agent library now behaves as plain repository content instead of a nested Git repository.
- Updated `INDEX.md`, the root `README.md`, `0-agents/README.md`, and the mode documentation to reflect the actual current template structure, the vendored `agency-agents` specialist library, and the dual-layer operating model for future project reuse.
- Corrected outdated mode paths to match the current repository skeleton, especially around `4-marketing/`, `5-financing/pitches/`, `8-governance/reviews/`, `1-ideas/market-research/`, and `0-agents/workflows/project-config/`.
- Standardized core-agent routing docs so the responsibility matrix and agent definitions now map common task types to recommended `agency-agents` specialists, keeping routing aligned across `INDEX.md`, modes, and agents.
- Replaced the hardcoded tree label `factory/` with `[project-root]/` in the canonical structure docs so the template reads correctly when reused under any repository name and does not imply a literal folder named `factory`.
- Standardized boost/workflow scaffolds and product/marketing docs around the same `[project-root]/` and current-folder conventions, including a real `2-product-foundation/requirements/README.md` skeleton and removal of stale `4-marketing/channels/` assumptions.

### Fixed
- Cleared remaining references to legacy numbered product foundation paths (plan/boost scaffolds) and added a redirect notice in the old backlog file to point to `product-backlog/backlog.md`.
- **Structure:** Fixed `financial-modeling` skill to follow Agent Skills Spec (moved from `skills/financial-modeling.md` to `skills/financial-modeling/SKILL.md` with proper YAML frontmatter)
- **Finance-director agent:** Enhanced to explicitly activate `financial-modeling` skill during all projection work (steps 3, 4, 5) and added mandatory skill usage pattern
- **Cursor modes:** Added missing `/refactor` command to Cursor to match `0-agents/mode/refactor.md`

## [2.0.0] - 2025-12-14 (Factory AI 2.0)

### Added
- **Work-Item Traceability System** (`0-agents/_core/work-item-traceability.md`) — Unified taxonomy, ID schema, and lifecycle tracking for all work items across domains (product, code, marketing, finance, operations, research). Implements HMVC-like architecture for project management.
  - Glossary: epic vs slice vs task vs bug vs experiment vs spike vs research with scope definitions
  - ID schema: `[DOMAIN]-[TYPE]-[SEQUENCE]` (e.g., `PRD-EPIC-001`, `CODE-BUG-042`, `MKT-TASK-031`)
  - Mandatory metadata: YAML frontmatter with `id`, `parent_id`, `related_ids`, `phases`, `owner`, `folder` for every work item
  - Attachment rules: every task/bug/slice declares parent epic; cross-domain tasks link back to product epic
  - Lifecycle tracking: work items pass through phases (ideas → plan → code → review) with full history
- **Work-Item Registry** (`3-technical/3.2-implementation/status/work-items-registry.md`) — Master index aggregating all work items, enabling cross-domain navigation and dependency tracking
  - Tables: Active Epics, Slices, Tasks (by domain), Bugs, Experiments, Recently Completed
  - Epic Dependency Map showing cross-domain task relationships
- **Task Validation Gate** (enforced by @product-strategist) — Prevents orphan tasks and scope creep by requiring every new task to link to an existing epic, idea, or plan before other agents proceed
  - Added rule 10.1 to `0-agents/_core/global-rules.md`
  - Updated `0-agents/agents/product-strategist.md` with mandatory task validation workflow and rejection template
  - Updated `0-agents/workflows/orchestration-protocol.md` section 0 (Task Validation Gate — ALWAYS FIRST)
  - Ensures product strategy is followed, system integrity maintained, and no drift occurs
- **Ideas status tables (standardized)** across all `1-ideas/` departments (`market-research/summaries.md`, `marketing/README.md`, `finance/README.md`, `features/summaries.md`, `technical/README.md`, `operations/README.md`, `product/README.md`, `executive-docs/README.md`) with newest-first ordering to keep latest work visible.

### Changed
- Updated `0-agents/_core/global-rules.md` — Added section **"Work-Item Traceability System (MANDATORY — Read This First)"** with ID schema, metadata templates, and attachment rules; added new rule 10.1 **"Task Validation Gate (MANDATORY — Product Strategist Enforces)"**
- Updated `0-agents/agents/product-strategist.md` — Added **"Task Validation Gate (MANDATORY)"** section defining validation checklist, rejection workflow, and reasoning; tightened Forbidden Actions against orphan tasks.
- Updated `0-agents/mode/fix.md` — Enforce parent-attachment for all bugs: identify owning epic/slice, attach to parent plan, no orphan docs.
- Updated `2-product-foundation/product-backlog/backlog.md` — Added epic metadata template and "Known Issues" section for bug tracking.
- Updated `3-technical/3.2-implementation/plans/README.md` — Made work-item metadata mandatory; added metadata frontmatter requirements.
- Updated `0-agents/workflows/orchestration-protocol.md` — Added section 0 (Task Validation Gate) as first orchestration pattern.
- Renamed `1-ideas/feature-ideas/` → `1-ideas/features/` and renamed initial plan files (`finance/initial-financing-plan.md`, `marketing/initial-go-to-market-plan.md`); updated references across agents, modes, workflows, marketing/financing docs, INDEX; added ideas-warehouse status guidance in `1-ideas/README.md`.
- Updated `0-agents/mode/ideas.md` — Added human-request triage flow (classify → check status tables → update existing first → create new only with docs-guardian) and clarified response expectations.
- Updated `0-agents/agents/docs-guardian.md` — Enforce the triage flow, prevent duplicate idea files, and keep Ideas Status Tables current/newest-first.
- Updated `0-agents/mode/boost.md` — Added a verification loop to ensure every required directory has a templated README before Boost completes.
- Updated `1-ideas/features/summaries.md` — Added a standardized feature status table (feature, status, priority, stage, owner, last updated, link) to enforce update-before-create tracking.

### Fixed
- Removed old plan metadata format; unified on work-item traceability frontmatter.
- Removed test data from template files; restored `backlog.md` and `work-items-registry.md` to clean placeholder format.

## Added
- *New features, capabilities, or functionality*

### Changed
- Regenerated `INDEX.md` to reflect current structure (`.github/`, `IDE-SETUP/` visibility)
### Fixed
- Relocated `6-operations/team-structure.md` to `6-operations/team/team-structure.md` to align with Boost Mode directory rules; updated links in `6-operations/README.md`, `6-operations/hr/README.md`, `6-operations/legal/README.md`, `INDEX.md`, `0-agents/_core/file-placement-guide.md`, and Boost docs.
- Updated root `README.md` to include IDE setup and GitHub config, reinforce mode discipline and alignment with global rules
- Updated agent coordination docs to align with the actual AI Factory agent roster and plan locations (`0-agents/workflows/primary-workflow.md`, `0-agents/workflows/development.md`, `0-agents/workflows/orchestration-protocol.md`)
- Expanded responsibility matrix to include forecasting/projection ownership and workflow/skill maintenance expectations
- Tightened Plan/Fix modes and documentation management defaults to reduce file sprawl and enforce correct folder placement

### Fixed
- Fixed skills frontmatter `name` fields to comply with Agent Skills Spec and folder naming (`debugging`, `problem-solving`, `frontend-development`)
- Aligned `planning` and `research` skills with AI Factory plan/report locations and “update existing docs first” rules
- Fixed `progress.md` to link to the canonical plans index (`3-technical/3.2-implementation/plans/README.md`)

### Deprecated
- *Features that are still available but will be removed in a future version*

### Removed
- *Features that have been removed in this version*

### Fixed
- *Bug fixes and error corrections*

### Security
- *Security-related fixes and improvements*

---

## Change Categories

### Added
New features, capabilities, or functionality.

### Changed
Changes to existing functionality, behavior, or APIs.

### Deprecated
Features that are still available but will be removed in a future version.

### Removed
Features that have been removed in this version.

### Fixed
Bug fixes and error corrections.

### Security
Security-related fixes and improvements.

## Version Format

When creating a new version entry, use this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Change 1
- Change 2

### Fixed
- Bug fix 1
- Bug fix 2
```

## Related Documents

- **[Project Versions](project-versions.md)** - Version milestones
- **[Decision Log](decision-log.md)** - Decisions leading to changes
- **[Implementation History](../3-technical/3.2-implementation/history/history.log.md)** - Technical implementation details

---

*Maintain this changelog for all releases to track project evolution.*
