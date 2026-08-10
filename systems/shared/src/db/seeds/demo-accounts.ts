// Demo accounts seed — creates high-profile demo users for showcase + marketing.
// Run AFTER dev-seed with `ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:demo`.
//
// Creates:
//   - 1 CEO (Trần Minh CEO) — full read-only + executive dashboard
//   - 1 Operations Director (Lê Hà Ops Director) — BO admin
//   - 1 Senior BO (Phạm Linh Senior BO)
//   - 1 Junior BO (Nguyễn Trang Junior BO)
//   - 3 Senior Supervisors (tên VN thật) — 1 cho mỗi dự án flagship
//   - 5 Demo Employees (NV-DEMO-01..05) — each receives an open UAT schedule
//     for every calendar date in the current Vietnam month.
//   - 3 Cat Lai field-test employees — scheduled at the dedicated UAT project
//     at 33 Phan Bá Vành for every calendar date in the current Vietnam month.
//
// All passwords are simple + memorable for showcase (NHƯNG KHÔNG dùng production).

import { PrismaClient, UserRole, SalaryType, ShiftAssignmentStatus } from '@prisma/client'
import { hashPassword } from '../../auth/password.js'

const prisma = new PrismaClient()
const AK_TENANT_ID = 'c0ffee00-0000-4000-8000-000000000001'

const DEMO_PASSWORD = 'Demo@2026' // Uniform password for ALL demo accounts
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000
const CAT_LAI_UAT_PROJECT = {
  code: 'UAT-CAT-LAI',
  name: 'UAT - 33 Phan Bá Vành',
  clientName: 'AKAIUNSAN UAT',
  address: '33 Phan Bá Vành, Phường Cát Lái, TP. Hồ Chí Minh',
  latitude: 10.7727537,
  longitude: 106.7572902,
  geofenceRadiusMeters: 250,
} as const

const DEMO_EMPLOYEE_SCHEDULES = [
  { employeeCode: 'NV-DEMO-01', projectCode: 'PRJ001', shiftName: 'Ca sáng' },
  { employeeCode: 'NV-DEMO-02', projectCode: 'PRJ004', shiftName: 'Ca chiều' },
  { employeeCode: 'NV-DEMO-03', projectCode: 'PRJ007', shiftName: 'Ca hành chính' },
  { employeeCode: 'NV-DEMO-04', projectCode: 'PRJ001', shiftName: 'Ca tối' },
  { employeeCode: 'NV-DEMO-05', projectCode: 'PRJ004', shiftName: 'Ca sáng' },
  { employeeCode: 'NV-UAT-CL-01', projectCode: CAT_LAI_UAT_PROJECT.code, shiftName: 'Ca sáng' },
  { employeeCode: 'NV-UAT-CL-02', projectCode: CAT_LAI_UAT_PROJECT.code, shiftName: 'Ca chiều' },
  { employeeCode: 'NV-UAT-CL-03', projectCode: CAT_LAI_UAT_PROJECT.code, shiftName: 'Ca hành chính' },
] as const

function assertDemoSeedAllowed(): void {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing demo seed: set ALLOW_DEMO_SEED=true only for disposable development or controlled-UAT data')
  }
}

function currentVietnamDateOnly(): Date {
  const vietnamNow = new Date(Date.now() + VIETNAM_UTC_OFFSET_MS)
  return new Date(Date.UTC(
    vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), vietnamNow.getUTCDate(),
  ))
}

function currentVietnamMonthDates(): Date[] {
  const vietnamNow = currentVietnamDateOnly()
  const monthStart = new Date(Date.UTC(
    vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), 1,
  ))
  const nextMonthStart = new Date(Date.UTC(
    vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth() + 1, 1,
  ))
  const dates: Date[] = []
  const candidate = new Date(monthStart)
  while (candidate < nextMonthStart) {
    dates.push(new Date(candidate))
    candidate.setUTCDate(candidate.getUTCDate() + 1)
  }
  return dates
}

