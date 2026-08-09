import { describe, expect, it } from 'vitest'
import { prisma } from '@ak/shared'
import sharp from 'sharp'
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

      const { aggregateReportData, generateAndStoreReport } = await import(
        '../../src/services/reports/customer-report.js'
      )
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

      const duplicateWorkShift = await prisma.shift.create({
        data: {
          tenantId: f.tenantA.id,
          name: `Report guard ${f.dateKey}`,
          startTime: '12:00',
          endTime: '20:00',
          breakMinutes: 60,
        },
      })
      f.shiftIds.push(duplicateWorkShift.id)
      const duplicateWorkAssignment = await prisma.shiftAssignment.create({
        data: {
          employeeId: f.teamMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: duplicateWorkShift.id,
          date: f.assignmentDate,
          assignedById: f.admin.id,
        },
      })
      const oneAttendedControl = await aggregateReportData(
        f.teamProject.id,
        f.assignmentDate,
        f.assignmentDate,
        f.tenantA.id,
      )
      expect(oneAttendedControl?.attendanceByEmployee.find(
        ({ employeeCode }) => employeeCode === f.teamMember.employee.employeeCode,
      )?.daysWorked).toBe(1)
      await prisma.attendanceRecord.create({
        data: {
          shiftAssignmentId: duplicateWorkAssignment.id,
          employeeId: f.teamMember.employee.id,
          projectId: f.teamProject.id,
          checkInAt: new Date(),
          status: 'present',
        },
      })
      const reportCountBeforeGuard = await prisma.customerReport.count({
        where: { tenantId: f.tenantA.id, projectId: f.teamProject.id },
      })
      await expect(generateAndStoreReport(
        f.teamProject.id,
        f.assignmentDate,
        f.assignmentDate,
        'csv',
        f.admin.id,
        f.tenantA.id,
      )).rejects.toMatchObject({
        code: 'BUSINESS_RULE_VIOLATION',
        details: {
          employeeId: f.teamMember.employee.id,
          projectId: f.teamProject.id,
          workDate: f.dateKey,
        },
      })
      expect(await prisma.customerReport.count({
        where: { tenantId: f.tenantA.id, projectId: f.teamProject.id },
      })).toBe(reportCountBeforeGuard)

      expect((await f.app.inject({
        method: 'GET',
        url: '/v1/reports/customer',
        headers: { authorization: `Bearer ${f.mobileToken}` },
      })).statusCode).toBe(403)
    } finally {
      await f.cleanup()
    }
  })

  it('enforces BO and supervisor shift scheduling lifecycle', { timeout: 60_000 }, async () => {
    const f = await createScopeFixture()
    const supervisorHeaders = { authorization: `Bearer ${f.supervisorToken}` }
    const boHeaders = { authorization: `Bearer ${f.boAdminToken}` }
    const mobileHeaders = { authorization: `Bearer ${f.mobileToken}` }
    const dateAfter = (days: number) => {
      const date = new Date(f.assignmentDate)
      date.setUTCDate(date.getUTCDate() + days)
      return date.toISOString().slice(0, 10)
    }
    const assignmentPayload = (overrides: Record<string, unknown> = {}) => ({
      employeeId: f.teamMember.employee.id,
      projectId: f.teamProject.id,
      shiftId: f.shift.id,
      date: dateAfter(2),
      notes: 'Phân ca UAT',
      ...overrides,
    })

    try {
      expect((await f.app.inject({
        method: 'GET', url: '/v1/shifts/assignments', headers: mobileHeaders,
      })).statusCode).toBe(403)

      const shiftList = await f.app.inject({ method: 'GET', url: '/v1/shifts', headers: supervisorHeaders })
      expect(shiftList.statusCode).toBe(200)
      const visibleShiftIds = (shiftList.json().data as Array<{ id: string }>).map(({ id }) => id)
      expect(visibleShiftIds).toContain(f.shift.id)
      expect(visibleShiftIds).not.toContain(f.foreignShift.id)

      const tenantTemplate = await f.app.inject({
        method: 'POST', url: '/v1/shifts', headers: boHeaders,
        payload: { name: `Tenant shift ${f.dateKey}`, startTime: '05:00', endTime: '13:00' },
      })
      expect(tenantTemplate.statusCode).toBe(200)
      expect(tenantTemplate.json().tenantId).toBe(f.tenantA.id)
      f.shiftIds.push(tenantTemplate.json().id)
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts', headers: boHeaders,
        payload: { name: `Tenant shift ${f.dateKey}`, startTime: '06:00', endTime: '14:00' },
      })).statusCode).toBe(409)

      const scopedList = await f.app.inject({
        method: 'GET',
        url: `/v1/shifts/assignments?from=${f.dateKey}&to=${f.dateKey}&limit=2`,
        headers: supervisorHeaders,
      })
      expect(scopedList.statusCode).toBe(200)
      expect(scopedList.json().pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 })
      expect(scopedList.json().summary).toMatchObject({ scheduled: 3, cancelled: 0 })
      const scopedProjects = (scopedList.json().data as Array<{ projectId: string }>)
        .map((assignment) => assignment.projectId)
      expect(scopedProjects).toHaveLength(2)
      expect(scopedProjects).toContain(f.teamProject.id)
      expect(scopedProjects).not.toContain(f.outsideProject.id)
      expect(scopedProjects).not.toContain(f.foreignProject.id)

      expect((await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: supervisorHeaders,
        payload: assignmentPayload({ projectId: f.outsideProject.id }),
      })).statusCode).toBe(404)
      expect((await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: assignmentPayload({
          employeeId: f.foreign.employee.id,
          projectId: f.foreignProject.id,
        }),
      })).statusCode).toBe(404)
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ shiftId: f.foreignShift.id }),
      })).statusCode).toBe(404)

      const createdResponse = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: assignmentPayload(),
      })
      expect(createdResponse.statusCode).toBe(200)
      const created = createdResponse.json() as { id: string; status: string }
      expect(created.status).toBe('scheduled')
      expect(await prisma.auditLog.count({
        where: { entityId: created.id, action: 'create_shift_assignment' },
      })).toBe(1)

      expect((await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: assignmentPayload(),
      })).statusCode).toBe(409)

      const overlapA = await prisma.shift.create({
        data: {
          tenantId: f.tenantA.id,
          name: `Overlap A ${f.dateKey}`,
          startTime: '06:00',
          endTime: '14:00',
          breakMinutes: 30,
        },
      })
      const overlapB = await prisma.shift.create({
        data: {
          tenantId: f.tenantA.id,
          name: `Overlap B ${f.dateKey}`,
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 30,
        },
      })
      f.shiftIds.push(overlapA.id, overlapB.id)
      const concurrentCreates = await Promise.all([
        f.app.inject({
          method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
          payload: assignmentPayload({ shiftId: overlapA.id, date: dateAfter(3) }),
        }),
        f.app.inject({
          method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
          payload: assignmentPayload({ shiftId: overlapB.id, date: dateAfter(3) }),
        }),
      ])
      expect(concurrentCreates.map((response) => response.statusCode).sort()).toEqual([200, 409])

      await prisma.employee.update({ where: { id: f.mobileMember.employee.id }, data: { status: 'inactive' } })
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ employeeId: f.mobileMember.employee.id, date: dateAfter(4) }),
      })).statusCode).toBe(404)
      await prisma.employee.update({ where: { id: f.mobileMember.employee.id }, data: { status: 'active' } })

      await prisma.user.update({ where: { id: f.mobileMember.user.id }, data: { status: 'inactive' } })
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ employeeId: f.mobileMember.employee.id, date: dateAfter(4) }),
      })).statusCode).toBe(404)
      await prisma.user.update({ where: { id: f.mobileMember.user.id }, data: { status: 'active' } })

      await prisma.employee.update({
        where: { id: f.mobileMember.employee.id }, data: { deletedAt: new Date() },
      })
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ employeeId: f.mobileMember.employee.id, date: dateAfter(4) }),
      })).statusCode).toBe(404)
      await prisma.employee.update({
        where: { id: f.mobileMember.employee.id }, data: { deletedAt: null },
      })

      await prisma.user.update({ where: { id: f.boAdmin.id }, data: { status: 'inactive' } })
      expect((await f.app.inject({
        method: 'GET', url: '/v1/shifts', headers: boHeaders,
      })).statusCode).toBe(403)
      await prisma.user.update({ where: { id: f.boAdmin.id }, data: { status: 'active' } })

      await prisma.project.update({ where: { id: f.teamProject.id }, data: { status: 'paused' } })
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ date: dateAfter(4) }),
      })).statusCode).toBe(404)
      await prisma.project.update({ where: { id: f.teamProject.id }, data: { status: 'active' } })

      await prisma.project.update({
        where: { id: f.teamProject.id }, data: { contractEndDate: f.assignmentDate },
      })
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ date: dateAfter(4) }),
      })).statusCode).toBe(404)
      await prisma.project.update({
        where: { id: f.teamProject.id }, data: { contractEndDate: null },
      })

      await prisma.shift.update({ where: { id: overlapB.id }, data: { isActive: false } })
      expect((await f.app.inject({
        method: 'POST', url: '/v1/shifts/assignments', headers: boHeaders,
        payload: assignmentPayload({ shiftId: overlapB.id, date: dateAfter(4) }),
      })).statusCode).toBe(404)

      expect((await f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${created.id}/cancel`,
        headers: boHeaders,
        payload: { reason: 'ngắn' },
      })).statusCode).toBe(400)
      const cancelReason = 'Điều chuyển nhân viên sang dự án khác'
      const cancelledResponse = await f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${created.id}/cancel`,
        headers: boHeaders,
        payload: { reason: cancelReason },
      })
      expect(cancelledResponse.statusCode).toBe(200)
      expect(cancelledResponse.json().status).toBe('cancelled')
      const cancelAudit = await prisma.auditLog.findFirstOrThrow({
        where: { entityId: created.id, action: 'cancel_shift_assignment' },
      })
      expect(cancelAudit.newValue).toMatchObject({ status: 'cancelled', reason: cancelReason })
      expect((await f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${created.id}/cancel`,
        headers: boHeaders,
        payload: { reason: 'Hủy lại ca đã được hủy trước đó' },
      })).statusCode).toBe(409)

      const concurrentCancelTarget = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: assignmentPayload({ date: dateAfter(5) }),
      })
      expect(concurrentCancelTarget.statusCode).toBe(200)
      const concurrentCancelId = concurrentCancelTarget.json().id as string
      const concurrentCancels = await Promise.all([
        f.app.inject({
          method: 'POST', url: `/v1/shifts/assignments/${concurrentCancelId}/cancel`, headers: boHeaders,
          payload: { reason: 'Hủy ca theo yêu cầu điều phối lần một' },
        }),
        f.app.inject({
          method: 'POST', url: `/v1/shifts/assignments/${concurrentCancelId}/cancel`, headers: boHeaders,
          payload: { reason: 'Hủy ca theo yêu cầu điều phối lần hai' },
        }),
      ])
      expect(concurrentCancels.map((response) => response.statusCode).sort()).toEqual([200, 409])
      expect(await prisma.auditLog.count({
        where: { entityId: concurrentCancelId, action: 'cancel_shift_assignment' },
      })).toBe(1)

      const jpeg = (await sharp({
        create: { width: 640, height: 480, channels: 3, background: '#0289f7' },
      }).jpeg({ quality: 80 }).toBuffer()).toString('base64')
      const cancelVsCheckIn = await Promise.all([
        f.app.inject({
          method: 'POST', url: `/v1/shifts/assignments/${f.raceAssignment.id}/cancel`,
          headers: boHeaders, payload: { reason: 'Điều phối hủy ca trong lúc nhân viên vào ca' },
        }),
        f.app.inject({
          method: 'POST', url: '/v1/attendance/check-in',
          headers: { authorization: `Bearer ${f.raceToken}` },
          payload: {
            shiftAssignmentId: f.raceAssignment.id,
            gps: { latitude: 10.7720, longitude: 106.7009, accuracy: 5 },
            photoBase64: jpeg,
          },
        }),
      ])
      expect(cancelVsCheckIn.filter((response) => response.statusCode === 200)).toHaveLength(1)
      expect(cancelVsCheckIn.filter((response) => [409, 422].includes(response.statusCode)))
        .toHaveLength(1)
      const raceAssignment = await prisma.shiftAssignment.findUniqueOrThrow({
        where: { id: f.raceAssignment.id }, include: { attendanceRecord: true },
      })
      if (raceAssignment.status === 'cancelled') {
        expect(raceAssignment.attendanceRecord).toBeNull()
        expect(await prisma.auditLog.count({
          where: { entityId: f.raceAssignment.id, action: 'cancel_shift_assignment' },
        })).toBe(1)
      } else {
        expect(raceAssignment.status).toBe('checked_in')
        expect(raceAssignment.attendanceRecord?.checkInAt).toEqual(expect.any(Date))
        expect(await prisma.auditLog.count({
          where: { entityId: f.raceAssignment.id, action: 'cancel_shift_assignment' },
        })).toBe(0)
        if (raceAssignment.attendanceRecord?.checkInPhotoKey) {
          f.photoKeys.push(raceAssignment.attendanceRecord.checkInPhotoKey)
        }
      }

      expect((await f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${f.teamRecord.shiftAssignmentId}/cancel`,
        headers: supervisorHeaders,
        payload: { reason: 'Không được hủy sau khi đã điểm danh' },
      })).statusCode).toBe(422)
      expect((await f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${f.outsideRecord.shiftAssignmentId}/cancel`,
        headers: supervisorHeaders,
        payload: { reason: 'Không thuộc dự án được phân quyền' },
      })).statusCode).toBe(404)

      const cancelMobile = await f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${f.mobileAssignment.id}/cancel`,
        headers: supervisorHeaders,
        payload: { reason: 'Nhân viên nghỉ theo xác nhận của quản lý' },
      })
      expect(cancelMobile.statusCode).toBe(200)
      const mobileToday = await f.app.inject({
        method: 'GET', url: '/v1/attendance/my-today', headers: mobileHeaders,
      })
      expect(mobileToday.statusCode).toBe(200)
      expect(mobileToday.json()).toEqual({ message: 'No assignment today', data: [] })
    } finally {
      await f.cleanup()
    }
  })
})
