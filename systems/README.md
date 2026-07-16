# Systems

## Overview

This directory contains the source code for **all software systems** in the project. Whether your project has one system or multiple systems, **all source code goes here**.

> **Unified Structure:** This directory is used for **all projects** - single-system or multi-system. The structure is the same, making it easy to identify:
> - **Single system?** You'll see one directory in `systems/`
> - **Multiple systems?** You'll see multiple directories in `systems/`

## Directory Structure

```
systems/
├── README.md                   # This file
├── shared/                     # Shared code across systems
│   ├── libraries/             # Shared libraries
│   ├── packages/              # Shared packages (for monorepo)
│   └── services/              # Shared services (auth, logging, etc.)
│
├── [system-1]/                # First software system (or only system)
│   ├── README.md              # System-specific documentation
│   ├── docs/                  # System-specific docs
│   ├── [source code structure]
│
├── [system-2]/                # Second software system (if multi-system)
│   └── ...
│
└── [system-n]/                # Additional systems
    └── ...
```

## Single-System vs Multi-System

### Single-System Project
If your project has **one software system**, you'll have:
```
systems/
├── README.md
├── shared/
└── [your-system-name]/        # Your single system
    ├── README.md
    ├── docs/
    ├── frontend/
    ├── backend/
    ├── tests/
    └── db/
```

### Multi-System Project
If your project has **multiple software systems**, you'll have:
```
systems/
├── README.md
├── shared/
├── web-app/                   # Web application
├── mobile-app/                # Mobile application
├── admin-dashboard/           # Admin dashboard
└── api-gateway/               # API gateway
```

**The structure is the same - just more directories!**

## Systems List

### Current Systems

- **`attendance`** — Chấm công tại dự án, mobile app (Flutter), báo cáo khách hàng.
  - Location: `systems/attendance/`
  - Tech Stack: Flutter 3.24 (mobile), Node.js 20 + Fastify + TypeScript (backend), PostgreSQL 16, Redis 7, MinIO
  - Documentation: `systems/attendance/README.md`
  - Related Docs: `3-technical/3.1-system-foundation/architecture/domain-specs.md`, `architecture/api-contracts/openapi.yaml`

- **`payroll`** — Tính lương, duyệt bảng lương, xuất Excel cho BO.
  - Location: `systems/payroll/`
  - Tech Stack: Node.js 20 + Fastify + TypeScript (backend), Next.js 14 (web admin), PostgreSQL 16
  - Documentation: `systems/payroll/README.md`
  - Related Docs: Same shared docs as attendance

**Shared between attendance + payroll:** Postgres database, Redis, MinIO, Docker Compose stack, Caddy reverse proxy, Cloudflare Tunnel.

**Shared code:** `systems/shared/` — common TypeScript types, repositories, error classes, logging utilities.

- **System Name** - Brief description
  - Location: `systems/[system-name]/`
  - Tech Stack: [Stack]
  - Documentation: `systems/[system-name]/README.md`
  - Related Docs: `3-technical/3.1-system-foundation/architecture/system-overview.md` (if multi-system)

### Shared Resources

- **Shared Libraries** - `systems/shared/libraries/`
- **Shared Packages** - `systems/shared/packages/`
- **Shared Services** - `systems/shared/services/`

## System Structure Template

Each system should follow this structure:

```
[system-name]/
├── README.md                   # System overview, tech stack, setup
├── docs/                       # System-specific documentation
│   ├── architecture.md        # System architecture
│   ├── api-contracts.md       # API contracts (if applicable)
│   └── deployment.md          # Deployment instructions
├── [frontend/]                # Frontend code (if applicable)
├── [backend/]                # Backend code (if applicable)
├── tests/                     # Tests
└── db/                        # Database schemas/migrations (if applicable)
```

## Documentation Mapping

### Cross-System Documentation
Technical documentation that applies to **all systems** or **system relationships** is in `3-technical/`:
- `3-technical/3.1-system-foundation/` - Overall architecture, infrastructure, design standards
- `3-technical/3.1-system-foundation/architecture/system-overview.md` - Overview of all systems and their relationships (for multi-system projects)
- `3-technical/3.1-system-foundation/architecture/domain-specs.md` - Cross-system domain model
- `3-technical/3.1-system-foundation/architecture/api-contracts/` - Cross-system API contracts

### System-Specific Documentation
Documentation for **individual systems** is in each system's directory:
- `systems/[system-name]/README.md` - System overview, tech stack, setup
- `systems/[system-name]/docs/architecture.md` - System-specific architecture
- `systems/[system-name]/docs/api-contracts.md` - System-specific API contracts

### Mapping Rules
- **Cross-system concerns** → `3-technical/`
- **System-specific concerns** → `systems/[system-name]/docs/`
- **System overview** → `3-technical/3.1-system-foundation/architecture/system-overview.md` (must map to all systems in `systems/`)

## Development Workflow

1. **Create New System**: Create a new directory in `systems/` following the template
2. **System Documentation**: Add system-specific docs in `[system-name]/docs/`
3. **Cross-System Documentation**: Update `3-technical/3.1-system-foundation/architecture/system-overview.md` to include the new system
4. **Shared Code**: Place shared code in `systems/shared/`
5. **Mapping**: Ensure `system-overview.md` maps to all systems in `systems/`

## Related Documentation

- **[3-technical/](../3-technical/README.md)** - Cross-system technical documentation (architecture, design standards)
- **[3-technical/3.1-system-foundation/architecture/system-overview.md](../3-technical/3.1-system-foundation/architecture/system-overview.md)** - System overview and mapping
- **[Shared Templates](../shared/templates/)** - Document templates

---

*This directory structure is unified for all projects - single-system or multi-system. All source code goes here, making it easy to see project structure at a glance.*
