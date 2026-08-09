import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { issueAccessToken, prisma } from '@ak/shared'
import { skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Internal attendance projection (integration)', () => {
  it('uses assignment work dates for null and overnight timestamps and enforces tenant scope', async () => {
    const suffix = randomUUID().slice(0, 8)
    const tenantA = await prisma.tenant.create({ data: { name: `Internal A ${suffix}` } })
    const tenantB = await prisma.tenant.create({ data: { name: `Internal B ${suffix}` } })
    const user = await prisma.user.create({
      data: { tenantId: tenantA.id, phone: `+8477${String(Date.now()).slice(-7)}`, role: 'system_admin' },
    })
    const employee = await prisma.employee.create({
      data: {
        tenantId: tenantA.id, userId: user.id, employeeCode: `INT-${suffix}`,
        fullName: 'Internal Projection', hireDate: new Date('2026-01-01'),
        baseSalary: '10000000', salaryType: 'monthly',
      },
    })
    const project = await prisma.project.create({
      data: {
        tenantId: tenantA.id, code: `INT-${suffix}`, name: 'Internal Projection',
        clientName: 'Test', address: 'HCMC', latitude: 10.77, longitude: 106.70,
        contractStartDate: new Date('2026-01-01'),
      },
    })
    const shift = await prisma.shift.create({
      data: {
        tenantId: tenantA.id,
        name: `Internal ${suffix}`,
        startTime: '22:00',
        endTime: '06:00',
        isOvernight: true,
      },
    })
    const assignments = await Promise.all(['2026-07-12', '2026-07-31'].map((date) => (
      prisma.shiftAssignment.create({
        data: {
          employeeId: employee.id, projectId: project.id, shiftId: shift.id,
          date: new Date(`${date}T00:00:00.000Z`), assignedById: user.id,
        },
      })
    )))
    await prisma.attendanceRecord.createMany({
      data: [
        {
          shiftAssignmentId: assignments[0]!.id, employeeId: employee.id,
          projectId: project.id, status: 'holiday', totalMinutesWorked: 0,
        },
        {
          shiftAssignmentId: assignments[1]!.id, employeeId: employee.id,
          projectId: project.id, status: 'present',
          checkInAt: new Date('2026-07-31T18:00:00.000Z'),
          checkOutAt: new Date('2026-08-01T02:00:00.000Z'), totalMinutesWorked: 480,
        },
      ],
    })
    const { buildServer } = await import('../../src/server.js')
    const { app } = await buildServer()
    const headers = { 'x-internal-api-key': process.env.INTERNAL_API_KEY! }
    try {
      const permission = await prisma.permission.upsert({
        where: { code: 'attendance.view_all' },
        update: {},
        create: { code: 'attendance.view_all', module: 'attendance', action: 'view_all' },
      })
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: 'system_admin', permissionId: permission.id } },
        update: {},
        create: { role: 'system_admin', permissionId: permission.id },
      })
      const scoped = await app.inject({
        method: 'GET', headers,
        url: `/internal/attendance?tenantId=${tenantA.id}&employeeId=${employee.id}&from=2026-07-01&to=2026-07-31`,
      })
      expect(scoped.statusCode).toBe(200)
      expect(scoped.json().data.map((record: { workDate: string }) => record.workDate))
        .toEqual(['2026-07-12', '2026-07-31'])
      expect(scoped.json().data[0]).toMatchObject({ checkInAt: null, status: 'holiday' })

      const authorization = `Bearer ${issueAccessToken({
        userId: user.id, tenantId: tenantA.id, role: user.role,
      }).token}`
      const publicScoped = await app.inject({
        method: 'GET', headers: { authorization },
        url: '/v1/attendance/records?from=2026-07-01&to=2026-07-31',
      })
      expect(publicScoped.statusCode).toBe(200)
      expect(publicScoped.json().data).toHaveLength(2)
      expect(publicScoped.json().data.find((record: { status: string }) => record.status === 'holiday'))
        .toMatchObject({ checkInAt: null })

      const crossTenant = await app.inject({
        method: 'GET', headers,
        url: `/internal/attendance?tenantId=${tenantB.id}&employeeId=${employee.id}&from=2026-07-01&to=2026-07-31`,
      })
      expect(crossTenant.statusCode).toBe(200)
      expect(crossTenant.json().data).toEqual([])
    } finally {
      await app.close()
      await prisma.attendanceRecord.deleteMany({ where: { employeeId: employee.id } })
      await prisma.shiftAssignment.deleteMany({ where: { employeeId: employee.id } })
      await prisma.employee.delete({ where: { id: employee.id } })
      await prisma.project.delete({ where: { id: project.id } })
      await prisma.user.delete({ where: { id: user.id } })
      await prisma.shift.delete({ where: { id: shift.id } })
      await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } })
      await prisma.$disconnect()
    }
  })
})
