import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { prisma } from '@ak/shared'
import { createScopeFixture, skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('monthly schedule copy and warning confirmation', () => {
  it('previews, atomically copies, audits, replays, and exposes multiple Today assignments', async () => {
    const f = await createScopeFixture()
    const boHeaders = { authorization: `Bearer ${f.boAdminToken}` }
    const supervisorHeaders = { authorization: `Bearer ${f.supervisorToken}` }
    const mobileHeaders = { authorization: `Bearer ${f.mobileToken}` }
    const dateAfter = (days: number) => {
      const date = new Date(f.assignmentDate)
      date.setUTCDate(date.getUTCDate() + days)
      return date.toISOString().slice(0, 10)
    }
    try {
      const secondShift = await prisma.shift.create({
        data: {
          tenantId: f.tenantA.id,
          name: `Copy shift ${randomUUID().slice(0, 8)}`,
          startTime: '08:00',
          endTime: '16:00',
          breakMinutes: 60,
        },
      })
      f.shiftIds.push(secondShift.id)
      await prisma.shiftAssignment.create({
        data: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: secondShift.id,
          date: new Date(`${dateAfter(2)}T00:00:00.000Z`),
          notes: 'Nguồn copy',
          assignedById: f.boAdmin.id,
        },
      })
      await prisma.shiftAssignment.create({
        data: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.outsideProject.id,
          shiftId: f.shift.id,
          date: new Date(`${dateAfter(10)}T00:00:00.000Z`),
          assignedById: f.boAdmin.id,
        },
      })

      const copyInput = {
        projectId: f.teamProject.id,
        sourceFrom: dateAfter(2),
        sourceTo: dateAfter(2),
        targetStart: dateAfter(10),
      }
      const preview = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: supervisorHeaders,
        payload: copyInput,
      })
      expect(preview.statusCode).toBe(200)
      expect(preview.json().summary).toEqual({ total: 1, warningCount: 1, blockingCount: 0 })
      expect(preview.json().previewToken).toMatch(/^[0-9a-f]{64}$/)
      expect(preview.json().items[0]).toMatchObject({
        targetDate: dateAfter(10),
        notes: 'Nguồn copy',
        warnings: [{ type: 'time_overlap' }],
        blockingReasons: [],
      })
      expect(preview.body).not.toContain(f.outsideProject.id)

      const requestId = randomUUID()
      const unconfirmed = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy',
        headers: boHeaders,
        payload: { ...copyInput, requestId, previewToken: preview.json().previewToken },
      })
      expect(unconfirmed.statusCode).toBe(409)
      expect(unconfirmed.json().error.details).toMatchObject({ requiresConfirmation: true })

      const changedTarget = await prisma.shiftAssignment.create({
        data: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.outsideProject.id,
          shiftId: secondShift.id,
          date: new Date(`${dateAfter(10)}T00:00:00.000Z`),
          assignedById: f.boAdmin.id,
        },
      })
      const stalePreviewCopy = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy',
        headers: boHeaders,
        payload: {
          ...copyInput,
          requestId,
          previewToken: preview.json().previewToken,
          confirmConflicts: true,
        },
      })
      expect(stalePreviewCopy.statusCode).toBe(409)
      expect(stalePreviewCopy.json().error.details).toMatchObject({ repreviewRequired: true })
      await prisma.shiftAssignment.delete({ where: { id: changedTarget.id } })
      const refreshedPreview = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: boHeaders,
        payload: copyInput,
      })
      expect(refreshedPreview.statusCode).toBe(200)

      const copied = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy',
        headers: boHeaders,
        payload: {
          ...copyInput,
          requestId,
          previewToken: refreshedPreview.json().previewToken,
          confirmConflicts: true,
        },
      })
      expect(copied.statusCode).toBe(200)
      expect(copied.json()).toMatchObject({
        requestId,
        replayed: false,
        assignments: [{ date: `${dateAfter(10)}T00:00:00.000Z`, notes: 'Nguồn copy' }],
      })
      expect(await prisma.auditLog.count({
        where: { action: 'copy_shift_assignments', entityId: requestId },
      })).toBe(1)
      const copiedAssignmentId = copied.json().assignments[0].id as string
      await prisma.attendanceRecord.create({
        data: {
          shiftAssignmentId: copiedAssignmentId,
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          checkInAt: new Date(),
          checkInPhotoKey: 'private/replay-must-not-expose.jpg',
          status: 'present',
        },
      })
      await prisma.shiftAssignment.update({
        where: { id: copiedAssignmentId },
        data: { status: 'checked_in' },
      })

      const replay = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy',
        headers: boHeaders,
        payload: {
          ...copyInput,
          requestId,
          previewToken: refreshedPreview.json().previewToken,
          confirmConflicts: true,
        },
      })
      expect(replay.statusCode).toBe(200)
      expect(replay.json().replayed).toBe(true)
      expect(replay.json().assignments).toHaveLength(1)
      expect(replay.json().assignments[0]).toMatchObject({
        id: copiedAssignmentId,
        status: 'scheduled',
        attendanceRecord: null,
      })
      expect(replay.body).not.toContain('private/replay-must-not-expose.jpg')

      const mismatchedReplay = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy',
        headers: boHeaders,
        payload: {
          ...copyInput,
          targetStart: dateAfter(11),
          requestId,
          previewToken: refreshedPreview.json().previewToken,
          confirmConflicts: true,
        },
      })
      expect(mismatchedReplay.statusCode).toBe(409)

      const sharedAssignedAt = new Date('2026-07-24T00:00:00.000Z')
      await Promise.all([
        prisma.shiftAssignment.create({
          data: {
            employeeId: f.mobileMember.employee.id,
            projectId: f.teamProject.id,
            shiftId: secondShift.id,
            date: new Date(`${dateAfter(3)}T00:00:00.000Z`),
            assignedById: f.boAdmin.id,
            assignedAt: sharedAssignedAt,
          },
        }),
        prisma.shiftAssignment.create({
          data: {
            employeeId: f.teamMember.employee.id,
            projectId: f.teamProject.id,
            shiftId: secondShift.id,
            date: new Date(`${dateAfter(3)}T00:00:00.000Z`),
            assignedById: f.boAdmin.id,
            assignedAt: sharedAssignedAt,
          },
        }),
      ])
      const concurrentRequestId = randomUUID()
      const concurrentInput = {
        projectId: f.teamProject.id,
        sourceFrom: dateAfter(3),
        sourceTo: dateAfter(3),
        targetStart: dateAfter(12),
        requestId: concurrentRequestId,
        confirmConflicts: true,
      }
      const concurrentPreview = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: boHeaders,
        payload: concurrentInput,
      })
      expect(concurrentPreview.statusCode).toBe(200)
      const repeatedConcurrentPreview = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: boHeaders,
        payload: concurrentInput,
      })
      expect(repeatedConcurrentPreview.statusCode).toBe(200)
      expect(repeatedConcurrentPreview.json().previewToken)
        .toBe(concurrentPreview.json().previewToken)
      await prisma.shift.update({
        where: { id: secondShift.id },
        data: { startTime: '09:00', endTime: '17:00' },
      })
      const staleResourceCopy = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy',
        headers: boHeaders,
        payload: {
          ...concurrentInput,
          previewToken: concurrentPreview.json().previewToken,
        },
      })
      expect(staleResourceCopy.statusCode).toBe(409)
      expect(staleResourceCopy.json().error.details).toMatchObject({ repreviewRequired: true })
      const refreshedConcurrentPreview = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: boHeaders,
        payload: concurrentInput,
      })
      expect(refreshedConcurrentPreview.statusCode).toBe(200)
      expect(refreshedConcurrentPreview.json().previewToken)
        .not.toBe(concurrentPreview.json().previewToken)
      const concurrentCopyInput = {
        ...concurrentInput,
        previewToken: refreshedConcurrentPreview.json().previewToken,
      }
      const concurrentCopies = await Promise.all([
        f.app.inject({
          method: 'POST',
          url: '/v1/shifts/assignments/copy',
          headers: boHeaders,
          payload: concurrentCopyInput,
        }),
        f.app.inject({
          method: 'POST',
          url: '/v1/shifts/assignments/copy',
          headers: boHeaders,
          payload: concurrentCopyInput,
        }),
      ])
      expect(concurrentCopies.map(({ statusCode }) => statusCode)).toEqual([200, 200])
      expect(concurrentCopies.map((response) => response.json().replayed).sort()).toEqual([false, true])
      expect(await prisma.shiftAssignment.count({
        where: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: secondShift.id,
          date: new Date(`${dateAfter(12)}T00:00:00.000Z`),
          status: { not: 'cancelled' },
        },
      })).toBe(1)

      const duplicatePreview = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: boHeaders,
        payload: copyInput,
      })
      expect(duplicatePreview.json().summary.blockingCount).toBe(1)
      expect(duplicatePreview.json().items[0].blockingReasons).toContain('exact_duplicate')

      const warningCreate = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: secondShift.id,
          date: f.dateKey,
        },
      })
      expect(warningCreate.statusCode).toBe(409)
      expect(warningCreate.json().error.details.requiresConfirmation).toBe(true)
      expect(warningCreate.json().error.details.conflictToken).toMatch(/^[0-9a-f]{64}$/)
      await prisma.shift.update({
        where: { id: secondShift.id },
        data: { startTime: '10:00', endTime: '18:00' },
      })
      const staleShiftConfirmedCreate = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: secondShift.id,
          date: f.dateKey,
          confirmConflicts: true,
          conflictToken: warningCreate.json().error.details.conflictToken,
        },
      })
      expect(staleShiftConfirmedCreate.statusCode).toBe(409)
      expect(staleShiftConfirmedCreate.json().error.details).toMatchObject({
        reconfirmRequired: true,
        requiresConfirmation: true,
      })
      expect(staleShiftConfirmedCreate.json().error.details.conflictToken)
        .not.toBe(warningCreate.json().error.details.conflictToken)
      const changedConflict = await prisma.shiftAssignment.create({
        data: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.outsideProject.id,
          shiftId: secondShift.id,
          date: f.assignmentDate,
          assignedById: f.boAdmin.id,
        },
      })
      const staleConfirmedCreate = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: secondShift.id,
          date: f.dateKey,
          confirmConflicts: true,
          conflictToken: staleShiftConfirmedCreate.json().error.details.conflictToken,
        },
      })
      expect(staleConfirmedCreate.statusCode).toBe(409)
      expect(staleConfirmedCreate.json().error.details).toMatchObject({
        reconfirmRequired: true,
        requiresConfirmation: true,
      })
      expect(staleConfirmedCreate.json().error.details.conflictToken)
        .not.toBe(staleShiftConfirmedCreate.json().error.details.conflictToken)

      const confirmedCreate = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments',
        headers: boHeaders,
        payload: {
          employeeId: f.mobileMember.employee.id,
          projectId: f.teamProject.id,
          shiftId: secondShift.id,
          date: f.dateKey,
          confirmConflicts: true,
          conflictToken: staleConfirmedCreate.json().error.details.conflictToken,
        },
      })
      expect(confirmedCreate.statusCode).toBe(200)
      expect(confirmedCreate.json().warnings).toHaveLength(2)
      await prisma.shiftAssignment.delete({ where: { id: changedConflict.id } })
      const today = await f.app.inject({
        method: 'GET',
        url: '/v1/attendance/my-today',
        headers: mobileHeaders,
      })
      expect(today.statusCode).toBe(200)
      expect(today.json().data).toHaveLength(2)
      expect(today.json().id).toBe(today.json().data[0].id)

      const forbidden = await f.app.inject({
        method: 'POST',
        url: '/v1/shifts/assignments/copy-preview',
        headers: supervisorHeaders,
        payload: { ...copyInput, projectId: f.outsideProject.id },
      })
      expect(forbidden.statusCode).toBe(404)
    } finally {
      await f.cleanup()
    }
  })

  it('serializes cancellation against the project lock used by copy', async () => {
    const f = await createScopeFixture()
    const boHeaders = { authorization: `Bearer ${f.boAdminToken}` }
    let releaseProjectLock = () => {}
    let blocker: Promise<unknown> | undefined
    let cancellation: Promise<Awaited<ReturnType<typeof f.app.inject>>> | undefined
    try {
      let signalProjectLockReady = () => {}
      const projectLockReady = new Promise<void>((resolve) => {
        signalProjectLockReady = resolve
      })
      const holdProjectLock = new Promise<void>((resolve) => {
        releaseProjectLock = resolve
      })
      blocker = prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule-copy:${f.teamProject.id}`}))`
        signalProjectLockReady()
        await holdProjectLock
      })
      await projectLockReady

      cancellation = f.app.inject({
        method: 'POST',
        url: `/v1/shifts/assignments/${f.mobileAssignment.id}/cancel`,
        headers: boHeaders,
        payload: { reason: 'Điều phối lại sau khi kiểm tra lịch copy' },
      }).then((response) => response)
      let observedAdvisoryWait = false
      for (let attempt = 0; attempt < 40 && !observedAdvisoryWait; attempt += 1) {
        const [waiting] = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*)::bigint AS count
          FROM pg_stat_activity
          WHERE datname = current_database()
            AND wait_event_type = 'Lock'
            AND lower(wait_event) = 'advisory'
            AND query LIKE '%pg_advisory_xact_lock%'
        `
        observedAdvisoryWait = Number(waiting?.count ?? 0) > 0
        if (!observedAdvisoryWait) {
          await new Promise((resolve) => setTimeout(resolve, 25))
        }
      }
      expect(observedAdvisoryWait).toBe(true)

      releaseProjectLock()
      await blocker
      const cancelled = await cancellation
      expect(cancelled.statusCode).toBe(200)
      expect(cancelled.json().status).toBe('cancelled')
    } finally {
      releaseProjectLock()
      await blocker?.catch(() => undefined)
      await cancellation?.catch(() => undefined)
      await f.cleanup()
    }
  })
})
