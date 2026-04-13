# Epic Plans

## Overview

This directory contains plans organized by epic. Each epic has its own subdirectory with the epic plan and related feature plans.

## Directory Structure

```
epics/
├── README.md                    # This file - Epic plans index
├── [epic-1]/                    # Epic 1
│   ├── plan.md                  # Epic-level plan
│   ├── [feature-1].md          # Feature plan within epic
│   └── [feature-2].md          # Feature plan within epic
├── [epic-2]/                    # Epic 2
│   ├── plan.md
│   └── [feature-1].md
└── ...
```

## Epic Plans Index

| Epic Name | Status | Priority | Features | Created | Last Updated | System |
|-----------|--------|----------|----------|---------|--------------|--------|
| *[No epic plans yet]* | - | - | - | - | - | - |

## Epic Details

*[Epic details will be added here as epics are created]*

---

## Epic Management

### Creating Epic Plans

1. Create epic directory: `epics/[epic-name]/`
2. Create epic plan: `epics/[epic-name]/plan.md`
3. Add epic to index in this README
4. Link features to epic in feature plan metadata

### Updating Epic Plans

1. Update epic plan file
2. Update Last Updated in index
3. Update feature status in epic details

### Completing Epic Plans

1. Mark all features as completed
2. Update epic status to "Completed"
3. Add completion date
4. Move epic directory to `../completed/epics/[epic-name]/` (optional)

## Related Documents

- **[Plans Index](../README.md)** - All plans index
- **[Plan Overview](../plan-overview.md)** - High-level overview
- **[Progress Tracking](../../status/progress.md)** - Implementation progress

---

**Last Updated:** [Auto-updated by agents]
