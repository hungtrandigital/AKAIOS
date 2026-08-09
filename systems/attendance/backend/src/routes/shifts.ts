// Shift + ShiftAssignment routes.

import { createHmac } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  Prisma,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessRuleViolationError,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { findScheduleConflicts } from '../services/schedule-service.js'
import { getSupervisorProjectIds } from '../services/project-access.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'
import { toPublicAttendanceRecord } from '../services/photo-service.js'

const ShiftSchema = z.object({
  name: z.string().trim().min(1).max(100),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  breakMinutes: z.number().int().nonnegative().default(60),
  lateThresholdMinutes: z.number().int().nonnegative().default(15),
  isOvernight: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).superRefine((value, ctx) => {
  const toMinutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    return hour! * 60 + minute!
  }
  const start = toMinutes(value.startTime)
  const end = toMinutes(value.endTime)
  if (start === end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endTime'], message: 'Shift start and end must differ' })
    return
  }
  if (value.isOvernight !== (end < start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['isOvernight'],
      message: 'isOvernight must match the shift time range',
    })
  }
  const duration = end - start + (value.isOvernight ? 24 * 60 : 0)
  if (value.breakMinutes >= duration) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['breakMinutes'], message: 'Break must be shorter than the shift' })
  }
  if (value.lateThresholdMinutes > duration) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lateThresholdMinutes'], message: 'Late threshold exceeds shift duration' })
  }
})

const AssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  shiftId: z.string().uuid(),
  date: CalendarDateSchema,
  notes: z.string().trim().max(500).optional(),
  confirmConflicts: z.boolean().default(false),
  conflictToken: z.string().regex(/^[0-9a-f]{64}$/).optional(),
})

const CancelAssignmentSchema = z.object({
  reason: z.string().trim().min(10).max(500),
})

const schedulingRoles = ['bo_admin', 'system_admin', 'supervisor'] as const

const assignmentEmployeeSelect = {
  id: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  status: true,
} as const

function createAssignmentConflictToken(
  body: z.infer<typeof AssignmentSchema>,
  conflicts: Array<{ type: string; existingAssignmentId?: string }>,
  resources: {
    employee: { id: string; status: string }
    project: {
      id: string
      status: string
      contractStartDate: Date
      contractEndDate: Date | null
    }
    shift: {
      id: string
      startTime: string
      endTime: string
      isOvernight: boolean
      isActive: boolean
    }
    existingAssignments: Array<{
      id: string
      projectId: string
      shiftId: string
      date: Date
      status: string
      shift: {
        startTime: string
        endTime: string
        isOvernight: boolean
        isActive: boolean
      }
    }>
  },
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify({
      employeeId: body.employeeId,
      projectId: body.projectId,
      shiftId: body.shiftId,
      date: body.date,
      notes: body.notes ?? null,
      resources: {
        ...resources,
        existingAssignments: [...resources.existingAssignments].sort((a, b) => a.id.localeCompare(b.id)),
      },
      conflicts: conflicts
        .map(({ type, existingAssignmentId }) => ({
          type,
          existingAssignmentId: existingAssignmentId ?? null,
        }))
        .sort((a, b) => (
          `${a.type}:${a.existingAssignmentId ?? ''}`
            .localeCompare(`${b.type}:${b.existingAssignmentId ?? ''}`)
        )),
    }))
    .digest('hex')
}

