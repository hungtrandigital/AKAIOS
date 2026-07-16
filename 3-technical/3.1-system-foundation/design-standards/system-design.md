# System Design — AKAIUNSAN Attendance + Payroll

**Status:** Active — Phase 0 deliverable for PRD-EPIC-002
**Last Updated:** 2026-07-16
**Owner:** @system-architecture
**Related:** [Infrastructure](../infrastructure.md), [Domain Specs](../architecture/domain-specs.md)

## Overview

This document describes the C4 model diagrams (Context, Container, Component, Code) for the **attendance** and **payroll** systems. Per factory convention, system-specific concerns live in `systems/[name]/docs/architecture.md`; this document captures the cross-cutting design shared by both systems.

## C4 Level 1: System Context

```mermaid
C4Context
    title System Context — AKAIUNSAN Attendance + Payroll

    Person(employee, "Nhân viên vệ sinh", "Check-in/out tại dự án qua mobile app")
    Person(supervisor, "Giám sát dự án", "Quản lý ca, override chấm công")
    Person(bo_staff, "BO Staff", "Vận hành hệ thống, duyệt bảng lương")
    Person(admin, "System Admin", "Quản trị user, dự án, cấu hình")

    System(attendance_sys, "Attendance System", "Mobile + API cho chấm công, lịch sử, báo cáo khách hàng")
    System(payroll_sys, "Payroll System", "Web admin cho tính lương, duyệt, xuất Excel")

    System_Ext(sms_gateway, "SMS Gateway VN", "Gửi OTP cho nhân viên")
    System_Ext(cloudflare, "Cloudflare Tunnel", "Bridge HTTPS từ internet vào on-prem")

    Rel(employee, attendance_sys, "Check-in/out, xem lịch sử", "HTTPS/Mobile")
    Rel(supervisor, attendance_sys, "Xem realtime, override", "HTTPS/Web")
    Rel(bo_staff, attendance_sys, "CRUD dự án, NV, ca, xem báo cáo KH", "HTTPS/Web")
    Rel(bo_staff, payroll_sys, "Tính lương, duyệt, xuất Excel", "HTTPS/Web")
    Rel(admin, attendance_sys, "User management, cấu hình", "HTTPS/Web")
    Rel(admin, payroll_sys, "Cấu hình lương, OT rules", "HTTPS/Web")
    Rel(attendance_sys, sms_gateway, "Gửi OTP", "HTTPS")
    Rel(attendance_sys, cloudflare, "Internet-facing access", "HTTPS")
    Rel(payroll_sys, attendance_sys, "Đọc dữ liệu chấm công (internal)", "HTTPS/Internal API")
```

**Actors:**
- **Nhân viên vệ sinh:** ~200 người, 15 dự án, dùng mobile app Flutter
- **Giám sát dự án:** ~15 người (1/dự án), dùng web admin
- **BO Staff:** ~3-5 người, dùng web admin cho cả 2 hệ thống
- **System Admin:** 1-2 người, full access

