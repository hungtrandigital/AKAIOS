# Domain Specs — AKAIUNSAN Attendance + Payroll

**Status:** Active — Phase 0 deliverable for PRD-EPIC-002
**Last Updated:** 2026-07-18
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
| Giám sát | Supervisor | Người quản lý các dự án được BO/system admin gán, override chấm công, duyệt ca |
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

The YAML below is the domain-facing aggregate model, not an exhaustive database
catalog. The committed Prisma schema is authoritative for persistence-only
columns, indexes, relations, and defaults; OpenAPI is authoritative for transport
DTOs. Fields shown here must still match their persisted names and nullability.

### 1. Identity (Shared Kernel)

Owns: authentication, users, employees, roles.

**Why Shared Kernel:** Both Attendance and Payroll need to know who is who. Owned by Identity but readable by both contexts.

```yaml
User:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  email: String (nullable, globally unique in the current schema)
  phone: String (globally unique in the current schema)
  passwordHash: String (nullable, for password-authenticated admin or employee)
  role: enum(employee | supervisor | bo_admin | system_admin)
  status: enum(active | inactive | suspended)
  lastLoginAt: DateTime (nullable)
  createdAt: DateTime
  updatedAt: DateTime

Employee:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  userId: UUID (FK to User, unique)
  employeeCode: String (mã NV, e.g., "NV001")
  fullName: String (họ tên đầy đủ)
  dateOfBirth: Date (nullable)
  hireDate: Date
  baseSalary: Decimal(15,2)  # VNĐ, base cho payroll
  salaryType: enum(monthly | hourly)
  hourlyRate: Decimal(15,2) (nullable)  # required positive when salaryType=hourly
  bankAccount: String (nullable, số tài khoản)
  bankName: String (nullable, tên NH)
  idNumber: String (nullable, CCCD)
  status: enum(active | inactive)
  deletedAt: DateTime (nullable)
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
  assignedById: UUID (FK to User)  # supervisor/BO gán
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
  employeeId: UUID (FK to Employee)
  projectId: UUID (FK to Project)
  checkInAt: DateTime (nullable)
  checkOutAt: DateTime (nullable)
  checkInGps: JSONB { latitude, longitude, accuracy } (nullable)
  checkOutGps: JSONB { latitude, longitude, accuracy } (nullable)
  checkInPhotoKey: String (nullable, private MinIO object key)
  checkOutPhotoKey: String (nullable, private MinIO object key)
  status: enum(present | late | early_leave | half_day | absent | on_leave | holiday)
  totalMinutesWorked: Integer (nullable, computed)
  overtimeMinutes: Integer (nullable, computed)
  lateMinutes: Integer (nullable, computed)
  overrideReason: String (nullable, nếu supervisor sửa)
  overrideById: UUID (FK to User, nullable)
  overrideAt: DateTime (nullable)
  createdAt: DateTime
  updatedAt: DateTime
```

#### Entities (not aggregate roots, belong to ShiftAssignment aggregate)

**Shift**

```yaml
Shift:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  name: String  # "Ca sáng", "Ca chiều", "Ca tối", or custom
  startTime: Time  # "06:00"
  endTime: Time  # "14:00"
  breakMinutes: Integer  # giờ nghỉ giữa ca (mặc định 60 phút)
  lateThresholdMinutes: Integer  # sau startTime bao nhiêu phút tính late (default 15)
  isOvernight: Boolean  # ca qua đêm (vd: 22:00-06:00 ngày hôm sau)
  color: String (nullable)  # UI color (hex)
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime

Constraint: UNIQUE(tenantId, name)
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
  reportTemplateConfig: JSONB (nullable)  # cấu hình template báo cáo KH
  deletedAt: DateTime (nullable)
  createdAt: DateTime
  updatedAt: DateTime
```

**ProjectSupervisor (authorization membership)**

