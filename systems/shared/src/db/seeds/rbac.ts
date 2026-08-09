// RBAC seed — default Permission codes + RolePermission mappings.
// Idempotent: re-running updates descriptions and re-asserts mappings.
//
// Convention: <module>.<action>
// Modules: users, employees, projects, attendance, payroll, reports, rbac
// Actions: view, create, update, delete, approve, export, override, manage

import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

interface PermissionDef {
  code: string
  module: string
  action: string
  description: string
}

/** Master list of all permission codes in the system. */
const PERMISSIONS: PermissionDef[] = [
  // users + rbac
  { code: 'users.view',     module: 'users',     action: 'view',    description: 'Xem danh sách users' },
  { code: 'users.create',   module: 'users',     action: 'create',  description: 'Tạo user mới' },
  { code: 'users.update',   module: 'users',     action: 'update',  description: 'Sửa thông tin user' },
  { code: 'users.delete',   module: 'users',     action: 'delete',  description: 'Xoá / deactivate user' },
  { code: 'rbac.manage',    module: 'rbac',      action: 'manage',  description: 'Quản lý role + permission mapping' },

  // employees
  { code: 'employees.view',   module: 'employees', action: 'view',    description: 'Xem danh sách nhân viên' },
  { code: 'employees.create', module: 'employees', action: 'create',  description: 'Tạo nhân viên mới' },
  { code: 'employees.update', module: 'employees', action: 'update',  description: 'Sửa thông tin nhân viên' },
  { code: 'employees.delete', module: 'employees', action: 'delete',  description: 'Xoá nhân viên' },

  // projects
  { code: 'projects.view',   module: 'projects',  action: 'view',    description: 'Xem danh sách dự án' },
  { code: 'projects.create', module: 'projects',  action: 'create',  description: 'Tạo dự án mới' },
  { code: 'projects.update', module: 'projects',  action: 'update',  description: 'Sửa dự án và quản lý supervisor membership (BO/admin only)' },
  { code: 'projects.delete', module: 'projects',  action: 'delete',  description: 'Xoá / kết thúc dự án' },

  // attendance
  { code: 'attendance.view_self',   module: 'attendance', action: 'view',    description: 'NV xem chấm công của mình' },
  { code: 'attendance.view_all',    module: 'attendance', action: 'view',    description: 'Xem tất cả chấm công' },
  { code: 'attendance.override',    module: 'attendance', action: 'override', description: 'Sửa trạng thái chấm công' },
  { code: 'attendance.shifts.manage', module: 'attendance', action: 'update', description: 'Tạo / sửa ca, phân ca' },

  // payroll
  { code: 'payroll.view',    module: 'payroll', action: 'view',    description: 'Xem kỳ lương + lines' },
  { code: 'payroll.open',     module: 'payroll', action: 'create',  description: 'Mở kỳ lương mới' },
  { code: 'payroll.calculate', module: 'payroll', action: 'update',  description: 'Trigger tính lương' },
  { code: 'payroll.override', module: 'payroll', action: 'override', description: 'Sửa line lương' },
  { code: 'payroll.approve',  module: 'payroll', action: 'approve', description: 'Duyệt kỳ lương' },
  { code: 'payroll.export',   module: 'payroll', action: 'export',  description: 'Xuất Excel bảng lương' },
  { code: 'payroll.lock',     module: 'payroll', action: 'approve', description: 'Khoá kỳ lương (sau khi trả)' },
  { code: 'payroll.rules.manage', module: 'payroll', action: 'manage', description: 'Cấu hình quy tắc tính lương' },

  // reports
  { code: 'reports.view',     module: 'reports', action: 'view',   description: 'Xem báo cáo khách hàng' },
  { code: 'reports.generate', module: 'reports', action: 'create', description: 'Tạo báo cáo khách hàng mới' },
  { code: 'reports.export',   module: 'reports', action: 'export', description: 'Tải báo cáo PDF/CSV' },
]

/**
 * Default role-permission mapping (matches current hardcoded `requireRole` calls).
 * sys_admin has ALL permissions. bo_admin is full ops. supervisor is limited. employee is self-only.
 */
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  system_admin: PERMISSIONS.map((p) => p.code), // Everything
  bo_admin: [
    // users view (not manage)
    'users.view',
    // employees full
    'employees.view', 'employees.create', 'employees.update',
    // projects full
    'projects.view', 'projects.create', 'projects.update',
    // attendance (no override, just view)
    'attendance.view_all', 'attendance.shifts.manage',
    // payroll (no lock)
    'payroll.view', 'payroll.open', 'payroll.calculate', 'payroll.override', 'payroll.approve', 'payroll.export',
    // reports
    'reports.view', 'reports.generate', 'reports.export',
  ],
  supervisor: [
    'employees.view',                                          // xem NV của mình
    'projects.view',                                            // xem dự án được phân công
    'attendance.view_all',                                      // xem chấm công team
    'attendance.override',                                     // sửa chấm công (trong team mình)
    'attendance.shifts.manage',                                 // phân ca
    'reports.view',                                             // xem báo cáo
  ],
  employee: [
    'attendance.view_self',  // chỉ xem chấm công của mình
  ],
}

async function main() {
  console.log('Seeding RBAC permissions + role mappings…\n')

  // Upsert all permissions
  let created = 0
  for (const p of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { code: p.code } })
    if (existing) {
      await prisma.permission.update({
        where: { code: p.code },
        data: { module: p.module, action: p.action, description: p.description },
      })
    } else {
      await prisma.permission.create({ data: p })
      created++
    }
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions (${created} new)`)

  // Upsert role-permission mappings
  const allPermissions = await prisma.permission.findMany()
  const permByCode = new Map(allPermissions.map((p) => [p.code, p]))

  let mappings = 0
  for (const [role, codes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const code of codes) {
      const perm = permByCode.get(code)
      if (!perm) {
        console.warn(`    ⚠ Skipped unknown permission: ${code}`)
        continue
      }
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as UserRole, permissionId: perm.id } },
        update: {},
        create: { role: role as UserRole, permissionId: perm.id },
      })
      mappings++
    }
  }
  console.log(`  ✓ ${mappings} role-permission mappings\n`)

  // Summary
  const roleCounts = await prisma.rolePermission.groupBy({
    by: ['role'],
    _count: { _all: true },
  })
  console.log('  Permissions per role:')
  for (const r of roleCounts) {
    console.log(`    ${r.role.padEnd(15)} ${r._count._all} permissions`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ RBAC seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
