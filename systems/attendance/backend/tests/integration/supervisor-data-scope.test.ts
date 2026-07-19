import { describe, expect, it } from 'vitest'
import { prisma } from '@ak/shared'
import { createScopeFixture, skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Supervisor data scope (integration)', () => {
  it('returns safe team DTOs and only authorized customer reports', { timeout: 60_000 }, async () => {
    const f = await createScopeFixture()
    const headers = { authorization: `Bearer ${f.supervisorToken}` }
    try {
      const employeeList = await f.app.inject({ method: 'GET', url: '/v1/employees', headers })
      expect(employeeList.statusCode).toBe(200)
      const employees = employeeList.json().data as Array<Record<string, unknown>>
      expect(employees.some((employee) => employee.id === f.outsider.employee.id)).toBe(false)
      expect(employees.some((employee) => employee.id === f.teamMember.employee.id)).toBe(true)
      expect(employees.every((employee) => !('baseSalary' in employee)
        && !('bankAccount' in employee) && !('idNumber' in employee))).toBe(true)
      expect(employees.every((employee) => {
        const user = employee.user as Record<string, unknown>
        return !('passwordHash' in user)
      })).toBe(true)

      const records = await f.app.inject({ method: 'GET', url: '/v1/attendance/records', headers })
      expect(records.statusCode).toBe(200)
      const recordEmployees = (records.json().data as Array<{
        shiftAssignment: { employee: Record<string, unknown> }
      }>).map((record) => record.shiftAssignment.employee)
      expect(recordEmployees.every((employee) => !('baseSalary' in employee)
        && !('bankAccount' in employee) && !('idNumber' in employee))).toBe(true)

      expect((await f.app.inject({
        method: 'GET', url: '/v1/projects?status=not-a-status', headers,
      })).statusCode).toBe(400)
      expect((await f.app.inject({
        method: 'GET', url: '/v1/shifts/assignments?from=2026-03-02&to=2026-03-01', headers,
      })).statusCode).toBe(400)
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers,
        payload: {
          employeeId: f.teamMember.employee.id, projectId: f.teamProject.id,
          shiftId: f.shift.id, date: '2026-02-31',
        },
      })).statusCode).toBe(400)
      for (const payload of [
        { projectId: f.teamProject.id, from: '2026-02-31', to: '2026-03-01', format: 'csv' },
        { projectId: f.teamProject.id, from: '2026-03-02', to: '2026-03-01', format: 'csv' },
      ]) {
        expect((await f.app.inject({
          method: 'POST', url: '/v1/reports/customer', headers, payload,
        })).statusCode).toBe(400)
      }
      const adminHeaders = { authorization: `Bearer ${f.adminToken}` }
      expect((await f.app.inject({
        method: 'POST', url: '/v1/projects', headers: adminHeaders,
        payload: {
          code: 'INVALID-DATE', name: 'Invalid', clientName: 'Invalid', address: 'Invalid',
          latitude: 10, longitude: 106, contractStartDate: '2026-02-31',
        },
      })).statusCode).toBe(400)
      expect((await f.app.inject({
        method: 'PATCH', url: `/v1/projects/${f.teamProject.id}`, headers: adminHeaders,
        payload: { contractEndDate: '2025-12-31' },
      })).statusCode).toBe(400)

      const { generateAndStoreReport } = await import('../../src/services/reports/customer-report.js')
      const teamReport = await generateAndStoreReport(
        f.teamProject.id, f.assignmentDate, f.assignmentDate, 'pdf',
        f.supervisor.user.id, f.tenantA.id,
      )
      const outsideReport = await generateAndStoreReport(
        f.outsideProject.id, f.assignmentDate, f.assignmentDate, 'pdf',
        f.admin.id, f.tenantA.id,
      )
      const stored = await prisma.customerReport.findMany({
        where: { id: { in: [teamReport.reportId, outsideReport.reportId] } },
      })
      f.reportKeys.push(...stored.map((report) => report.fileKey))
      expect(stored.find((report) => report.id === teamReport.reportId)!.fileKey)
        .toMatch(new RegExp(`^${f.tenantA.id}/${f.teamProject.id}/${teamReport.reportId}/`))

      const visible = await f.app.inject({ method: 'GET', url: '/v1/reports/customer', headers })
      expect(visible.statusCode).toBe(200)
      const ids = (visible.json().data as Array<{ id: string }>).map((report) => report.id)
      expect(ids).toContain(teamReport.reportId)
      expect(ids).not.toContain(outsideReport.reportId)
      const filteredOutside = await f.app.inject({
        method: 'GET',
        url: `/v1/reports/customer?projectId=${f.outsideProject.id}`,
        headers,
      })
      expect(filteredOutside.statusCode).toBe(200)
      expect(filteredOutside.json().data).toHaveLength(0)

      expect((await f.app.inject({
        method: 'GET',
        url: '/v1/reports/customer',
        headers: { authorization: `Bearer ${f.mobileToken}` },
      })).statusCode).toBe(403)
    } finally {
      await f.cleanup()
    }
  })
})
