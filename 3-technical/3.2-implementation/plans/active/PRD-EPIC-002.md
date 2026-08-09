---
id: PRD-EPIC-002
title: Hệ thống Quản lý Chấm công & Tính lương — AKAIUNSAN
type: epic
domain: product
status: in-progress
parent_id: "-"
related_ids:
  - PRD-EPIC-001
  - CODE-BUG-002
  - CODE-BUG-003
  - CODE-BUG-004
  - CODE-BUG-005
  - CODE-BUG-006
  - CODE-BUG-007
  - CODE-BUG-008
  - CODE-BUG-009
  - CODE-BUG-010
  - CODE-BUG-011
  - CODE-BUG-012
  - CODE-BUG-013
  - CODE-BUG-014
  - CODE-BUG-015
  - CODE-BUG-016
  - CODE-BUG-017
  - CODE-BUG-018
  - CODE-BUG-019
  - CODE-BUG-020
  - CODE-BUG-021
  - CODE-BUG-022
created: 2026-07-16
updated: 2026-08-09
priority: high
owner: "@fullstack-engineer"
phases:
  - plan
  - code
  - review
folder: 3-technical/3.2-implementation/plans/active/
related_domain_docs:
  - 3-technical/3.1-system-foundation/infrastructure.md
  - 3-technical/3.1-system-foundation/design-standards/system-design.md
  - 3-technical/3.1-system-foundation/architecture/domain-specs.md
  - 3-technical/3.1-system-foundation/architecture/api-contracts/
  - 3-technical/3.1-system-foundation/design-standards/coding-standards.md
---

# Plan: Hệ thống Quản lý Chấm công & Tính lương — AKAIUNSAN

## Context

**Vấn đề.** AKAIUNSAN là công ty dịch vụ vệ sinh ở VN với ~200 nhân viên trải trên 15 dự án. Back-office hiện xử lý chấm công, ca kíp, bảng lương, báo cáo khách hàng bằng Excel + Zalo + giấy — chậm, dễ gian lận (ghost workers, OT ảo), thiếu audit trail, và khó đối chiếu khi khách hàng hỏi bằng chứng dịch vụ.

**Kết quả mong muốn.** Phần mềm nội bộ cho phép nhân viên check-in/out tại dự án bằng mobile (GPS + ảnh), BO xem bảng chấm công realtime, tự động tính bảng lương cuối tháng, và xuất báo cáo gửi 15 khách hàng. Pilot trên 1–2 dự án đầu trước khi mở rộng.

