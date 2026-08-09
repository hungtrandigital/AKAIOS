import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { issueAccessToken, prisma } from '@ak/shared'
import { calculatePayroll } from '../../src/services/payroll-service.js'
const skipIntegration = process.env.RUN_INTEGRATION !== 'true'
describe.skipIf(skipIntegration)('Payroll flow (PostgreSQL integration)', () => {
  it('rolls back failures, recalculates explicit overrides, enforces CAS, and locks', { timeout: 60_000 }, async () => {
    const suffix = randomUUID().slice(0, 8)
    const tenant = await prisma.tenant.create({ data: { name: `Payroll ${suffix}` } })
    const actor = await prisma.user.create({
      data: {
        tenantId: tenant.id, phone: `+8488${String(Date.now()).slice(-7)}`,
        email: `payroll-${suffix}@ak.local`, role: 'system_admin',
      },
    })
    const employeeUser = await prisma.user.create({
      data: { tenantId: tenant.id, phone: `+8489${String(Date.now()).slice(-7)}`, role: 'employee' },
    })
    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id, userId: employeeUser.id, employeeCode: `PAY-${suffix}`,
        fullName: 'Payroll Integration Employee', hireDate: new Date('2026-01-01'),
        baseSalary: '10000000', salaryType: 'monthly',
      },
    })
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id, code: `PAY-${suffix}`, name: 'Payroll Integration',
        clientName: 'Test', address: 'HCMC', latitude: 10.77, longitude: 106.70,
        contractStartDate: new Date('2026-01-01'),
      },
    })
    const shift = await prisma.shift.create({
      data: { tenantId: tenant.id, name: `Payroll ${suffix}`, startTime: '08:00', endTime: '17:00' },
    })
    let closeApp: (() => Promise<void>) | undefined
    let closeAttendanceApp: (() => Promise<void>) | undefined
    const addAttendance = async (day: number) => {
      const dateKey = `2026-07-${String(day).padStart(2, '0')}`
      const assignment = await prisma.shiftAssignment.create({
        data: {
          employeeId: employee.id,
          projectId: project.id,
          shiftId: shift.id,
          date: new Date(`${dateKey}T00:00:00.000Z`),
          assignedById: actor.id,
        },
      })
      await prisma.attendanceRecord.create({
        data: {
          shiftAssignmentId: assignment.id,
          employeeId: employee.id,
          projectId: project.id,
          checkInAt: new Date(`${dateKey}T01:00:00.000Z`),
          checkOutAt: new Date(`${dateKey}T09:00:00.000Z`),
          status: 'present',
          totalMinutesWorked: 480,
        },
      })
    }
    try {
      const { buildServer: buildAttendanceServer } = await import('../../../../attendance/backend/src/server.js')
      const { app: attendanceApp } = await buildAttendanceServer()
      process.env.ATTENDANCE_API_URL = await attendanceApp.listen({ port: 0, host: '127.0.0.1' })
      closeAttendanceApp = () => attendanceApp.close()
      await addAttendance(1)
      await prisma.payrollRule.create({
        data: {
          tenantId: tenant.id,
          effectiveFrom: new Date('2026-01-01'),
          otWeekdayMultiplier: 1.5,
          otWeekendMultiplier: 2,
          otHolidayMultiplier: 3,
          mealAllowancePerDay: 30000,
          updatedBy: actor.id,
        },
      })
      const period = await prisma.payrollPeriod.create({
        data: { tenantId: tenant.id, year: 2026, month: 7, openedById: actor.id },
      })
      await expect(calculatePayroll(period.id, tenant.id, {
        userId: randomUUID(), role: 'system_admin',
      })).rejects.toMatchObject({ code: 'P2003' })
      expect((await prisma.payrollPeriod.findUnique({ where: { id: period.id } }))?.status).toBe('open')
      expect(await prisma.payrollLine.count({ where: { payrollPeriodId: period.id } })).toBe(0)
      await calculatePayroll(period.id, tenant.id, { userId: actor.id, role: actor.role })
      let line = await prisma.payrollLine.findFirstOrThrow({ where: { payrollPeriodId: period.id } })
      expect(line.allowances.toString()).toBe('30000')
      for (const code of ['payroll.override', 'payroll.approve', 'payroll.lock', 'payroll.export']) {
        const permission = await prisma.permission.upsert({
          where: { code },
          update: {},
          create: { code, module: 'payroll', action: code.split('.').at(-1)! },
        })
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role: actor.role, permissionId: permission.id } },
          update: {},
          create: { role: actor.role, permissionId: permission.id },
        })
      }
      const { buildServer } = await import('../../src/server.js')
      const { app } = await buildServer()
      closeApp = () => app.close()
      const authorization = `Bearer ${issueAccessToken({ userId: actor.id, tenantId: tenant.id, role: actor.role }).token}`
      const overrideUrl = `/v1/payroll/lines/${line.id}/override`
      const concurrentOverrides = await Promise.all([
        app.inject({
          method: 'POST', url: overrideUrl, headers: { authorization },
          payload: { reason: 'explicit zero allowance', allowances: '0' },
        }),
        app.inject({
          method: 'POST', url: overrideUrl, headers: { authorization },
          payload: { reason: 'concurrent advance update', advance: '100' },
        }),
      ])
      expect(concurrentOverrides.map((response) => response.statusCode)).toEqual([200, 200])
      line = await prisma.payrollLine.findUniqueOrThrow({ where: { id: line.id } })
      expect(line.allowancesOverridden).toBe(true)
      expect(line.allowances.toString()).toBe('0')
      expect(line.advance.toString()).toBe('100')
      const overridePeriod = await prisma.payrollPeriod.findUniqueOrThrow({ where: { id: period.id } })
      expect(overridePeriod.totalGross?.toString()).toBe(line.gross.toString())
      expect(overridePeriod.totalNet?.toString()).toBe(line.net.toString())
      await addAttendance(2)
      await prisma.attendanceRecord.update({
        where: { shiftAssignmentId: (await prisma.shiftAssignment.findFirstOrThrow({
          where: { employeeId: employee.id, date: new Date('2026-07-02') },
        })).id },
        data: { status: 'half_day', totalMinutesWorked: 240 },
      })
      await calculatePayroll(period.id, tenant.id, { userId: actor.id, role: actor.role })
      line = await prisma.payrollLine.findFirstOrThrow({ where: { payrollPeriodId: period.id } })
      expect(line.workdayUnits.toString()).toBe('1.5')
      expect(line.allowances.toString()).toBe('0')
      const cleared = await app.inject({
        method: 'POST',
        url: `/v1/payroll/lines/${line.id}/override`,
        headers: { authorization },
        payload: { reason: 'clear allowance override', clearAllowancesOverride: true },
      })
      expect(cleared.statusCode, cleared.body).toBe(200)
      line = await prisma.payrollLine.findUniqueOrThrow({ where: { id: line.id } })
      expect(line.allowancesOverridden).toBe(false)
      expect(line.allowances.toString()).toBe('45000')
      await addAttendance(3)
      await calculatePayroll(period.id, tenant.id, { userId: actor.id, role: actor.role })
      line = await prisma.payrollLine.findFirstOrThrow({ where: { id: line.id } })
      expect(line.allowances.toString()).toBe('75000')
      const finalized = await prisma.payrollPeriod.findUniqueOrThrow({ where: { id: period.id } })
      expect(finalized.totalGross?.toString()).toBe(line.gross.toString())
      expect(finalized.totalNet?.toString()).toBe(line.net.toString())
      const overrideAudit = await prisma.auditLog.findFirstOrThrow({
        where: { entityId: line.id, action: 'override_payroll_line' },
        orderBy: { occurredAt: 'desc' },
      })
      expect(overrideAudit.newValue).toMatchObject({ allowancesOverridden: false })
      const concurrent = await prisma.payrollPeriod.create({
        data: { tenantId: tenant.id, year: 2026, month: 8, openedById: actor.id },
      })
      const results = await Promise.allSettled([
        calculatePayroll(concurrent.id, tenant.id, { userId: actor.id, role: actor.role }),
        calculatePayroll(concurrent.id, tenant.id, { userId: actor.id, role: actor.role }),
      ])
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
      const otherTenantAuthorization = `Bearer ${issueAccessToken({
        userId: actor.id, tenantId: randomUUID(), role: actor.role,
      }).token}`
      const crossTenant = await app.inject({
        method: 'POST',
        url: `/v1/payroll/periods/${period.id}/approve`,
        headers: { authorization: otherTenantAuthorization },
      })
      expect(crossTenant.statusCode).toBe(404)
      const crossTenantExport = await app.inject({
        method: 'GET', url: `/v1/payroll/periods/${period.id}/export`,
        headers: { authorization: otherTenantAuthorization },
      })
      expect(crossTenantExport.statusCode).toBe(404)
      const illegalPaid = await app.inject({
        method: 'POST', url: `/v1/payroll/periods/${period.id}/mark-paid`, headers: { authorization },
      })
      expect(illegalPaid.statusCode).toBe(422)
      for (const action of ['approve', 'mark-paid', 'lock']) {
        const response = await app.inject({
          method: 'POST', url: `/v1/payroll/periods/${period.id}/${action}`, headers: { authorization },
        })
        expect(response.statusCode, response.body).toBe(200)
      }
      expect((await prisma.payrollPeriod.findUnique({ where: { id: period.id } }))?.status).toBe('locked')
    } finally {
      if (closeApp) await closeApp()
      if (closeAttendanceApp) await closeAttendanceApp()
      await prisma.auditLog.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.payrollPeriod.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.attendanceRecord.deleteMany({ where: { projectId: project.id } })
      await prisma.shiftAssignment.deleteMany({ where: { projectId: project.id } })
      await prisma.employee.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.payrollRule.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.project.delete({ where: { id: project.id } })
      await prisma.user.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.shift.delete({ where: { id: shift.id } })
      await prisma.tenant.delete({ where: { id: tenant.id } })
      await prisma.$disconnect()
    }
  })
})