```yaml
ProjectSupervisor:
  projectId: UUID (FK to Project)
  userId: UUID (FK to User, role = supervisor, status = active)
  assignedById: UUID (FK to User, role = bo_admin | system_admin)
  createdAt: DateTime
  primaryKey: [projectId, userId]
```

- `ProjectSupervisor` is the sole project-management authorization source for a supervisor.
  A `ShiftAssignment`, including a supervisor's own historical/self-created shift, never grants access.
- BO/system admin grant or revoke membership transactionally with an `AuditLog`. Project,
  supervisor, assigning actor, and request must belong to the same tenant; unauthorized and
  cross-tenant identifiers fail closed as `404`.
- Revocation takes effect on the next request. Supervisor project, attendance, employee,
  report, and shift-assignment queries must predicate both tenant ownership and membership.
- Employee visibility includes employees with historical or current shift assignments in an
  authorized project, but responses use a non-payroll, non-identity safe DTO.

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

These are conceptual event payloads only; the MVP does not publish them to a
message bus. Photo references are private object keys, never public URLs.

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
  photoKey: String
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
  reasonCode: enum(capture_unavailable | permission_blocked | device_failure) (optional)
  provenance: enum(correction | manual)
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
5. **Photo required (BR-ATT-005):** Employee self check-in/out luôn yêu cầu ảnh JPEG mới chụp trong official client, tối đa 5 MB; không có ảnh, ảnh thư viện hoặc placeholder → reject. Server phải giải mã đầy đủ JPEG, giới hạn tối đa 16 MP và tối thiểu 320×240, không chỉ tin magic bytes. Camera lỗi không làm yếu GPS/photo policy của employee endpoint. MVP chưa có device attestation/liveness, nên freshness/camera origin là client control chứ không phải bằng chứng mật mã cho direct API caller.
6. **Schedule conflict (BR-ATT-006):** MVP chỉ cho phép một assignment không-cancelled cho mỗi nhân viên trong một business date vì mobile Today xử lý một ca. API reject ca thứ hai cùng ngày kể cả liền kề; đồng thời kiểm tra ngày trước/sau để chặn overlap qua đêm.
7. **Project geofence required (BR-ATT-007):** Project phải có latitude/longitude + radius trước khi cho check-in.
8. **Past date check-in (BR-ATT-008):** NV không được check-in cho assignment quá 7 ngày trước ngày Việt Nam hiện tại. Operator manual event cũng tuân theo cửa sổ này và không nhận thời điểm tương lai.
9. **Holiday override (BR-ATT-009):** Nếu assignment date là ngày lễ VN và status = `present` → tính lương OT holiday (3x).
10. **GPS accuracy telemetry (BR-ATT-010):** Client gửi `accuracy` không âm để lưu làm bằng chứng/telemetry. MVP không áp ngưỡng accuracy riêng; server luôn kiểm tra khoảng cách Haversine với bán kính dự án và accuracy không được mở rộng/bỏ qua geofence.
11. **Shift cancellation audit (BR-ATT-011):** BO/admin chỉ được hủy assignment còn ở trạng thái `scheduled` và chưa có attendance; supervisor chỉ được hủy trong dự án có membership đang hiệu lực. Lý do hủy từ 10–500 ký tự, actor và trạng thái trước/sau phải được ghi audit atomically. Đổi lịch được thực hiện theo chuỗi hủy lịch cũ rồi tạo lịch mới.
12. **Tenant-owned shift catalog (BR-ATT-012):** Mỗi `Shift` thuộc đúng một tenant; list/create template và assignment lookup luôn predicate tenant. Tên ca unique trong tenant nhưng có thể trùng giữa các tenant.
13. **Camera-failure manual event (BR-ATT-013):** Khi không thể chụp ảnh, employee không được bypass. Chỉ supervisor active có membership đúng project hoặc system admin break-glass, với `attendance.override`, mới tạo `check_in|check_out` thủ công cho assignment còn hợp lệ. Supervisor không được tự ghi cho chính mình. Reason code chỉ nhận `capture_unavailable|permission_blocked|device_failure`; note tối thiểu 10 ký tự. Event time phải thuộc business date của assignment (checkout ca qua đêm có thể ở ngày kế tiếp) và nằm trong support window từ 4 giờ trước scheduled start đến 12 giờ sau scheduled end. Event không giả lập GPS/photo, lưu actor/reason/time trong override provenance, đổi record + assignment bằng compare-and-set và ghi `override_attendance` audit trong cùng transaction. BO chỉ review ngoại lệ, không tạo event.

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
  daysWorked: Integer  # số attendance-day không absent/on_leave, dùng để hiển thị
  workdayUnits: Decimal(5,2)  # persisted paid-day units used by proration/allowances
  daysOnLeave: Integer  # số ngày nghỉ phép (có/không lương tùy rule)
  totalWorkMinutes: Integer  # tổng phút làm (từ attendance)
  overtimeWeekdayMinutes: Integer
  overtimeWeekendMinutes: Integer
  overtimeHolidayMinutes: Integer
  lateMinutes: Integer
  absentDays: Integer
  # Money breakdown
  baseSalary: Decimal(15,2)
  proratedBase: Decimal(15,2)  # monthly: workdayUnits prorata; hourly: regular minutes × hourlyRate
  overtimeWeekdayAmount: Decimal(15,2)
  overtimeWeekendAmount: Decimal(15,2)
  overtimeHolidayAmount: Decimal(15,2)
  latePenalty: Decimal(15,2)  # số tiền phạt trễ (nếu rule bật)
  allowances: Decimal(15,2)  # tổng phụ cấp
  gross: Decimal(15,2)
  # Persisted compliance columns; guaranteed zero while ADR-003 MVP gate is active
  bhxhNhanVien: Decimal(15,2)
  bhxhDoanhNghiep: Decimal(15,2)
  bhytNhanVien: Decimal(15,2)
  bhytDoanhNghiep: Decimal(15,2)
  bhtnNhanVien: Decimal(15,2)
  bhtnDoanhNghiep: Decimal(15,2)
  thueTNCN: Decimal(15,2)
  tongKhauTru: Decimal(15,2)
  advance: Decimal(15,2)  # tạm ứng
  otherDeductions: Decimal(15,2)
  net: Decimal(15,2)
  # Override
  allowancesOverridden: Boolean  # true khi BO đã override allowance thủ công
  overrideReason: String (nullable)
  overrideById: UUID (FK to User, nullable)
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
  # Persisted compliance config; non-none modes are rejected in the MVP
  taxMode: enum(none | tncn_only | full | custom)
  bhxhRateNv: Decimal(5,4) (nullable)
  bhxhRateDn: Decimal(5,4) (nullable)
  bhytRateNv: Decimal(5,4) (nullable)
  bhytRateDn: Decimal(5,4) (nullable)
  bhtnRateNv: Decimal(5,4) (nullable)
  bhtnRateDn: Decimal(5,4) (nullable)
  pitBrackets: JSONB (nullable)
  updatedBy: UUID (nullable)
  createdAt: DateTime
  updatedAt: DateTime
