import { createHmac, randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  BusinessRuleViolationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  Prisma,
  type UserRole,
  prisma,
  requirePermission,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'
import { toPublicAttendanceRecord } from '../services/photo-service.js'
import {
  assertCopyRange,
  buildCopyPreviewItems,
  dateKey,
  type CopyRangeInput,
} from '../services/schedule-copy-service.js'

const CopyPreviewSchema = z.object({
  projectId: z.string().uuid(),
  sourceFrom: CalendarDateSchema,
  sourceTo: CalendarDateSchema,
  targetStart: CalendarDateSchema,
})

const CopySchema = CopyPreviewSchema.extend({
  requestId: z.string().uuid(),
  previewToken: z.string().regex(/^[0-9a-f]{64}$/),
  confirmConflicts: z.boolean().default(false),
})

const schedulingRoles = ['bo_admin', 'system_admin', 'supervisor'] as const
const employeeSelect = {
  id: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  status: true,
} as const

type Db = Pick<
  Prisma.TransactionClient,
  'user' | 'project' | 'projectSupervisor' | 'shiftAssignment' | 'auditLog'
>

interface ScheduleUser {
  userId: string
  tenantId: string
  role: UserRole
}

async function assertProjectScope(db: Db, user: ScheduleUser, projectId: string) {
  if (!schedulingRoles.includes(user.role as (typeof schedulingRoles)[number])) {
    throw new ForbiddenError()
  }
  const [actor, project] = await Promise.all([
    db.user.findFirst({
      where: { id: user.userId, tenantId: user.tenantId, role: user.role, status: 'active' },
    }),
    db.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId, status: 'active', deletedAt: null },
    }),
  ])
  if (!actor) throw new ForbiddenError('Scheduling account not active')
  if (!project) throw new NotFoundError('Project', projectId)
  if (user.role === 'supervisor') {
    const membership = await db.projectSupervisor.findFirst({
      where: {
        projectId,
        userId: actor.id,
        supervisor: { tenantId: user.tenantId, role: 'supervisor', status: 'active' },
      },
    })
    if (!membership) throw new NotFoundError('Project', projectId)
  }
  return { actor, project }
}