export function shiftRoutes(conflictSecret: string): FastifyPluginAsync {
  return async (app) => {
  app.get('/', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!schedulingRoles.includes(request.user.role as (typeof schedulingRoles)[number])) {
      throw new ForbiddenError()
    }
    const actor = await prisma.user.findFirst({
      where: {
        id: request.user.userId,
        tenantId: request.user.tenantId,
        role: request.user.role,
        status: 'active',
      },
    })
    if (!actor) throw new ForbiddenError('Scheduling account not active')
    const shifts = await prisma.shift.findMany({
      where: { tenantId: request.user.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    })
    return { data: shifts }
  })

  app.post('/', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
      throw new ForbiddenError('Only BO/admin can create shift templates')
    }
    const actor = await prisma.user.findFirst({
      where: {
        id: request.user.userId,
        tenantId: request.user.tenantId,
        role: request.user.role,
        status: 'active',
      },
    })
    if (!actor) throw new ForbiddenError('Scheduling account not active')
    const body = ShiftSchema.parse(request.body)
    try {
      return await prisma.shift.create({
        data: { ...body, tenantId: request.user.tenantId },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('A shift template with this name already exists in the tenant')
      }
      throw error
    }
  })

  app.get('/assignments', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!schedulingRoles.includes(request.user.role as (typeof schedulingRoles)[number])) {
      throw new ForbiddenError()
    }
    const actor = await prisma.user.findFirst({
      where: {
        id: request.user.userId,
        tenantId: request.user.tenantId,
        role: request.user.role,
        status: 'active',
      },
    })
    if (!actor) throw new ForbiddenError('Scheduling account not active')
    const q = z.object({
      employeeId: z.string().uuid().optional(),
      projectId: z.string().uuid().optional(),
      status: z.enum(['scheduled', 'checked_in', 'checked_out', 'completed', 'missed', 'cancelled']).optional(),
      from: CalendarDateSchema.optional(),
      to: CalendarDateSchema.optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }).refine((value) => !value.from || !value.to || value.from <= value.to, {
      message: 'from must be on or before to',
    }).parse(request.query)

    const supervisorProjectIds = request.user.role === 'supervisor'
      ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      : undefined
    const where: Prisma.ShiftAssignmentWhereInput = {
      employee: { tenantId: request.user.tenantId, deletedAt: null },
      project: {
        tenantId: request.user.tenantId,
        ...(supervisorProjectIds ? { id: { in: supervisorProjectIds } } : {}),
      },
      shift: { tenantId: request.user.tenantId },
    }
    if (q.employeeId) where.employeeId = q.employeeId
    if (q.projectId) where.projectId = q.projectId
    if (q.status) where.status = q.status
    if (q.from || q.to) {
      where.date = {}
      if (q.from) where.date.gte = new Date(`${q.from}T00:00:00.000Z`)
      if (q.to) where.date.lte = new Date(`${q.to}T00:00:00.000Z`)
    }
    const countStatus = (status: Prisma.EnumShiftAssignmentStatusFilter['equals']) => (
      prisma.shiftAssignment.count({ where: { AND: [where, { status }] } })
    )
    const [
      total,
      scheduled,
      checkedIn,
      checkedOut,
      completed,
      missed,
      cancelled,
      assignments,
    ] = await prisma.$transaction([
      prisma.shiftAssignment.count({ where }),
      countStatus('scheduled'),
      countStatus('checked_in'),
      countStatus('checked_out'),
      countStatus('completed'),
      countStatus('missed'),
      countStatus('cancelled'),
      prisma.shiftAssignment.findMany({
        where,
        include: {
          employee: { select: assignmentEmployeeSelect },
          project: true,
          shift: true,
          attendanceRecord: true,
        },
        orderBy: [{ date: 'asc' }, { assignedAt: 'asc' }, { id: 'asc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ])
    const summary = { scheduled, checked_in: checkedIn, checked_out: checkedOut, completed, missed, cancelled }
    return {
      data: await Promise.all(assignments.map(async (assignment) => ({
        ...assignment,
        attendanceRecord: assignment.attendanceRecord
          ? await toPublicAttendanceRecord(assignment.attendanceRecord)
          : null,
      }))),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
      summary,
    }
  })

  app.post('/assignments', { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!schedulingRoles.includes(request.user.role as (typeof schedulingRoles)[number])) {
      throw new ForbiddenError()
    }
    const body = AssignmentSchema.parse(request.body)
    const assignmentDate = new Date(`${body.date}T00:00:00.000Z`)
    try {
      return await prisma.$transaction(async (tx) => {
        // All schedule writers take project then employee locks. Row locks keep
        // resource eligibility stable until the assignment commits, including
        // against ordinary project/employee update transactions.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule-copy:${body.projectId}`}))`
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule:${body.employeeId}`}))`
        await tx.$queryRaw`
          SELECT id FROM projects
          WHERE id = ${body.projectId}::uuid
            AND "tenantId" = ${request.user!.tenantId}::uuid
          FOR UPDATE
        `
        if (request.user!.role === 'supervisor') {
          await tx.$queryRaw`
            SELECT "projectId" FROM project_supervisors
            WHERE "projectId" = ${body.projectId}::uuid
              AND "userId" = ${request.user!.userId}::uuid
            FOR UPDATE
          `
        }
        await tx.$queryRaw`
          SELECT id FROM employees
          WHERE id = ${body.employeeId}::uuid
            AND "tenantId" = ${request.user!.tenantId}::uuid
          FOR UPDATE
        `
        await tx.$queryRaw`
          SELECT id FROM shifts
          WHERE id = ${body.shiftId}::uuid
            AND "tenantId" = ${request.user!.tenantId}::uuid
          FOR UPDATE
        `
        const employeeIdentity = await tx.employee.findFirst({
          where: { id: body.employeeId, tenantId: request.user!.tenantId },
          select: { userId: true },
        })
        const lockedUserIds = [...new Set([
          request.user!.userId,
          ...(employeeIdentity ? [employeeIdentity.userId] : []),
        ])].sort()
        await tx.$queryRaw(Prisma.sql`
          SELECT id FROM users
          WHERE id::text IN (${Prisma.join(lockedUserIds)})
            AND "tenantId" = ${request.user!.tenantId}::uuid
          ORDER BY id
          FOR UPDATE
        `)

        const [actor, employee, project, shift] = await Promise.all([
          tx.user.findFirst({
            where: {
              id: request.user!.userId,
              tenantId: request.user!.tenantId,
              role: request.user!.role,
              status: 'active',
            },
          }),
          tx.employee.findFirst({
            where: {
              id: body.employeeId,
              tenantId: request.user!.tenantId,
              status: 'active',
              deletedAt: null,
              user: { status: 'active' },
            },
          }),
          tx.project.findFirst({
            where: {
              id: body.projectId,
              tenantId: request.user!.tenantId,
              status: 'active',
              deletedAt: null,
              contractStartDate: { lte: assignmentDate },
              OR: [{ contractEndDate: null }, { contractEndDate: { gte: assignmentDate } }],
            },
          }),
          tx.shift.findFirst({
            where: { id: body.shiftId, tenantId: request.user!.tenantId, isActive: true },
          }),
        ])
        if (!actor) throw new ForbiddenError('Scheduling account not active')
        if (!employee) throw new NotFoundError('Employee')
        if (!project) throw new NotFoundError('Project')
        if (!shift) throw new NotFoundError('Shift')

        if (request.user!.role === 'supervisor') {
          const membership = await tx.projectSupervisor.findFirst({
            where: {
              projectId: project.id,
              userId: actor.id,
              supervisor: {
                tenantId: request.user!.tenantId,
                role: 'supervisor',
                status: 'active',
              },
              project: { tenantId: request.user!.tenantId, status: 'active', deletedAt: null },
            },
          })
          if (!membership) throw new NotFoundError('Project', project.id)
        }

        const existing = await tx.shiftAssignment.findFirst({
          where: {
            employeeId: body.employeeId,
            projectId: body.projectId,
            shiftId: body.shiftId,
            date: assignmentDate,
            status: { not: 'cancelled' },
          },
        })
        if (existing) {
          throw new ConflictError('Assignment already exists for this employee on this work date')
        }

        const adjacentDateFrom = new Date(assignmentDate)
        adjacentDateFrom.setUTCDate(adjacentDateFrom.getUTCDate() - 1)
        const adjacentDateTo = new Date(assignmentDate)
        adjacentDateTo.setUTCDate(adjacentDateTo.getUTCDate() + 1)
        const employeeAssignments = await tx.shiftAssignment.findMany({
          where: {
            employeeId: body.employeeId,
            date: { gte: adjacentDateFrom, lte: adjacentDateTo },
            status: { not: 'cancelled' },
          },
          include: { shift: true },
        })
        const conflicts = findScheduleConflicts(
          {
            employeeId: body.employeeId,
            date: assignmentDate,
            shiftId: body.shiftId,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isOvernight: shift.isOvernight,
          },
          employeeAssignments.map((assignment) => ({
            id: assignment.id,
            employeeId: assignment.employeeId,
            date: assignment.date,
            shiftId: assignment.shiftId,
            startTime: assignment.shift.startTime,
            endTime: assignment.shift.endTime,
            isOvernight: assignment.shift.isOvernight,
          })),
        )
        const warnings = conflicts.map((conflict) => ({
          type: conflict.type,
          employeeId: body.employeeId,
          date: body.date,
          shiftId: body.shiftId,
          conflictCount: 1,
          message: conflict.type === 'time_overlap'
            ? 'Ca làm việc bị trùng thời gian với lịch hiện có.'
            : 'Nhân viên đã có một ca khác trong ngày.',
        }))
        const conflictToken = createAssignmentConflictToken(
          body,
          conflicts,
          {
            employee: { id: employee.id, status: employee.status },
            project: {
              id: project.id,
              status: project.status,
              contractStartDate: project.contractStartDate,
              contractEndDate: project.contractEndDate,
            },
            shift: {
              id: shift.id,
              startTime: shift.startTime,
              endTime: shift.endTime,
              isOvernight: shift.isOvernight,
              isActive: shift.isActive,
            },
            existingAssignments: employeeAssignments.map((assignment) => ({
              id: assignment.id,
              projectId: assignment.projectId,
              shiftId: assignment.shiftId,
              date: assignment.date,
              status: assignment.status,
              shift: {
                startTime: assignment.shift.startTime,
                endTime: assignment.shift.endTime,
                isOvernight: assignment.shift.isOvernight,
                isActive: assignment.shift.isActive,
              },
            })),
          },
          conflictSecret,
        )
        if (warnings.length > 0 && !body.confirmConflicts) {
          throw new ConflictError(
            'Schedule conflict requires confirmation',
            { requiresConfirmation: true, warnings, conflictToken },
          )
        }
        if (
          body.confirmConflicts
          && (
            (warnings.length > 0 && !body.conflictToken)
            || (body.conflictToken && body.conflictToken !== conflictToken)
          )
        ) {
          throw new ConflictError(
            'Schedule changed after conflict review; review current warnings before confirming',
            {
              reconfirmRequired: true,
              requiresConfirmation: warnings.length > 0,
              warnings,
              conflictToken,
            },
          )
        }

        const assignment = await tx.shiftAssignment.create({
          data: {
            employeeId: body.employeeId,
            projectId: body.projectId,
            shiftId: body.shiftId,
            date: assignmentDate,
            notes: body.notes,
            assignedById: actor.id,
          },
        })
        await tx.auditLog.create({
          data: {
            tenantId: request.user!.tenantId,
            actorId: actor.id,
            actorRole: actor.role,
            action: 'create_shift_assignment',
            entityType: 'ShiftAssignment',
            entityId: assignment.id,
            newValue: {
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              shiftId: assignment.shiftId,
              date: body.date,
              status: assignment.status,
              notes: assignment.notes,
              conflictAcknowledged: body.confirmConflicts && warnings.length > 0,
              conflictingAssignmentIds: conflicts
                .map((conflict) => conflict.existingAssignmentId)
                .filter((id): id is string => Boolean(id)),
            },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          },
        })
        return { ...assignment, warnings }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Assignment already exists for this employee on this work date')
      }
      throw error
    }
  })

  app.post<{ Params: { id: string } }>(
    '/assignments/:id/cancel',
    { preHandler: [requireAuth, requirePermission('attendance.shifts.manage')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      if (!schedulingRoles.includes(request.user.role as (typeof schedulingRoles)[number])) {
        throw new ForbiddenError()
      }
      const body = CancelAssignmentSchema.parse(request.body)
      return prisma.$transaction(async (tx) => {
        const actor = await tx.user.findFirst({
          where: {
            id: request.user!.userId,
            tenantId: request.user!.tenantId,
            role: request.user!.role,
            status: 'active',
          },
        })
        if (!actor) throw new ForbiddenError('Scheduling account not active')

        const assignmentIdentity = await tx.shiftAssignment.findFirst({
          where: {
            id: request.params.id,
            employee: { tenantId: request.user!.tenantId, deletedAt: null },
            project: { tenantId: request.user!.tenantId, deletedAt: null },
            shift: { tenantId: request.user!.tenantId },
          },
          select: { projectId: true, employeeId: true },
        })
        if (!assignmentIdentity) throw new NotFoundError('ShiftAssignment', request.params.id)

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule-copy:${assignmentIdentity.projectId}`}))`
        await tx.$queryRaw`
          SELECT id FROM projects
          WHERE id = ${assignmentIdentity.projectId}::uuid
            AND "tenantId" = ${request.user!.tenantId}::uuid
          FOR UPDATE
        `
        if (request.user!.role === 'supervisor') {
          await tx.$queryRaw`
            SELECT "projectId" FROM project_supervisors
            WHERE "projectId" = ${assignmentIdentity.projectId}::uuid
              AND "userId" = ${request.user!.userId}::uuid
            FOR UPDATE
          `
        }
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule:${assignmentIdentity.employeeId}`}))`
        await tx.$queryRaw`SELECT id FROM shift_assignments WHERE id = ${request.params.id}::uuid FOR UPDATE`

        const assignment = await tx.shiftAssignment.findFirst({
          where: {
            id: request.params.id,
            employeeId: assignmentIdentity.employeeId,
            projectId: assignmentIdentity.projectId,
            employee: { tenantId: request.user!.tenantId, deletedAt: null },
            project: { tenantId: request.user!.tenantId, deletedAt: null },
            shift: { tenantId: request.user!.tenantId },
          },
          include: { attendanceRecord: true, project: true },
        })
        if (!assignment) {
          throw new ConflictError('Assignment changed while cancellation was waiting for the schedule lock')
        }

        if (request.user!.role === 'supervisor') {
          const membership = await tx.projectSupervisor.findFirst({
            where: {
              projectId: assignment.projectId,
              userId: actor.id,
              supervisor: {
                tenantId: request.user!.tenantId,
                role: 'supervisor',
                status: 'active',
              },
              project: { tenantId: request.user!.tenantId, deletedAt: null },
            },
          })
          if (!membership) throw new NotFoundError('ShiftAssignment', request.params.id)
        }

        if (assignment.status === 'cancelled') {
          throw new ConflictError('Assignment is already cancelled')
        }
        if (assignment.attendanceRecord || assignment.status !== 'scheduled') {
          throw new BusinessRuleViolationError('Only a scheduled assignment without attendance can be cancelled')
        }

        const cancelled = await tx.shiftAssignment.updateMany({
          where: {
            id: assignment.id,
            status: 'scheduled',
            attendanceRecord: { is: null },
          },
          data: { status: 'cancelled' },
        })
        if (cancelled.count !== 1) {
          throw new ConflictError('Assignment changed while cancellation was in progress')
        }

        await tx.auditLog.create({
          data: {
            tenantId: request.user!.tenantId,
            actorId: actor.id,
            actorRole: actor.role,
            action: 'cancel_shift_assignment',
            entityType: 'ShiftAssignment',
            entityId: assignment.id,
            previousValue: {
              employeeId: assignment.employeeId,
              projectId: assignment.projectId,
              shiftId: assignment.shiftId,
              date: assignment.date.toISOString().slice(0, 10),
              status: assignment.status,
              notes: assignment.notes,
            },
            newValue: { status: 'cancelled', reason: body.reason },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          },
        })
        return tx.shiftAssignment.findUniqueOrThrow({
          where: { id: assignment.id },
          include: {
            employee: { select: assignmentEmployeeSelect },
            project: true,
            shift: true,
            attendanceRecord: true,
          },
        })
      })
    },
  )
}
}