**Tại sao bây giờ.** Đây là epic product đầu tiên của AKAIUNSAN. Factory repo hiện là template rỗng (xem [findings note](#findings-note)). Epic này thiết lập đồng thời (a) domain model thật cho công ty vệ sinh VN, (b) các architecture docs còn thiếu, (c) baseline codebase & CI cho tất cả epic sau.

## Code Review

### Review scope and plan

- Work item: `PRD-EPIC-002`.
- Frozen commit range: `08d9d25..9ed7be2`.
- Inventory: 147 files, 28,885 insertions and 360 deletions.
- Priority order: authentication/RBAC/tenant isolation; attendance GPS/photo/state; payroll money/state integrity; CI/deployment; frontend reliability and documentation drift.
- Audit method: parallel security, payroll, attendance/data-flow, and CI/reliability reviews; automated lint, typecheck, test, build, coverage, migration, Compose, and Docker checks; manual evidence at file and line level.
- Exclusions: dependency vulnerability scan, load testing, live deployment, accessibility scoring, and complete Flutter platform/device validation.

### Review result — 2026-07-17

- Verdict: **REJECTED**.
- Findings: 4 Critical, 14 High, and 3 Medium.
- Deployment and pilot are blocked until all Critical and security/payroll High findings are fixed and re-reviewed.
- Canonical report: [PRD-EPIC-002 code review](../../../../8-governance/reviews/prd-epic-002-code-review-2026-07-17.md).
- Vietnam tax/insurance remains outside MVP under ADR-003; executable modes other than `none` must not affect MVP payroll.

### Remediation re-review — 2026-07-18

- Independent attendance/auth/mobile and payroll reviewers returned **GO** on remediation commit `056a769` with no blocking findings.
- All 21 findings are fixed and locally validated; Docs Guardian returned GO for `CODE-BUG-022` on 2026-07-19. The evidence includes 150 unit tests, 8 fresh-database integration tests, 7 live Playwright scenarios, coverage above 90%, production package/image builds, fresh migrations, Compose/Caddy validation, OpenAPI 3.1 parse/semantic validation, Flutter analysis/tests, and an Android APK build.
- Remediation commit `056a769` is pushed, [GitHub Actions run 29670131275](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275) passes quality, build, integration, Playwright, and Flutter/APK jobs, and the [SHA-pinned re-review](../../../../8-governance/reviews/prd-epic-002-code-re-review-2026-07-19.md) records **GO**. The 2026-07-17 rejected report remains immutable historical evidence.
- Immutable CI/review is necessary but not sufficient for pilot. The epic remains
  `in-progress`; unmet PRD-SLICE-003..005 acceptance items must be completed or
  explicitly deferred with product-owner approval before the 1–2 project pilot,
  and pilot/scale-out acceptance remains outstanding.

## Findings Note

Exploration ngày 2026-07-16 xác nhận:
- `systems/` trống — chưa có dòng code sản phẩm
- `6-operations/` chứa generic SaaS boilerplate, KHÔNG phản ánh reality vệ sinh VN (không có tên BO, không có công thức lương, không có BHXH/PIT/BHXH-process, không có 15 dự án)
- Tất cả `3-technical/3.1-system-foundation/**` (infrastructure, system-design, domain-specs, api-contracts, coding-standards) là template trống
- Epic đang chạy duy nhất: `PRD-EPIC-001` (meta — Factory Agent Leadership Orchestration, không liên quan product)

→ Epic này **tự sản xuất** các architecture docs thật (thay vì điền vào template) như là deliverable của Phase 0. Nếu user muốn "lean hơn", Phase 0 rút gọn xuống MVP-spec; Phase 0 đầy đủ mới tạo nền tái sử dụng được cho epic sau.

## Decisions

| # | Quyết định | Lựa chọn | Lý do |
| --- | --- | --- | --- |
| 1 | System boundaries | `attendance` + `payroll`, shared infrastructure in `systems/shared` | Separates the two bounded contexts while retaining one database/runtime stack for the MVP |
| 2 | Phạm vi MVP | **Attendance + Payroll + Customer report** (user chọn) | Full scope, dù có pilot để giảm rủi ro |
| 3 | Rollout | Pilot 1–2 dự án đầu (user chọn) | Validate trước khi scale 15 dự án |
| 4 | VN compliance | **Bỏ qua** ở MVP — BO xử lý thủ công (user chọn) | Đơn giản hóa bảng lương (gross + OT cơ bản); có thể thêm compliance engine ở epic sau |
| 5 | Hosting | **On-premise** server + Cloudflare Tunnel (user chọn) | Data services remain on-prem; Cloudflare provides public edge TLS over an outbound tunnel, with no inbound port-forward |
| 6 | Mobile platform | **Native iOS + Android** (user chọn) | UX tốt nhất cho 200 NV |
| 7 | Check-in method | GPS + ảnh chụp lúc in/out (user chọn) | Cân bằng bảo mật & chi phí; không cần ML face-match ở MVP |
| 8 | Tech stack | Architect đề xuất — đề xuất dưới đây, chốt qua ADR | Per `[core-agents/system-architecture.md:62-81]` |

### Tech Stack Đề Xuất (sẽ thành ADR-001)

| Layer | Lựa chọn | Lý do |
| --- | --- | --- |
| Mobile | **Flutter 3.x (Dart)** | Một codebase cho iOS + Android, native perf, package camera/location đầy đủ, dev VN sẵn có |
| Backend API | **Node.js 20 + Fastify + TypeScript** | Type-safe, ecosystem JWT/auth/ORM rộng, dev VN dễ tuyển, async I/O tốt cho 200 user đồng thời |
| Web admin | **Next.js 15 (App Router) + TypeScript** | Cùng ecosystem TS, build nhanh, deploy Docker dễ |
| Database | **PostgreSQL 16** | Quan hệ chặt cho HR/payroll, JSONB cho metadata linh hoạt, mature |
| Cache / auth state | **Redis 7** | OTP challenges and abuse controls; refresh-token families are hashed in PostgreSQL, and payroll calculation is transactional in the API |
| Object storage (ảnh check-in) | **MinIO** (S3-compatible, self-hosted) | On-premise friendly, không phụ thuộc AWS, chi phí = 0 |
| Reverse proxy + TLS | **Caddy 2 origin + Cloudflare edge TLS** | Caddy routes local services over HTTP origin; Cloudflare terminates public HTTPS through the outbound tunnel |
| Container | **Docker Compose** trên 1 server Linux (Ubuntu 22.04) | Đơn giản cho on-premise; scale lên Kubernetes chỉ khi >1 server |
| CI | **GitHub Actions** | Lint, tests, coverage, fresh-service integration/E2E, production build, and Android APK; iOS requires a separate Apple toolchain/signing gate |

**Tuân thủ factory gates:**
- Product code is split between `systems/attendance`, `systems/payroll`, and `systems/shared`
- 5 architecture docs **được tạo ra trong Phase 0** (chứ không dùng template)
- Coverage floor **≥90%** (theo `[code.md:47]`); target 100% cho domain logic chấm công/tính lương
- Plan format copy từ `3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md`

## Scope

### In-Scope (MVP)
1. Mobile app (Flutter): login, xem ca hôm nay, check-in/out kèm GPS + ảnh, xem lịch sử chấm công của mình
2. Web admin (Next.js): CRUD nhân viên, dự án, ca kíp; lên lịch; xem bảng chấm công realtime; override/manual adjust; tính bảng lương cuối kỳ; xuất báo cáo khách hàng (PDF/CSV)
3. Backend API (Node/Fastify): auth, attendance records, schedule engine, payroll calculation engine, customer report generator
4. On-premise deployment: Docker Compose stack (Postgres, Redis, MinIO, backend, web), Caddy reverse proxy
5. Pilot: 1–2 dự án đầu tiên (user chọn cụ thể ở Phase 1)

### Out-of-Scope (Epic sau hoặc không làm)
- Tích hợp BHXH/PIT/thuế TNCN (BO xử lý thủ công ở MVP)
- Face recognition / liveness detection
- Multi-tenant SaaS (giữ tenancy hook trong DB nhưng UI là single-tenant)
- Customer portal self-service (BO gửi báo cáo PDF)
- Push notification qua FCM (dùng Zalo/SMS thủ công)
- Tích hợp máy chấm công vân tay / RFID
- App offline hoàn toàn (cache tạm được nhưng check-in phải online)

## Architecture

### High-Level Diagram

```
Mobile / browser ──HTTPS──► Cloudflare edge + Tunnel
                              │ HTTP origin :80
                              ▼
                         Caddy reverse proxy
                         ├── Attendance API ──┬── PostgreSQL
                         │                    ├── Redis
                         │                    └── private MinIO
                         └── Web Admin ───────┬── Attendance API
                                              └── Payroll API ──HTTP/internal──► Attendance API
```

### Core Domain Model (sẽ chi tiết trong `domain-specs.md` ở Phase 0)

```
Tenant (1) ─── (n) Project  (15 dự án thuộc AKAIUNSAN)
                      │
                      │  (n)
                      ▼
                 ShiftAssignment
                 (employee × shift × ngày)
                      │
                      │  produces
                      ▼
                 AttendanceRecord
                 (in/out timestamps, GPS, private photo object keys, status)
                      │
                      │  feeds
                      ▼
                 PayrollPeriod  ─── (n) PayrollLine
                 (tháng)            (1 NV × 1 tháng)

User:  employee | supervisor | bo_admin | system_admin
Shift: ca_sáng (6-14h) | ca_chiều (14-22h) | ca_tối (22-6h) | custom
AttendanceRecord.status: present | late | early_leave | half_day | absent | on_leave | holiday
PayrollLine.gross = monthly_prorata_or_hourly_regular + category_OT - late_penalty + allowances
PayrollLine.deductions = advance | other (compliance để BO tính)
```

### Tech Stack & Stack Map

Sẽ cập nhật `3-technical/3.1-system-foundation/infrastructure.md` (tạo mới — thay template) trong Phase 0 với Tech Stack này.

## Work Breakdown

### Epic: PRD-EPIC-002

```
PRD-EPIC-002 (this epic)
├── PRD-SLICE-002: Foundation (Phase 0 + 1)
│   ├── CODE-TASK-003: Produce 5 architecture docs
│   ├── CODE-TASK-004: Scaffold systems/attendance + systems/payroll
│   ├── CODE-TASK-005: Create ADR-001/002/003
│   └── CODE-TASK-006: Docker Compose stack + Caddy reverse proxy
│
├── PRD-SLICE-003: Attendance (Phase 2)
│   ├── Backend Project, Shift, Employee, monthly project schedule/copy, Check-in/out, report APIs
│   ├── Flutter login + multi-assignment Today + check-in/out flow
│   ├── Web-admin realtime attendance, monthly scheduling, copy preview, and audited override
│   └── Unit/integration/mobile/browser regression coverage
│
├── PRD-SLICE-004: Payroll (Phase 3)
│   ├── Payroll engine + period/line persistence
│   ├── Web-admin review, approve, and Excel export
│   └── Unit/integration/browser regression coverage
│
├── PRD-SLICE-005: Customer Report (Phase 4)
│   ├── Tenant/project-scoped PDF and CSV generator
│   └── Web-admin executive/report visibility
│
├── PRD-SLICE-006: Pilot (Phase 5)
│   ├── OPS-TASK-006: Chọn 1–2 dự án pilot (user)
│   ├── On-site training + support
│   └── Pilot feedback and remediation backlog
│
└── PRD-SLICE-007: Scale-out (Phase 6)
    ├── OPS-TASK-007: Rollout plan 13 dự án còn lại
    ├── Multi-project conflict handling
    └── Performance tuning if pilot evidence requires it
```

**ID sequence:** `PRD-EPIC-002`, `PRD-SLICE-002..007`, registered foundation tasks `CODE-TASK-003..006`, and operations tasks `OPS-TASK-006..007`. Feature implementation below the foundation is tracked at slice level; no orphan `CODE-TASK-007+` IDs are implied.

## Implementation Phases

### Phase 0 — Architecture (Foundation, 1 tuần)
**Priority:** Highest (gate cho mọi code sau)
**Goals:**
- Chốt cấu trúc tách `systems/attendance` + `systems/payroll`, dùng `systems/shared` cho hạ tầng chung
- Tạo hai system scaffold từ TEMPLATE-SYSTEM
- Sản xuất 5 architecture docs thật (không điền vào template):
  - `3-technical/3.1-system-foundation/infrastructure.md` — Tech stack + on-prem setup + cost estimate
  - `3-technical/3.1-system-foundation/design-standards/system-design.md` — C4 diagrams (Context, Container, Component, Code)
  - `3-technical/3.1-system-foundation/architecture/domain-specs.md` — DDD entities + business rules + aggregate roots
  - `3-technical/3.1-system-foundation/architecture/api-contracts/` — OpenAPI 3.1 cho 30+ endpoints
  - `3-technical/3.1-system-foundation/design-standards/coding-standards.md` — TS/Flutter conventions + testing strategy
- Tạo ADR-001 (tech stack), ADR-002 (on-prem), ADR-003 (bỏ qua compliance ở MVP) trong `8-governance/decision-log/`
- Cập nhật `systems/README.md` + `3-technical/3.1-system-foundation/architecture/system-overview.md` để map system mới

**Tasks:** CODE-TASK-003 and CODE-TASK-005; owner @system-architecture, @fullstack-engineer
**Success Metrics:** Cả 5 docs tồn tại + nội dung thật (không phải placeholder); ADR-001/002/003 accepted; user approve name.

### Phase 1 — Foundation Build (2 tuần)
**Priority:** High
**Goals:**
- Scaffold `systems/attendance` và `systems/payroll` (Fastify APIs + Flutter + Next.js) cùng Compose/CI trong shared/root
- Auth (OTP cho nhân viên qua SMS gateway của VN, email+password+2FA cho admin)
- DB schema + migrations (Prisma)
- Dev environment chạy được trên laptop

**Tasks:** CODE-TASK-004 and CODE-TASK-006
**Success Metrics:** `docker compose up` chạy local, login flow pass tests, CI green trên PR đầu tiên.

### Phase 2 — Attendance (3 tuần)
**Priority:** High (core feature của MVP)
**Goals:** Mobile app check-in/out bằng GPS + ảnh, web admin xem realtime + override,
và lịch dự án theo tháng có copy lịch, xem trước, cảnh báo xung đột và xác nhận có audit.

**Tracking:** PRD-SLICE-003
**Coverage:** ≥90% (target 100%) cho schedule engine, GPS validation, attendance logic
**Success Metrics:**
- 10 NV test thật trong dev environment, check-in/out ổn định 1 tuần
- Ảnh + GPS lưu vào MinIO + Postgres đúng
- Web admin xem được bảng chấm công realtime, manual adjust có audit trail

### Phase 3 — Payroll (2 tuần)
**Priority:** High
**Goals:** Tính bảng lương cơ bản (gross + OT + deductions), xuất Excel

**Tracking:** PRD-SLICE-004
**Coverage:** ≥90% cho payroll engine (nhiều edge case: tháng 28/30/31 ngày, làm tròn giờ, OT cuối tuần vs ngày lễ, nghỉ phép không lương)
**Success Metrics:**
- Payroll cho tháng test khớp với tính tay của BO trong phạm vi ±1 giờ làm tròn
- Web admin duyệt được bảng lương, xuất Excel đúng format kế toán VN

### Phase 4 — Customer Report (1 tuần)
**Priority:** Medium
**Goals:** Auto-generate báo cáo PDF/CSV gửi 15 khách hàng

**Tracking:** PRD-SLICE-005
**Success Metrics:** 15 dự án có template riêng (logo, header), xuất PDF cho 1 dự án trong <10s

### Phase 5 — Pilot (2 tuần)
**Priority:** High (gate trước scale-out)
**Goals:** Triển khai thật ở 1–2 dự án đầu

**Tracking:** PRD-SLICE-006 and OPS-TASK-006
**Success Metrics:**
- 30–60 NV ở pilot projects dùng app hàng ngày trong 2 tuần không lỗi nghiêm trọng
- BO duyệt được bảng lương pilot tháng đầu tiên từ hệ thống (không cần Excel)
- Feedback từ supervisor + BO → backlog ép vào Phase 6

### Phase 6 — Scale-out (3 tuần, sau pilot)
**Priority:** Medium (chỉ chạy nếu pilot pass)
**Goals:** Triển khai 13 dự án còn lại + xử lý NV làm nhiều dự án

**Tracking:** PRD-SLICE-007 and OPS-TASK-007
**Success Metrics:** 200 NV dùng ổn định; payroll tháng đầu tiên full-rollout chạy mượt

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 200 NV phản đối mobile app (quen giấy/giọng nói) | High — adoption fail | Training on-site + tiếng Việt thuần + UX đơn giản (1 nút to); Phase 5 pilot validate trước |
| Site mất 4G/WiFi khi check-in | High — miss records | MVP uses an audited supervisor override/fallback process; offline retry queue is a future enhancement and must be validated before any offline claim |
| Bảng lương tính sai gây tranh cấp | High — pháp lý + morale | 100% test cho payroll engine + chạy song song Excel 1 tháng trước khi cắt |
| On-prem server hỏng (cháy, HDD chết) | High — mất data | Daily backup Postgres + MinIO ra ổ ngoài hoặc 1 VPS backup; test restore hàng quý |
| Server on-prem không có static IP / domain | Medium — mobile không truy cập được | Dùng Cloudflare Tunnel hoặc Tailscale (VPN miễn phí) làm bridge |
| 5 architecture docs chưa đầy đủ → Code Mode block | Medium — delay | Phase 0 là gate rõ ràng; không vào Phase 1 nếu docs chưa accept |
| Pilot feedback làm đảo lộn design | Medium — rework | Pilot scope giới hạn 1–2 dự án; tách epic sau cho scale-out |

## Verification (How to test end-to-end)

Mỗi phase có test riêng. End-to-end verification cho toàn bộ hệ thống sau Phase 6:

1. **Local dev test:**
   - `docker compose up` → backend + web + mobile (qua emulator) chạy được
   - Login NV, check-in tại vị trí giả lập (GPS emulator), ảnh từ camera emulator → record xuất hiện trong DB + MinIO
   - Web admin login → xem record, manual adjust, tính bảng lương test 1 tháng → Excel khớp với tính tay

2. **Staging test (sau Phase 5):**
   - Deploy lên on-prem server thật
   - 5 NV ở 1 dự án thật dùng 7 ngày
   - So sánh attendance records từ app với sổ tay supervisor (target ≥95% khớp)

3. **Pilot acceptance (cuối Phase 5):**
   - 30–60 NV ở 1–2 dự án dùng 2 tuần
   - BO chạy payroll từ hệ thống, đối chiếu Excel
   - Customer report auto-generated cho 1 dự án pilot, gửi khách, thu feedback

4. **Full rollout acceptance (cuối Phase 6):**
   - 200 NV dùng ổn định 30 ngày
   - 1 bảng lương full-rollout chạy đúng từ đầu đến cuối (tính lương → duyệt → xuất Excel → BO gửi)
   - 15 báo cáo khách hàng gửi đúng hẹn tháng đầu tiên

## Critical Delivery Files

### Phase 0 — Architecture docs (delivered)
- `3-technical/3.1-system-foundation/infrastructure.md` (thay template)
- `3-technical/3.1-system-foundation/design-standards/system-design.md` (thay template)
- `3-technical/3.1-system-foundation/architecture/domain-specs.md` (thay template)
- `3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml` (mới)
- `3-technical/3.1-system-foundation/design-standards/coding-standards.md` (thay template)
- `systems/README.md` (lists the split `attendance` and `payroll` systems)
- `8-governance/decision-log/adr-001-tech-stack.md`, `adr-002-on-premise.md`, `adr-003-skip-vn-compliance-mvp.md`

### Phase 1+ — Code
- `systems/attendance/` — Fastify API, Flutter app, tests, and system docs
- `systems/payroll/` — Fastify API, Next.js web admin, tests, and system docs
- `systems/shared/` — shared auth/domain utilities, Prisma schema/migrations, Caddy, and Compose
- `.github/workflows/ci.yml` — quality, live integration/E2E, production build, and Flutter gates
- `3-technical/3.3-devops/server-steps.md` — on-premise deployment and upgrade runbook
- `3-technical/3.3-devops/windows-docker-deployment.md` and `windows-docker.ps1` — Windows local/UAT exact-SHA deploy and seed-only rebuild
- `systems/shared/docker-compose.windows.yml` — required Windows named-volume and loopback override

### Tracking
- `3-technical/3.2-implementation/status/work-items-registry.md` (thêm PRD-EPIC-002 + slices + tasks)
- `3-technical/3.2-implementation/plans/README.md` (active plans table)
- `2-product-foundation/product-backlog/backlog.md` (Epic 2)
- `8-governance/changelog.md` (mỗi phase close)

## Active Delivery Batch — Windows Docker Git-to-UAT Deployment (2026-07-21)

**Owner:** `CODE-TASK-006` under `PRD-SLICE-002`. Product validation: GO with conditions.

**Context allowlist:**

- `systems/shared/docker-compose.yml`
- `systems/shared/docker-compose.windows.yml`
- `systems/shared/src/db/seeds/`
- `systems/shared/README.md`
- `.github/workflows/ci.yml`
- `3-technical/3.3-devops/`
- `3-technical/3.1-system-foundation/infrastructure.md`
- Root `README.md`, `INDEX.md`, active plan, work-item registry, progress, and changelog for navigation/traceability/evidence.

**Acceptance scope:**

1. Windows 10/11 Docker Desktop uses WSL2 Linux containers, a thin Compose override with stable named volumes, and loopback-only host ports. It remains local/controlled UAT and does not replace the Ubuntu 22.04 production/pilot architecture.
2. A guarded PowerShell entry point supports read-only validation/status/logs/smoke tests plus confirmed fresh-only install/start/update/stop and an explicitly destructive seed-only UAT database reset. Reset requires both an explicit switch and a committed seed tenant/admin sentinel. It never removes volumes, prunes Docker, opens a firewall/tunnel, pushes Git, or prints Compose secrets.
3. Install/update accepts only a clean canonical repository and a full reviewed SHA contained in remote `main`; migrations run before the full stack, followed by the RBAC seed or an explicit demo-seed option.
4. Git transports source, migrations, and seed scripts, not Docker volumes or database files. The disposable Windows seed database may be rebuilt with `ResetSeedUat`; production/pilot data may not.
5. CI parses the PowerShell script and validates the merged base/Windows Compose configuration. Local validation proves no `/data` bind remains in the merged profile and every published port binds to loopback.
6. Caddy actively routes the explicit storage hostname to MinIO; cloudflared sends both application and storage hostnames to Caddy so one maintenance transition closes all ingress before checkpoint, migration, or seed reset.
7. The Windows AI runbook states preflight, confirmation, maintenance downtime, TOTP, Cloudflare separation, migration failure, backup, health, evidence, and rollback boundaries without copying secrets into Git or chat.
8. Aggregate UAT seed creates an idempotent open schedule on the current Vietnam date plus 13 following Mon–Sat dates for all five fixed demo employees; historical attendance stops at yesterday so the employee can perform the current-day GPS/photo check-in and check-out manually.

**Explicit exclusions:** automatic deployment on Git push, self-hosted runner, remote Docker daemon, WinRM/RDP/SSH setup, firewall/DNS/tunnel mutation, Windows production/pilot approval, database downgrade, volume deletion, real-host deployment from this Mac, and pilot acceptance.

## Active Delivery Batch — BO Shift Scheduling and Local Attendance UAT (2026-07-20)

**Owner:** `PRD-SLICE-003` — Attendance. Product validation: GO with conditions.

**Context allowlist:**

- `systems/attendance/backend/src/routes/shifts.ts`
- `systems/attendance/backend/src/routes/attendance.ts`
- `systems/attendance/backend/src/services/schedule-service.ts`
- `systems/attendance/backend/tests/integration/supervisor-data-scope.test.ts`
- `systems/attendance/backend/tests/integration/scope-fixture.ts`
- `systems/attendance/backend/tests/unit/schedule-service.test.ts`
- `systems/shared/src/db/prisma/schema.prisma`
- `systems/shared/src/db/prisma/migrations/`
- `systems/shared/src/db/seeds/demo-accounts.ts`
- `DEMO_ACCOUNTS.md`
- `systems/shared/README.md`
- `systems/shared/src/db/seeds/`
- `systems/payroll/web-admin/app/attendance/page.tsx`
- `systems/payroll/web-admin/app/login/page.tsx`
- `systems/payroll/web-admin/app/globals.css`
- `systems/payroll/web-admin/components/TopNav.tsx`
- `systems/payroll/web-admin/next.config.js`
- `systems/payroll/web-admin/e2e/auth.spec.ts`
- `systems/attendance/mobile/lib/features/attendance/`
- `systems/attendance/mobile/test/widget_test.dart`
- `3-technical/3.1-system-foundation/architecture/domain-specs.md`
- `3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml`
- Existing attendance READMEs, progress status, and changelog for delivery evidence.

**Acceptance scope:**

1. BO/system admin can list/create active shift templates and list/filter/create/cancel dated assignments across their tenant.
2. Supervisors can list/create/cancel only within explicit active project membership. Employees have no scheduling access.
3. Shift templates are tenant-owned. Assignments require an active employee/user, active project, and active shift in the same tenant. This original single-assignment invariant is superseded by the approved monthly scheduling batch below: exact duplicates remain blocked, while genuine time conflicts require an explicit warning acknowledgement and audit.
4. Cancellation requires a reason, is audited, and is rejected after check-in or any attendance record. Rescheduling is cancel then create; full template update/delete is deferred.
5. BO UI exposes a dated scheduling form, project/employee/shift filters, operational status counts, clear empty/error states, and a roster with guarded cancellation.
6. Local UAT proves BO assignment → employee mobile Today → GPS/photo check-in → BO visibility → GPS/photo check-out → checkout-complete (`checked_out`) state. Simulator evidence is development-only and does not replace physical-device or pilot acceptance.

**Explicit exclusions:** recurring-rule/drag-drop schedules, staffing optimization, leave workflow, notifications, offline behavior, payroll/report changes, production deploy/tunnel, real-site device reliability, signing, and pilot approval. Monthly same-project copy and multiple confirmed assignments per employee/day are included only by the later approved batch below.

**Local completion evidence (2026-07-20):**

- BO operations board implements dated assignment, active project/employee/shift selection, status coverage, filtering, audited cancellation, and BO-only template creation; supervisor UI is membership-scoped and hides template creation.
- Shift templates are tenant-scoped in Prisma, API reads/writes, seeds, and fixtures. The migration clones the former global catalog per tenant, repoints assignments by project tenant, verifies alignment, and adds a partial database unique index for one non-cancelled employee/date assignment.
- Assignment/cancellation integration passes tenant/role/membership checks, foreign-shift and inactive-resource rejection, same-date/adjacent-date overlap, duplicate/concurrent create, concurrent cancel, audit, and no-cancel-after-attendance behavior. Assignment lists are paginated and return full-filter status summaries so BO totals do not truncate with the visible page.
- Live local UAT used `PRJ001`: BO assigned the employee, the iOS Simulator showed the shift and geofence GPS, check-in/out with required JPEG evidence succeeded through the public API, and both BO and the explicitly assigned supervisor saw the record and final `checked_out` state.
- The UAT exposed and fixed UTC clock rendering on mobile; Flutter now converts server instants to device local time and has a regression test.
- iOS Simulator cannot provide a camera stream and reports `Camera not available`; the UI was verified to require a photo, while the photo upload path was completed at API level. A physical-device GPS/camera pass remains a release/pilot gate.
- Database verification passes both a fresh six-migration deploy/seed and an explicit two-tenant backfill from the prior five-migration schema; cloned templates and assignments remain tenant-aligned, a second active same-day assignment is rejected, and cancelled history is retained. The existing legacy local demo database was not mutated because its repeated non-cancelled employee/date rows correctly trigger the migration preflight; those rows require audited reconciliation before that database can be upgraded.
- A foreign-tenant seed sentinel remained untouched while the full attendance demo seed processed 13,800 AK assignments, confirming tenant-scoped demo writes. Independent final code re-review returned **GO** with no High/Medium findings.
- The controlled-UAT aggregate seed now leaves the current Vietnam day open and schedules `NV-DEMO-01..05` for today plus 13 following Mon–Sat dates. It requires a process-local `ALLOW_DEMO_SEED=true` sentinel, rejects reserved demo identities that belong to another tenant/employee, preserves existing attendance on reruns, and writes historical shift times as Vietnam `+07:00` instants. An isolated API walkthrough using `NV-DEMO-01` passed password login, Today assignment lookup with no prefilled attendance, real JPEG/MinIO plus project-GPS check-in, immediate check-out, and final `checked_out` reconciliation.
- Local gates pass: Attendance 47 unit tests and 9/9 full live integration tests, Payroll integration 1/1, Flutter 4 tests/analyze, web lint/typecheck/production build, focused BO Playwright schedule create/cancel E2E using the BO account, and OpenAPI YAML parse. No deployment, commit, push, or remote CI was performed in this batch.

## Active Delivery Batch — Monthly Project Schedule and Copy (2026-07-24)

**Owner:** `PRD-SLICE-003` — Attendance. Product validation: conditional GO;
the required canonical conflict rules and contracts were updated before
implementation.

**Context allowlist:**

- `systems/attendance/backend/src/routes/shifts.ts`
- `systems/attendance/backend/src/routes/schedule-copy.ts`
- `systems/attendance/backend/src/routes/attendance.ts`
- `systems/attendance/backend/src/services/schedule-service.ts`
- `systems/attendance/backend/src/services/schedule-copy-service.ts`
- `systems/attendance/backend/src/services/reports/customer-report.ts`
- `systems/attendance/backend/package.json`
- `systems/attendance/backend/tests/unit/`
- `systems/attendance/backend/tests/integration/`
- `systems/shared/src/db/prisma/schema.prisma`
- `systems/shared/src/db/prisma/migrations/`
- `systems/payroll/web-admin/app/attendance/page.tsx`
- `systems/payroll/web-admin/app/globals.css`
- `systems/payroll/web-admin/lib/api.ts`
- `systems/payroll/web-admin/e2e/auth.spec.ts`
- `systems/attendance/mobile/lib/features/attendance/`
- `systems/attendance/mobile/test/widget_test.dart`
- `systems/payroll/backend/src/clients/attendance-client.ts`
- `systems/payroll/backend/src/engine/calculator.ts`
- `systems/payroll/backend/src/server.ts`
- `systems/payroll/backend/tests/unit/attendance-client.test.ts`
- `systems/payroll/backend/tests/unit/calculator.test.ts`
- `systems/payroll/backend/tests/unit/health.test.ts`
- `3-technical/3.1-system-foundation/architecture/domain-specs.md`
- `3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml`
- Existing attendance READMEs, progress status, and changelog for delivery evidence.

**Acceptance scope:**

1. BO/system admin and an explicitly assigned supervisor can select one authorized
   project and a Vietnam-calendar month, then list the complete paginated roster
   for that project/month with employee, date, shift, status, and notes.
2. An authorized scheduler can copy a non-cancelled source range of at most 31
   days to a target start date in the same project. Target dates preserve the
   source day offsets. Only employee, project, shift, and notes are copied;
   attendance, cancellation state, and prior audit history are never copied.
3. Copy always has a preview. Preview and create detect same-day and adjacent-day
   overnight time conflicts. Genuine overlaps are soft warnings: saving requires
   explicit confirmation and records actor, request, source, target, and conflict
   evidence in immutable audit. The review displays every source→target mapping,
   with warnings/blockers first, before confirmation.
4. Exact duplicate employee/project/shift/date assignments, inactive or
   cross-tenant resources, unauthorized project access, invalid dates, and dates
   outside the active project contract remain hard failures.
5. Bulk copy is atomic and accepts a client UUID idempotency key. Repeating a
   completed request returns the original result and does not create duplicate
   assignments.
6. The employee Today contract and Flutter UI expose every non-cancelled
   assignment for the Vietnam business date so each saved assignment has an
   unambiguous check-in/out action.
7. Regression coverage proves monthly range reads, preview-to-save parity,
   warning confirmation, exact-duplicate blocking, supervisor scope,
   idempotency, multi-assignment Today, audit, and web/mobile behavior.
8. Payroll compatibility hardening groups multiple assignments by Vietnam
   business date for workday units, allowance, and late-cap. More than one worked
   attendance record on the same date fails payroll calculation for BO
   reconciliation; the MVP does not invent a cross-shift OT or break rule.
   Customer reports likewise reject multiple attended assignments for the same
   employee/project/date instead of emitting duplicate days or hours.

**Explicit exclusions:** recurring schedule rules, cross-project copy, drag/drop,
staffing optimization, automatic conflict resolution, leave/availability,
notifications, payroll/report changes beyond the required same-day aggregation
and fail-closed multi-attendance guards above, production deployment, and pilot
approval.

**Compatibility, recovery, and rollback:**

- Roll out the hybrid Today API before the new mobile client. New clients read
  the full `data` array; the prior client receives the earliest assignment at the
  legacy top level. Do not operationally rely on multiple daily assignments
  until the employee client upgrade is confirmed.
- Before pilot, take and verify a database backup, deploy the server/API contract
  first, then the upgraded mobile client, and confirm client adoption before
  enabling confirmed multiple assignments in operations.
- Payroll and customer report generation return actionable reconciliation
  errors when multiple assignments were attended on one date. Timestamp/status
  correction is available through the existing authorized attendance override
  API; a guided BO reconciliation UI is deferred and remains a pilot blocker.
- The schema migration is forward-only in normal operation. App rollback after
  multi-assignment data exists requires maintenance mode, an audited decision to
  cancel/reconcile extra active employee/date rows, verification that no group
  has more than one active row, and only then restoration of the former partial
  unique index. Restore from the verified backup if reconciliation cannot be
  completed safely. Never deploy the old mobile/API blindly against the new data;
  rolling backend/app downgrade is unsafe after the first confirmed multi-shift row.

**Local completion evidence (2026-07-24):**

- The BO/supervisor operations board now selects an authorized project and month,
  queries the complete monthly range, and exposes create/cancel plus same-project
  copy preview and confirmation. Exact duplicates remain blocked; overlaps and
  multiple same-day shifts require an explicit warning acknowledgement.
- Copy is limited to 1–31 source days, preserves calendar offsets and notes, and
  creates only fresh assignments. A transaction, project/employee advisory locks,
  and a request-scoped idempotency lock keep the batch atomic and make concurrent
  retries return the original result. Mismatched reuse of a request UUID fails.
- The employee Today API returns every non-cancelled assignment, and Flutter
  renders an independent state and action for each assignment.
- The database migration replaces the former employee/date uniqueness rule with
  an exact active employee/project/shift/date invariant and adds the copy audit
  action. All seven migrations applied cleanly to an isolated PostgreSQL database;
  the pre-existing legacy development database was not reset or reconciled.
- Local gates pass: Attendance 56/56 unit tests, 13/13 full integration tests
  including resource-fingerprint, cancel-lock, concurrent idempotency, and
  mismatched-replay regressions; covered core services have 100%
  statements/lines/functions and 97.59% branches; Payroll typecheck and 112/112
  unit tests; Flutter analyze and 19/19 tests; web lint/typecheck/production build, focused
  Chromium E2E, OpenAPI YAML parsing, and a real seeded monthly-roster smoke test
  returning 293 rows. The isolated local demo is available on loopback only; no
  commit, push, deployment, remote CI, or pilot approval belongs to this batch.

## Active Delivery Batch — Employee Mobile Ease-of-Use and Camera Failure (2026-07-20)

**Owner:** `PRD-SLICE-003` — Attendance. Product validation: GO with conditions.

**Context allowlist:**

- `systems/attendance/mobile/pubspec.yaml`
- `systems/attendance/mobile/assets/`
- `shared/assets/Prismate Brand Assets/LOGO/Prismate_Black@5x.png`
- `shared/assets/README.md`
- `systems/attendance/mobile/android/app/src/main/res/`
- `systems/attendance/mobile/ios/Runner/Base.lproj/LaunchScreen.storyboard`
- `systems/attendance/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/`
- `systems/attendance/mobile/lib/main.dart`
- `systems/attendance/mobile/lib/core/`
- `systems/attendance/mobile/lib/features/auth/`
- `systems/attendance/mobile/lib/features/attendance/`
- `systems/attendance/mobile/lib/l10n/`
- `systems/attendance/mobile/test/`
- `systems/attendance/backend/src/routes/attendance.ts`
- `systems/attendance/backend/tests/`
- `systems/shared/src/db/prisma/schema.prisma`
- `systems/shared/src/db/prisma/migrations/`
- `systems/payroll/web-admin/app/attendance/page.tsx`
- `systems/payroll/web-admin/e2e/auth.spec.ts`
- Existing domain/API contracts, attendance/mobile READMEs, progress status, and changelog.

**Acceptance scope:**

1. Vietnamese-first employee flow from a static native Prismate launch mark into a reduced-motion-aware Flutter Prismate loading animation, then Today, check-in/out, completed, no-shift, and recoverable-error states; no indefinite spinner or artificial startup delay.
2. One clear primary action per state, body text at least 16sp, touch targets at least 48dp, high contrast, text labels beside icons, reduced-motion support, and usable large-text wrapping.
3. Today shows project, shift time, current attendance state, and recorded local timestamps. Camera/location requirements are explained before system permission prompts, with Retry and Settings recovery.
4. Employee self check-in/out continues to require the assigned shift, geofence-valid GPS, and a newly captured photo in the official client. The backend fully decodes JPEG evidence and enforces 5 MB/16 MP ceilings plus a 320×240 minimum; camera failure must not issue a photo-less bypass.
5. Cancelling capture stays a normal retry state. Confirmed permission, unavailable-hardware, or camera/plugin failures expose a prominent supervisor-help path and a re-check action. Employee self-attendance never accepts a missing/photo-library image. The operator-only `POST /v1/attendance/assignments/:id/manual-event` path accepts only `capture_unavailable`, `permission_blocked`, or `device_failure`, requires a note and assignment-bounded event time, records actor/time/provenance in the existing override fields plus immutable audit, blocks supervisor self-fallback, and remains visible to BO and the employee as an exception only when that structured camera-failure provenance exists.
6. App bootstrap reads secure storage once, renders `/splash` until the auth state resolves, never flashes Login/Today, and exposes retry on storage timeout/error without clearing valid credentials because of network loss.

**Local completion evidence (2026-07-21):**

- The optimized 1200×464 Prismate derivative is bundled once for Flutter; density-specific legacy and Android 12+ masked launch resources plus original-rendering iOS launch images bridge native startup into the reusable opacity/scale loading mark. Light/dark startup backgrounds stay white, reduced-motion settings render a static mark, and bootstrap performs no fake wait.
- Login, Today and check-in busy states reuse the same branded loader with task-specific Vietnamese status text. Cold-start visual QA passes on the iPhone 17 Pro Simulator after a fresh install.
- Camera cancellation remains a quiet retry. Only permission denial, unavailable hardware, or camera/plugin failure highlights `Nhờ giám sát hỗ trợ`; the help sheet explains the three-step assisted flow and can re-fetch Today without enabling employee photo-less submission.
- The employee manual-attendance badge now requires an authorized actor plus a structured camera-failure reason code, preventing unrelated BO overrides from being mislabeled.
- Flutter analyze and 16/16 tests pass, including reduced-motion semantics and recovery-state coverage. The iOS debug Simulator build passes. The Android resources validate, but this Mac cannot rerun APK packaging because no Android SDK is installed; physical-device camera/GPS UAT remains a release gate. Independent targeted re-review returned **GO** with no High/Medium/Low findings.

**Controlled-UAT follow-up evidence (2026-08-07):**

- Today now combines shift state, project, working time, progress, and the next
  check action in one senior-friendly card. Check-in/out uses a compact three-step
  header while preserving large-text wrapping and one primary action per state.
- `UAT_SIMULATED_CAMERA=true` replaces only the camera input when the client is a
  debug build running on the iOS Simulator. The default, profile, release, Android,
  and physical-iPhone paths remain camera-only and fail closed. Assignment/date/state
  checks, fresh geofence GPS, full JPEG validation, MinIO storage, and backend
  attendance rules are unchanged.
- The controlled seed rerun repaired all 13 reserved demo identities to the documented
  password/status without creating schedules. First-factor login passed for all eight
  named CEO/BO/supervisor demo operators. The web login now defaults to the documented
  `ops@ak.local` demo identity and lists every named operator instead of pre-filling the
  incompatible base-development admin. Flutter analyze and 20/20 tests pass.
  Simulator UI UAT completed check-in and check-out with fresh GPS and the opt-in
  simulated JPEG; PostgreSQL confirms `checked_out` plus both stored photo keys.
  This verifies the normal data path only; physical-device camera/GPS UAT remains
  a release and pilot gate.

**Corporate-aligned employee-mobile UI follow-up (2026-08-08):**

- Work remains owned by `PRD-SLICE-003`. The context allowlist is limited to the
  existing employee-mobile source, tests, assets, Flutter manifest and README;
  `systems/attendance/README.md`;
  `3-technical/3.2-implementation/plans/README.md`;
  `docs/style-system/STYLE_GUIDE.md`; `4-marketing/brand-guidelines.md` as a
  read-only visual reference; `shared/assets/README.md`; and the existing
  progress/changelog documents. `shared/context/current-scope.md` continues to
  describe `PRD-EPIC-003` and is not the owner of this mobile delivery.
- Login, Today, and check-in/out may inherit the corporate olive/paper/forest
  palette, disciplined editorial hierarchy, Manrope headings, and Be Vietnam Pro
  body/control typography. They must not inherit marketing hero scale,
  image-led layouts, parallax, decorative motion, unverifiable claims, or public
  lead-conversion patterns.
- Acceptance requires preserving every current auth, multi-assignment,
  reconciled non-working, GPS, fresh-camera, simulator-guard, recovery, and
  submit/reconciliation behavior; one clear primary action per state; at least
  16sp body text and 48/52dp touch targets; reduced-motion support; 200% text
  scaling; Vietnamese-first copy; and passing Flutter analysis/widget tests.
- Android debug packaging and emulator launch are verified against the intended
  `https://akaios.prismate.vn/api/attendance` base. The live HPC still returns a
  route-level 404 for that mobile prefix, so the artifact does not claim live UAT,
  physical-device camera/GPS acceptance, release signing, deployment, pilot
  approval, or a change to backend/API semantics.
- The 2026-08-09 full local gate reapplied all seven migrations on an isolated
  PostgreSQL database, passed 14 integration and 9 Playwright scenarios, fixed a
  calendar-dependent E2E fixture, and passed Flutter format/analyze plus 22/22
  tests. The rebuilt debug APK installed and cold-launched on Android with SHA-256
  `33a9a8fb2cf64493702db647138f94b4baa1b8e97a2b1b8c71c2e527b5ca4b55`.
  Read-only HPC inspection confirmed the host remains on the older `cbb3a96`
  corporate branch; no remote mutation or deployment occurred.
- Rollback is presentation-only: revert the mobile theme, presentation widgets,
  font manifest entries, and bundled font/license assets together. It requires no
  data migration and must retain the current auth/session, API contract,
  multi-assignment, GPS, fresh-camera, simulator guard, and reconciliation logic.

**Explicit exclusions:** offline queue, gallery-photo fallback, face recognition/liveness, device attestation, push notifications, full-app redesign outside boot/login/Today/check flow, automatic payroll approval of manual exceptions, production rollout, and claims of physical-device reliability before field UAT.

## Active Delivery Batch — Production Dependency Security Remediation (2026-08-09)

- **Owner and scope:** `PRD-EPIC-002` owns remediation of the 43 findings from
  `pnpm audit --prod` across the four pnpm workspaces. The context allowlist is
  limited to the root/workspace manifests and lockfile; Fastify compatibility
  bootstrap/config files; the three application Dockerfiles; dependency-related
  architecture/runbook/system READMEs; the existing progress/changelog/plan
  documents; and the CI configuration required to prevent runtime-closure
  regressions. Tests may be read and executed as evidence.
- **Approved implementation:** move both APIs to Fastify 5 and compatible plugin
  majors, web admin to Next.js 15, and attendance image processing to Sharp
  0.35 with Node >=20.9. Preserve React 18.3.1 because the installed Next.js
  peer range accepts it and the complete production build/Playwright suite
  verifies the App Router flows; React 19 is a separate future migration.
- **Intentional compatibility exceptions:** pin only the three transitive fixes
  that cross parent-declared ranges: `next>postcss=8.5.23`,
  `next>sharp=0.35.0`, and `exceljs>uuid=11.1.1`. The lockfile owns safe
  in-range nanoid, fast-uri, find-my-way, and brace-expansion resolutions.
- **Acceptance:** zero production audit findings; frozen-lockfile install;
  lint/typecheck; 170 unit tests and >=90% core coverage; fresh seven-migration
  integration 14/14; Playwright 9/9; all package and Node 20 Alpine image builds;
  production-only non-root closure for all three long-running images; in-image
  Prisma/native-module checks with no development-tool packages or broken
  symlinks; API readiness, web `/login`, and image-based Playwright 9/9; final
  exact-SHA review; and green remote CI before merge to `akaios/main`.
- **Completion evidence:** Code Reviewer and Docs Guardian returned GO for
  candidate `90a95b06131a43f7a655dcd7f8441a92cb604cce`; its nine-job
  [exact-SHA Actions run](https://github.com/hungtrandigital/AKAIOS/actions/runs/31295175661)
  passed before [PR #1](https://github.com/hungtrandigital/AKAIOS/pull/1)
  merged it as `4f72810f3bc75c8411605f9fb2b3b0b36821a869`. The nine-job
  [post-merge `main` run](https://github.com/hungtrandigital/AKAIOS/actions/runs/31295350615)
  also passed. These gates do not perform or authorize deployment.
- **Rollback:** manifests, lockfile, compatibility changes, and rebuilt images
  move together. Prefer fix-forward; any short-lived rollback image restores the
  known-vulnerable dependency graph and therefore is operational recovery only.
- **Exclusions:** corporate website's separate npm audit, Flutter package audit,
  React 19 migration, a separate minimal package for the non-exposed one-shot
  migration image, live HPC/Cloudflare mutation, deployment, and pilot
  acceptance. The migration target may retain its build-time CLI/tooling but is
  never a long-running or exposed service. Deployment remains gated by the
  mobile route repair, reviewed clean main SHA, backup/restore readiness, and
  physical-device validation.

## Resolved Decisions and Remaining Pilot Inputs

1. **Resolved — system split:** `systems/attendance` and `systems/payroll`, with shared infrastructure in `systems/shared`.
2. **Remaining — pilot projects:** select the specific 1–2 projects and accountable supervisors for Phase 5.
3. **Resolved — SMS gateway:** SpeedSMS in production; mock mode is restricted to non-production environments.
4. **Remaining — production endpoint:** supply the real domain/Cloudflare Tunnel configuration (or approve a different private-access topology).
5. **Remaining — server capacity:** confirm the on-premise hardware/backup budget against the runbook sizing.

### Temporary local authentication exception — 2026-07-20

- Local UI testing may set `DEV_FIXED_ADMIN_2FA_CODE` to an exact four-digit
  value. The value stays in ignored local environment files and is not a
  committed default.
- The exception replaces only TOTP verification. Password/active-admin checks,
  Redis challenge TTL and attempt limits, challenge replay prevention, and
  refresh-token rotation remain mandatory. The API also binds to loopback and
  rejects fixed-mode admin auth from an effective non-loopback client address;
  the web-admin development server binds to loopback as well.
- Configuration fails closed if the flag is present without an explicit
  `NODE_ENV=development|test`. Standard CI and E2E keep the flag unset and test
  real encrypted six-digit TOTP.
- This exception is not staging or pilot acceptance evidence. It must be unset,
  and the real authenticator flow must be integrated and revalidated, before
  any shared/staging/pilot deployment.

## Known Issues & Bugs

| ID | Severity | Summary | Status |
| --- | --- | --- | --- |
| CODE-BUG-002 | Critical | Password authentication bypass | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-003 | Critical | Payroll RBAC and cross-tenant IDOR | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-004 | Critical | Attendance override cross-team/cross-tenant IDOR | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-005 | Critical | Production build and database initialization unusable | fixed; local Docker/fresh-DB gates pass 2026-07-18 |
| CODE-BUG-006 | High | Missing 2FA and inactive-account enforcement | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-007 | High | Supervisor PII and password-hash disclosure | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-008 | High | Spoofable OTP rate-limit boundary | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-009 | High | GPS accuracy bypasses geofence | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-010 | High | Attendance race and missing worked-time persistence | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-011 | High | Vietnam timezone/calendar drift | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-012 | High | Customer-report authorization and tenant leakage | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-013 | High | Mobile/photo/MinIO path cannot operate as shipped | fixed; Android validation passes 2026-07-18 |
| CODE-BUG-014 | High | Payroll excludes the last day of month | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-015 | High | Payroll calculation is non-atomic and unrecoverable | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-016 | High | Payroll override breaks money and state invariants | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-017 | High | Weekend/holiday overtime double-counted | fixed; local re-review GO 2026-07-18 |
| CODE-BUG-018 | High | Out-of-scope compliance changes unauditable net pay | fixed; ADR-003 invariant tested 2026-07-18 |
| CODE-BUG-019 | High | CI/integration/coverage quality gate invalid | fixed (GitHub Actions run 29555194773 verified 2026-07-17) |
| CODE-BUG-020 | Medium | Web-admin auth state, E2E, and checkout display defects | fixed; Playwright 7/7 on 2026-07-18 |
| CODE-BUG-021 | Medium | Aggregate seed omits attendance and RBAC data | fixed (fresh-database aggregate seed verified 2026-07-17) |
| CODE-BUG-022 | Medium | Canonical documentation and implementation drift | fixed; Docs Guardian GO 2026-07-19 |

### Historical remediation batch — CI and migration baseline (2026-07-17)

- Linked findings: `CODE-BUG-019` and the database-initialization portion of `CODE-BUG-005`.
- Local verification passes for Prisma generation, lint, typecheck, unit tests, ≥90% coverage, production build, a fresh PostgreSQL 16 migration deploy, and a real PostgreSQL/Redis/MinIO integration test.
- The aggregate seed now runs dev, demo-account, attendance, and RBAC stages once in order; a fresh-database run completed with a randomized multi-month attendance dataset and 52 role-permission mappings, closing `CODE-BUG-021`.
- The browser gate now installs Chromium, migrates and seeds a fresh database, starts both APIs and the web admin, then runs all Playwright tests. Its local run reports 5 pass and 2 fail; the failures reproduce open `CODE-BUG-002` and `CODE-BUG-020` instead of being skipped or ignored.
- `CODE-BUG-005` remains open because production Docker/Compose validation is outside this batch. `CODE-BUG-019` is fixed by [GitHub Actions run 29555194773](https://github.com/hungtrandigital/AKAIOS/actions/runs/29555194773): quality, build, integration, and browser jobs all executed; the overall run remains red only because E2E reproduces open `CODE-BUG-002` and `CODE-BUG-020`.

### Remediation closure (2026-07-18)

- Production Docker images, Compose, Caddy, and the five-migration fresh-database path now pass locally, closing the remaining `CODE-BUG-005` scope.
- Auth, tenant/project authorization, attendance, reporting, payroll, mobile, and web-admin findings have adversarial regression coverage; the fresh live browser suite passes 7/7.
- Turbo now passes the ephemeral TOTP secret into `test:e2e`, matching the GitHub Actions job and preventing authenticated scenarios from failing before execution.
- Closure is preserved in commit `056a769`; all five jobs in [GitHub Actions run 29670131275](https://github.com/hungtrandigital/AKAIOS/actions/runs/29670131275) pass, and the [SHA-pinned re-review](../../../../8-governance/reviews/prd-epic-002-code-re-review-2026-07-19.md) records GO. The non-code pilot gates remain required before pilot deployment.

## Related Documents

- `[3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md]` — format mẫu cho plan này
- `[0-agents/workflows/system-creation-workflow.md:60-77]` — gate approve tên hệ thống
- `[0-agents/_core/work-item-traceability.md:73-91]` — ID schema
- `[0-agents/agents/core-agents/system-architecture.md:87-101]` — 5 architecture docs bắt buộc
- `[0-agents/agents/core-agents/fullstack-engineer.md:55-75]` — gate trước coding
- `[0-agents/mode/code.md:47]` — coverage floor ≥90%
- `[6-operations/team/team-structure.md]` (template rỗng — sẽ populate qua discovery song song)
