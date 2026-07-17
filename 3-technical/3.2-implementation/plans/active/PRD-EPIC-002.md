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
updated: 2026-07-17
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

## Findings Note

Exploration ngày 2026-07-16 xác nhận:
- `systems/` trống — chưa có dòng code sản phẩm
- `6-operations/` chứa generic SaaS boilerplate, KHÔNG phản ánh reality vệ sinh VN (không có tên BO, không có công thức lương, không có BHXH/PIT/BHXH-process, không có 15 dự án)
- Tất cả `3-technical/3.1-system-foundation/**` (infrastructure, system-design, domain-specs, api-contracts, coding-standards) là template trống
- Epic đang chạy duy nhất: `PRD-EPIC-001` (meta — Factory Agent Leadership Orchestration, không liên quan product)

→ Epic này **tự sản xuất** các architecture docs thật (thay vì điền vào template) như là deliverable của Phase 0. Nếu user muốn "lean hơn", Phase 0 rút gọn xuống MVP-spec; Phase 0 đầy đủ mới tạo nền tái sử dụng được cho epic sau.

## Decisions (Cần User Approve trước khi Phase 1)

| # | Quyết định | Lựa chọn | Lý do |
| --- | --- | --- | --- |
| 1 | Tên hệ thống (kebab-case) | `attendance-payroll` | Mô tả cả 2 domain; tuân thủ `[system-creation-workflow.md:64-68]`. **Cần user approve trước khi tạo `systems/attendance-payroll/`** |
| 2 | Phạm vi MVP | **Attendance + Payroll + Customer report** (user chọn) | Full scope, dù có pilot để giảm rủi ro |
| 3 | Rollout | Pilot 1–2 dự án đầu (user chọn) | Validate trước khi scale 15 dự án |
| 4 | VN compliance | **Bỏ qua** ở MVP — BO xử lý thủ công (user chọn) | Đơn giản hóa bảng lương (gross + OT cơ bản); có thể thêm compliance engine ở epic sau |
| 5 | Hosting | **On-premise** server công ty (user chọn) | Data nội bộ, latency thấp tới site, không phụ thuộc cloud; cần HTTPS + VPN/port-forward cho mobile |
| 6 | Mobile platform | **Native iOS + Android** (user chọn) | UX tốt nhất cho 200 NV |
| 7 | Check-in method | GPS + ảnh chụp lúc in/out (user chọn) | Cân bằng bảo mật & chi phí; không cần ML face-match ở MVP |
| 8 | Tech stack | Architect đề xuất — đề xuất dưới đây, chốt qua ADR | Per `[core-agents/system-architecture.md:62-81]` |

### Tech Stack Đề Xuất (sẽ thành ADR-001)

| Layer | Lựa chọn | Lý do |
| --- | --- | --- |
| Mobile | **Flutter 3.x (Dart)** | Một codebase cho iOS + Android, native perf, package camera/location đầy đủ, dev VN sẵn có |
| Backend API | **Node.js 20 + Fastify + TypeScript** | Type-safe, ecosystem JWT/auth/ORM rộng, dev VN dễ tuyển, async I/O tốt cho 200 user đồng thời |
| Web admin | **Next.js 14 (App Router) + TypeScript** | Cùng ecosystem TS, build nhanh, deploy Docker dễ |
| Database | **PostgreSQL 16** | Quan hệ chặt cho HR/payroll, JSONB cho metadata linh hoạt, mature |
| Cache / queue | **Redis 7** | Session cache, BullMQ cho job bảng lương cuối tháng |
| Object storage (ảnh check-in) | **MinIO** (S3-compatible, self-hosted) | On-premise friendly, không phụ thuộc AWS, chi phí = 0 |
| Reverse proxy + TLS | **Caddy** hoặc **nginx** | Auto HTTPS nếu có domain; reverse proxy cho backend + Next |
| Container | **Docker Compose** trên 1 server Linux (Ubuntu 22.04) | Đơn giản cho on-premise; scale lên Kubernetes chỉ khi >1 server |
| CI | **GitHub Actions** (nếu repo host GitHub) hoặc **Gitea Actions** (nếu self-host) | Tự động lint + test + build APK/IPA |