## C4 Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram — On-Premise Deployment

    Person(employee, "Nhân viên")
    Person(bo, "BO/Supervisor/Admin")

    System_Boundary(c1, "On-Premise Server (Ubuntu 22.04)") {
        Container(mobile_app, "Mobile App", "Flutter 3.24 (Dart)", "iOS + Android, check-in/out, GPS, camera")
        Container(web_admin, "Web Admin", "Next.js 14 (TS)", "Dashboard BO, supervisor, admin")
        Container(attendance_api, "Attendance API", "Fastify + Node 20 + TS", "Auth, CRUD dự án, chấm công, báo cáo KH")
        Container(payroll_api, "Payroll API", "Fastify + Node 20 + TS", "Tính lương, duyệt, xuất Excel")
        ContainerDb(postgres, "PostgreSQL 16", "Relational DB", "Shared schema: users, projects, shifts, attendance, payroll")
        ContainerDb(redis, "Redis 7", "Cache + queue", "Sessions, BullMQ jobs")
        ContainerDb(minio, "MinIO", "S3-compatible", "Photos, generated PDFs")
    }

    System_Ext(cloudflare, "Cloudflare Tunnel", "Reverse proxy + TLS")
    System_Ext(sms, "SMS Gateway", "OTP delivery")

    Rel(employee, mobile_app, "Uses", "HTTPS")
    Rel(bo, web_admin, "Uses", "HTTPS")
    Rel(mobile_app, cloudflare, "TLS", "HTTPS")
    Rel(web_admin, cloudflare, "TLS", "HTTPS")
    Rel(cloudflare, attendance_api, "Routes /api/attendance/*", "HTTP")
    Rel(cloudflare, payroll_api, "Routes /api/payroll/*", "HTTP")
    Rel(attendance_api, postgres, "Reads/Writes", "TCP 5432")
    Rel(attendance_api, redis, "Cache + queue", "TCP 6379")
    Rel(attendance_api, minio, "Upload/download photos", "HTTP")
    Rel(payroll_api, postgres, "Reads attendance, writes payroll", "TCP 5432")
    Rel(payroll_api, redis, "Queue for calc jobs", "TCP 6379")
    Rel(attendance_api, sms, "Send OTP", "HTTPS")
    Rel(attendance_api, payroll_api, "Read attendance for payroll", "HTTPS Internal")
```

**Key decisions:**
- **Two API containers (not monolith):** Allows independent deployment, clearer bounded contexts, payroll can be scaled separately if needed
- **Shared Postgres:** Simplifies data consistency (no cross-service sync); schemas separated per service
- **MinIO for photos:** Self-hosted S3 alternative; presigned URLs for secure access
- **Cloudflare Tunnel:** Eliminates need for static IP / port forwarding on office router

## C4 Level 3: Component Diagrams

### Attendance System Components

```mermaid
C4Component
    title Attendance System — Component View

    Container(mobile_app, "Mobile App", "Flutter")
    Container(web_admin, "Web Admin", "Next.js")
    Container(attendance_api, "Attendance API", "Fastify")

    Component(auth_ctrl, "Auth Controller", "Fastify route", "Login, OTP, refresh tokens")
    Component(project_ctrl, "Project Controller", "Fastify route", "CRUD dự án, GPS bounds")
    Component(employee_ctrl, "Employee Controller", "Fastify route", "CRUD nhân viên, gán dự án")
    Component(shift_ctrl, "Shift Controller", "Fastify route", "CRUD ca, schedule")
    Component(attendance_ctrl, "Attendance Controller", "Fastify route", "Check-in/out, queries")
    Component(report_ctrl, "Report Controller", "Fastify route", "Customer report generator")

    Component(schedule_svc, "Schedule Service", "TS class", "Auto-assign shifts, detect conflicts")
    Component(attendance_svc, "Attendance Service", "TS class", "GPS validation, late detection, status calculation")
    Component(photo_svc, "Photo Service", "TS class", "Upload, presigned URLs, MinIO interaction")
    Component(report_svc, "Report Service", "TS class", "PDF generation (PDFKit), CSV export")
    Component(notif_svc, "Notification Service", "TS class", "OTP via SMS gateway")

    ComponentDb(repo, "Repositories (Prisma)", "TS", "Type-safe DB access")

    Rel(mobile_app, auth_ctrl, "Login, refresh")
    Rel(web_admin, auth_ctrl, "Login, refresh")
    Rel(mobile_app, attendance_ctrl, "Check-in/out")
    Rel(web_admin, project_ctrl, "Manage projects")
    Rel(web_admin, employee_ctrl, "Manage employees")
    Rel(web_admin, shift_ctrl, "Manage shifts/schedules")
    Rel(web_admin, attendance_ctrl, "View, override")
    Rel(web_admin, report_ctrl, "Generate, export")

    Rel(auth_ctrl, notif_svc, "Send OTP")
    Rel(attendance_ctrl, attendance_svc, "Validate GPS + process")
    Rel(attendance_ctrl, photo_svc, "Upload photos")
    Rel(shift_ctrl, schedule_svc, "Auto-assign")
    Rel(report_ctrl, report_svc, "Generate PDF/CSV")
    Rel(attendance_svc, repo, "Read/write")
    Rel(schedule_svc, repo, "Read/write")
    Rel(photo_svc, minio, "S3 API")
    Rel(report_svc, repo, "Read attendance data")
    Rel(notif_svc, sms, "HTTPS")
