import { randomUUID } from 'node:crypto'
import {
  deleteObject,
  ensureBuckets,
  issueAccessToken,
  MINIO_BUCKET_NAMES,
  prisma,
  type UserRole,
} from '@ak/shared'

export const skipIntegration = process.env.RUN_INTEGRATION !== 'true'

export async function createScopeFixture() {
  const suffix = randomUUID().slice(0, 8)
  const tenantA = await prisma.tenant.create({ data: { name: `Scope A ${suffix}` } })
  const tenantB = await prisma.tenant.create({ data: { name: `Scope B ${suffix}` } })
  const admin = await prisma.user.create({
    data: { tenantId: tenantA.id, phone: phone('8'), role: 'system_admin' },
  })
  const createUserEmployee = async (tenantId: string, role: 'employee' | 'supervisor', code: string) => {
    const user = await prisma.user.create({ data: { tenantId, phone: phone('9'), role } })
    const employee = await prisma.employee.create({
      data: {
        tenantId,
        userId: user.id,
        employeeCode: `${code}-${suffix}`,
        fullName: code,
        hireDate: new Date('2026-01-01'),
        baseSalary: '10000000',
        salaryType: 'monthly',
        bankAccount: 'SECRET-BANK',
        idNumber: 'SECRET-ID',
      },
    })
    return { user, employee }
  }
  const supervisor = await createUserEmployee(tenantA.id, 'supervisor', 'SUP')
  const teamMember = await createUserEmployee(tenantA.id, 'employee', 'TEAM')
  const mobileMember = await createUserEmployee(tenantA.id, 'employee', 'MOBILE')
  const outsider = await createUserEmployee(tenantA.id, 'employee', 'OUT')
  const foreign = await createUserEmployee(tenantB.id, 'employee', 'FOREIGN')
  const shift = await prisma.shift.create({
    data: {
      name: `Security Shift ${suffix}`,
      startTime: '00:00',
      endTime: '23:59',
      breakMinutes: 0,
      lateThresholdMinutes: 1_440,
    },
  })
  const createProject = (tenantId: string, code: string) => prisma.project.create({
    data: {
      tenantId,
      code: `${code}-${suffix}`,
      name: code,
      clientName: 'Client',
      address: 'Test address',
      latitude: 10.7720,
      longitude: 106.7009,
      geofenceRadiusMeters: 100,
      contractStartDate: new Date('2026-01-01'),
    },
  })
  const teamProject = await createProject(tenantA.id, 'TEAM')
  const outsideProject = await createProject(tenantA.id, 'OUTSIDE')
  const foreignProject = await createProject(tenantB.id, 'FOREIGN')
  await prisma.projectSupervisor.create({
    data: { projectId: teamProject.id, userId: supervisor.user.id, assignedById: admin.id },
  })
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const assignmentDate = new Date(`${dateKey}T00:00:00.000Z`)
  const createAssignment = (employeeId: string, projectId: string, assignedById: string) => (
    prisma.shiftAssignment.create({
      data: { employeeId, projectId, shiftId: shift.id, date: assignmentDate, assignedById },
    })
  )
  await createAssignment(supervisor.employee.id, teamProject.id, supervisor.user.id)
  await createAssignment(supervisor.employee.id, outsideProject.id, supervisor.user.id)
  const teamAssignment = await createAssignment(teamMember.employee.id, teamProject.id, supervisor.user.id)
  const mobileAssignment = await createAssignment(mobileMember.employee.id, teamProject.id, supervisor.user.id)
  const outsideAssignment = await createAssignment(outsider.employee.id, outsideProject.id, supervisor.user.id)
  const foreignAssignment = await createAssignment(foreign.employee.id, foreignProject.id, foreign.user.id)
  const createRecord = (a: { id: string; employeeId: string; projectId: string }) => (
    prisma.attendanceRecord.create({
      data: {
        shiftAssignmentId: a.id,
        employeeId: a.employeeId,
        projectId: a.projectId,
        checkInAt: new Date(),
        status: 'present',
      },
    })
  )
  const teamRecord = await createRecord(teamAssignment)
  const outsideRecord = await createRecord(outsideAssignment)
  const foreignRecord = await createRecord(foreignAssignment)
  await grantPermissions([
    ['attendance.override', 'attendance', 'override', ['supervisor']],
    ['attendance.view_all', 'attendance', 'view', ['supervisor']],
    ['employees.view', 'employees', 'view', ['supervisor']],
    ['employees.create', 'employees', 'create', ['system_admin']],
    ['employees.update', 'employees', 'update', ['system_admin']],
    ['projects.view', 'projects', 'view', ['supervisor', 'system_admin']],
    ['projects.create', 'projects', 'create', ['system_admin']],
    ['projects.update', 'projects', 'update', ['system_admin']],
    ['reports.view', 'reports', 'view', ['supervisor']],
    ['reports.generate', 'reports', 'generate', ['supervisor']],
    ['attendance.shifts.manage', 'attendance', 'manage', ['supervisor']],
    ['attendance.view_self', 'attendance', 'view', ['employee']],
  ])
  await ensureBuckets()
  const { buildServer } = await import('../../src/server.js')
  const { app } = await buildServer()
  const supervisorToken = issueAccessToken({
    userId: supervisor.user.id, tenantId: tenantA.id, role: 'supervisor',
  }).token
  const adminToken = issueAccessToken({
    userId: admin.id, tenantId: tenantA.id, role: 'system_admin',
  }).token
  const mobileToken = issueAccessToken({
    userId: mobileMember.user.id, tenantId: tenantA.id, role: 'employee',
  }).token
  const photoKeys: string[] = []
  const reportKeys: string[] = []
  const cleanup = async () => {
    await app.close()
    for (const key of photoKeys) await deleteObject(MINIO_BUCKET_NAMES[0], key).catch(() => undefined)
    for (const key of reportKeys) await deleteObject(MINIO_BUCKET_NAMES[1], key).catch(() => undefined)
    await prisma.customerReport.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } })
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } })
    await prisma.attendanceRecord.deleteMany({ where: { projectId: { in: projectIds() } } })
    await prisma.shiftAssignment.deleteMany({ where: { projectId: { in: projectIds() } } })
    await prisma.project.deleteMany({ where: { id: { in: projectIds() } } })
    await prisma.employee.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } })
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } })
    await prisma.shift.delete({ where: { id: shift.id } })
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } })
    await prisma.$disconnect()
  }
  const projectIds = () => [teamProject.id, outsideProject.id, foreignProject.id]
  return {
    app, tenantA, tenantB, admin, supervisor, teamMember, mobileMember, outsider,
    shift, teamProject, outsideProject, foreignProject, assignmentDate, dateKey,
    teamRecord, outsideRecord, foreignRecord, mobileAssignment,
    supervisorToken, adminToken, mobileToken, photoKeys, reportKeys, cleanup,
  }
}

function phone(prefix: string): string {
  return `+84${prefix}${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`
}

type PermissionSeed = [string, string, string, UserRole[]]
async function grantPermissions(items: PermissionSeed[]): Promise<void> {
  await prisma.permission.createMany({
    data: items.map(([code, module, action]) => ({ code, module, action })),
    skipDuplicates: true,
  })
  const permissions = await prisma.permission.findMany({
    where: { code: { in: items.map(([code]) => code) } },
    select: { id: true, code: true },
  })
  const permissionIds = new Map(permissions.map(({ code, id }) => [code, id]))
  await prisma.rolePermission.createMany({
    data: items.flatMap(([code, , , roles]) => {
      const permissionId = permissionIds.get(code)
      if (!permissionId) throw new Error(`Missing permission after seed: ${code}`)
      return roles.map((role) => ({ role, permissionId }))
    }),
    skipDuplicates: true,
  })
}
