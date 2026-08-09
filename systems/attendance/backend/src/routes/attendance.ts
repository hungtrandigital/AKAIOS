// Attendance routes — check-in, check-out, my-today, records query, override.
// Implements BR-ATT-001 through BR-ATT-010 from Domain Specs.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  Prisma,
  GPSCoordinate,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BusinessRuleViolationError,
  requirePermission,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { validateGeofence, assertProjectHasGeofence } from '../services/geo-service.js'
import {
  computeAttendanceStatus,
  computeWorkedMinutes,
  buildShiftDateTime,
  getVietnamDateKey,
  assertCanCheckIn,
  assertCanCheckOut,
} from '../services/attendance-service.js'
import { assertNotTooFarInPast } from '../services/schedule-service.js'
import {
  uploadCheckInPhoto,
  deletePhoto,
  toPublicAttendanceRecord,
} from '../services/photo-service.js'
import { randomUUID } from 'node:crypto'
import { getSupervisorProjectIds } from '../services/project-access.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'

const GpsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
})

const CheckInSchema = z.object({
  shiftAssignmentId: z.string().uuid(),
  gps: GpsSchema,
  photoBase64: z.string().min(10),
})

const CheckOutSchema = CheckInSchema

const OverrideSchema = z.object({
  reason: z.string().min(10),
  newStatus: z.enum(['present', 'late', 'early_leave', 'half_day', 'absent', 'on_leave', 'holiday']),
  checkInAt: z.string().datetime().nullable().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
})

const ManualEventSchema = z.object({
  event: z.enum(['check_in', 'check_out']),
  occurredAt: z.string().datetime({ offset: true }),
  reasonCode: z.enum(['capture_unavailable', 'permission_blocked', 'device_failure']),
  reason: z.string().trim().min(10).max(500),
})

const attendanceEmployeeSelect = {
  id: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  status: true,
} as const

async function loadAssignmentWithProject(shiftAssignmentId: string, tenantId: string) {
  const assignment = await prisma.shiftAssignment.findUnique({
    where: { id: shiftAssignmentId },
    include: {
      project: true,
      shift: true,
      attendanceRecord: true,
      employee: { include: { user: true } },
    },
  })
  if (!assignment || assignment.project.tenantId !== tenantId || assignment.employee.tenantId !== tenantId) {
    throw new NotFoundError('ShiftAssignment', shiftAssignmentId)
  }
  return assignment
}

