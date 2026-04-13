# Project Versions

## Overview

This document tracks major project versions, milestones, and release history. For detailed changes, see [changelog.md](changelog.md).

## Version History
### Version 2.1.0 - 2025-12-15
**Status:** Released  
**Milestone:** Domain Scaling — Marketing, Finance, and Operations structures unified with templates, registries, metrics, and history

**Key Features:**
- Operations domain build-out: strategy, registry (OPS-TASK-XXX), metrics glossary, changelog
- Templates: hiring plan, onboarding checklist, JD template; role-specific JDs + hiring plans
- Marketing enhancements: campaign brief template, performance registry, metrics glossary, GTM changelog, README quick links
- Finance enhancements: projection template, tracking registry, metrics glossary, scale rules, README quick links

**Key Components:**
- Cross-domain traceability: tasks linked to PRD-EPIC-XXX
- Scale rules aligned across domains (≤ active items, parking lots, quarterly archival)
- Quick Links in domain READMEs for discoverability

**Breaking Changes:**
- None (backward compatible structural additions)

**Related Decisions:**
- See `8-governance/decision-log.md` entries for domain scaling and archival patterns

**Related Risks:**
- Maintain discipline on scale rules to avoid sprawl; monitor quarterly archival cadence

---

*Add version entries here as releases are made. Use the template below for each version.*

### Version 2.0.0 - 2025-12-14
**Status:** Released  
**Milestone:** Factory AI 2.0 — traceability, task validation gate, and standardized idea governance

**Key Features:**
- Work-Item Traceability System with mandatory metadata and attachment rules
- Work-Item Registry for cross-domain visibility
- Task Validation Gate enforced by product strategist

**Key Components:**
- Updated agent modes (ideas, boost, fix) and docs-guardian enforcement
- Standardized Ideas Status Tables (newest-first) across all `1-ideas/` departments

**Breaking Changes:**
- Mandatory work-item metadata and task validation gate for all new tasks (blocks orphan tasks)

**Related Decisions:**
- See `8-governance/decision-log.md` entries associated with traceability and validation (if applicable)

**Related Risks:**
- Enforce adherence to traceability to avoid blocked work; update risk-register entries as needed

---

### Version Template

```markdown
### Version X.Y.Z - YYYY-MM-DD
**Status:** [Released | In Development | Planned]  
**Milestone:** [Milestone description]

**Key Features:**
- Feature 1
- Feature 2
- Feature 3

**Key Components:**
- Component 1
- Component 2

**Breaking Changes:**
- [None | List breaking changes]

**Related Decisions:**
- [Link to decision-log.md entries]

**Related Risks:**
- [Link to risk-register.md entries]

---
```

## Versioning Strategy

### Semantic Versioning
- **Major (X.0.0):** Breaking changes
- **Minor (0.X.0):** New features, backward compatible
- **Patch (0.0.X):** Bug fixes, backward compatible

### Release Schedule
- *Release cadence*
- *Major version frequency*
- *Minor version frequency*

## Current Version

**Version:** *Current version number*  
**Release Date:** *Date*  
**Status:** *Current status*  
**Next Planned Version:** *Next version and target date*

## Current Version (updated)

**Version:** 2.0.0  
**Release Date:** 2025-12-14  
**Status:** Released  
**Next Planned Version:** 2.1.0 (TBD)

## Version Roadmap

### Upcoming Versions

#### Version X.Y.Z - [Target Date]
**Planned Features:**
- *Feature 1*
- *Feature 2*

**Target Milestones:**
- *Milestone 1*
- *Milestone 2*

## Related Documents

- **[Changelog](changelog.md)** - Detailed change history
- **[Decision Log](decision-log.md)** - Decisions affecting versions
- **[Risk Register](risk-register.md)** - Risks impacting releases
- **[Quarterly Retrospectives](quarterly-retrospective/)** - Version retrospectives

---

*Keep this document updated with each major release and milestone.*
