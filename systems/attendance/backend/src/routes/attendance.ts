// Attendance routes — check-in, check-out, my-today, records query, override.
// Implements BR-ATT-001 through BR-ATT-010 from Domain Specs.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  GPSCoordinate,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { validateGeofence, assertProjectHasGeofence } from '../services/geo-service.js'
import {
  computeAttendanceStatus,
  buildShiftDateTime,
  assertCanCheckIn,
  assertCanCheckOut,
} from '../services/attendance-service.js'
import { assertNotTooFarInPast } from '../services/schedule-service.js'
import { uploadCheckInPhoto, getPhotoUrl } from '../services/photo-service.js'

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
  checkInAt: z.string().datetime().optional(),
  checkOutAt: z.string().datetime().optional(),
})

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
  if (!assignment || assignment.employee.tenantId !== tenantId) {
    throw new NotFoundError('ShiftAssignment', shiftAssignmentId)
  }
  return assignment
}

export const attendanceRoutes: FastifyPluginAsync = async (app) => {
  // ===== MY-TODAY =====
  app.get('/my-today', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const employee = await prisma.employee.findUnique({
      where: { userId: request.user.userId },
    })
    if (!employee) throw new NotFoundError('Employee')

    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: today, lt: tomorrow },
        project: { tenantId: request.user.tenantId },
      },
      include: { project: true, shift: true, attendanceRecord: true },
    })

    return assignment ?? { message: 'No assignment today' }
  })

  // ===== CHECK-IN =====
  app.post('/check-in', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const body = CheckInSchema.parse(request.body)

    const assignment = await loadAssignmentWithProject(body.shiftAssignmentId, request.user.tenantId)

    // Verify employee matches authenticated user
    if (assignment.employee.userId !== request.user.userId) {
      throw new ForbiddenError('Not your assignment')
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
    let record = assignment.attendanceRecord
    if (!record) {
      // Create an empty AttendanceRecord first
      record = await prisma.attendanceRecord.create({
        data: {
          shiftAssignmentId: assignment.id,
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          status: 'absent',
        },
      })
    }
    assertCanCheckIn(record)

    // BR-ATT-001 — GPS validation
    const userGps = new GPSCoordinate(body.gps)
    validateGeofence(userGps, {
      latitude: Number(assignment.project.latitude),
      longitude: Number(assignment.project.longitude),
      geofenceRadiusMeters: assignment.project.geofenceRadiusMeters,
    })

    // Upload photo
    const photoKey = await uploadCheckInPhoto(record.id, 'in', body.photoBase64)

    // Compute status
    const scheduledStart = buildShiftDateTime(assignment.date, assignment.shift.startTime, false)
    const status = computeAttendanceStatus(
      {
        startTime: assignment.shift.startTime,
        endTime: assignment.shift.endTime,
        breakMinutes: assignment.shift.breakMinutes,
        lateThresholdMinutes: assignment.shift.lateThresholdMinutes,
        isOvernight: assignment.shift.isOvernight,
      },
      { scheduledStart, scheduledEnd: scheduledStart, checkInAt: new Date(), checkOutAt: null }
    )

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkInAt: new Date(),
        checkInGps: body.gps,
        checkInPhotoKey: photoKey,
        status: status.status,
        lateMinutes: status.lateMinutes,
      },
    })

    // Update assignment status
    await prisma.shiftAssignment.update({
      where: { id: assignment.id },
      data: { status: 'checked_in' },
    })

    request.log.info({ assignmentId: assignment.id, employeeId: assignment.employeeId }, 'Check-in successful')
    return {
      ...updated,
      checkInPhotoUrl: await getPhotoUrl(photoKey),
    }
  })

  // ===== CHECK-OUT =====
  app.post('/check-out', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const body = CheckOutSchema.parse(request.body)

    const assignment = await loadAssignmentWithProject(body.shiftAssignmentId, request.user.tenantId)
    if (assignment.employee.userId !== request.user.userId) {
      throw new ForbiddenError('Not your assignment')
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

    const photoKey = await uploadCheckInPhoto(assignment.attendanceRecord.id, 'out', body.photoBase64)

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
        checkInAt: assignment.attendanceRecord.checkInAt,
        checkOutAt: new Date(),
      }
    )

    const updated = await prisma.attendanceRecord.update({
      where: { id: assignment.attendanceRecord.id },
      data: {
        checkOutAt: new Date(),
        checkOutGps: body.gps,
        checkOutPhotoKey: photoKey,
        overtimeMinutes: status.overtimeMinutes,
      },
    })

    await prisma.shiftAssignment.update({
      where: { id: assignment.id },
      data: { status: 'checked_out' },
    })

    return {
      ...updated,
      checkOutPhotoUrl: await getPhotoUrl(photoKey),
    }
  })

  // ===== RECORDS QUERY (admin/supervisor) =====
  app.get('/records', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (request.user.role === 'employee') throw new ForbiddenError('Employees cannot query all records')

    const query = z
      .object({
        employeeId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        status: z.enum(['present', 'late', 'early_leave', 'half_day', 'absent', 'on_leave', 'holiday']).optional(),
        limit: z.coerce.number().int().min(1).max(500).default(100),
      })
      .parse(request.query)

    // Date semantics: "from" = start of day UTC 00:00, "to" = END of day UTC 23:59:59.999
    // (otherwise records on the "to" date would be excluded since lte midnight)
    const fromDate = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined
    const toDate = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined

    const records = await prisma.attendanceRecord.findMany({
      where: {
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(fromDate || toDate
          ? {
              checkInAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
        shiftAssignment: {
          project: { tenantId: request.user.tenantId },
        },
      },
      include: { shiftAssignment: { include: { employee: true, project: true, shift: true } } },
      orderBy: { checkInAt: 'desc' },
      take: query.limit,
    })
    return { data: records }
  })

  // ===== OVERRIDE (supervisor/admin) =====
  app.post<{ Params: { id: string } }>(
    '/records/:id/override',
    { preHandler: requireAuth },
    async (request: any) => {
      if (!request.user) throw new ForbiddenError()
      if (request.user.role === 'employee') throw new ForbiddenError()
      const body = OverrideSchema.parse(request.body)
      const id = (request.params as { id: string }).id

      const record = await prisma.attendanceRecord.findUnique({ where: { id } })
      if (!record) throw new NotFoundError('AttendanceRecord', id)

      const updated = await prisma.attendanceRecord.update({
        where: { id },
        data: {
          status: body.newStatus,
          checkInAt: body.checkInAt ? new Date(body.checkInAt) : undefined,
          checkOutAt: body.checkOutAt ? new Date(body.checkOutAt) : undefined,
          overrideReason: body.reason,
          overrideById: request.user.userId,
          overrideAt: new Date(),
        },
      })

      await prisma.auditLog.create({
        data: {
          tenantId: request.user.tenantId,
          actorId: request.user.userId,
          actorRole: request.user.role,
          action: 'override_attendance',
          entityType: 'AttendanceRecord',
          entityId: id,
          previousValue: { status: record.status, checkInAt: record.checkInAt, checkOutAt: record.checkOutAt },
          newValue: { status: body.newStatus, reason: body.reason },
        },
      })

      return updated
    }
  )
}
