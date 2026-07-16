# Domain Specs — AKAIUNSAN Attendance + Payroll

**Status:** Active — Phase 0 deliverable for PRD-EPIC-002
**Last Updated:** 2026-07-16
**Owner:** @system-architecture + @fullstack-engineer
**Related:** [System Design](../design-standards/system-design.md), [API Contracts](api-contracts/)

## Overview

Domain-Driven Design (DDD) model for the Attendance and Payroll bounded contexts. Defines aggregates, value objects, domain events, ubiquitous language, and business rules. Used by `@fullstack-engineer` when writing code (per `[core-agents/fullstack-engineer.md:55-75]` — "no code without domain-specs.md entry").

**Bounded contexts:**
1. **Identity** — Users, employees, authentication, roles (Shared Kernel)
2. **Attendance** — Projects, shifts, schedule, check-in/out records, customer reports
3. **Payroll** — Salary rules, payroll periods, payroll lines, approvals

## Ubiquitous Language (Glossary)

| Vietnamese | English | Definition |
| --- | --- | --- |
| Nhân viên | Employee | Người làm việc vệ sinh, dùng mobile app check-in/out |
| Giám sát | Supervisor | Người quản lý 1 dự án, override chấm công, duyệt ca |
| BO Staff | Back-Office Staff | Nhân viên văn phòng xử lý lương, báo cáo |
| Dự án | Project | Site khách hàng nơi NV làm việc (15 sites hiện tại) |
| Ca | Shift | Khung giờ làm việc (ca sáng, ca chiều, ca tối, custom) |
| Phân ca | Shift Assignment | Gán 1 NV vào 1 ca tại 1 dự án vào 1 ngày cụ thể |
| Chấm công | Attendance | Ghi nhận NV có mặt tại dự án (in/out) |
| Check-in / Check-out | Check-in / Check-out | Hành động NV bấm nút + GPS + ảnh lúc đến/rời |
| Bảng chấm công | Attendance Report | Tổng hợp giờ công tháng của NV |
| Kỳ lương | Payroll Period | 1 tháng (vd: 2026-07) đang tính lương |
| Bảng lương | Payroll | Tổng hợp lương 1 NV trong 1 kỳ |
| Lương cơ bản | Base Salary | Lương thỏa thuận cố định/tháng hoặc theo giờ |
| Tăng ca (OT) | Overtime | Giờ làm thêm ngoài giờ hành chính |
| Phụ cấp | Allowance | Phụ cấp cơm, xăng, điện thoại, v.v. |
| Khấu trừ | Deduction | Tiền tạm ứng, phạt, các khoản trừ khác |
| Lương gross | Gross Salary | Tổng trước khấu trừ |
| Lương net | Net Salary | Thực nhận sau khấu trừ (BO tính compliance thủ công ở MVP) |
| Ngày lễ | Holiday | Ngày nghỉ lễ VN (1/1, 30/4, 1/5, 2/9, ...) |
| Ngày nghỉ phép | Leave | NV xin nghỉ có/không lương |
| Vùng cho phép | Geofence | Bán kính GPS quanh dự án mà NV được phép check-in |

## Bounded Contexts

### 1. Identity (Shared Kernel)

Owns: authentication, users, employees, roles.

**Why Shared Kernel:** Both Attendance and Payroll need to know who is who. Owned by Identity but readable by both contexts.

```yaml
User:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  email: String (nullable, unique per tenant)
  phone: String (unique per tenant)
  passwordHash: String (nullable, for admin)
  role: enum(employee | supervisor | bo_admin | system_admin)
  status: enum(active | inactive | suspended)
  createdAt: DateTime
  updatedAt: DateTime

Employee:
  id: UUID (PK)
  userId: UUID (FK to User, unique)
  employeeCode: String (mã NV, e.g., "NV001")
  fullName: String (họ tên đầy đủ)
  dateOfBirth: Date (nullable)
  hireDate: Date
  baseSalary: Decimal(15,2)  # VNĐ, base cho payroll
  salaryType: enum(monthly | hourly)
  hourlyRate: Decimal(15,2)  # chỉ dùng nếu salaryType=hourly
  bankAccount: String (nullable, số tài khoản)
  bankName: String (nullable, tên NH)
  idNumber: String (CCCD)
  status: enum(active | inactive)
  createdAt: DateTime
  updatedAt: DateTime

Tenant:
  id: UUID (PK)
  name: String  # "AKAIUNSAN"
  createdAt: DateTime
```

