-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('employee', 'supervisor', 'bo_admin', 'system_admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('monthly', 'hourly');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'paused', 'ended');

-- CreateEnum
CREATE TYPE "ShiftAssignmentStatus" AS ENUM ('scheduled', 'checked_in', 'checked_out', 'completed', 'missed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'late', 'early_leave', 'half_day', 'absent', 'on_leave', 'holiday');

-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('open', 'calculating', 'calculated', 'approved', 'paid', 'locked');

-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('none', 'tncn_only', 'full', 'custom');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create_user', 'update_user', 'deactivate_user', 'override_attendance', 'create_shift_assignment', 'cancel_shift_assignment', 'open_payroll_period', 'calculate_payroll', 'approve_payroll', 'lock_payroll', 'override_payroll_line', 'export_payroll', 'generate_customer_report', 'update_payroll_rules');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('pdf', 'csv');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "hireDate" DATE NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "salaryType" "SalaryType" NOT NULL,
    "hourlyRate" DECIMAL(15,2),
    "bankAccount" TEXT,
    "bankName" TEXT,
    "idNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "contractStartDate" DATE NOT NULL,
    "contractEndDate" DATE,
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "reportTemplateConfig" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "isOvernight" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "shiftId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "ShiftAssignmentStatus" NOT NULL DEFAULT 'scheduled',
    "assignedById" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "shiftAssignmentId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "checkInGps" JSONB,
    "checkOutGps" JSONB,
    "checkInPhotoKey" TEXT,
    "checkOutPhotoKey" TEXT,
    "status" "AttendanceStatus" NOT NULL,
    "totalMinutesWorked" INTEGER,
    "overtimeMinutes" INTEGER,
    "lateMinutes" INTEGER,
    "overrideReason" TEXT,
    "overrideById" UUID,
    "overrideAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_reports" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "periodFrom" DATE NOT NULL,
    "periodTo" DATE NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "generatedBy" UUID NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_rules" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "otWeekdayMultiplier" DECIMAL(3,2) NOT NULL,
    "otWeekendMultiplier" DECIMAL(3,2) NOT NULL,
    "otHolidayMultiplier" DECIMAL(3,2) NOT NULL,
    "latePenaltyPerMinute" DECIMAL(15,2),
    "maxLatePenaltyPerDay" DECIMAL(15,2),
    "mealAllowancePerDay" DECIMAL(15,2),
    "phoneAllowance" DECIMAL(15,2),
    "roundingMinutes" INTEGER NOT NULL DEFAULT 15,
    "workingHoursPerDay" INTEGER NOT NULL DEFAULT 8,
    "standardWorkingDaysPerMonth" INTEGER NOT NULL DEFAULT 26,
    "taxMode" "TaxMode" NOT NULL DEFAULT 'none',
    "bhxhRateNv" DECIMAL(5,4),
    "bhxhRateDn" DECIMAL(5,4),
    "bhytRateNv" DECIMAL(5,4),
    "bhytRateDn" DECIMAL(5,4),
    "bhtnRateNv" DECIMAL(5,4),
    "bhtnRateDn" DECIMAL(5,4),
    "pitBrackets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "payroll_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'open',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedById" UUID NOT NULL,
    "calculatedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" UUID,
    "paidAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "totalGross" DECIMAL(15,2),
    "totalNet" DECIMAL(15,2),
    "totalEmployees" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_lines" (
    "id" UUID NOT NULL,
    "payrollPeriodId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "daysOnLeave" INTEGER NOT NULL DEFAULT 0,
    "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeWeekdayMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeWeekendMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeHolidayMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "absentDays" INTEGER NOT NULL DEFAULT 0,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "proratedBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overtimeWeekdayAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overtimeWeekendAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overtimeHolidayAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "latePenalty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gross" DECIMAL(15,2) NOT NULL,
    "bhxhNhanVien" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bhxhDoanhNghiep" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bhytNhanVien" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bhytDoanhNghiep" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bhtnNhanVien" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bhtnDoanhNghiep" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "thueTNCN" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tongKhauTru" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "advance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(15,2) NOT NULL,
    "overrideReason" TEXT,
    "overrideById" UUID,
    "overrideAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role" "UserRole" NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role","permissionId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_tenantId_idx" ON "employees"("tenantId");

-- CreateIndex
CREATE INDEX "employees_userId_idx" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_tenantId_employeeCode_key" ON "employees"("tenantId", "employeeCode");

-- CreateIndex
CREATE INDEX "projects_tenantId_idx" ON "projects"("tenantId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tenantId_code_key" ON "projects"("tenantId", "code");

-- CreateIndex
CREATE INDEX "shifts_isActive_idx" ON "shifts"("isActive");

-- CreateIndex
CREATE INDEX "shift_assignments_employeeId_date_idx" ON "shift_assignments"("employeeId", "date");

-- CreateIndex
CREATE INDEX "shift_assignments_projectId_date_idx" ON "shift_assignments"("projectId", "date");

-- CreateIndex
CREATE INDEX "shift_assignments_status_idx" ON "shift_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shift_assignments_employeeId_projectId_shiftId_date_key" ON "shift_assignments"("employeeId", "projectId", "shiftId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_shiftAssignmentId_key" ON "attendance_records"("shiftAssignmentId");

-- CreateIndex
CREATE INDEX "attendance_records_employeeId_idx" ON "attendance_records"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_records_projectId_idx" ON "attendance_records"("projectId");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE INDEX "attendance_records_checkInAt_idx" ON "attendance_records"("checkInAt");

-- CreateIndex
CREATE INDEX "customer_reports_projectId_generatedAt_idx" ON "customer_reports"("projectId", "generatedAt");

-- CreateIndex
CREATE INDEX "payroll_rules_tenantId_effectiveFrom_idx" ON "payroll_rules"("tenantId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_tenantId_year_month_key" ON "payroll_periods"("tenantId", "year", "month");

-- CreateIndex
CREATE INDEX "payroll_lines_employeeId_idx" ON "payroll_lines"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_lines_payrollPeriodId_employeeId_key" ON "payroll_lines"("payrollPeriodId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_action_idx" ON "permissions"("module", "action");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_occurredAt_idx" ON "audit_logs"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_occurredAt_idx" ON "audit_logs"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_occurredAt_idx" ON "audit_logs"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "shift_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_overrideById_fkey" FOREIGN KEY ("overrideById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_reports" ADD CONSTRAINT "customer_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_rules" ADD CONSTRAINT "payroll_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_overrideById_fkey" FOREIGN KEY ("overrideById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
