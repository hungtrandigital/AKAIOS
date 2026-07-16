// Shift + ShiftAssignment routes.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, ForbiddenError, NotFoundError, ConflictError, BusinessRuleViolationError } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { detectShiftConflict } from '../services/schedule-service.js'

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
  date: z.string(),
  notes: z.string().optional(),
})

export const shiftRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireAuth }, async () => {
    const shifts = await prisma.shift.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return { data: shifts }
  })

  app.post('/', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin', 'supervisor'].includes(request.user.role)) {
      throw new ForbiddenError()
    }
    const body = ShiftSchema.parse(request.body)
    return prisma.shift.create({ data: body })
  })

  app.get('/assignments', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const q = z.object({
      employeeId: z.string().uuid().optional(),
      projectId: z.string().uuid().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(request.query)

    const where: any = { tenantId: request.user.tenantId }
    if (q.employeeId) where.employeeId = q.employeeId
    if (q.projectId) where.projectId = q.projectId
    if (q.from || q.to) {
      where.date = {}
      if (q.from) where.date.gte = new Date(q.from)
      if (q.to) where.date.lte = new Date(q.to)
    }
    const assignments = await prisma.shiftAssignment.findMany({
      where,
      include: { employee: true, project: true, shift: true, attendanceRecord: true },
      orderBy: { date: 'asc' },
      take: 200,
    })
    return { data: assignments }
  })

  app.post('/assignments', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin', 'supervisor'].includes(request.user.role)) {
      throw new ForbiddenError()
    }
    const body = AssignmentSchema.parse(request.body)

    const [employee, project, shift] = await Promise.all([
      prisma.employee.findUnique({ where: { id: body.employeeId } }),
      prisma.project.findUnique({ where: { id: body.projectId } }),
      prisma.shift.findUnique({ where: { id: body.shiftId } }),
    ])
    if (!employee || employee.tenantId !== request.user.tenantId) throw new NotFoundError('Employee')
    if (!project || project.tenantId !== request.user.tenantId) throw new NotFoundError('Project')
    if (!shift) throw new NotFoundError('Shift')

    const existing = await prisma.shiftAssignment.findUnique({
      where: {
        employeeId_projectId_shiftId_date: {
          employeeId: body.employeeId,
          projectId: body.projectId,
          shiftId: body.shiftId,
          date: new Date(body.date),
        },
      },
    })
    if (existing) throw new ConflictError('Assignment already exists for this employee/project/shift/date')

    // BR-ATT-006: Check for schedule conflict with existing assignments on the same date
    const employeeAssignments = await prisma.shiftAssignment.findMany({
      where: { employeeId: body.employeeId, date: new Date(body.date) },
      include: { shift: true },
    })
    const conflictResult = detectShiftConflict(
      {
        employeeId: body.employeeId,
        date: new Date(body.date),
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
        date: new Date(body.date),
        notes: body.notes,
        assignedById: request.user.userId,
      },
    })
  })
}
