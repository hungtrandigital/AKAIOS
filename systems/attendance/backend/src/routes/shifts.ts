// Shift + ShiftAssignment routes.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, ForbiddenError, NotFoundError, ConflictError, BusinessRuleViolationError } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { detectShiftConflict } from '../services/schedule-service.js'
import { getSupervisorProjectIds, supervisorCanAccessProject } from '../services/project-access.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'
import { toPublicAttendanceRecord } from '../services/photo-service.js'

const ShiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  breakMinutes: z.number().int().nonnegative().default(60),
  lateThresholdMinutes: z.number().int().nonnegative().default(15),
  isOvernight: z.boolean().default(false),
  color: z.string().optional(),
})

const AssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  shiftId: z.string().uuid(),
  date: CalendarDateSchema,
  notes: z.string().optional(),
})

const assignmentEmployeeSelect = {
  id: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  status: true,
} as const

export const shiftRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async () => {
    const shifts = await prisma.shift.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return { data: shifts }
  })

  app.post('/', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
      throw new ForbiddenError('Only BO/admin can create shift templates')
    }
    const body = ShiftSchema.parse(request.body)
    return prisma.shift.create({ data: body })
  })

  app.get('/assignments', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const q = z.object({
      employeeId: z.string().uuid().optional(),
      projectId: z.string().uuid().optional(),
      from: CalendarDateSchema.optional(),
      to: CalendarDateSchema.optional(),
    }).refine((value) => !value.from || !value.to || value.from <= value.to, {
      message: 'from must be on or before to',
    }).parse(request.query)

    const supervisorProjectIds = request.user.role === 'supervisor'
      ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      : undefined
    const where: any = {
      project: {
        tenantId: request.user.tenantId,
        ...(supervisorProjectIds ? { id: { in: supervisorProjectIds } } : {}),
      },
    }
    if (q.employeeId) where.employeeId = q.employeeId
    if (q.projectId) where.projectId = q.projectId
    if (q.from || q.to) {
      where.date = {}
      if (q.from) where.date.gte = new Date(`${q.from}T00:00:00.000Z`)
      if (q.to) where.date.lte = new Date(`${q.to}T00:00:00.000Z`)
    }
    const assignments = await prisma.shiftAssignment.findMany({
      where,
      include: {
        employee: { select: assignmentEmployeeSelect },
        project: true,
        shift: true,
        attendanceRecord: true,
      },
      orderBy: { date: 'asc' },
      take: 200,
    })
    return {
      data: await Promise.all(assignments.map(async (assignment) => ({
        ...assignment,
        attendanceRecord: assignment.attendanceRecord
          ? await toPublicAttendanceRecord(assignment.attendanceRecord)
          : null,
      }))),
    }
  })

  app.post('/assignments', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin', 'supervisor'].includes(request.user.role)) {
      throw new ForbiddenError()
    }
    const body = AssignmentSchema.parse(request.body)
    const assignmentDate = new Date(`${body.date}T00:00:00.000Z`)

    const [employee, project, shift] = await Promise.all([
      prisma.employee.findUnique({ where: { id: body.employeeId } }),
      prisma.project.findUnique({ where: { id: body.projectId } }),
      prisma.shift.findUnique({ where: { id: body.shiftId } }),
    ])
    if (!employee || employee.tenantId !== request.user.tenantId) throw new NotFoundError('Employee')
    if (!project || project.tenantId !== request.user.tenantId) throw new NotFoundError('Project')
    if (!shift) throw new NotFoundError('Shift')
    if (request.user.role === 'supervisor'
      && !await supervisorCanAccessProject(
        request.user.userId,
        request.user.tenantId,
        project.id,
      )) {
      throw new NotFoundError('Project', project.id)
    }

    const existing = await prisma.shiftAssignment.findUnique({
      where: {
        employeeId_projectId_shiftId_date: {
          employeeId: body.employeeId,
          projectId: body.projectId,
          shiftId: body.shiftId,
          date: assignmentDate,
        },
      },
    })
    if (existing) throw new ConflictError('Assignment already exists for this employee/project/shift/date')

    // BR-ATT-006: Check for schedule conflict with existing assignments on the same date
    const employeeAssignments = await prisma.shiftAssignment.findMany({
      where: { employeeId: body.employeeId, date: assignmentDate },
      include: { shift: true },
    })
    const conflictResult = detectShiftConflict(
      {
        employeeId: body.employeeId,
        date: assignmentDate,
        shiftId: body.shiftId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isOvernight: shift.isOvernight,
      },
      employeeAssignments.map((a) => ({
        employeeId: a.employeeId,
        date: a.date,
        shiftId: a.shiftId,
        startTime: a.shift.startTime,
        endTime: a.shift.endTime,
        isOvernight: a.shift.isOvernight,
      }))
    )
    if (conflictResult) {
      throw new BusinessRuleViolationError(
        'Employee already has a shift assignment that overlaps on this date',
        { existingShiftId: employeeAssignments[0]?.shiftId }
      )
    }

    return prisma.shiftAssignment.create({
      data: {
        employeeId: body.employeeId,
        projectId: body.projectId,
        shiftId: body.shiftId,
        date: assignmentDate,
        notes: body.notes,
        assignedById: request.user.userId,
      },
    })
  })
}