**Business rules:**
- `employeeCode` phải unique trong tenant
- Khi `Employee.status = inactive`, không cho check-in/out (chặn ở API level)
- `baseSalary` và `hourlyRate` là tiền VNĐ, lưu dạng Decimal để tránh float rounding
- `hireDate` không được trong tương lai

### 2. Attendance Bounded Context

Owns: projects, shifts, shift assignments, attendance records, customer reports.

#### Aggregates

**Aggregate Root: ShiftAssignment**

```yaml
ShiftAssignment:
  id: UUID (PK)
  employeeId: UUID (FK to Employee)
  projectId: UUID (FK to Project)
  shiftId: UUID (FK to Shift)
  date: Date  # ngày làm việc
  status: enum(scheduled | checked_in | checked_out | completed | missed | cancelled)
  attendanceRecordId: UUID (FK to AttendanceRecord, nullable)
  assignedBy: UUID (FK to User)  # supervisor/BO gán
  assignedAt: DateTime
  notes: String (nullable)
  createdAt: DateTime
  updatedAt: DateTime
```

**Aggregate Root: AttendanceRecord**

```yaml
AttendanceRecord:
  id: UUID (PK)
  shiftAssignmentId: UUID (FK to ShiftAssignment, unique)
  checkInAt: DateTime (nullable)
  checkOutAt: DateTime (nullable)
  checkInGps: JSONB { lat, lng, accuracy } (nullable)
  checkOutGps: JSONB { lat, lng, accuracy } (nullable)
  checkInPhotoUrl: String (nullable, MinIO presigned URL)
  checkOutPhotoUrl: String (nullable, MinIO presigned URL)
  status: enum(present | late | early_leave | half_day | absent | on_leave | holiday)
  totalMinutesWorked: Integer (nullable, computed)
  overtimeMinutes: Integer (nullable, computed)
  lateMinutes: Integer (nullable, computed)
  overrideReason: String (nullable, nếu supervisor sửa)
  overrideBy: UUID (FK to User, nullable)
  overrideAt: DateTime (nullable)
  createdAt: DateTime
  updatedAt: DateTime
```

#### Entities (not aggregate roots, belong to ShiftAssignment aggregate)

**Shift**

```yaml
Shift:
  id: UUID (PK)
  name: String  # "Ca sáng", "Ca chiều", "Ca tối", or custom
  startTime: Time  # "06:00"
  endTime: Time  # "14:00"
  breakMinutes: Integer  # giờ nghỉ giữa ca (mặc định 60 phút)
  lateThresholdMinutes: Integer  # sau startTime bao nhiêu phút tính late (default 15)
  isOvernight: Boolean  # ca qua đêm (vd: 22:00-06:00 ngày hôm sau)
  color: String  # UI color (hex)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
```

**Project**

```yaml
Project:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  code: String  # mã dự án nội bộ
  name: String  # tên KH / tên dự án
  clientName: String  # tên khách hàng (vd: "Vincom", "Samsung")
  address: String
  latitude: Decimal(10,7)
  longitude: Decimal(10,7)
  geofenceRadiusMeters: Integer  # default 100m
  contractStartDate: Date
  contractEndDate: Date (nullable)
  status: enum(active | paused | ended)
  reportTemplateConfig: JSONB  # cấu hình template báo cáo KH
  createdAt: DateTime
  updatedAt: DateTime
```

#### Value Objects

**GPSCoordinate (immutable)**

```typescript
class GPSCoordinate {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly accuracy: number  // meters
  ) {
    if (latitude < -90 || latitude > 90) throw new Error('Invalid latitude')
    if (longitude < -180 || longitude > 180) throw new Error('Invalid longitude')
  }

  distanceTo(other: GPSCoordinate): number {
    // Haversine formula, return meters
  }

  isWithinRadius(center: GPSCoordinate, radiusMeters: number): boolean {
    return this.distanceTo(center) <= radiusMeters
  }
}
```

**ShiftTimeRange**

```typescript
class ShiftTimeRange {
  constructor(
    public readonly start: Date,  // timestamp thực tế
    public readonly end: Date
  )

  durationMinutes(): number
  overlapsWith(other: ShiftTimeRange): boolean
  isOvernight(): boolean
}
```

#### Domain Events