```

#### Value Objects

**Money (Decimal wrapper)**

```typescript
class Money {
  readonly amount: Decimal
  constructor(value: Decimal.Value)
  static zero(): Money
  static fromVNĐ(value: number | string): Money
  add(other: Money): Money
  subtract(other: Money): Money
  multiply(factor: number | Decimal): Money
  divide(divisor: number | Decimal): Money
  isGreaterThan(other: Money): boolean
  toDBString(): string
  format(): string  // Vietnamese VND formatting
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
   monthly: proratedBase = baseSalary × (workdayUnits / standardWorkingDaysPerMonth)
   hourly:  proratedBase = hourlyRate × regularWorkMinutes / 60
   ```
   `workdayUnits`: normal/holiday = 1, half-day = 0.5, absent/on_leave = 0;
   monthly units are capped at the configured standard. `daysWorked` remains an
   integer display/persistence count. Hourly employees require a positive
   `hourlyRate` at Employee create/update and again at calculation.

2. **OT calculation (BR-PAY-002):**
   ```
   monthly minuteRate = baseSalary / standardWorkingDays / workingHoursPerDay / 60
   hourly minuteRate  = hourlyRate / 60
   overtimeAmount = minuteRate × roundedOTMinutes × categoryMultiplier
   ```
   Vd: base 10tr, 26 ngày, 8h/ngày = ~48,000 VNĐ/giờ → 1h OT weekday (1.5x) = ~72,000 VNĐ.

3. **Time rounding (BR-PAY-003):** OT minutes được làm tròn theo `roundingMinutes` (default 15 phút). Vd: 22 phút → 15 phút, 38 phút → 45 phút.

4. **Late penalty (BR-PAY-004):**
   ```
   latePenalty = sum(min(recordLateMinutes × latePenaltyPerMinute, maxLatePenaltyPerDay))
   ```
   Cap được áp riêng cho từng attendance record/ngày rồi mới cộng. Chỉ áp dụng
   nếu rule bật; default OFF ở MVP (BO xử lý thủ công).

5. **Allowances (BR-PAY-005):**
   ```
   totalAllowances = mealAllowancePerDay × workdayUnits + phoneAllowance (nếu có)
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
   - calculating: trạng thái CAS tạm thời trong transaction tính đồng bộ; không có background job
   - calculated: đã có lines, BO có thể review + override từng line
   - approved: BO đã duyệt, không thể sửa line; MVP không có endpoint revert
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
  ↓ exposes a tenant-bound attendance projection
Payroll (reads synchronously via Internal API)
```

**Concretely:**
- Payroll API calls Attendance API: `GET /internal/attendance?tenantId=...&employeeId=...&from=YYYY-MM-DD&to=YYYY-MM-DD` with `X-Internal-API-Key` để lấy attendance data cho kỳ lương.
- Redis pub/sub/domain-event delivery is not implemented in the MVP. Any future asynchronous integration requires a separately approved design with durability and idempotency semantics.

## Cross-Cutting Concerns

### Audit Trail (BR-X-001)

Các thay đổi nhạy cảm đã triển khai ghi `AuditLog`: attendance override,
grant/revoke supervisor membership, payroll calculate/approve/override/export,
và payroll-rule update. Không được suy diễn rằng mọi
CRUD/state transition đều đã có audit; mở rộng coverage là gate riêng trước khi
coi audit trail là toàn diện.

```yaml
AuditLog:
  id: UUID (PK)
  tenantId: UUID (FK to Tenant)
  actorId: UUID (FK to User)
  actorRole: String
  action: String  # "override_attendance", "approve_payroll", "create_user"
  entityType: String  # "AttendanceRecord", "PayrollPeriod"
  entityId: UUID (nullable)
  previousValue: JSONB (nullable)
  newValue: JSONB (nullable)
  ipAddress: String (nullable)
  userAgent: String (nullable)
  occurredAt: DateTime
```

### Tenancy (BR-X-002)
- Aggregate roots như `User`, `Employee`, `Project`, `PayrollPeriod`, và report có
  `tenantId`; child records được scope qua quan hệ tới các roots này.
- Route/service queries phải đưa tenant từ JWT (hoặc tenant-bound internal API
  input) vào predicate. Prisma không tự động thêm tenant filter.

### Soft Delete (BR-X-003)
- `Employee` và `Project` dùng `deletedAt`; `Shift` dùng `isActive`. Không có cơ
  chế soft-delete tổng quát áp dụng tự động cho mọi model.
- Các route/service đã triển khai phải thêm `deletedAt: null` vào predicate phù
  hợp; Prisma không có middleware/global scope tự động làm việc này.

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
- [ADR-003: Skip VN Compliance at MVP](../../../8-governance/decision-log/adr-003-skip-vn-compliance-mvp.md) — Why no BHXH/PIT in MVP