async function seedEmployeeUatSchedules(assignedById: string): Promise<number> {
  const dates = currentVietnamMonthDates()
  let created = 0

  for (const schedule of DEMO_EMPLOYEE_SCHEDULES) {
    const [employee, project, shift] = await Promise.all([
      prisma.employee.findUnique({
        where: {
          tenantId_employeeCode: {
            tenantId: AK_TENANT_ID,
            employeeCode: schedule.employeeCode,
          },
        },
      }),
      prisma.project.findUnique({
        where: {
          tenantId_code: {
            tenantId: AK_TENANT_ID,
            code: schedule.projectCode,
          },
        },
      }),
      prisma.shift.findFirst({
        where: {
          tenantId: AK_TENANT_ID,
          name: schedule.shiftName,
          isActive: true,
        },
      }),
    ])
    if (!employee || !project || !shift) {
      throw new Error(`Missing UAT schedule dependency for ${schedule.employeeCode}`)
    }

    for (const date of dates) {
      const existingAssignment = await prisma.shiftAssignment.findFirst({
        where: {
          employeeId: employee.id,
          date,
          status: { not: ShiftAssignmentStatus.cancelled },
        },
      })
      if (existingAssignment) continue

      await prisma.shiftAssignment.create({
        data: {
          employeeId: employee.id,
          projectId: project.id,
          shiftId: shift.id,
          date,
          assignedById,
          status: ShiftAssignmentStatus.scheduled,
        },
      })
      created += 1
    }
  }

  console.log(`Created ${created} missing open UAT assignments across all ${dates.length} dates in the current Vietnam month`)
  return created
}

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

  // ===== CÁT LÁI FIELD UAT (physical Android GPS/camera walkthrough) =====
  {
    phone: '+84900000201',
    fullName: 'Nguyễn Văn An (UAT Cát Lái)',
    role: UserRole.employee,
    employeeCode: 'NV-UAT-CL-01',
    baseSalary: 8_500_000,
    note: 'Physical Android UAT at 33 Phan Bá Vành — morning shift',
  },
  {
    phone: '+84900000202',
    fullName: 'Trần Thị Bình (UAT Cát Lái)',
    role: UserRole.employee,
    employeeCode: 'NV-UAT-CL-02',
    baseSalary: 8_500_000,
    note: 'Physical Android UAT at 33 Phan Bá Vành — afternoon shift',
  },
  {
    phone: '+84900000203',
    fullName: 'Lê Văn Cường (UAT Cát Lái)',
    role: UserRole.employee,
    employeeCode: 'NV-UAT-CL-03',
    baseSalary: 8_500_000,
    note: 'Physical Android UAT at 33 Phan Bá Vành — office shift',
  },
]

async function assertDemoIdentityReservations(): Promise<void> {
  const [existingUsers, existingEmployees] = await Promise.all([
    prisma.user.findMany({
      where: { phone: { in: DEMO_ACCOUNTS.map((account) => account.phone) } },
      select: {
        id: true,
        tenantId: true,
        phone: true,
        employee: { select: { tenantId: true, employeeCode: true, userId: true } },
      },
    }),
    prisma.employee.findMany({
      where: {
        tenantId: AK_TENANT_ID,
        employeeCode: { in: DEMO_ACCOUNTS.map((account) => account.employeeCode) },
      },
      select: { tenantId: true, employeeCode: true, userId: true },
    }),
  ])
  const usersByPhone = new Map(existingUsers.map((user) => [user.phone, user]))
  const employeesByCode = new Map(existingEmployees.map((employee) => [employee.employeeCode, employee]))

  for (const account of DEMO_ACCOUNTS) {
    const user = usersByPhone.get(account.phone)
    const employee = employeesByCode.get(account.employeeCode)
    if (!user && !employee) continue

    const identityMatches = user?.tenantId === AK_TENANT_ID
      && employee?.tenantId === AK_TENANT_ID
      && employee.userId === user.id
      && user.employee?.tenantId === AK_TENANT_ID
      && user.employee.employeeCode === account.employeeCode
      && user.employee.userId === user.id
    if (!identityMatches) {
      throw new Error(
        `Refusing demo seed: reserved identity collision for ${account.phone} / ${account.employeeCode}`,
      )
    }
  }
}