```yaml
ShiftAssigned:
  shiftAssignmentId: UUID
  employeeId: UUID
  projectId: UUID
  date: Date
  assignedBy: UUID
  occurredAt: DateTime

CheckedIn:
  attendanceRecordId: UUID
  employeeId: UUID
  projectId: UUID
  checkInAt: DateTime
  gps: GPSCoordinate
  photoUrl: String
  isLate: Boolean
  lateMinutes: Integer
  occurredAt: DateTime

CheckedOut:
  attendanceRecordId: UUID
  employeeId: UUID
  projectId: UUID
  checkOutAt: DateTime
  totalMinutesWorked: Integer
  overtimeMinutes: Integer
  occurredAt: DateTime

AttendanceOverridden:
  attendanceRecordId: UUID
  overriddenBy: UUID
  reason: String
  previousStatus: AttendanceStatus
  newStatus: AttendanceStatus
  occurredAt: DateTime

CustomerReportGenerated:
  reportId: UUID
  projectId: UUID
  periodFrom: Date
  periodTo: Date
  format: enum(pdf | csv)
  generatedBy: UUID
  occurredAt: DateTime
```

#### Business Rules (Attendance)

1. **GPS validation (BR-ATT-001):** Check-in chỉ thành công nếu GPS nằm trong bán kính `Project.geofenceRadiusMeters` quanh `Project.{latitude, longitude}`. Nếu ngoài → reject + ghi log.
2. **Late detection (BR-ATT-002):** Check-in sau `Shift.startTime + lateThresholdMinutes` (default 15 phút) → status = `late`. Trước đó → `present`.
3. **Missing check-out (BR-ATT-003):** Nếu NV check-in nhưng quên check-out, cuối ngày supervisor có thể manual add check-out time. Hệ thống không tự động set check-out = endOfDay.
4. **Double check-in prevention (BR-ATT-004):** Nếu `AttendanceRecord.checkInAt` đã có cho assignment này, API reject check-in lần 2. Tương tự cho check-out.
5. **Photo required (BR-ATT-005):** Cả check-in và check-out đều yêu cầu ảnh (JPEG, max 5 MB). Không có ảnh → reject.
6. **Schedule conflict (BR-ATT-006):** Khi gán shift cho NV, nếu NV đã có shift khác cùng ngày (overlap thời gian) → cảnh báo supervisor (không block, vì có thể NV cover ca khác).
7. **Project geofence required (BR-ATT-007):** Project phải có latitude/longitude + radius trước khi cho check-in.
8. **Past date check-in (BR-ATT-008):** NV không được check-in cho assignment ngày quá khứ (>7 ngày). Supervisor có thể backfill có lý do.
9. **Holiday override (BR-ATT-009):** Nếu assignment date là ngày lễ VN và status = `present` → tính lương OT holiday (3x).
10. **Geofence precision (BR-ATT-010):** GPS accuracy > 50m → cảnh báo nhưng vẫn cho check-in (NV có thể ở trong tòa nhà, GPS kém).

### 3. Payroll Bounded Context

Owns: payroll rules, payroll periods, payroll lines, approvals.

#### Aggregates

**Aggregate Root: PayrollPeriod**

```yaml
PayrollPeriod:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  year: Integer  # 2026
  month: Integer  # 7 (July)
  status: enum(open | calculating | calculated | approved | paid | locked)
  openedAt: DateTime
  openedBy: UUID (FK to User)
  calculatedAt: DateTime (nullable)
  approvedAt: DateTime (nullable)
  approvedBy: UUID (FK to User, nullable)
  paidAt: DateTime (nullable)
  lockedAt: DateTime (nullable)
  totalGross: Decimal(15,2) (nullable, computed)
  totalNet: Decimal(15,2) (nullable, computed)
  totalEmployees: Integer (nullable, computed)
  createdAt: DateTime
  updatedAt: DateTime

Constraint: UNIQUE(tenantId, year, month)
```

**Aggregate Root: PayrollLine**

