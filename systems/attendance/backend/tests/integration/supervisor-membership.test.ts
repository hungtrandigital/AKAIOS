import { describe, expect, it } from 'vitest'
import { prisma } from '@ak/shared'
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
        expect(await prisma.auditLog.count({
          where: { tenantId: f.tenantA.id, entityId: f.teamRecord.id, action: 'override_attendance' },
        })).toBe(2)
      } finally {
        await f.cleanup()
      }
    })
})