```

### Payroll System Components

```mermaid
C4Component
    title Payroll System — Component View

    Container(web_admin, "Web Admin", "Next.js")
    Container(payroll_api, "Payroll API", "Fastify")

    Component(payroll_period_ctrl, "Payroll Period Controller", "Fastify route", "CRUD kỳ lương")
    Component(payroll_line_ctrl, "Payroll Line Controller", "Fastify route", "View, override lines")
    Component(approve_ctrl, "Approval Controller", "Fastify route", "Duyệt bảng lương")

    Component(payroll_engine, "Payroll Engine", "TS class", "Tính gross, OT, deductions theo rules")
    Component(rules_svc, "Rules Service", "TS class", "OT rules, late penalties, allowances config")
    Component(excel_svc, "Excel Service", "TS class", "Generate Excel (ExcelJS), theo template kế toán VN")
    Component(audit_svc, "Audit Service", "TS class", "Log mọi thay đổi bảng lương")

    ComponentDb(repo, "Repositories (Prisma)", "TS", "Type-safe DB access")
    ComponentDb(attendance_client, "Attendance Client", "TS class", "Internal API client, đọc attendance từ attendance system")

    Rel(web_admin, payroll_period_ctrl, "CRUD")
    Rel(web_admin, payroll_line_ctrl, "View, edit")
    Rel(web_admin, approve_ctrl, "Approve, lock")

    Rel(payroll_period_ctrl, attendance_client, "Pull attendance cho kỳ")
    Rel(payroll_period_ctrl, payroll_engine, "Trigger calculation")
    Rel(payroll_engine, rules_svc, "Apply OT rules, deductions")
    Rel(payroll_engine, repo, "Persist lines")
    Rel(payroll_line_ctrl, excel_svc, "Export Excel")
    Rel(approve_ctrl, audit_svc, "Log approval")
    Rel(payroll_engine, repo, "Read employee base salary")
    Rel(excel_svc, repo, "Read approved lines")
```

**Cross-system data flow:** Payroll API does NOT directly access attendance tables. It calls Attendance API's internal endpoints (`/api/internal/attendance?from=...&to=...&employee_id=...`) for cleaner separation. Internal API key in header for auth.

## C4 Level 4: Code (Selected Examples)

For MVP, we won't diagram every class. Below are key domain model classes that capture business logic. See [Domain Specs](../architecture/domain-specs.md) for full DDD model.

### Attendance Aggregate

```mermaid
classDiagram
    class ShiftAssignment {
        +UUID id
        +UUID employeeId
        +UUID projectId
        +UUID shiftId
        +Date date
        +ShiftStatus status
        +assign(employeeId, shiftId, date)
        +cancel()
    }
    class AttendanceRecord {
        +UUID id
        +UUID shiftAssignmentId
        +DateTime checkInAt
        +DateTime checkOutAt
        +GPSCoordinate checkInGps
        +GPSCoordinate checkOutGps
        +String checkInPhotoUrl
        +String checkOutPhotoUrl
        +AttendanceStatus status
        +Duration totalHours
        +Duration overtimeHours
        +recordCheckIn(gps, photo)
        +recordCheckOut(gps, photo)
        +calculateStatus()
    }
    class GPSCoordinate {
        +float latitude
        +float longitude
        +float accuracy
        +distanceTo(other)
        +isWithinRadius(center, radiusMeters)
    }
    ShiftAssignment "1" --> "1" AttendanceRecord : produces
    AttendanceRecord "1" --> "2" GPSCoordinate : has