async function preparePreview(db: Db, user: ScheduleUser, input: CopyRangeInput) {
  const { actor, project } = await assertProjectScope(db, user, input.projectId)
  const range = assertCopyRange(input)
  const sources = await db.shiftAssignment.findMany({
    where: {
      projectId: input.projectId,
      date: { gte: range.sourceFrom, lte: range.sourceTo },
      status: { not: 'cancelled' },
      employee: { tenantId: user.tenantId, deletedAt: null },
      shift: { tenantId: user.tenantId },
    },
    include: {
      employee: { select: { ...employeeSelect, user: { select: { status: true } } } },
      shift: true,
    },
    orderBy: [{ date: 'asc' }, { assignedAt: 'asc' }, { id: 'asc' }],
  })
  const employeeIds = [...new Set(sources.map(({ employeeId }) => employeeId))]
  const existing = employeeIds.length === 0 ? [] : await db.shiftAssignment.findMany({
    where: {
      employeeId: { in: employeeIds },
      date: {
        gte: new Date(range.targetFrom.getTime() - 86_400_000),
        lte: new Date(range.targetTo.getTime() + 86_400_000),
      },
      status: { not: 'cancelled' },
      employee: { tenantId: user.tenantId },
    },
    include: { shift: true },
    orderBy: { id: 'asc' },
  })
  const items = buildCopyPreviewItems(
    input,
    sources.map((source) => ({
      id: source.id,
      employeeId: source.employeeId,
      shiftId: source.shiftId,
      date: source.date,
      notes: source.notes,
      startTime: source.shift.startTime,
      endTime: source.shift.endTime,
      isOvernight: source.shift.isOvernight,
      employeeActive: source.employee.status === 'active' && source.employee.user.status === 'active',
      shiftActive: source.shift.isActive,
    })),
    existing.map((assignment) => ({
      id: assignment.id,
      projectId: assignment.projectId,
      employeeId: assignment.employeeId,
      shiftId: assignment.shiftId,
      date: assignment.date,
      startTime: assignment.shift.startTime,
      endTime: assignment.shift.endTime,
      isOvernight: assignment.shift.isOvernight,
    })),
    project.contractStartDate,
    project.contractEndDate,
  )
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const publicItems = items.map((item) => {
    const source = sourceById.get(item.sourceAssignmentId)!
    return {
      ...item,
      conflictingAssignmentIds: undefined,
      employee: {
        id: source.employee.id,
        userId: source.employee.userId,
        employeeCode: source.employee.employeeCode,
        fullName: source.employee.fullName,
        status: source.employee.status,
      },
      shift: source.shift,
    }
  })
  const warnings = items.flatMap(({ warnings: itemWarnings }) => itemWarnings)
  return {
    actor,
    project,
    range,
    items,
    warnings,
    resourceIds: {
      employeeIds,
      employeeUserIds: [...new Set(sources.map(({ employee }) => employee.userId))],
      shiftIds: [...new Set([
        ...sources.map(({ shiftId }) => shiftId),
        ...existing.map(({ shiftId }) => shiftId),
      ])],
      assignmentIds: [...new Set([
        ...sources.map(({ id }) => id),
        ...existing.map(({ id }) => id),
      ])],
    },
    fingerprintResources: {
      project: {
        id: project.id,
        status: project.status,
        contractStartDate: project.contractStartDate,
        contractEndDate: project.contractEndDate,
      },
      sources: sources.map((source) => ({
        id: source.id,
        employeeId: source.employeeId,
        shiftId: source.shiftId,
        date: source.date,
        status: source.status,
        notes: source.notes,
        employee: {
          id: source.employee.id,
          employeeCode: source.employee.employeeCode,
          fullName: source.employee.fullName,
          status: source.employee.status,
          userStatus: source.employee.user.status,
        },
        shift: {
          id: source.shift.id,
          name: source.shift.name,
          startTime: source.shift.startTime,
          endTime: source.shift.endTime,
          isOvernight: source.shift.isOvernight,
          isActive: source.shift.isActive,
        },
      })),
      existing: existing.map((assignment) => ({
        id: assignment.id,
        employeeId: assignment.employeeId,
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
    response: {
      projectId: input.projectId,
      sourceFrom: input.sourceFrom,
      sourceTo: input.sourceTo,
      targetFrom: dateKey(range.targetFrom),
      targetTo: dateKey(range.targetTo),
      items: publicItems,
      summary: {
        total: items.length,
        warningCount: warnings.length,
        blockingCount: items.filter(({ blockingReasons }) => blockingReasons.length > 0).length,
      },
    },
  }
}

function createPreviewToken(
  preview: Awaited<ReturnType<typeof preparePreview>>,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify({
      projectId: preview.response.projectId,
      sourceFrom: preview.response.sourceFrom,
      sourceTo: preview.response.sourceTo,
      targetFrom: preview.response.targetFrom,
      targetTo: preview.response.targetTo,
      items: preview.response.items,
      resources: preview.fingerprintResources,
    }))
    .digest('hex')
}

export function scheduleCopyRoutes(previewSecret: string): FastifyPluginAsync {
  return async (app) => {
  app.post('/assignments/copy-preview', {
    preHandler: [requireAuth, requirePermission('attendance.shifts.manage')],
  }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const preview = await preparePreview(prisma, request.user, CopyPreviewSchema.parse(request.body))
    return { ...preview.response, previewToken: createPreviewToken(preview, previewSecret) }
  })

  app.post('/assignments/copy', {
    preHandler: [requireAuth, requirePermission('attendance.shifts.manage')],
  }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const body = CopySchema.parse(request.body)
    return prisma.$transaction(async (tx) => {
      const scoped = await assertProjectScope(tx, request.user!, body.projectId)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule-copy-request:${request.user!.tenantId}:${body.requestId}`}))`
      const prior = await tx.auditLog.findFirst({
        where: {
          tenantId: request.user!.tenantId,
          action: 'copy_shift_assignments',
          entityType: 'ShiftAssignmentCopyRequest',
          entityId: body.requestId,
        },
      })
      if (prior) {
        const value = prior.newValue as {
          projectId?: string
          sourceFrom?: string
          sourceTo?: string
          targetStart?: string
          createdAssignmentIds?: string[]
          resultAssignments?: unknown[]
          warnings?: unknown[]
        } | null
        if (
          value?.projectId !== body.projectId
          || value.sourceFrom !== body.sourceFrom
          || value.sourceTo !== body.sourceTo
          || value.targetStart !== body.targetStart
        ) {
          throw new ConflictError('requestId was already used for a different schedule copy')
        }
        if (!value.resultAssignments) {
          throw new ConflictError('Completed copy request is missing its stable result snapshot')
        }
        return {
          requestId: body.requestId,
          replayed: true,
          assignments: value.resultAssignments,
          warnings: value.warnings ?? [],
        }
      }

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule-copy:${body.projectId}`}))`
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
      let preview = await preparePreview(tx, request.user!, body)
      const employeeIds = [...new Set(preview.items.map(({ employeeId }) => employeeId))].sort()
      for (const employeeId of employeeIds) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`schedule:${employeeId}`}))`
      }
      if (preview.resourceIds.employeeIds.length > 0) {
        await tx.$queryRaw(Prisma.sql`
          SELECT id FROM employees
          WHERE id::text IN (${Prisma.join([...preview.resourceIds.employeeIds].sort())})
            AND "tenantId" = ${request.user!.tenantId}::uuid
          ORDER BY id
          FOR UPDATE
        `)
      }
      if (preview.resourceIds.shiftIds.length > 0) {
        await tx.$queryRaw(Prisma.sql`
          SELECT id FROM shifts
          WHERE id::text IN (${Prisma.join([...preview.resourceIds.shiftIds].sort())})
            AND "tenantId" = ${request.user!.tenantId}::uuid
          ORDER BY id
          FOR UPDATE
        `)
      }
      const userIds = [...new Set([
        preview.actor.id,
        ...preview.resourceIds.employeeUserIds,
      ])].sort()
      await tx.$queryRaw(Prisma.sql`
        SELECT id FROM users
        WHERE id::text IN (${Prisma.join(userIds)})
          AND "tenantId" = ${request.user!.tenantId}::uuid
        ORDER BY id
        FOR UPDATE
      `)
      if (preview.resourceIds.assignmentIds.length > 0) {
        await tx.$queryRaw(Prisma.sql`
          SELECT id FROM shift_assignments
          WHERE id::text IN (${Prisma.join([...preview.resourceIds.assignmentIds].sort())})
          ORDER BY id
          FOR UPDATE
        `)
      }
      preview = await preparePreview(tx, request.user!, body)
      const currentPreviewToken = createPreviewToken(preview, previewSecret)
      if (currentPreviewToken !== body.previewToken) {
        throw new ConflictError('Schedule changed after preview; preview again before copying', {
          repreviewRequired: true,
        })
      }
      if (preview.items.length === 0) {
        throw new BusinessRuleViolationError('No source assignments to copy')
      }
      const blocked = preview.items.filter(({ blockingReasons }) => blockingReasons.length > 0)
      if (blocked.length > 0) {
        throw new ConflictError('Schedule copy contains blocking conflicts', {
          blockingItems: blocked.map(({ sourceAssignmentId, targetDate, blockingReasons }) => ({
            sourceAssignmentId, targetDate, blockingReasons,
          })),
        })
      }
      if (preview.warnings.length > 0 && !body.confirmConflicts) {
        throw new ConflictError('Schedule conflict requires confirmation', {
          requiresConfirmation: true,
          warnings: preview.warnings,
        })
      }

      const assignedAt = new Date()
      const rows = preview.items.map((item) => ({
        id: randomUUID(),
        employeeId: item.employeeId,
        projectId: body.projectId,
        shiftId: item.shiftId,
        date: new Date(`${item.targetDate}T00:00:00.000Z`),
        notes: item.notes,
        assignedById: scoped.actor.id,
        assignedAt,
      }))
      await tx.shiftAssignment.createMany({ data: rows })
      const assignments = await tx.shiftAssignment.findMany({
        where: { id: { in: rows.map(({ id }) => id) } },
        include: { employee: { select: employeeSelect }, project: true, shift: true, attendanceRecord: true },
        orderBy: [{ date: 'asc' }, { assignedAt: 'asc' }, { id: 'asc' }],
      })
      const publicAssignments = await Promise.all(assignments.map(async (assignment) => ({
        ...assignment,
        attendanceRecord: assignment.attendanceRecord
          ? await toPublicAttendanceRecord(assignment.attendanceRecord)
          : null,
      })))
      const resultAssignments = JSON.parse(JSON.stringify(publicAssignments)) as Prisma.InputJsonValue
      await tx.auditLog.create({
        data: {
          tenantId: request.user!.tenantId,
          actorId: scoped.actor.id,
          actorRole: scoped.actor.role,
          action: 'copy_shift_assignments',
          entityType: 'ShiftAssignmentCopyRequest',
          entityId: body.requestId,
          newValue: {
            projectId: body.projectId,
            sourceFrom: body.sourceFrom,
            sourceTo: body.sourceTo,
            targetStart: body.targetStart,
            createdAssignmentIds: rows.map(({ id }) => id),
            resultAssignments,
            conflictAcknowledged: body.confirmConflicts && preview.warnings.length > 0,
            warnings: preview.warnings,
            conflictingAssignmentIds: preview.items
              .flatMap(({ conflictingAssignmentIds }) => conflictingAssignmentIds)
              .sort(),
          } as unknown as Prisma.InputJsonValue,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      })
      return {
        requestId: body.requestId,
        replayed: false,
        assignments: publicAssignments,
        warnings: preview.warnings,
      }
    })
  })
}
}
