// Demo accounts seed — creates high-profile demo users for showcase + marketing.
// Run AFTER `pnpm db:seed` (dev-seed.ts) to layer named demo users on top of 200 random employees.
//
// Creates:
//   - 1 CEO (Trần Minh CEO) — full read-only + executive dashboard
//   - 1 Operations Director (Lê Hà Ops Director) — BO admin
//   - 1 Senior BO (Phạm Linh Senior BO)
//   - 1 Junior BO (Nguyễn Trang Junior BO)
//   - 3 Senior Supervisors (tên VN thật) — 1 cho mỗi dự án flagship
//   - 5 Demo Employees (NV-DEMO-01..05) — dùng cho marketing demo
//
// All passwords are simple + memorable for showcase (NHƯNG KHÔNG dùng production).

import { PrismaClient, UserRole, SalaryType } from '@prisma/client'
import { hashPassword } from '../../auth/password.js'

const prisma = new PrismaClient()
const AK_TENANT_ID = 'c0ffee00-0000-4000-8000-000000000001'

const DEMO_PASSWORD = 'Demo@2026' // Uniform password for ALL demo accounts

const DEMO_ACCOUNTS = [
  // ===== EXECUTIVE =====
  {
    phone: '+84900000099',
    email: 'ceo@ak.local',
    fullName: 'Trần Minh Quốc',
    role: UserRole.system_admin,
    employeeCode: 'CEO-001',
    baseSalary: 80_000_000,
    note: 'CEO — full system access, sees executive dashboard',
  },

  // ===== SYSADMIN (technical admin — separate from CEO) =====
  {
    phone: '+84900000050',
    email: 'sysadmin@ak.local',
    fullName: 'Ngô Hệ Thống (Sysadmin)',
    role: UserRole.system_admin,
    employeeCode: 'SYS-001',
    baseSalary: 35_000_000,
    note: 'Sysadmin — quản lý users + roles + permissions + cấu hình hệ thống',
  },

  // ===== BO =====
  {
    phone: '+84900000098',
    email: 'ops@ak.local',
    fullName: 'Lê Hà Operations',
    role: UserRole.bo_admin,
    employeeCode: 'BO-001',
    baseSalary: 35_000_000,
    note: 'Operations Director — full payroll + operations access',
  },
  {
    phone: '+84900000097',
    email: 'bo-senior@ak.local',
    fullName: 'Phạm Linh Senior',
    role: UserRole.bo_admin,
    employeeCode: 'BO-002',
    baseSalary: 22_000_000,
    note: 'Senior BO — payroll approval',
  },
  {
    phone: '+84900000096',
    email: 'bo-junior@ak.local',
    fullName: 'Nguyễn Trang Junior',
    role: UserRole.bo_admin,
    employeeCode: 'BO-003',
    baseSalary: 15_000_000,
    note: 'Junior BO — daily attendance ops',
  },

  // ===== SUPERVISORS (3 flagship projects) =====
  {
    phone: '+84900000090',
    email: 'sup-vincom@ak.local',
    fullName: 'Hoàng Văn Đội Trưởng',
    role: UserRole.supervisor,
    employeeCode: 'SUP-VC',
    baseSalary: 18_000_000,
    projectCode: 'PRJ001', // Vincom Đồng Khởi
    note: 'Supervisor Vincom Đồng Khởi — flagship retail client',
  },
  {
    phone: '+84900000091',
    email: 'sup-bitexco@ak.local',
    fullName: 'Đặng Văn Bitexco',
    role: UserRole.supervisor,
    employeeCode: 'SUP-BTC',
    baseSalary: 18_000_000,
    projectCode: 'PRJ004', // Bitexco Financial Tower
    note: 'Supervisor Bitexco Financial Tower — premium office client',
  },
  {
    phone: '+84900000092',
    email: 'sup-fv@ak.local',
    fullName: 'Vũ Thị Hospital',
    role: UserRole.supervisor,
    employeeCode: 'SUP-FV',
    baseSalary: 18_000_000,
    projectCode: 'PRJ007', // Bệnh viện FV
    note: 'Supervisor Bệnh viện FV — healthcare client (strict hygiene)',
  },

  // ===== DEMO EMPLOYEES (mobile app showcase) =====
  {
    phone: '+84900000101',
    fullName: 'Trần Thị Mai (Demo NV)',
    role: UserRole.employee,
    employeeCode: 'NV-DEMO-01',
    baseSalary: 8_500_000,
    note: 'Demo NV #1 — typically assigned to PRJ001 (Vincom)',
  },
  {
    phone: '+84900000102',
    fullName: 'Lê Văn Hùng (Demo NV)',
    role: UserRole.employee,
    employeeCode: 'NV-DEMO-02',
    baseSalary: 9_000_000,
    note: 'Demo NV #2 — typically assigned to PRJ004 (Bitexco)',
  },
  {
    phone: '+84900000103',
    fullName: 'Phạm Thị Lan (Demo NV)',
    role: UserRole.employee,
    employeeCode: 'NV-DEMO-03',
    baseSalary: 8_500_000,
    note: 'Demo NV #3 — typically assigned to PRJ007 (FV Hospital)',
  },
  {
    phone: '+84900000104',
    fullName: 'Nguyễn Văn Nam (Demo NV)',
    role: UserRole.employee,
    employeeCode: 'NV-DEMO-04',
    baseSalary: 9_500_000,
    note: 'Demo NV #4 — high-seniority demo',
  },
  {
    phone: '+84900000105',
    fullName: 'Hoàng Thị Oanh (Demo NV)',
    role: UserRole.employee,
    employeeCode: 'NV-DEMO-05',
    baseSalary: 8_000_000,
    note: 'Demo NV #5 — new hire demo',
  },
]

