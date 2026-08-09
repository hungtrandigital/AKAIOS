import { describe, expect, it } from 'vitest'
import { issueAccessToken, prisma } from '@ak/shared'
import { createScopeFixture, skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Supervisor membership and overrides (integration)', () => {
  it('prevents self-grant, revokes immediately and keeps override totals coherent',
    { timeout: 60_000 }, async () => {
      const f = await createScopeFixture()
      const auth = (token: string) => ({ authorization: `Bearer ${token}` })
      const post = (url: string, token: string, payload: object) => f.app.inject({
        method: 'POST', url, headers: auth(token), payload,
      })
      try {
        await prisma.user.update({ where: { id: f.supervisor.user.id }, data: { status: 'inactive' } })
        expect((await f.app.inject({
          method: 'GET', url: `/v1/projects/${f.teamProject.id}`,
          headers: auth(f.supervisorToken),
        })).statusCode).toBe(404)
        expect((await post(
          `/v1/projects/${f.outsideProject.id}/supervisors`,
          f.adminToken,
          { userId: f.supervisor.user.id },
        )).statusCode).toBe(404)
        await prisma.user.update({ where: { id: f.supervisor.user.id }, data: { status: 'active' } })

        for (const id of [f.outsideRecord.id, f.foreignRecord.id]) {
          expect((await post(`/v1/attendance/records/${id}/override`, f.supervisorToken, {
            reason: 'Not in supervisor project', newStatus: 'absent',
            checkInAt: null, checkOutAt: null,
          })).statusCode).toBe(404)
        }
        expect((await f.app.inject({
          method: 'GET', url: `/v1/projects/${f.teamProject.id}/supervisors`,
          headers: auth(f.supervisorToken),
        })).statusCode).toBe(403)
        expect((await f.app.inject({
          method: 'GET', url: `/v1/projects/${f.teamProject.id}/supervisors`,
          headers: auth(f.adminToken),
        })).statusCode).toBe(200)

        expect((await post('/v1/shifts/assignments', f.supervisorToken, {
          employeeId: f.teamMember.employee.id,
          projectId: f.outsideProject.id,
          shiftId: f.shift.id,
          date: f.dateKey,
        })).statusCode).toBe(404)
        expect((await post(
          `/v1/projects/${f.foreignProject.id}/supervisors`,
          f.adminToken,
          { userId: f.supervisor.user.id },
        )).statusCode).toBe(404)
        expect((await post(
          `/v1/projects/${f.outsideProject.id}/supervisors`,
          f.adminToken,
          { userId: f.teamMember.user.id },
        )).statusCode).toBe(404)

        expect((await post(
          `/v1/projects/${f.outsideProject.id}/supervisors`,
          f.adminToken,
          { userId: f.supervisor.user.id },
        )).statusCode).toBe(200)
        expect((await f.app.inject({
          method: 'GET', url: `/v1/projects/${f.outsideProject.id}`,
          headers: auth(f.supervisorToken),
        })).statusCode).toBe(200)
        expect((await f.app.inject({
          method: 'DELETE',
          url: `/v1/projects/${f.outsideProject.id}/supervisors/${f.supervisor.user.id}`,
          headers: auth(f.adminToken),
        })).statusCode).toBe(204)
        expect((await f.app.inject({
          method: 'GET', url: `/v1/projects/${f.outsideProject.id}`,
          headers: auth(f.supervisorToken),
        })).statusCode).toBe(404)
        expect(await prisma.auditLog.count({
          where: {
            tenantId: f.tenantA.id,
            entityId: f.outsideProject.id,
            action: { in: ['grant_project_supervisor', 'revoke_project_supervisor'] },
          },
        })).toBe(2)

        const instant = (time: string) => new Date(`${f.dateKey}T${time}:00.000+07:00`).toISOString()
        const allowed = await post(
          `/v1/attendance/records/${f.teamRecord.id}/override`,
          f.supervisorToken,
          {
            reason: 'Verified by site supervisor', newStatus: 'late',
            checkInAt: instant('00:30'), checkOutAt: instant('01:30'),
          },
        )
        expect(allowed.statusCode).toBe(200)
        expect(allowed.json()).toMatchObject({ totalMinutesWorked: 60, overtimeMinutes: 0 })
        expect((await post(
          `/v1/attendance/records/${f.teamRecord.id}/override`,
          f.supervisorToken,
          {
            reason: 'Invalid timestamp ordering', newStatus: 'late',
            checkInAt: instant('02:00'), checkOutAt: instant('01:00'),
          },
        )).statusCode).toBe(422)
        expect((await post(
          `/v1/attendance/records/${f.teamRecord.id}/override`,
          f.supervisorToken,
          {
            reason: 'Holiday cannot contain work', newStatus: 'holiday',
            checkInAt: instant('01:00'), checkOutAt: instant('02:00'),
          },
        )).statusCode).toBe(422)
        expect((await post(
          `/v1/attendance/records/${f.teamRecord.id}/override`,
          f.supervisorToken,
          {
            reason: 'Working status needs complete times', newStatus: 'present',
            checkInAt: null, checkOutAt: null,
          },
        )).statusCode).toBe(422)
        const absent = await post(
          `/v1/attendance/records/${f.teamRecord.id}/override`,
          f.supervisorToken,
          {
            reason: 'Confirmed employee absence', newStatus: 'absent',
            checkInAt: null, checkOutAt: null,
          },
        )
        expect(absent.statusCode).toBe(200)
        expect(absent.json()).toMatchObject({
          status: 'absent', checkInAt: null, checkOutAt: null, totalMinutesWorked: 0,
        })
        const teamMemberToken = issueAccessToken({
          userId: f.teamMember.user.id,
          tenantId: f.tenantA.id,
          role: 'employee',
        }).token
        const reconciledToday = await f.app.inject({
          method: 'GET',
          url: '/v1/attendance/my-today',
          headers: auth(teamMemberToken),
        })
        expect(reconciledToday.statusCode).toBe(200)
        expect(reconciledToday.json().data[0].attendanceRecord).toMatchObject({
          status: 'absent',
          checkInAt: null,
          checkOutAt: null,
        })
        expect(await prisma.auditLog.count({
          where: { tenantId: f.tenantA.id, entityId: f.teamRecord.id, action: 'override_attendance' },
        })).toBe(2)
      } finally {
        await f.cleanup()
      }
    })

  it('records camera-failure attendance only through an audited scoped manual event',
    { timeout: 60_000 }, async () => {
      const f = await createScopeFixture()
      const auth = (token: string) => ({ authorization: `Bearer ${token}` })
      const post = (assignmentId: string, token: string, payload: object) => f.app.inject({
        method: 'POST',
        url: `/v1/attendance/assignments/${assignmentId}/manual-event`,
        headers: auth(token),
        payload,
      })
      const checkInAt = new Date(Date.now() - 2 * 60_000)
      const checkOutAt = new Date(Date.now() - 60_000)
      const reason = 'Camera điện thoại bị hỏng; giám sát đã xác nhận trực tiếp tại dự án'
      try {
        const checkInPayload = {
          event: 'check_in',
          occurredAt: checkInAt.toISOString(),
          reasonCode: 'device_failure',
          reason,
        }
        expect((await post(f.mobileAssignment.id, f.mobileToken, checkInPayload)).statusCode)
          .toBe(403)
        expect((await post(f.mobileAssignment.id, f.boAdminToken, checkInPayload)).statusCode)
          .toBe(403)
        expect((await post(f.outsideAssignment.id, f.supervisorToken, checkInPayload)).statusCode)
          .toBe(404)
        expect((await post(f.foreignAssignment.id, f.supervisorToken, checkInPayload)).statusCode)
          .toBe(404)
        expect((await post(f.mobileAssignment.id, f.supervisorToken, {
          ...checkInPayload,
          occurredAt: new Date(Date.now() + 60_000).toISOString(),
        })).statusCode).toBe(422)
        expect((await post(f.mobileAssignment.id, f.supervisorToken, {
          ...checkInPayload,
          occurredAt: new Date(checkInAt.getTime() - 24 * 60 * 60_000).toISOString(),
        })).statusCode).toBe(422)
        const narrowShift = await prisma.shift.create({
          data: {
            tenantId: f.tenantA.id,
            name: 'Manual event support window',
            startTime: '06:00',
            endTime: '14:00',
            breakMinutes: 0,
            lateThresholdMinutes: 15,
          },
        })
        f.shiftIds.push(narrowShift.id)
        const previousDateForWindow = new Date(f.assignmentDate)
        previousDateForWindow.setUTCDate(previousDateForWindow.getUTCDate() - 1)
        const narrowAssignment = await prisma.shiftAssignment.create({
          data: {
            employeeId: f.outsider.employee.id,
            projectId: f.teamProject.id,
            shiftId: narrowShift.id,
            date: previousDateForWindow,
            assignedById: f.admin.id,
          },
        })
        expect((await post(narrowAssignment.id, f.supervisorToken, {
          ...checkInPayload,
          occurredAt: new Date(
            `${previousDateForWindow.toISOString().slice(0, 10)}T01:00:00.000+07:00`,
          ).toISOString(),
        })).statusCode).toBe(422)

        const selfAssignment = await prisma.shiftAssignment.create({
          data: {
            employeeId: f.supervisor.employee.id,
            projectId: f.teamProject.id,
            shiftId: f.shift.id,
            date: f.assignmentDate,
            assignedById: f.admin.id,
          },
        })
        expect((await post(selfAssignment.id, f.supervisorToken, checkInPayload)).statusCode)
          .toBe(403)

        const previousDate = new Date(f.assignmentDate)
        previousDate.setUTCDate(previousDate.getUTCDate() - 1)
        const adminAssignment = await prisma.shiftAssignment.create({
          data: {
            employeeId: f.raceMember.employee.id,
            projectId: f.outsideProject.id,
            shiftId: f.shift.id,
            date: previousDate,
            assignedById: f.admin.id,
          },
        })
        const previousDateKey = previousDate.toISOString().slice(0, 10)
        const adminManual = await post(adminAssignment.id, f.adminToken, {
          ...checkInPayload,
          occurredAt: new Date(`${previousDateKey}T08:00:00.000+07:00`).toISOString(),
        })
        expect(adminManual.statusCode).toBe(200)
        expect(adminManual.json()).toMatchObject({
          overrideById: f.admin.id,
          checkInGps: null,
          checkInPhotoUrl: null,
        })

        const manualCheckIn = await post(
          f.mobileAssignment.id,
          f.supervisorToken,
          checkInPayload,
        )
        expect(manualCheckIn.statusCode).toBe(200)
        expect(manualCheckIn.json()).toMatchObject({
          shiftAssignmentId: f.mobileAssignment.id,
          checkInAt: checkInAt.toISOString(),
          checkInGps: null,
          checkInPhotoUrl: null,
          overrideById: f.supervisor.user.id,
        })
        expect(manualCheckIn.json().overrideReason).toContain('device_failure:')
        expect((await post(
          f.mobileAssignment.id,
          f.supervisorToken,
          checkInPayload,
        )).statusCode).toBe(409)

        const manualCheckOut = await post(f.mobileAssignment.id, f.supervisorToken, {
          event: 'check_out',
          occurredAt: checkOutAt.toISOString(),
          reasonCode: 'device_failure',
          reason,
        })
        expect(manualCheckOut.statusCode).toBe(200)
        expect(manualCheckOut.json()).toMatchObject({
          checkOutAt: checkOutAt.toISOString(),
          checkOutGps: null,
          checkOutPhotoUrl: null,
          totalMinutesWorked: 1,
          overrideById: f.supervisor.user.id,
        })
        expect(await prisma.shiftAssignment.findUnique({
          where: { id: f.mobileAssignment.id },
        })).toMatchObject({ status: 'checked_out' })

        const audits = await prisma.auditLog.findMany({
          where: {
            tenantId: f.tenantA.id,
            entityId: manualCheckIn.json().id,
            action: 'override_attendance',
          },
          orderBy: { occurredAt: 'asc' },
        })
        expect(audits).toHaveLength(2)
        expect(audits[0]?.newValue).toMatchObject({
          provenance: 'manual', event: 'check_in', reasonCode: 'device_failure',
        })
        expect(audits[1]?.newValue).toMatchObject({
          provenance: 'manual', event: 'check_out', reasonCode: 'device_failure',
        })
      } finally {
        await f.cleanup()
      }
    })
})
