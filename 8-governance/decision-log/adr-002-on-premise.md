# ADR-002: On-Premise Hosting

**Status:** Accepted
**Date:** 2026-07-16
**Decider:** @user (chose on-premise from options)
**Related:** [Infrastructure](../../3-technical/3.1-system-foundation/infrastructure.md), [ADR-001](adr-001-tech-stack.md)

## Context

AKAIUNSAN needs hosting for the attendance + payroll systems. Options were cloud (AWS Singapore, VNPT Cloud, Viettel IDC) vs on-premise (own server at office). User chose on-premise.

## Decision

Host the entire stack on a single physical server at AKAIUNSAN's office, accessed externally via Cloudflare Tunnel. No cloud VMs, no managed databases.

## Rationale

**Why on-premise:**
- Data residency: all 200+ employee records (CCCD, phone, bank account) stay physically in VN office
- Latency: 15 project sites mostly in HCMC, office server is on same metro network
- Cost: ~$0-10/month recurring (Cloudflare Tunnel free tier + electricity) vs ~$50-200/month for equivalent cloud VM
- Control: backup, restore, and access policy all in-house

**Why not pure cloud:**
- Recurring cost adds up over years
- Data residency compliance for employee data simpler on-prem
- Office already has stable internet + UPS

## Architecture

See [Infrastructure doc](../../3-technical/3.1-system-foundation/infrastructure.md) for full spec. Summary:
- 1× Dell OptiPlex / used server (4 vCPU, 16 GB RAM, 500 GB SSD, ~$800-1500 one-time)
- Ubuntu 22.04 LTS
- Docker Compose stack (1 file, 6 services: 2× Fastify, 1× Next.js, Postgres, Redis, MinIO)
- Caddy reverse proxy (TLS via Cloudflare Tunnel)
- Cloudflare Tunnel for external access (no static IP needed, no port forwarding)
- Daily `pg_dump` + MinIO bucket sync to backup VPS (Vultr Singapore, $6/mo)
- UPS 1000 VA for power outage buffer

## Consequences

**Positive:**
- Zero recurring cloud cost beyond backup VPS
- Full physical control over data
- Low latency to all project sites (all in HCMC area)
- Network outage resilience via local LAN at office

**Negative / Risks:**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Office server theft/damage | Data loss | Off-site backup VPS, weekly restore drill |
| Internet outage at office | Mobile users can't check-in | All sites have 4G; sites can hotspot to phone if office WiFi down (server still up) |
| Single point of failure | Total downtime if server dies | UPS + spare hardware ready; 4-hour RTO documented |
| Limited compute scaling | Won't scale to 1000+ users on 1 server | Scale vertically (32 GB RAM upgrade) before horizontal split |
| Sysadmin burden | Hack-style "I run prod on my laptop" | Documented runbook in `3-technical/3.3-devops/server-steps.md`; train 2 people |

**Operational requirements:**
- Backup verification daily (auto-script sends alert if pg_dump missing)
- Quarterly restore drill to test backup
- Patch Windows/Linux security updates monthly (auto via unattended-upgrades)
- UPS battery test quarterly
- Replace server hardware every 4-5 years (planned refresh)

**Rollback path:**
If on-prem becomes infeasible (cost of redundancy, scale limit hit), migration to cloud is straightforward:
1. Export pg_dump + MinIO bucket → upload to S3
2. Stand up equivalent VM (e.g., Lightsail $40/mo) on AWS Singapore
3. Point Cloudflare Tunnel to new IP
4. Total migration time: ~1 day with runbook

## Future Triggers to Migrate to Cloud

- User count > 500 active monthly
- Office site count > 30 (cross-region latency)
- Compliance requires SOC 2 / ISO 27001 (cloud providers have these)
- Available budget for ops team > $500/mo

ADR supersedes none. Superseded by none.
