# Agents — AI-First Startup Factory

This directory contains the **three-layer agent system**.

## Layers

| Layer | Directory | Purpose |
|-------|-----------|---------|
| **Core Agents** | [core-agents/](core-agents/) | Factory owners (13 agents) |
| **Agency Agents** | [agency-agents/](agency-agents/) | Specialized execution (150+ playbooks) |
| **Skills** | [skills/](skills/) | Method layer |

## Structure

```
agents/
├── core-agents/     # 13 factory owner agents
├── agency-agents/   # 150+ specialist playbooks
└── skills/         # Reusable methods
```

## Usage

1. **Core Agents** own work and route to specialists
2. **Agency Agents** provide deep execution
3. **Skills** provide methods and techniques

See [Mode Overview](../mode/README.md) for how agents work in workflows.

## Related

- [0-agents/README.md](../README.md)
- [0-agents/mode/README.md](../mode/README.md)
- [INDEX.md](../../INDEX.md)
