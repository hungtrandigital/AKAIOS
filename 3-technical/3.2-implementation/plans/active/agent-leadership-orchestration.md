---
id: PRD-SLICE-001
title: "Standardize Core-Agent Leadership Orchestration"
type: slice
domain: code
status: in-progress
parent_id: PRD-EPIC-001
related_ids: [CODE-TASK-001, CODE-TASK-002]
created: 2026-04-13
updated: 2026-04-13
priority: high
owner: @docs-guardian
phases: [plan, review]
folder: 0-agents/agents/
backlog_item: "2-product-foundation/product-backlog/backlog.md#epic-1-factory-agent-leadership-orchestration"
implementation_plan: "3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md"
related_domain_docs: [0-agents/README.md, 8-governance/changelog.md]
---

# Agent Leadership Orchestration Plan

## Overview

Optimize the outer/core agents in `0-agents/agents/` so they act as domain leaders for multi-project reuse. The change must preserve the current modes, workflows, process gates, folder structure, and sequential execution steps while making specialist pull-ins and local skill activation explicit.

## Scope

### In Scope
- Add a reusable leader-orchestration contract to every core agent in `0-agents/agents/*.md`
- Clarify how each core agent selects one or more `agency-agents` specialists
- Clarify which local skills from `0-agents/agents/skills/` should pair with those specialists
- Tighten supporting documentation so the stack is easier to reuse across projects

### Out of Scope
- Changing any file under `0-agents/mode/`
- Changing any file under `0-agents/workflows/`
- Rewriting the existing per-agent workflow steps
- Introducing new specialist files under `agency-agents/`

## Constraints

- Preserve all existing governance and validation rules.
- Preserve the current sequential process defined inside each core agent.
- Use only real, existing skills from `0-agents/agents/skills/`.
- Keep `agency-agents` as depth and specialization, not as replacements for core-agent ownership.

## Quality Standards

- Every core agent states that it is the leader layer for its domain.
- Every core agent explains how to select a primary specialist and when to add secondary specialists.
- Every core agent maps specialist pull-ins to valid local skills.
- The resulting language remains compatible with the existing agent-specific workflow steps below it.

## Coverage Requirements

- `0-agents/agents/*.md` top-level core agent definitions
- `0-agents/README.md` stack description
- `2-product-foundation/product-backlog/backlog.md`
- `3-technical/3.2-implementation/plans/README.md`
- `3-technical/3.2-implementation/status/work-items-registry.md`
- `8-governance/changelog.md`

## Work Breakdown

### Phase 1: Register the Initiative
- Confirm parent epic in the product backlog
- Create an active slice plan with traceability metadata
- Update the work-items registry and plans index

### Phase 2: Standardize Core-Agent Leadership
- Add a `Leader Orchestration` section to every core agent
- Preserve the current `Specialist Routing` section and existing workflow order
- Make selection rules explicit: primary specialist, optional secondary specialists, and final synthesis responsibility

### Phase 3: Align Skills to Specialists
- Verify each referenced skill exists in `0-agents/agents/skills/`
- Add domain-specific skill pairings that complement `agency-agents` specialists
- Avoid introducing new skill names or changing the skill library structure

### Phase 4: Document and Verify
- Update stack-level documentation and traceability indexes
- Record the change in the changelog
- Verify that no mode or workflow files were modified

## Risks

- Over-standardizing and weakening domain-specific nuance in some agents
- Referencing skill names that do not exist or no longer match the skill library
- Accidentally changing workflow semantics instead of only clarifying leadership/orchestration behavior

## Verification

- Search for `## Leader Orchestration` across all core agents and confirm full coverage
- Verify every skill name referenced in the new sections exists under `0-agents/agents/skills/`
- Confirm no files under `0-agents/mode/` or `0-agents/workflows/` changed during this slice

## Related Documents

- [Product Backlog](../../../../2-product-foundation/product-backlog/backlog.md)
- [Plans Index](../README.md)
- [Work-Items Registry](../../status/work-items-registry.md)
- [Agent Stack Overview](../../../../0-agents/README.md)