**Tuân thủ factory gates:**
- Tất cả code nằm trong `systems/attendance-payroll/` (sau khi user approve tên)
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
┌──────────────────┐                    ┌──────────────────────────────┐
│  Mobile App      │   HTTPS / TLS      │   On-Premise Server          │
│  (Flutter)       │ ◄──────────────►   │   ┌────────────────────┐    │
│  iOS + Android   │                    │   │  Caddy (TLS + RP)  │    │
│                  │                    │   └─────────┬──────────┘    │
│  - Login (OTP)   │                    │             │               │
│  - Xem ca        │                    │   ┌─────────▼──────────┐    │
│  - Check-in/out  │                    │   │  Backend (Fastify) │    │
│    (GPS + ảnh)   │                    │   │  TypeScript        │    │
│  - Lịch sử cá    │                    │   └─────────┬──────────┘    │
│  nhân             │                    │             │               │
└──────────────────┘                    │   ┌─────────▼──────────┐    │
                                         │   │  Web Admin         │    │
                                         │   │  (Next.js)         │    │
                                         │   └─────────┬──────────┘    │
                                         │             │               │
                                         │   ┌─────────▼──────────┐    │
                                         │   │  PostgreSQL 16     │    │
                                         │   │  Redis 7           │    │
                                         │   │  MinIO (ảnh)       │    │
                                         │   └────────────────────┘    │
                                         └──────────────────────────────┘
                                                       ▲
┌──────────────────┐                                  │
│  Web Admin       │  HTTPS                            │
│  (Next.js)       │ ◄────────────────────────────────┘
│  BO / Supervisor │
└──────────────────┘
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
                 (in/out timestamps, GPS, photo URLs, status)
                      │
                      │  feeds
                      ▼
                 PayrollPeriod  ─── (n) PayrollLine
                 (tháng)            (1 NV × 1 tháng)

User:  employee | supervisor | bo_admin | system_admin
Shift: ca_sáng (6-14h) | ca_chiều (14-22h) | ca_tối (22-6h) | custom
AttendanceRecord.status: present | late | absent | half_day | leave | holiday
PayrollLine.gross = base + ot_weekday*1.5 + ot_weekend*2 + ot_holiday*3 + allowances
PayrollLine.deductions = advance | other (compliance để BO tính)
```

### Tech Stack & Stack Map

Sẽ cập nhật `3-technical/3.1-system-foundation/infrastructure.md` (tạo mới — thay template) trong Phase 0 với Tech Stack này.

## Work Breakdown

### Epic: PRD-EPIC-002

```
PRD-EPIC-002 (this epic)
├── PRD-SLICE-001: Foundation (Phase 0 + 1)
│   ├── CODE-TASK-003: System scaffold + 5 architecture docs
│   ├── CODE-TASK-004: Docker Compose stack trên on-prem
│   ├── CODE-TASK-005: CI pipeline (lint + test + build)
│   └── CODE-TASK-006: Auth (OTP cho NV, email+pwd cho admin)
│
├── PRD-SLICE-002: Attendance (Phase 2)
│   ├── CODE-TASK-007: Backend CRUD Project, Shift, Employee
│   ├── CODE-TASK-008: Backend Schedule engine (gán ca tự động + manual override)
│   ├── CODE-TASK-009: Backend Check-in/out endpoint (GPS + ảnh, validation phạm vi)
│   ├── CODE-TASK-010: Mobile app — login + dashboard + check-in/out flow
│   ├── CODE-TASK-011: Web admin — xem realtime attendance, manual adjust
│   └── CODE-TASK-012: Tests: domain logic + GPS validation + photo upload
│
├── PRD-SLICE-003: Payroll (Phase 3)
│   ├── CODE-TASK-013: Backend Payroll engine (gross, OT, deductions cơ bản)
│   ├── CODE-TASK-014: Backend PayrollPeriod + PayrollLine persistence
│   ├── CODE-TASK-015: Web admin — bảng lương UI, duyệt, xuất Excel
│   └── CODE-TASK-016: Tests: payroll engine + edge cases (cuối tháng 31 ngày, nghỉ phép, làm tròn giờ)
│
├── PRD-SLICE-004: Customer Report (Phase 4)
│   ├── CODE-TASK-017: Backend Report generator (PDF, CSV, theo dự án)
│   ├── CODE-TASK-018: Web admin — UI chọn dự án + kỳ + preview báo cáo
│   └── CODE-TASK-019: Templates cho 15 dự án (tùy biến header khách hàng)
│
├── PRD-SLICE-005: Pilot (Phase 5)
│   ├── OPS-TASK-006: Chọn 1–2 dự án pilot (user)
│   ├── CODE-TASK-020: On-site training + support
│   ├── CODE-TASK-021: Bug-fix sprint 2 tuần sau pilot
│   └── MKT-TASK-XXX (optional): Thu thập feedback từ giám sát dự án pilot
│
└── PRD-SLICE-006: Scale-out (Phase 6)
    ├── OPS-TASK-007: Rollout plan 13 dự án còn lại
    ├── CODE-TASK-022: Multi-project conflict handling (NV làm nhiều dự án)
    └── CODE-TASK-023: Performance tuning (nếu cần)
