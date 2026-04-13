# System Overview

## Purpose

This document provides a high-level overview of all systems in the project, their relationships, and how they work together.

> **Mapping Requirement:** This document **must map to all systems** in `systems/` directory. Every system listed in `systems/` should be documented here, and every system documented here should exist in `systems/`.

## Systems Architecture

### System Diagram

*Add a diagram showing all systems and their relationships*

### Systems List

#### [System 1 Name]
- **Purpose:** [Description]
- **Location:** `systems/[system-1]/`
- **Tech Stack:** [Stack]
- **Documentation:** [systems/[system-1]/README.md](../../../systems/[system-1]/README.md)

#### [System 2 Name]
- **Purpose:** [Description]
- **Location:** `systems/[system-2]/`
- **Tech Stack:** [Stack]
- **Documentation:** [systems/[system-2]/README.md](../../../systems/[system-2]/README.md)

## Shared Services

### [Service Name]
- **Purpose:** [Description]
- **Location:** `systems/shared/services/[service-name]/`
- **Used by:** [List of systems using this service]

## Integration Patterns

### Communication Between Systems
- [Pattern 1]: [Description]
- [Pattern 2]: [Description]

### Data Flow
- [Description of how data flows between systems]

## Infrastructure

See [infrastructure.md](../infrastructure.md) for infrastructure details.

## Related Documentation

- **[Individual System Docs](../../../systems/README.md)** - Documentation for each system
- **[Shared Code](../../../systems/shared/README.md)** - Shared libraries and services
- **[System Design](system-design.md)** - Detailed system design
- **[Infrastructure](../infrastructure.md)** - Infrastructure setup

---

*Keep this document updated as systems are added or changed.*