```yaml
PayrollLine:
  id: UUID (PK)
  payrollPeriodId: UUID (FK to PayrollPeriod)
  employeeId: UUID (FK to Employee)
  # Input data
  daysWorked: Integer  # số ngày làm thực tế
  daysOnLeave: Integer  # số ngày nghỉ phép (có/không lương tùy rule)
  totalWorkMinutes: Integer  # tổng phút làm (từ attendance)
  overtimeWeekdayMinutes: Integer
  overtimeWeekendMinutes: Integer
  overtimeHolidayMinutes: Integer
  lateMinutes: Integer
  absentDays: Integer
  # Money breakdown
  baseSalary: Decimal(15,2)
  proratedBase: Decimal(15,2)  # base × (daysWorked / workingDaysInMonth)
  overtimeWeekdayAmount: Decimal(15,2)
  overtimeWeekendAmount: Decimal(15,2)
  overtimeHolidayAmount: Decimal(15,2)
  latePenalty: Decimal(15,2)  # số tiền phạt trễ (nếu rule bật)
  allowances: Decimal(15,2)  # tổng phụ cấp
  gross: Decimal(15,2)
  advance: Decimal(15,2)  # tạm ứng
  otherDeductions: Decimal(15,2)
  net: Decimal(15,2)
  # Override
  overrideReason: String (nullable)
  overrideBy: UUID (FK to User, nullable)
  overrideAt: DateTime (nullable)
  createdAt: DateTime
  updatedAt: DateTime

Constraint: UNIQUE(payrollPeriodId, employeeId)
```

#### Entities

**PayrollRule (configurable per tenant)**

```yaml
PayrollRule:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  effectiveFrom: Date
  effectiveTo: Date (nullable)
  # OT rates
  otWeekdayMultiplier: Decimal(3,2)  # 1.5
  otWeekendMultiplier: Decimal(3,2)  # 2.0
  otHolidayMultiplier: Decimal(3,2)  # 3.0
  # Late penalty
  latePenaltyPerMinute: Decimal(15,2) (nullable)  # vd: 1000 VND/phút
  maxLatePenaltyPerDay: Decimal(15,2) (nullable)
  # Allowances
  mealAllowancePerDay: Decimal(15,2) (nullable)  # phụ cấp cơm/ngày
  phoneAllowance: Decimal(15,2) (nullable)  # phụ cấp điện thoại/tháng
  # Rounding
  roundingMinutes: Integer  # làm tròn giờ (vd: 15 phút)
  workingHoursPerDay: Integer  # default 8
  # Standard working days (for prorated base)
  standardWorkingDaysPerMonth: Integer  # default 26 (Mon-Sat, off Sunday)
  createdAt: DateTime
  updatedAt: DateTime
```

#### Value Objects

**Money (Decimal wrapper)**

```typescript
class Money {
  constructor(public readonly amount: number) {
    // amount in VNĐ, integer to avoid float issues (or Decimal.js for precise)
  }
  add(other: Money): Money
  subtract(other: Money): Money
  multiply(factor: number): Money
  isGreaterThan(other: Money): boolean
  format(locale: string = 'vi-VN'): string  // "1.234.567 ₫"
}
```

#### Domain Events (Payroll)

```yaml
PayrollPeriodOpened:
  payrollPeriodId: UUID
  year: Integer
  month: Integer
  openedBy: UUID
  occurredAt: DateTime

PayrollCalculated:
  payrollPeriodId: UUID
  totalLines: Integer
  totalGross: Decimal
  calculatedAt: DateTime
  occurredAt: DateTime

PayrollApproved:
  payrollPeriodId: UUID
  approvedBy: UUID
  totalNet: Decimal
  occurredAt: DateTime

PayrollLineOverridden:
  payrollLineId: UUID
  overriddenBy: UUID
  reason: String
  previousNet: Decimal
  newNet: Decimal
  occurredAt: DateTime
```

#### Business Rules (Payroll)

1. **Pro-rated base (BR-PAY-001):**
   ```
   proratedBase = baseSalary × (daysWorked / standardWorkingDaysPerMonth)
   ```
   Vd: NV monthly salary 10tr, làm 22/26 ngày → prorated = 8.46tr.

2. **OT calculation (BR-PAY-002):**
   ```
   overtimeWeekdayAmount = (baseSalary / standardWorkingDays / workingHoursPerDay / 60) × otWeekdayMinutes × otWeekdayMultiplier
   ```
   Vd: base 10tr, 26 ngày, 8h/ngày = ~48,000 VNĐ/giờ → 1h OT weekday (1.5x) = ~72,000 VNĐ.

3. **Time rounding (BR-PAY-003):** OT minutes được làm tròn theo `roundingMinutes` (default 15 phút). Vd: 22 phút → 15 phút, 38 phút → 45 phút.

4. **Late penalty (BR-PAY-004):**
   ```
   latePenalty = min(lateMinutes × latePenaltyPerMinute, maxLatePenaltyPerDay) × daysLate
   ```
   Chỉ áp dụng nếu rule bật. Default OFF ở MVP (BO xử lý thủ công).

5. **Allowances (BR-PAY-005):**
   ```
   totalAllowances = mealAllowancePerDay × daysWorked + phoneAllowance (nếu có)
   ```