async function createDemoAccounts() {
  console.log('Creating demo accounts...\n')
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const membershipAdmin = await prisma.user.findFirst({
    where: { tenantId: AK_TENANT_ID, role: UserRole.system_admin, status: 'active' },
    orderBy: { createdAt: 'asc' },
  })
  if (!membershipAdmin) throw new Error('Seeded system admin required before demo project memberships')

  for (const acc of DEMO_ACCOUNTS) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { phone: acc.phone },
      update: {
        email: acc.email ?? undefined,
        role: acc.role,
      },
      create: {
        tenantId: AK_TENANT_ID,
        phone: acc.phone,
        email: acc.email ?? null,
        passwordHash,
        role: acc.role,
      },
    })

    // Upsert employee (link to user)
    const employee = await prisma.employee.upsert({
      where: { tenantId_employeeCode: { tenantId: AK_TENANT_ID, employeeCode: acc.employeeCode } },
      update: {
        fullName: acc.fullName,
        baseSalary: acc.baseSalary.toString(),
      },
      create: {
        tenantId: AK_TENANT_ID,
        userId: user.id,
        employeeCode: acc.employeeCode,
        fullName: acc.fullName,
        hireDate: new Date('2024-01-01'),
        baseSalary: acc.baseSalary.toString(),
        salaryType: SalaryType.monthly,
      },
    })

    // Demo supervisors receive explicit, idempotent project membership.
    if ('projectCode' in acc && acc.projectCode) {
      const project = await prisma.project.findUnique({
        where: { tenantId_code: { tenantId: AK_TENANT_ID, code: acc.projectCode } },
      })
      if (project) {
        await prisma.projectSupervisor.upsert({
          where: { projectId_userId: { projectId: project.id, userId: user.id } },
          update: { assignedById: membershipAdmin.id },
          create: {
            projectId: project.id,
            userId: user.id,
            assignedById: membershipAdmin.id,
          },
        })
        // Create a "supervisor on duty" assignment for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const morningShift = await prisma.shift.findFirst({
          where: { tenantId: AK_TENANT_ID, name: 'Ca sáng' },
        })
        if (morningShift) {
          const existingAssignment = await prisma.shiftAssignment.findFirst({
            where: { employeeId: employee.id, date: today, status: { not: 'cancelled' } },
          })
          if (!existingAssignment) {
            await prisma.shiftAssignment.create({ data: {
              employeeId: employee.id,
              projectId: project.id,
              shiftId: morningShift.id,
              date: today,
              assignedById: membershipAdmin.id,
              status: 'scheduled',
            } })
          }
        }
      }
    }

    const isSupervisor = acc.role === UserRole.supervisor
    const isExec = acc.role === UserRole.system_admin
    const isBo = acc.role === UserRole.bo_admin
    const roleLabel = isExec ? '👑 CEO/EXEC' : isBo ? '📋 BO' : isSupervisor ? '👷 GIÁM SÁT' : '📱 NHÂN VIÊN'

    console.log(`${roleLabel}  ${acc.email ?? acc.phone}`)
    console.log(`           Name: ${acc.fullName}`)
    console.log(`           Login: ${acc.email ?? acc.phone}`)
    console.log(`           Password: ${DEMO_PASSWORD}`)
    console.log(`           Role: ${acc.role}`)
    console.log(`           Note: ${acc.note}`)
    console.log('')
  }

  console.log('======================================')
  console.log(`✅ ${DEMO_ACCOUNTS.length} demo accounts created/updated`)
  console.log('======================================')
  console.log('')
  console.log('QUICK REFERENCE — LOGIN TO TEST EACH ROLE:')
  console.log('')
  console.log('   👑 CEO (executive dashboard):   ceo@ak.local           / Demo@2026')
  console.log('   📋 BO Director (full ops):       ops@ak.local           / Demo@2026')
  console.log('   📋 Senior BO:                    bo-senior@ak.local     / Demo@2026')
  console.log('   📋 Junior BO:                    bo-junior@ak.local     / Demo@2026')
  console.log('   👷 Supervisor Vincom:            sup-vincom@ak.local    / Demo@2026')
  console.log('   👷 Supervisor Bitexco:            sup-bitexco@ak.local    / Demo@2026')
  console.log('   👷 Supervisor Hospital:          sup-fv@ak.local        / Demo@2026')
  console.log('   📱 NV Demo #1 (mobile):          +84900000101          / Demo@2026')
  console.log('   📱 NV Demo #2 (mobile):          +84900000102          / Demo@2026')
  console.log('   📱 NV Demo #3 (mobile):          +84900000103          / Demo@2026')
  console.log('   📱 NV Demo #4 (mobile):          +84900000104          / Demo@2026')
  console.log('   📱 NV Demo #5 (mobile):          +84900000105          / Demo@2026')
  console.log('')
}

createDemoAccounts()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Demo accounts seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