export const attendanceRoutes: FastifyPluginAsync = async (app) => {
  // ===== MY-TODAY =====
  app.get('/my-today', { preHandler: requireAuth }, async (request) => {
    // requireAuth = any logged-in user; this is per-user self-view
    await requirePermission('attendance.view_self')(request)
    if (!request.user) throw new ForbiddenError()
    // ShiftAssignment.date is a PostgreSQL DATE. Query the Vietnam calendar
    // key as UTC midnight; using timezone instants would be truncated by the
    // DATE column and exclude the current day.
    const today = new Date(`${getVietnamDateKey()}T00:00:00.000Z`)

    const employee = await prisma.employee.findUnique({
      where: { userId: request.user.userId },
      include: { user: { select: { status: true } } },
    })
    if (!employee || employee.status !== 'active' || employee.user.status !== 'active') {
      throw new ForbiddenError('Employee account not active')
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        employeeId: employee.id,
        date: today,
        status: { not: 'cancelled' },
        project: { tenantId: request.user.tenantId },
      },
      include: { project: true, shift: true, attendanceRecord: true },
      orderBy: [{ shift: { startTime: 'asc' } }, { assignedAt: 'asc' }],
    })

    const data = await Promise.all(assignments.map(async (assignment) => ({
      ...assignment,
      attendanceRecord: assignment.attendanceRecord
        ? await toPublicAttendanceRecord(assignment.attendanceRecord)
        : null,
    })))
    // Rolling compatibility: the new client consumes `data`; the previously
    // shipped client still sees the earliest assignment at the top level.
    return data.length > 0
      ? { ...data[0], data }
      : { message: 'No assignment today', data }
  })

  // ===== CHECK-IN =====
  app.post('/check-in', { preHandler: requireAuth }, async (request) => {
    await requirePermission('attendance.view_self')(request)
    if (!request.user) throw new ForbiddenError()
    const body = CheckInSchema.parse(request.body)

    const assignment = await loadAssignmentWithProject(body.shiftAssignmentId, request.user.tenantId)

    // Verify employee matches authenticated user
    if (assignment.employee.userId !== request.user.userId) {
      throw new ForbiddenError('Not your assignment')
    }
    if (assignment.employee.status !== 'active' || assignment.employee.user.status !== 'active') {
      throw new ForbiddenError('Employee account not active')
    }

    // BR-ATT-007
    assertProjectHasGeofence({
      latitude: Number(assignment.project.latitude),
      longitude: Number(assignment.project.longitude),
      geofenceRadiusMeters: assignment.project.geofenceRadiusMeters,
    })

    // BR-ATT-008: Past date check-in window (default 7 days)
    assertNotTooFarInPast(assignment.date, 7)

    // BR-ATT-004 (no double check-in)
    if (assignment.attendanceRecord) assertCanCheckIn(assignment.attendanceRecord)

    // BR-ATT-001 — GPS validation
    const userGps = new GPSCoordinate(body.gps)
    validateGeofence(userGps, {
      latitude: Number(assignment.project.latitude),
      longitude: Number(assignment.project.longitude),
      geofenceRadiusMeters: assignment.project.geofenceRadiusMeters,
    })

    // Compute status
    const now = new Date()
    const scheduledStart = buildShiftDateTime(assignment.date, assignment.shift.startTime, false)
    const status = computeAttendanceStatus(
      {
        startTime: assignment.shift.startTime,
        endTime: assignment.shift.endTime,
        breakMinutes: assignment.shift.breakMinutes,
        lateThresholdMinutes: assignment.shift.lateThresholdMinutes,
        isOvernight: assignment.shift.isOvernight,
      },
      { scheduledStart, scheduledEnd: scheduledStart, checkInAt: now, checkOutAt: null }
    )
    const recordId = assignment.attendanceRecord?.id ?? randomUUID()
    const photoKey = await uploadCheckInPhoto(recordId, 'in', body.photoBase64)
    let updated
    try {
      updated = await prisma.$transaction(async (tx) => {
        let persisted
        if (assignment.attendanceRecord) {
          const claimed = await tx.attendanceRecord.updateMany({
            where: { id: recordId, checkInAt: null },
            data: {
              checkInAt: now,
              checkInGps: body.gps,
              checkInPhotoKey: photoKey,
              status: status.status,
              lateMinutes: status.lateMinutes,
            },
          })
          if (claimed.count !== 1) throw new ConflictError('Already checked in')
          persisted = await tx.attendanceRecord.findUniqueOrThrow({ where: { id: recordId } })
        } else {
          persisted = await tx.attendanceRecord.create({
            data: {
              id: recordId,
              shiftAssignmentId: assignment.id,
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              checkInAt: now,
              checkInGps: body.gps,
              checkInPhotoKey: photoKey,
              status: status.status,
              lateMinutes: status.lateMinutes,
            },
          })
        }
        const assignmentClaimed = await tx.shiftAssignment.updateMany({
          where: { id: assignment.id, status: { in: ['scheduled', 'missed'] } },
          data: { status: 'checked_in' },
        })
        if (assignmentClaimed.count !== 1) throw new ConflictError('Assignment cannot be checked in')
        return persisted
      })
    } catch (error) {
      await deletePhoto(photoKey).catch((cleanupError) => {
        request.log.error({ err: cleanupError, photoKey }, 'Failed to clean up rejected check-in photo')
      })
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictError('Already checked in')
      }
      throw error
    }

    request.log.info({ assignmentId: assignment.id, employeeId: assignment.employeeId }, 'Check-in successful')
    return toPublicAttendanceRecord(updated)
  })

  // ===== CHECK-OUT =====
  app.post('/check-out', { preHandler: requireAuth }, async (request) => {
    await requirePermission('attendance.view_self')(request)
    if (!request.user) throw new ForbiddenError()
    const body = CheckOutSchema.parse(request.body)

    const assignment = await loadAssignmentWithProject(body.shiftAssignmentId, request.user.tenantId)
    if (assignment.employee.userId !== request.user.userId) {
      throw new ForbiddenError('Not your assignment')
    }
    if (assignment.employee.status !== 'active' || assignment.employee.user.status !== 'active') {
      throw new ForbiddenError('Employee account not active')
    }

    if (!assignment.attendanceRecord) {
      throw new ConflictError('Must check in before checking out')
    }
    assertCanCheckOut(assignment.attendanceRecord)

    const userGps = new GPSCoordinate(body.gps)
    validateGeofence(userGps, {
      latitude: Number(assignment.project.latitude),
      longitude: Number(assignment.project.longitude),
      geofenceRadiusMeters: assignment.project.geofenceRadiusMeters,
    })

    const now = new Date()
    const checkInAt = assignment.attendanceRecord.checkInAt
    if (!checkInAt) throw new ConflictError('Must check in before checking out')
    const scheduledStart = buildShiftDateTime(assignment.date, assignment.shift.startTime, false)
    const scheduledEnd = buildShiftDateTime(
      assignment.date,
      assignment.shift.endTime,
      assignment.shift.isOvernight
    )
    const status = computeAttendanceStatus(
      {
        startTime: assignment.shift.startTime,
        endTime: assignment.shift.endTime,
        breakMinutes: assignment.shift.breakMinutes,
        lateThresholdMinutes: assignment.shift.lateThresholdMinutes,
        isOvernight: assignment.shift.isOvernight,
      },
      {
        scheduledStart,
        scheduledEnd,
        checkInAt,
        checkOutAt: now,
      }
    )
    const totalMinutesWorked = computeWorkedMinutes(checkInAt, now, assignment.shift.breakMinutes)
    const recordId = assignment.attendanceRecord.id
    const photoKey = await uploadCheckInPhoto(recordId, 'out', body.photoBase64)
    let updated
    try {
      updated = await prisma.$transaction(async (tx) => {
        const claimed = await tx.attendanceRecord.updateMany({
          where: { id: recordId, checkInAt: { not: null }, checkOutAt: null },
          data: {
            checkOutAt: now,
            checkOutGps: body.gps,
            checkOutPhotoKey: photoKey,
            status: status.status,
            lateMinutes: status.lateMinutes,
            overtimeMinutes: status.overtimeMinutes,
            totalMinutesWorked,
          },
        })
        if (claimed.count !== 1) throw new ConflictError('Already checked out')
        const assignmentClaimed = await tx.shiftAssignment.updateMany({
          where: { id: assignment.id, status: { in: ['checked_in', 'scheduled'] } },
          data: { status: 'checked_out' },
        })
        if (assignmentClaimed.count !== 1) throw new ConflictError('Assignment cannot be checked out')
        return tx.attendanceRecord.findUniqueOrThrow({ where: { id: recordId } })
      })
    } catch (error) {
      await deletePhoto(photoKey).catch((cleanupError) => {
        request.log.error({ err: cleanupError, photoKey }, 'Failed to clean up rejected check-out photo')
      })
      throw error
    }

    return toPublicAttendanceRecord(updated)
  })

  // ===== MANUAL EVENT (authorized supervisor/system-admin only) =====
  app.post<{ Params: { id: string } }>(
    '/assignments/:id/manual-event',
    { preHandler: requireAuth },
    async (request: any) => {
      if (!request.user) throw new ForbiddenError()
      await requirePermission('attendance.override')(request)
      if (request.user.role !== 'supervisor' && request.user.role !== 'system_admin') {
        throw new ForbiddenError('Only an authorized supervisor or system admin can record a manual event')
      }

      const assignmentId = (request.params as { id: string }).id
      const body = ManualEventSchema.parse(request.body)
      const occurredAt = new Date(body.occurredAt)
      if (occurredAt.getTime() > Date.now()) {
        throw new BusinessRuleViolationError('Manual attendance time cannot be in the future')
      }

      try {
        const updated = await prisma.$transaction(async (tx) => {
          const actor = await tx.user.findFirst({
            where: {
              id: request.user.userId,
              tenantId: request.user.tenantId,
              role: request.user.role,
              status: 'active',
            },
            select: { id: true },
          })
          if (!actor) throw new ForbiddenError('Attendance operator account not active')

          const assignment = await tx.shiftAssignment.findFirst({
            where: {
              id: assignmentId,
              employee: {
                tenantId: request.user.tenantId,
                status: 'active',
                deletedAt: null,
                user: { status: 'active' },
              },
              shift: { tenantId: request.user.tenantId, isActive: true },
              project: {
                tenantId: request.user.tenantId,
                deletedAt: null,
                ...(request.user.role === 'supervisor'
                  ? { supervisors: { some: { userId: request.user.userId } } }
                  : {}),
              },
            },
            include: {
              employee: { include: { user: true } },
              project: true,
              shift: true,
              attendanceRecord: true,
            },
          })
          if (!assignment) throw new NotFoundError('ShiftAssignment', assignmentId)
          if (assignment.employee.userId === request.user.userId) {
            throw new ForbiddenError('A supervisor cannot manually record their own attendance')
          }
          assertNotTooFarInPast(assignment.date, 7)

          const assignmentDateKey = assignment.date.toISOString().slice(0, 10)
          const nextDate = new Date(assignment.date)
          nextDate.setUTCDate(nextDate.getUTCDate() + 1)
          const allowedEventDates = new Set([
            assignmentDateKey,
            ...(body.event === 'check_out' && assignment.shift.isOvernight
              ? [nextDate.toISOString().slice(0, 10)]
              : []),
          ])
          if (!allowedEventDates.has(getVietnamDateKey(occurredAt))) {
            throw new BusinessRuleViolationError(
              'Manual attendance time must match the assignment business date',
            )
          }

          const scheduledStart = buildShiftDateTime(
            assignment.date,
            assignment.shift.startTime,
            false,
          )
          const scheduledEnd = buildShiftDateTime(
            assignment.date,
            assignment.shift.endTime,
            assignment.shift.isOvernight,
          )
          // Operational grace allows early arrival and delayed supervisor entry,
          // while bounding the event to this assignment instead of accepting an
          // arbitrary instant that happens to share its calendar date.
          const earliestManualEvent = new Date(scheduledStart.getTime() - 4 * 60 * 60_000)
          const latestManualEvent = new Date(scheduledEnd.getTime() + 12 * 60 * 60_000)
          if (occurredAt < earliestManualEvent || occurredAt > latestManualEvent) {
            throw new BusinessRuleViolationError(
              'Manual attendance time is outside the assignment support window',
            )
          }
          const overrideReason = `${body.reasonCode}: ${body.reason}`
          const overrideAt = new Date()
          let persisted

          if (body.event === 'check_in') {
            if (!['scheduled', 'missed'].includes(assignment.status)) {
              throw new ConflictError('Assignment cannot be manually checked in')
            }
            if (assignment.attendanceRecord?.checkInAt) {
              throw new ConflictError('Already checked in')
            }
            const status = computeAttendanceStatus(
              assignment.shift,
              {
                scheduledStart,
                scheduledEnd,
                checkInAt: occurredAt,
                checkOutAt: null,
              },
            )
            if (assignment.attendanceRecord) {
              const claimed = await tx.attendanceRecord.updateMany({
                where: { id: assignment.attendanceRecord.id, checkInAt: null },
                data: {
                  checkInAt: occurredAt,
                  status: status.status,
                  lateMinutes: status.lateMinutes,
                  overrideReason,
                  overrideById: request.user.userId,
                  overrideAt,
                },
              })
              if (claimed.count !== 1) throw new ConflictError('Already checked in')
              persisted = await tx.attendanceRecord.findUniqueOrThrow({
                where: { id: assignment.attendanceRecord.id },
              })
            } else {
              persisted = await tx.attendanceRecord.create({
                data: {
                  shiftAssignmentId: assignment.id,
                  employeeId: assignment.employeeId,
                  projectId: assignment.projectId,
                  checkInAt: occurredAt,
                  status: status.status,
                  lateMinutes: status.lateMinutes,
                  overrideReason,
                  overrideById: request.user.userId,
                  overrideAt,
                },
              })
            }
            const assignmentClaimed = await tx.shiftAssignment.updateMany({
              where: { id: assignment.id, status: { in: ['scheduled', 'missed'] } },
              data: { status: 'checked_in' },
            })
            if (assignmentClaimed.count !== 1) {
              throw new ConflictError('Assignment cannot be manually checked in')
            }
          } else {
            const record = assignment.attendanceRecord
            if (!record?.checkInAt) throw new ConflictError('Must check in before checking out')
            if (record.checkOutAt) throw new ConflictError('Already checked out')
            if (assignment.status !== 'checked_in') {
              throw new ConflictError('Assignment cannot be manually checked out')
            }
            if (occurredAt <= record.checkInAt) {
              throw new BusinessRuleViolationError('Check-out must be after check-in')
            }
            const status = computeAttendanceStatus(
              assignment.shift,
              {
                scheduledStart,
                scheduledEnd,
                checkInAt: record.checkInAt,
                checkOutAt: occurredAt,
              },
            )
            const totalMinutesWorked = computeWorkedMinutes(
              record.checkInAt,
              occurredAt,
              assignment.shift.breakMinutes,
            )
            const claimed = await tx.attendanceRecord.updateMany({
              where: { id: record.id, checkInAt: { not: null }, checkOutAt: null },
              data: {
                checkOutAt: occurredAt,
                status: status.status,
                lateMinutes: status.lateMinutes,
                overtimeMinutes: status.overtimeMinutes,
                totalMinutesWorked,
                overrideReason,
                overrideById: request.user.userId,
                overrideAt,
              },
            })
            if (claimed.count !== 1) throw new ConflictError('Already checked out')
            const assignmentClaimed = await tx.shiftAssignment.updateMany({
              where: { id: assignment.id, status: 'checked_in' },
              data: { status: 'checked_out' },
            })
            if (assignmentClaimed.count !== 1) {
              throw new ConflictError('Assignment cannot be manually checked out')
            }
            persisted = await tx.attendanceRecord.findUniqueOrThrow({ where: { id: record.id } })
          }

          await tx.auditLog.create({
            data: {
              tenantId: request.user.tenantId,
              actorId: request.user.userId,
              actorRole: request.user.role,
              action: 'override_attendance',
              entityType: 'AttendanceRecord',
              entityId: persisted.id,
              previousValue: {
                assignmentStatus: assignment.status,
                checkInAt: assignment.attendanceRecord?.checkInAt?.toISOString() ?? null,
                checkOutAt: assignment.attendanceRecord?.checkOutAt?.toISOString() ?? null,
              },
              newValue: {
                provenance: 'manual',
                event: body.event,
                occurredAt: occurredAt.toISOString(),
                reasonCode: body.reasonCode,
                reason: body.reason,
                assignmentStatus: body.event === 'check_in' ? 'checked_in' : 'checked_out',
                checkInAt: persisted.checkInAt?.toISOString() ?? null,
                checkOutAt: persisted.checkOutAt?.toISOString() ?? null,
              },
            },
          })
          return persisted
        })
        return toPublicAttendanceRecord(updated)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictError('Attendance event already recorded')
        }
        throw error
      }
    },
  )

  // ===== RECORDS QUERY (admin/supervisor) =====
  app.get('/records', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    // BR-RBAC-001: Only roles with attendance.view_all can list all records
    await requirePermission('attendance.view_all')(request as any)

    const query = z
      .object({
        employeeId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        from: CalendarDateSchema.optional(),
        to: CalendarDateSchema.optional(),
        status: z.enum(['present', 'late', 'early_leave', 'half_day', 'absent', 'on_leave', 'holiday']).optional(),
        limit: z.coerce.number().int().min(1).max(500).default(100),
      })
      .refine((value) => !value.from || !value.to || value.from <= value.to, {
        message: 'from must be on or before to',
      })
      .parse(request.query)

    const fromDate = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined
    const toDate = query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined
    const supervisorProjectIds = request.user.role === 'supervisor'
      ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      : undefined

    const records = await prisma.attendanceRecord.findMany({
      where: {
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.status ? { status: query.status } : {}),
        shiftAssignment: {
          ...(fromDate || toDate ? {
            date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          } : {}),
          project: {
            tenantId: request.user.tenantId,
            ...(supervisorProjectIds ? { id: { in: supervisorProjectIds } } : {}),
          },
        },
      },
      include: {
        shiftAssignment: {
          include: {
            employee: { select: attendanceEmployeeSelect },
            project: true,
            shift: true,
          },
        },
      },
      orderBy: { shiftAssignment: { date: 'desc' } },
      take: query.limit,
    })
    return { data: await Promise.all(records.map(toPublicAttendanceRecord)) }
  })

  // ===== OVERRIDE (supervisor/admin) =====
  app.post<{ Params: { id: string } }>(
    '/records/:id/override',
    { preHandler: requireAuth },
    async (request: any) => {
      if (!request.user) throw new ForbiddenError()
      // BR-RBAC-002: Only roles with attendance.override can edit records
      await requirePermission('attendance.override')(request as any)
      const body = OverrideSchema.parse(request.body)
      const id = (request.params as { id: string }).id

      const supervisorProjectIds = request.user.role === 'supervisor'
        ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
        : undefined

      const updated = await prisma.$transaction(async (tx) => {
        const record = await tx.attendanceRecord.findFirst({
          where: {
            id,
            shiftAssignment: {
              project: {
                tenantId: request.user.tenantId,
                ...(supervisorProjectIds ? { id: { in: supervisorProjectIds } } : {}),
              },
            },
          },
          include: { shiftAssignment: { include: { shift: true } } },
        })
        if (!record) throw new NotFoundError('AttendanceRecord', id)

        const nextCheckInAt = body.checkInAt === undefined
          ? record.checkInAt
          : body.checkInAt === null ? null : new Date(body.checkInAt)
        const nextCheckOutAt = body.checkOutAt === undefined
          ? record.checkOutAt
          : body.checkOutAt === null ? null : new Date(body.checkOutAt)
        if (nextCheckOutAt && !nextCheckInAt) {
          throw new BusinessRuleViolationError('Check-out requires a check-in timestamp')
        }
        if (nextCheckInAt && nextCheckOutAt && nextCheckOutAt <= nextCheckInAt) {
          throw new BusinessRuleViolationError('Check-out must be after check-in')
        }
        const isNonWorkingStatus = body.newStatus === 'absent'
          || body.newStatus === 'on_leave'
          || body.newStatus === 'holiday'
        if (isNonWorkingStatus
          && (nextCheckInAt || nextCheckOutAt)) {
          throw new BusinessRuleViolationError(
            `${body.newStatus} attendance cannot contain check-in or check-out timestamps`,
          )
        }
        if (!isNonWorkingStatus && (!nextCheckInAt || !nextCheckOutAt)) {
          throw new BusinessRuleViolationError(
            `${body.newStatus} attendance requires complete check-in and check-out timestamps`,
          )
        }

        const scheduledStart = buildShiftDateTime(
          record.shiftAssignment.date,
          record.shiftAssignment.shift.startTime,
          false,
        )
        const scheduledEnd = buildShiftDateTime(
          record.shiftAssignment.date,
          record.shiftAssignment.shift.endTime,
          record.shiftAssignment.shift.isOvernight,
        )
        const totals = computeAttendanceStatus(
          record.shiftAssignment.shift,
          {
            scheduledStart,
            scheduledEnd,
            checkInAt: nextCheckInAt,
            checkOutAt: nextCheckOutAt,
          },
        )
        const totalMinutesWorked = nextCheckInAt && nextCheckOutAt
          ? computeWorkedMinutes(
              nextCheckInAt,
              nextCheckOutAt,
              record.shiftAssignment.shift.breakMinutes,
            )
          : 0

        const updated = await tx.attendanceRecord.update({
          where: { id },
          data: {
            status: body.newStatus,
            checkInAt: nextCheckInAt,
            checkOutAt: nextCheckOutAt,
            lateMinutes: totals.lateMinutes,
            overtimeMinutes: totals.overtimeMinutes,
            totalMinutesWorked,
            overrideReason: body.reason,
            overrideById: request.user.userId,
            overrideAt: new Date(),
          },
        })

        await tx.auditLog.create({
          data: {
            tenantId: request.user.tenantId,
            actorId: request.user.userId,
            actorRole: request.user.role,
            action: 'override_attendance',
            entityType: 'AttendanceRecord',
            entityId: id,
            previousValue: {
              status: record.status,
              checkInAt: record.checkInAt?.toISOString() ?? null,
              checkOutAt: record.checkOutAt?.toISOString() ?? null,
              lateMinutes: record.lateMinutes,
              overtimeMinutes: record.overtimeMinutes,
              totalMinutesWorked: record.totalMinutesWorked,
            },
            newValue: {
              status: updated.status,
              checkInAt: updated.checkInAt?.toISOString() ?? null,
              checkOutAt: updated.checkOutAt?.toISOString() ?? null,
              lateMinutes: updated.lateMinutes,
              overtimeMinutes: updated.overtimeMinutes,
              totalMinutesWorked: updated.totalMinutesWorked,
              reason: body.reason,
            },
          },
        })

        return updated
      })
      return toPublicAttendanceRecord(updated)
    }
  )
}
