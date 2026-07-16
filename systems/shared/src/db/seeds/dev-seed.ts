// Dev/pilot seed data — creates 1 tenant + 15 projects + ~30 admin users + 200 employees + shifts + sample payroll rules.
// Run: `pnpm db:seed` (from repo root, after migrations applied).

import {
  PrismaClient,
  UserRole,
  SalaryType,
  ShiftAssignmentStatus,
} from '@prisma/client'
import { hashPassword } from '../../auth/password.js'
import { isWeekend } from '../../engine-helpers.js'

const prisma = new PrismaClient()

// Realistic Vietnamese customer names + addresses (HCMC area)
const CUSTOMERS = [
  { name: 'Vincom Đồng Khởi', address: '72 Lê Thánh Tôn, Q1, HCMC', lat: 10.7719, lng: 106.7009 },
  { name: 'Vincom Thủ Đức', address: 'Võ Văn Ngân, Thủ Đức, HCMC', lat: 10.8495, lng: 106.7719 },
  { name: 'Saigon Centre', address: '65 Lê Lợi, Q1, HCMC', lat: 10.7720, lng: 106.7004 },
  { name: 'Bitexco Financial Tower', address: '2 Hải Triều, Q1, HCMC', lat: 10.7717, lng: 106.7044 },
  { name: 'Landmark 81', address: '720A Điện Biên Phủ, Bình Thạnh, HCMC', lat: 10.7944, lng: 106.7218 },
  { name: 'Đại học RMIT', address: '702 Nguyễn Văn Cừ, Q. Long Biên, HN', lat: 21.0402, lng: 105.8747 },
  { name: 'Bệnh viện FV', address: '6 Nguyễn Lương Bằng, Q7, HCMC', lat: 10.7306, lng: 106.7180 },
  { name: 'Lotte Mart Q7', address: '469 Nguyễn Hữu Thọ, Q7, HCMC', lat: 10.7390, lng: 106.7006 },
  { name: 'Satra Q6', address: '12 Bạch Đằng, Bình Thạnh, HCMC', lat: 10.8033, lng: 106.7100 },
  { name: 'Coopmart Cống Quỳnh', address: '189C Cống Quỳnh, Q1, HCMC', lat: 10.7678, lng: 106.6879 },
  { name: 'Maximark Q12', address: '475B Cộng Hòa, Q. Tân Bình, HCMC', lat: 10.7965, lng: 106.6427 },
  { name: 'Aeon Bình Tân', address: '1 đường 17A, Bình Tân, HCMC', lat: 10.7412, lng: 106.6031 },
  { name: 'SC VivoCity Q7', address: '1058 Nguyễn Văn Linh, Q7, HCMC', lat: 10.7298, lng: 106.7220 },
  { name: 'The Garden Q1', address: '108 Hồ Tùng Mậu, Q1, HCMC', lat: 10.7670, lng: 106.7005 },
  { name: 'Lotte Liên Hưng Q.BTân', address: 'Số 1 đường 3A, Q. Bình Tân, HCMC', lat: 10.7470, lng: 106.6156 },
]

const EMPLOYEE_FIRST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ',
  'Ngô', 'Dương', 'Lý',
]
const EMPLOYEE_MIDDLE_LAST = [
  'Văn An', 'Thị Bình', 'Hoàng Cương', 'Minh Châu', 'Thị Dung', 'Văn Em',
  'Thị Phương', 'Hoàng Giang', 'Văn Hùng', 'Thị Hà', 'Minh Khánh',
  'Văn Long', 'Thị Mai', 'Hoàng Nam', 'Văn Phong', 'Thị Quyên',
  'Văn Sơn', 'Thị Thảo', 'Hoàng Uy', 'Văn Vinh',
]

const SHIFTS = [
  { name: 'Ca sáng', startTime: '06:00', endTime: '14:00', isOvernight: false },
  { name: 'Ca chiều', startTime: '14:00', endTime: '22:00', isOvernight: false },
  { name: 'Ca tối', startTime: '22:00', endTime: '06:00', isOvernight: true },
  { name: 'Ca hành chính', startTime: '08:00', endTime: '17:00', isOvernight: false },
]

const NUM_EMPLOYEES = 200

