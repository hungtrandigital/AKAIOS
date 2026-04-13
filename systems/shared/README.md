# Shared Code

## Overview

This directory contains code that is shared across multiple systems in the project. This includes libraries, packages, and services that are used by more than one system.

## Directory Structure

```
shared/
├── README.md           # This file
├── libraries/          # Shared libraries
│   └── [library-name]/
├── packages/          # Shared packages (for monorepo)
│   └── [package-name]/
└── services/          # Shared services
    └── [service-name]/
```

## Shared Libraries

Libraries that provide common functionality used across systems.

### Examples
- Authentication utilities
- Data validation libraries
- Logging utilities
- Error handling
- API clients

## Shared Packages

Packages that can be imported by multiple systems (useful for monorepo setups).

### Examples
- UI component libraries
- Type definitions
- Configuration packages
- Utility functions

## Shared Services

Services that are used by multiple systems.

### Examples
- Authentication service
- Notification service
- File storage service
- Analytics service

## Usage

### In Monorepo Setup

If using a monorepo tool (Turborepo, Nx, Lerna), shared packages can be referenced like:

```json
{
  "dependencies": {
    "@project/shared-auth": "workspace:*",
    "@project/shared-ui": "workspace:*"
  }
}
```

### In Separate Repos

If systems are in separate repositories, shared code can be:
- Published as npm packages
- Used as git submodules
- Copied to each system (not recommended)

## Development Guidelines

1. **Keep it generic:** Shared code should be system-agnostic
2. **Document well:** Add clear documentation for shared code
3. **Version carefully:** Breaking changes affect multiple systems
4. **Test thoroughly:** Shared code should have comprehensive tests

## Related Documentation

- **[systems/README.md](../README.md)** - Systems overview
- **[3-technical/3.1-system-foundation/](../../3-technical/3.1-system-foundation/)** - Architecture documentation

---

*Keep shared code well-maintained as it affects multiple systems.*