async function createDemoAccounts() {
  assertDemoSeedAllowed()
  console.log('Creating demo accounts...\n')
  await assertDemoIdentityReservations()
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const membershipAdmin = await prisma.user.findFirst({
    where: { tenantId: AK_TENANT_ID, role: UserRole.system_admin, status: 'active' },
    orderBy: { createdAt: 'asc' },
  })
  if (!membershipAdmin) throw new Error('Seeded system admin required before demo project memberships')

  const vietnamToday = currentVietnamDateOnly()
  const uatContractStartDate = new Date(Date.UTC(vietnamToday.getUTCFullYear(), 0, 1))
  const uatContractEndDate = new Date(Date.UTC(vietnamToday.getUTCFullYear(), 11, 31))

  await prisma.project.upsert({
    where: {
      tenantId_code: { tenantId: AK_TENANT_ID, code: CAT_LAI_UAT_PROJECT.code },
    },
    update: {
      name: CAT_LAI_UAT_PROJECT.name,
      clientName: CAT_LAI_UAT_PROJECT.clientName,
      address: CAT_LAI_UAT_PROJECT.address,
      latitude: CAT_LAI_UAT_PROJECT.latitude,
      longitude: CAT_LAI_UAT_PROJECT.longitude,
      geofenceRadiusMeters: CAT_LAI_UAT_PROJECT.geofenceRadiusMeters,
      contractStartDate: uatContractStartDate,
      contractEndDate: uatContractEndDate,
      status: 'active',
      deletedAt: null,
    },
    create: {
      tenantId: AK_TENANT_ID,
      ...CAT_LAI_UAT_PROJECT,
      contractStartDate: uatContractStartDate,
      contractEndDate: uatContractEndDate,
      status: 'active',
      reportTemplateConfig: {
        headerText: 'UAT CHẤM CÔNG - 33 PHAN BÁ VÀNH',
        footerText: 'Chỉ sử dụng cho kiểm thử có kiểm soát',
      },
    },
  })

  const identities = await prisma.$transaction(async (tx) => {
    const seeded = []
    for (const acc of DEMO_ACCOUNTS) {
      const user = await tx.user.upsert({
        where: { phone: acc.phone },
        update: {
          email: acc.email ?? undefined,
          // Controlled-UAT seed is intentionally authoritative for every demo
          // identity. Re-applying it must repair credentials left by an older
          // seed version instead of only refreshing employee passwords.
          passwordHash,
          role: acc.role,
          status: 'active',
        },
        create: {
          tenantId: AK_TENANT_ID,
          phone: acc.phone,
          email: acc.email ?? null,
          passwordHash,
          role: acc.role,
        },
      })
      const employee = await tx.employee.upsert({
        where: { tenantId_employeeCode: { tenantId: AK_TENANT_ID, employeeCode: acc.employeeCode } },
        update: {
          fullName: acc.fullName,
          baseSalary: acc.baseSalary.toString(),
          status: 'active',
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
      seeded.push({ user, employee })
    }
    return seeded
  }, { maxWait: 10_000, timeout: 30_000 })

  for (let index = 0; index < DEMO_ACCOUNTS.length; index += 1) {
    const acc = DEMO_ACCOUNTS[index]!
    const { user, employee } = identities[index]!

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
        const today = currentVietnamDateOnly()
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

  await seedEmployeeUatSchedules(membershipAdmin.id)

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
  console.log('   📍 UAT Cát Lái #1 (morning):     +84900000201          / Demo@2026')
  console.log('   📍 UAT Cát Lái #2 (afternoon):   +84900000202          / Demo@2026')
  console.log('   📍 UAT Cát Lái #3 (office):      +84900000203          / Demo@2026')
  console.log('')
}

createDemoAccounts()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Demo accounts seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