```

**ID sequence chú ý:** `PRD-EPIC-002` (PRD-EPIC-001 đã có), `PRD-SLICE-002..006` (SLICE-001 đã có cho meta epic), `CODE-TASK-003+` (TASK-001/002 đã có cho meta), `OPS-TASK-006+` (OPS-TASK-001/005 đã có cho hiring plans).

## Implementation Phases

### Phase 0 — Architecture (Foundation, 1 tuần)
**Priority:** Highest (gate cho mọi code sau)
**Goals:**
- User approve tên hệ thống `attendance-payroll`
- Tạo `systems/attendance-payroll/` từ TEMPLATE-SYSTEM
- Sản xuất 5 architecture docs thật (không điền vào template):
  - `3-technical/3.1-system-foundation/infrastructure.md` — Tech stack + on-prem setup + cost estimate
  - `3-technical/3.1-system-foundation/design-standards/system-design.md` — C4 diagrams (Context, Container, Component, Code)
  - `3-technical/3.1-system-foundation/architecture/domain-specs.md` — DDD entities + business rules + aggregate roots
  - `3-technical/3.1-system-foundation/architecture/api-contracts/` — OpenAPI 3.1 cho 30+ endpoints
  - `3-technical/3.1-system-foundation/design-standards/coding-standards.md` — TS/Flutter conventions + testing strategy
- Tạo ADR-001 (tech stack), ADR-002 (on-prem), ADR-003 (bỏ qua compliance ở MVP) trong `8-governance/decision-log/`
- Cập nhật `systems/README.md` + `3-technical/3.1-system-foundation/architecture/system-overview.md` để map system mới

**Tasks (CODE-TASK-003):** owner @system-architecture, @fullstack-engineer
**Success Metrics:** Cả 5 docs tồn tại + nội dung thật (không phải placeholder); ADR-001/002/003 accepted; user approve name.

### Phase 1 — Foundation Build (2 tuần)
**Priority:** High
**Goals:**
- Scaffold `systems/attendance-payroll/` (backend Fastify + mobile Flutter + web Next.js + Docker Compose + CI)
- Auth (OTP cho nhân viên qua SMS gateway của VN, email+password+2FA cho admin)
- DB schema + migrations (Prisma)
- Dev environment chạy được trên laptop

**Tasks:** CODE-TASK-004, 005, 006
**Success Metrics:** `docker compose up` chạy local, login flow pass tests, CI green trên PR đầu tiên.

### Phase 2 — Attendance (3 tuần)
**Priority:** High (core feature của MVP)
**Goals:** Mobile app check-in/out bằng GPS + ảnh, web admin xem realtime + override

**Tasks:** CODE-TASK-007 → 012
**Coverage:** ≥90% (target 100%) cho schedule engine, GPS validation, attendance logic
**Success Metrics:**
- 10 NV test thật trong dev environment, check-in/out ổn định 1 tuần
- Ảnh + GPS lưu vào MinIO + Postgres đúng
- Web admin xem được bảng chấm công realtime, manual adjust có audit trail

### Phase 3 — Payroll (2 tuần)
**Priority:** High
**Goals:** Tính bảng lương cơ bản (gross + OT + deductions), xuất Excel

**Tasks:** CODE-TASK-013 → 016
**Coverage:** ≥90% cho payroll engine (nhiều edge case: tháng 28/30/31 ngày, làm tròn giờ, OT cuối tuần vs ngày lễ, nghỉ phép không lương)
**Success Metrics:**
- Payroll cho tháng test khớp với tính tay của BO trong phạm vi ±1 giờ làm tròn
- Web admin duyệt được bảng lương, xuất Excel đúng format kế toán VN

### Phase 4 — Customer Report (1 tuần)
**Priority:** Medium
**Goals:** Auto-generate báo cáo PDF/CSV gửi 15 khách hàng

**Tasks:** CODE-TASK-017 → 019
**Success Metrics:** 15 dự án có template riêng (logo, header), xuất PDF cho 1 dự án trong <10s

### Phase 5 — Pilot (2 tuần)
**Priority:** High (gate trước scale-out)
**Goals:** Triển khai thật ở 1–2 dự án đầu

**Tasks:** OPS-TASK-006, CODE-TASK-020, 021
**Success Metrics:**
- 30–60 NV ở pilot projects dùng app hàng ngày trong 2 tuần không lỗi nghiêm trọng
- BO duyệt được bảng lương pilot tháng đầu tiên từ hệ thống (không cần Excel)
- Feedback từ supervisor + BO → backlog ép vào Phase 6

### Phase 6 — Scale-out (3 tuần, sau pilot)
**Priority:** Medium (chỉ chạy nếu pilot pass)
**Goals:** Triển khai 13 dự án còn lại + xử lý NV làm nhiều dự án

**Tasks:** OPS-TASK-007, CODE-TASK-022, 023
**Success Metrics:** 200 NV dùng ổn định; payroll tháng đầu tiên full-rollout chạy mượt

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 200 NV phản đối mobile app (quen giấy/giọng nói) | High — adoption fail | Training on-site + tiếng Việt thuần + UX đơn giản (1 nút to); Phase 5 pilot validate trước |
| Site mất 4G/WiFi khi check-in | High — miss records | Cache local + retry queue; cho phép supervisor manual add attendance có audit trail |
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

## Critical Files to be Created

### Phase 0 — Architecture docs (sẽ tạo mới, thay template rỗng)
- `3-technical/3.1-system-foundation/infrastructure.md` (thay template)
- `3-technical/3.1-system-foundation/design-standards/system-design.md` (thay template)
- `3-technical/3.1-system-foundation/architecture/domain-specs.md` (thay template)
- `3-technical/3.1-system-foundation/architecture/api-contracts/openapi.yaml` (mới)
- `3-technical/3.1-system-foundation/design-standards/coding-standards.md` (thay template)
- `systems/README.md` (cập nhật để list `attendance-payroll`)
- `8-governance/decision-log/adr-001-tech-stack.md`, `adr-002-on-premise.md`, `adr-003-skip-vn-compliance-mvp.md`

### Phase 1+ — Code
- `systems/attendance-payroll/README.md`
- `systems/attendance-payroll/docs/{architecture,api-contracts,deployment}.md`
- `systems/attendance-payroll/backend/` (Fastify + TypeScript)
- `systems/attendance-payroll/mobile/` (Flutter)
- `systems/attendance-payroll/web-admin/` (Next.js)
- `systems/attendance-payroll/db/` (Prisma migrations)
- `systems/attendance-payroll/tests/` (unit, integration, e2e)
- `systems/attendance-payroll/docker-compose.yml`
- `3-technical/3.3-devops/server-steps.md` (cập nhật với on-prem deploy runbook)

### Tracking
- `3-technical/3.2-implementation/status/work-items-registry.md` (thêm PRD-EPIC-002 + slices + tasks)
- `3-technical/3.2-implementation/plans/README.md` (active plans table)
- `2-product-foundation/product-backlog/backlog.md` (Epic 2)
- `8-governance/changelog.md` (mỗi phase close)

## Open Questions for User (resolve trước Phase 0 close)

1. **Tên hệ thống**: `attendance-payroll` OK chưa, hay muốn tách `attendance` + `payroll`?
2. **Pilot projects**: Cụ thể 1–2 dự án nào? (Phase 5 cần biết để setup seed data)
3. **SMS gateway**: Dùng nhà cung cấp nào (eSignal, SpeedSMS, VNPT API)? Hay skip OTP ở MVP và dùng password thường?
4. **Domain cho server on-prem**: Có domain thật + Cloudflare Tunnel, hay dùng Tailscale VPN thuần?
5. **Ngân sách server**: Approximate budget cho 1 server on-prem (RAM, CPU, SSD)? Hay sẵn server, cần mình viết runbook?

## Known Issues & Bugs

| ID | Severity | Summary | Status |
| --- | --- | --- | --- |
| CODE-BUG-002 | Critical | Password authentication bypass | open |
| CODE-BUG-003 | Critical | Payroll RBAC and cross-tenant IDOR | open |
| CODE-BUG-004 | Critical | Attendance override cross-team/cross-tenant IDOR | open |
| CODE-BUG-005 | Critical | Production build and database initialization unusable | open |
| CODE-BUG-006 | High | Missing 2FA and inactive-account enforcement | open |
| CODE-BUG-007 | High | Supervisor PII and password-hash disclosure | open |
| CODE-BUG-008 | High | Spoofable OTP rate-limit boundary | open |
| CODE-BUG-009 | High | GPS accuracy bypasses geofence | open |
| CODE-BUG-010 | High | Attendance race and missing worked-time persistence | open |
| CODE-BUG-011 | High | Vietnam timezone/calendar drift | open |
| CODE-BUG-012 | High | Customer-report authorization and tenant leakage | open |
| CODE-BUG-013 | High | Mobile/photo/MinIO path cannot operate as shipped | open |
| CODE-BUG-014 | High | Payroll excludes the last day of month | open |
| CODE-BUG-015 | High | Payroll calculation is non-atomic and unrecoverable | open |
| CODE-BUG-016 | High | Payroll override breaks money and state invariants | open |
| CODE-BUG-017 | High | Weekend/holiday overtime double-counted | open |
| CODE-BUG-018 | High | Out-of-scope compliance changes unauditable net pay | open |
| CODE-BUG-019 | High | CI/integration/coverage quality gate invalid | fixed (GitHub Actions run 29555194773 verified 2026-07-17) |
| CODE-BUG-020 | Medium | Web-admin auth state, E2E, and checkout display defects | open |
| CODE-BUG-021 | Medium | Aggregate seed omits attendance and RBAC data | fixed (fresh-database aggregate seed verified 2026-07-17) |
| CODE-BUG-022 | Medium | Canonical documentation and implementation drift | open |

### Remediation batch — CI and migration baseline (2026-07-17)

- Linked findings: `CODE-BUG-019` and the database-initialization portion of `CODE-BUG-005`.
- Local verification passes for Prisma generation, lint, typecheck, unit tests, ≥90% coverage, production build, a fresh PostgreSQL 16 migration deploy, and a real PostgreSQL/Redis/MinIO integration test.
- The aggregate seed now runs dev, demo-account, attendance, and RBAC stages once in order; a fresh-database run completed with a randomized multi-month attendance dataset and 52 role-permission mappings, closing `CODE-BUG-021`.
- The browser gate now installs Chromium, migrates and seeds a fresh database, starts both APIs and the web admin, then runs all Playwright tests. Its local run reports 5 pass and 2 fail; the failures reproduce open `CODE-BUG-002` and `CODE-BUG-020` instead of being skipped or ignored.
- `CODE-BUG-005` remains open because production Docker/Compose validation is outside this batch. `CODE-BUG-019` is fixed by [GitHub Actions run 29555194773](https://github.com/hungtrandigital/AKAIOS/actions/runs/29555194773): quality, build, integration, and browser jobs all executed; the overall run remains red only because E2E reproduces open `CODE-BUG-002` and `CODE-BUG-020`.

## Related Documents

- `[3-technical/3.2-implementation/plans/active/agent-leadership-orchestration.md]` — format mẫu cho plan này
- `[0-agents/workflows/system-creation-workflow.md:60-77]` — gate approve tên hệ thống
- `[0-agents/_core/work-item-traceability.md:73-91]` — ID schema
- `[0-agents/agents/core-agents/system-architecture.md:87-101]` — 5 architecture docs bắt buộc
- `[0-agents/agents/core-agents/fullstack-engineer.md:55-75]` — gate trước coding
- `[0-agents/mode/code.md:47]` — coverage floor ≥90%
- `[6-operations/team/team-structure.md]` (template rỗng — sẽ populate qua discovery song song)