```

### Payroll Aggregate

```mermaid
classDiagram
    class PayrollPeriod {
        +UUID id
        +int year
        +int month
        +PeriodStatus status
        +Date openedAt
        +Date closedAt
        +UUID approvedBy
        +open()
        +calculateAll()
        +approve(approverId)
        +lock()
    }
    class PayrollLine {
        +UUID id
        +UUID payrollPeriodId
        +UUID employeeId
        +Decimal baseSalary
        +Decimal otWeekday
        +Decimal otWeekend
        +Decimal otHoliday
        +Decimal allowances
        +Decimal gross
        +Decimal advance
        +Decimal otherDeductions
        +Decimal net
        +Money computeGross(rules)
        +Money computeNet(rules)
    }
    PayrollPeriod "1" --> "*" PayrollLine : contains
```

## Deployment Diagram

```mermaid
graph TB
    subgraph Internet
        Employee[📱 Employee Phone<br/>iOS/Android]
        BO[💻 BO Laptop<br/>Chrome/Safari]
    end

    subgraph Cloudflare_Edge["Cloudflare Edge"]
        CF[Cloudflare Tunnel<br/>ak-tunnel.example.com]
    end

    subgraph OnPrem["On-Premise Server (Ubuntu 22.04, 16GB RAM)"]
        direction TB
        Caddy[Caddy<br/>:443 TLS]
        subgraph DockerCompose["Docker Compose Stack"]
            direction LR
            BackendA[attendance-api<br/>Fastify]
            BackendP[payroll-api<br/>Fastify]
            WebAdmin[web-admin<br/>Next.js]
        end
        subgraph DataLayer["Data Layer"]
            direction LR
            PG[(PostgreSQL 16<br/>:5432)]
            Redis[(Redis 7<br/>:6379)]
            MinIO[(MinIO<br/>:9000)]
        end
        Backup[💾 Backup HDD/VPS<br/>Daily rsync]
    end

    Employee -->|HTTPS| CF
    BO -->|HTTPS| CF
    CF --> Caddy
    Caddy --> BackendA
    Caddy --> BackendP
    Caddy --> WebAdmin
    BackendA --> PG
    BackendA --> Redis
    BackendA --> MinIO
    BackendP --> PG
    BackendP --> Redis
    BackendP -.->|Internal API| BackendA
    WebAdmin --> BackendA
    WebAdmin --> BackendP
    PG -.->|pg_dump daily| Backup
    MinIO -.->|sync daily| Backup
```

## Key Architectural Patterns

1. **Bounded Contexts (DDD):** Two systems = two bounded contexts: Attendance and Payroll. Identity shared.
2. **Shared Kernel:** Postgres database shared; `users`, `employees`, `projects`, `tenants` tables are part of Shared Kernel, owned by Identity context but readable by both.
3. **Internal API Communication:** Payroll reads attendance data via internal HTTP API (not direct DB query), preserving service autonomy.
4. **Event-Driven Asynchrony:** Domain events (e.g., `AttendanceRecorded`) published to Redis pub/sub; payroll can subscribe if needed (Phase 2+).
5. **CQRS-lite:** Read-heavy queries (BO dashboard) use optimized read paths; write paths go through domain services. Not full CQRS — overkill for MVP scale.
6. **Repository Pattern:** All DB access via Prisma repositories in `db/repositories/`; controllers never touch Prisma directly.

## Security Boundaries

| Boundary | Controls |
| --- | --- |
| Internet ↔ On-prem | Cloudflare Tunnel (TLS, DDoS) |
| Mobile app ↔ API | JWT + refresh token, rate limit |
| Web admin ↔ API | Same as mobile; admin endpoints require role check |
| Attendance API ↔ Payroll API | Internal API key in header, IP allowlist (both on same Docker network) |
| Backend ↔ Postgres | Username/password, private Docker network only |
| Backend ↔ MinIO | Access/secret key, presigned URLs for client uploads/downloads |

## Related Documents

- [Infrastructure](../infrastructure.md) — Server specs, hosting model
- [Domain Specs](../architecture/domain-specs.md) — DDD aggregates, business rules
- [API Contracts](../architecture/api-contracts/) — OpenAPI 3.1 specs
- [Coding Standards](coding-standards.md) — TS/Flutter conventions
- [Attendance System Architecture](../../../../systems/attendance/docs/architecture.md) — System-specific details
- [Payroll System Architecture](../../../../systems/payroll/docs/architecture.md) — System-specific details
