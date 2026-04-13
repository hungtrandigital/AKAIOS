# 3. Technical

## Purpose

This section contains **technical documentation only** - architecture, design standards, implementation plans, and DevOps configuration. 

**All source code is located in the [systems/](../systems/README.md) directory** - whether your project has one system or multiple systems.

> **Unified Structure:** All projects use `systems/` for source code. Single-system projects have one directory in `systems/`, multi-system projects have multiple directories.

## Navigation

### Main Sections

- **[3.1 System Foundation](3.1-system-foundation/)** - Infrastructure, architecture, and design standards
- **[3.2 Implementation](3.2-implementation/README.md)** - Implementation details, history, and plans
- **[3.3 DevOps](3.3-devops/README.md)** - DevOps configuration and deployment (template)

## Documentation Mapping

### Cross-System Documentation (This Section)
Technical documentation in `3-technical/` applies to:
- **All systems** (infrastructure, design standards, coding standards)
- **System relationships** (system overview, cross-system API contracts, domain model)
- **Project-wide concerns** (DevOps, implementation plans)

### System-Specific Documentation
Documentation for individual systems is in `systems/[system-name]/docs/`:
- System-specific architecture
- System-specific API contracts
- System-specific deployment instructions

### Mapping Rules
- **Cross-system concerns** → `3-technical/`
- **System-specific concerns** → `systems/[system-name]/docs/`
- **System overview** → `3-technical/3.1-system-foundation/architecture/system-overview.md` must map to all systems in `systems/`

## Workflow

1. **Design System** - Start with [3.1-system-foundation/](3.1-system-foundation/) for architecture
2. **Plan Implementation** - Use [3.2-implementation/plans/](3.2-implementation/plans/) for detailed plans
3. **Track Progress** - Monitor status in [3.2-implementation/status/](3.2-implementation/status/)
4. **Implement** - Write code in [systems/](../systems/README.md)
5. **Deploy** - Configure DevOps in [3.3-devops/](3.3-devops/)

## Related Sections

- **[systems/](../systems/README.md)** - Source code for all software systems (single or multi-system)
- **[2-product-foundation/](../2-product-foundation/README.md)** - Product requirements that inform technical specs
- **[7-operations-monitoring/](../7-operations-monitoring/README.md)** - Post-deployment monitoring

## System Overview

For projects with multiple systems, see:
- **[systems/README.md](../systems/README.md)** - Source code organization
- **[3.1-system-foundation/architecture/system-overview.md](3.1-system-foundation/architecture/system-overview.md)** - Overview of all systems and their relationships

---

*This section contains cross-system technical documentation. All source code is in the systems/ directory. This is a template - customize documentation for your project.*