6. **Gross calculation (BR-PAY-006):**
   ```
   gross = proratedBase + otWeekday + otWeekend + otHoliday - latePenalty + totalAllowances
   ```

7. **Net calculation (BR-PAY-007):**
   ```
   net = gross - advance - otherDeductions
   ```
   **MVP scope: KHÔNG tính BHXH, BHYT, BHTN, PIT ở đây.** BO xử lý compliance thủ công sau khi hệ thống xuất net.

8. **Period state machine (BR-PAY-008):**
   ```
   open → calculating → calculated → approved → paid → locked
   ```
   - open: BO có thể sửa attendance input
   - calculating: hệ thống đang tính (job chạy)
   - calculated: đã có lines, BO có thể review + override từng line
   - approved: BO đã duyệt, không thể sửa line nữa (chỉ admin mới revert được)
   - paid: BO đã chuyển khoản, ghi ngày paid
   - locked: đóng kỳ, không thể mở lại (lưu trữ)

9. **Re-calculation (BR-PAY-009):** Sau khi period = calculated, nếu attendance thay đổi (supervisor override), hệ thống không tự động recalc; phải trigger thủ công qua API và ghi log.

10. **Holiday detection (BR-PAY-010):** Sử dụng bảng ngày lễ VN config sẵn trong code (hardcoded array, dễ extend). Vd:
    ```typescript
    const VIETNAM_HOLIDAYS_2026 = [
      { date: '2026-01-01', name: 'Tết Dương lịch' },
      { date: '2026-04-26', name: 'Giỗ Tổ Hùng Vương' },
      { date: '2026-04-30', name: 'Thống nhất' },
      { date: '2026-05-01', name: 'Quốc tế lao động' },
      { date: '2026-09-02', name: 'Quốc khánh' },
    ]
    ```

## Cross-Context Relationships

```
Identity (Shared Kernel)
  ↓ provides Users, Employees, Projects
Attendance
  ↓ publishes AttendanceRecorded events
Payroll (subscribes, reads via Internal API)
```

**Concretely:**
- Payroll API calls Attendance API: `GET /api/internal/attendance?employeeId=...&from=YYYY-MM-DD&to=YYYY-MM-DD` để lấy attendance data cho kỳ lương.
- Attendance writes domain events to Redis pub/sub; Payroll subscribes (Phase 3+, optional).

## Cross-Cutting Concerns

### Audit Trail (BR-X-001)

Tất cả hành động admin/supervisor/BO ghi vào `AuditLog`:

```yaml
AuditLog:
  id: UUID (PK)
  actorId: UUID (FK to User)
  actorRole: String
  action: String  # "override_attendance", "approve_payroll", "create_user"
  entityType: String  # "AttendanceRecord", "PayrollPeriod"
  entityId: UUID
  previousValue: JSONB (nullable)
  newValue: JSONB (nullable)
  ipAddress: String
  userAgent: String
  occurredAt: DateTime
```

### Tenancy (BR-X-002)
- Mọi bảng có `tenantId` (FK to Tenant)
- Middleware tự động filter theo `tenantId` từ JWT (MVP chỉ có 1 tenant = AKAIUNSAN, nhưng schema sẵn sàng cho multi-tenant tương lai)

### Soft Delete (BR-X-003)
- Các bảng chính (Employee, Project, Shift) dùng `deletedAt: DateTime (nullable)` thay vì xóa cứng
- Query mặc định filter `WHERE deletedAt IS NULL`

## Domain Glossary Index

| Term | Vietnamese | Defined In |
| --- | --- | --- |
| Check-in/out | Chấm công vào/ra | Attendance |
| Geofence | Vùng cho phép | Attendance |
| Late | Đi trễ | Attendance |
| Overtime | Tăng ca | Payroll |
| Gross/Net salary | Lương gross/net | Payroll |
| Payroll period | Kỳ lương | Payroll |
| Allowance | Phụ cấp | Payroll |
| Deduction | Khấu trừ | Payroll |

## Related Documents

- [System Design](../design-standards/system-design.md) — C4 diagrams
- [API Contracts](api-contracts/) — OpenAPI specs (DTOs match domain model)
- [Coding Standards](../design-standards/coding-standards.md) — Implementation conventions
- [ADR-003: Skip VN Compliance at MVP](../../8-governance/decision-log/adr-003-skip-vn-compliance-mvp.md) — Why no BHXH/PIT in MVP