export async function seedDevData(): Promise<{
  tenantId: string
  adminUserId: string
  projectCount: number
  employeeCount: number
}> {
  console.log('Seeding tenant AKAIUNSAN...')

  // === Tenant ===
  const tenant = await prisma.tenant.upsert({
    where: { id: 'ak-main-tenant' },
    update: {},
    create: {
      id: 'ak-main-tenant',
      name: 'AKAIUNSAN Cleaning Services',
    },
  })

  // === Admin users ===
  const adminPassword = await hashPassword('admin123!')
  const supervisorPassword = await hashPassword('super123!')

  const adminUser = await prisma.user.upsert({
    where: { phone: '+84900000001' },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '+84900000001',
      email: 'admin@ak.local',
      passwordHash: adminPassword,
      role: UserRole.system_admin,
    },
  })

  const boUser = await prisma.user.upsert({
    where: { phone: '+84900000002' },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '+84900000002',
      email: 'bo@ak.local',
      passwordHash: adminPassword,
      role: UserRole.bo_admin,
    },
  })

  const supervisors = []
  for (let i = 0; i < 5; i++) {
    const supervisor = await prisma.user.upsert({
      where: { phone: `+8490000001${i}` },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: `+8490000001${i}`,
        email: `supervisor${i}@ak.local`,
        passwordHash: supervisorPassword,
        role: UserRole.supervisor,
      },
    })
    supervisors.push(supervisor)
  }

  // === Shifts ===
  const shiftRecords = await Promise.all(
    SHIFTS.map((s) =>
      prisma.shift.upsert({
        where: { id: `ak-shift-${s.name}` },
        update: {},
        create: {
          id: `ak-shift-${s.name}`,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          breakMinutes: 60,
          lateThresholdMinutes: 15,
          isOvernight: s.isOvernight,
          color: s.name === 'Ca sáng' ? '#FFA500' : s.name === 'Ca chiều' ? '#4169E1' : s.name === 'Ca tối' ? '#2F4F4F' : '#90EE90',
        },
      })
    )
  )

  // === Projects (15) ===
  console.log(`Creating ${CUSTOMERS.length} projects...`)
  const projects = await Promise.all(
    CUSTOMERS.map((c, i) =>
      prisma.project.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: `PRJ${(i + 1).toString().padStart(3, '0')}` } },
        update: {},
        create: {
          tenantId: tenant.id,
          code: `PRJ${(i + 1).toString().padStart(3, '0')}`,
          name: c.name,
          clientName: c.name.split(' ')[0],
          address: c.address,
          latitude: c.lat,
          longitude: c.lng,
          geofenceRadiusMeters: 150,
          contractStartDate: new Date('2024-01-01'),
          contractEndDate: new Date('2027-12-31'),
          status: 'active',
          reportTemplateConfig: {
            headerText: `BÁO CÁO DỊCH VỤ VỆ SINH - ${c.name.toUpperCase()}`,
            footerText: 'Cảm ơn Quý khách đã sử dụng dịch vụ AKAIUNSAN',
          },
        },
      })
    )
  )

  // === Employees ===
  console.log(`Creating ${NUM_EMPLOYEES} employees...`)
  const employeePassword = await hashPassword('nv123456!')
  const employees = []

  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    const phone = `+8493${(1000000 + i).toString().slice(0, 7)}`
    const phoneValid = phone.slice(0, 3) + phone.slice(3) // already correct format
    const firstName = EMPLOYEE_FIRST_NAMES[i % EMPLOYEE_FIRST_NAMES.length]!
    const lastName = EMPLOYEE_MIDDLE_LAST[i % EMPLOYEE_MIDDLE_LAST.length]!
    const fullName = `${firstName} ${lastName} ${i.toString().padStart(3, '0')}`
    const user = await prisma.user.upsert({
      where: { phone: phoneValid },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: phoneValid,
        passwordHash: employeePassword,
        role: UserRole.employee,
      },
    })
    const monthlySalary = 7_000_000 + (i % 5) * 500_000 // 7M - 9M
    const employee = await prisma.employee.upsert({
      where: { tenantId_employeeCode: { tenantId: tenant.id, employeeCode: `NV${(i + 1).toString().padStart(4, '0')}` } },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: user.id,
        employeeCode: `NV${(i + 1).toString().padStart(4, '0')}`,
        fullName,
        hireDate: new Date(2024, Math.floor(i / 30) % 12, (i % 28) + 1),
        baseSalary: monthlySalary,
        salaryType: SalaryType.monthly,
        status: 'active',
      },
    })
    employees.push(employee)
  }

  // === Shift Assignments (last 30 days for current month) ===
  console.log('Generating shift assignments for last 30 days...')
  const today = new Date()
  let assignmentCount = 0
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)

    // Skip Sundays (per default working days = Mon-Sat)
    if (isWeekend(date)) continue

    // Assign each employee a rotation across the 15 projects
    for (let empIdx = 0; empIdx < employees.length; empIdx++) {
      const employee = employees[empIdx]!
      const project = projects[(empIdx + dayOffset) % projects.length]!
      const shift = shiftRecords[empIdx % 2]! // alternate morning/afternoon

      await prisma.shiftAssignment.upsert({
        where: {
          employeeId_projectId_shiftId_date: {
            employeeId: employee.id,
            projectId: project.id,
            shiftId: shift.id,
            date,
          },
        },
        update: {},
        create: {
          employeeId: employee.id,
          projectId: project.id,
          shiftId: shift.id,
          date,
          status: ShiftAssignmentStatus.scheduled,
          assignedById: boUser.id,
        },
      })
      assignmentCount++
    }
  }
  console.log(`  Created ${assignmentCount} shift assignments`)

  // === Default Payroll Rules ===
  console.log('Creating default payroll rules...')
  await prisma.payrollRule.create({
    data: {
      tenantId: tenant.id,
      effectiveFrom: new Date('2024-01-01'),
      otWeekdayMultiplier: 1.5,
      otWeekendMultiplier: 2.0,
      otHolidayMultiplier: 3.0,
      mealAllowancePerDay: 30000,
      phoneAllowance: 200000,
      roundingMinutes: 15,
      workingHoursPerDay: 8,
      standardWorkingDaysPerMonth: 26,
      updatedBy: adminUser.id,
    },
  })

  console.log('✅ Seed complete!')
  console.log('')
  console.log('Login credentials:')
  console.log(`  System admin: admin@ak.local / admin123!`)
  console.log(`  BO admin:     bo@ak.local / admin123!`)
  console.log(`  Supervisor:   supervisor0@ak.local / super123! (id: 0..4)`)
  console.log(`  Employee:     NV0001 / nv123456! (try +84931000000..200)`)

  return {
    tenantId: tenant.id,
    adminUserId: adminUser.id,
    projectCount: projects.length,
    employeeCount: employees.length,
  }
}

seedDevData()
  .then((result) => {
    console.log('Result:', JSON.stringify(result, null, 2))
    return prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
