// Project CRUD routes — for admin/supervisor to manage customer sites.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, Prisma, ForbiddenError, NotFoundError, ConflictError, ValidationError } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { getSupervisorProjectIds } from '../services/project-access.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'

const ProjectFields = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  clientName: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().int().positive().default(100),
  contractStartDate: CalendarDateSchema,
  contractEndDate: CalendarDateSchema.optional(),
  reportTemplateConfig: z.record(z.unknown()).optional(),
})
const ProjectSchema = ProjectFields.refine(
  (value) => !value.contractEndDate || value.contractStartDate <= value.contractEndDate,
  { message: 'contractEndDate must be on or after contractStartDate' },
)

const ProjectUpdateSchema = ProjectFields.partial().extend({
  status: z.enum(['active', 'paused', 'ended']).optional(),
})

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [requireAuth, requirePermission('projects.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const { status } = z.object({
      status: z.enum(['active', 'paused', 'ended']).optional(),
    }).parse(request.query)
    const supervisorProjectIds = request.user.role === 'supervisor'
      ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      : undefined
    const projects = await prisma.project.findMany({
      where: {
        tenantId: request.user.tenantId,
        deletedAt: null,
        ...(supervisorProjectIds ? { id: { in: supervisorProjectIds } } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { code: 'asc' },
    })
    return { data: projects }
  })

  app.get<{ Params: { id: string } }>(
    '/:id/supervisors',
    { preHandler: [requireAuth, requirePermission('projects.view')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
        throw new ForbiddenError('Only BO/admin can list project memberships')
      }
      const project = await prisma.project.findFirst({
        where: {
          id: request.params.id,
          tenantId: request.user.tenantId,
          deletedAt: null,
        },
      })
      if (!project) throw new NotFoundError('Project', request.params.id)
      const memberships = await prisma.projectSupervisor.findMany({
        where: {
          projectId: project.id,
          supervisor: { tenantId: request.user.tenantId, role: 'supervisor' },
        },
        select: {
          userId: true,
          createdAt: true,
          supervisor: { select: { id: true, email: true, phone: true, status: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      return { data: memberships }
    },
  )

  app.post<{ Params: { id: string } }>(
    '/:id/supervisors',
    { preHandler: [requireAuth, requirePermission('projects.update')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
        throw new ForbiddenError('Only BO/admin can grant project membership')
      }
      const body = z.object({ userId: z.string().uuid() }).parse(request.body)
      return prisma.$transaction(async (tx) => {
        const [project, supervisor, actor] = await Promise.all([
          tx.project.findFirst({
            where: { id: request.params.id, tenantId: request.user!.tenantId, deletedAt: null },
          }),
          tx.user.findFirst({
            where: {
              id: body.userId,
              tenantId: request.user!.tenantId,
              role: 'supervisor',
              status: 'active',
            },
          }),
          tx.user.findFirst({
            where: {
              id: request.user!.userId,
              tenantId: request.user!.tenantId,
              role: { in: ['bo_admin', 'system_admin'] },
              status: 'active',
            },
          }),
        ])
        if (!project) throw new NotFoundError('Project', request.params.id)
        if (!supervisor) throw new NotFoundError('Supervisor', body.userId)
        if (!actor) throw new ForbiddenError('Admin account not active')

        const existing = await tx.projectSupervisor.findUnique({
          where: { projectId_userId: { projectId: project.id, userId: supervisor.id } },
        })
        if (existing) return existing
        const membership = await tx.projectSupervisor.create({
          data: { projectId: project.id, userId: supervisor.id, assignedById: actor.id },
        })
        await tx.auditLog.create({
          data: {
            tenantId: request.user!.tenantId,
            actorId: actor.id,
            actorRole: actor.role,
            action: 'grant_project_supervisor',
            entityType: 'ProjectSupervisor',
            entityId: project.id,
            newValue: { projectId: project.id, supervisorUserId: supervisor.id },
          },
        })
        return membership
      })
    },
  )

  app.delete<{ Params: { id: string; userId: string } }>(
    '/:id/supervisors/:userId',
    { preHandler: [requireAuth, requirePermission('projects.update')] },
    async (request, reply) => {
      if (!request.user) throw new ForbiddenError()
      if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
        throw new ForbiddenError('Only BO/admin can revoke project membership')
      }
      await prisma.$transaction(async (tx) => {
        const [project, supervisor, actor] = await Promise.all([
          tx.project.findFirst({
            where: { id: request.params.id, tenantId: request.user!.tenantId, deletedAt: null },
          }),
          tx.user.findFirst({
            where: {
              id: request.params.userId,
              tenantId: request.user!.tenantId,
              role: 'supervisor',
            },
          }),
          tx.user.findFirst({
            where: {
              id: request.user!.userId,
              tenantId: request.user!.tenantId,
              role: { in: ['bo_admin', 'system_admin'] },
              status: 'active',
            },
          }),
        ])
        if (!project) throw new NotFoundError('Project', request.params.id)
        if (!supervisor) throw new NotFoundError('Supervisor', request.params.userId)
        if (!actor) throw new ForbiddenError('Admin account not active')
        const membership = await tx.projectSupervisor.findUnique({
          where: { projectId_userId: { projectId: project.id, userId: supervisor.id } },
        })
        if (!membership) throw new NotFoundError('ProjectSupervisor')
        await tx.projectSupervisor.delete({
          where: { projectId_userId: { projectId: project.id, userId: supervisor.id } },
        })
        await tx.auditLog.create({
          data: {
            tenantId: request.user!.tenantId,
            actorId: actor.id,
            actorRole: actor.role,
            action: 'revoke_project_supervisor',
            entityType: 'ProjectSupervisor',
            entityId: project.id,
            previousValue: { projectId: project.id, supervisorUserId: supervisor.id },
          },
        })
      })
      return reply.status(204).send()
    },
  )

  app.post('/', { preHandler: [requireAuth, requirePermission('projects.create')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
      throw new ForbiddenError('Only BO/admin can create projects')
    }
    const body = ProjectSchema.parse(request.body)
    const existing = await prisma.project.findUnique({
      where: { tenantId_code: { tenantId: request.user.tenantId, code: body.code } },
    })
    if (existing) throw new ConflictError(`Project with code ${body.code} already exists`)

    return prisma.project.create({
      data: {
        tenantId: request.user.tenantId,
        code: body.code,
        name: body.name,
        clientName: body.clientName,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        geofenceRadiusMeters: body.geofenceRadiusMeters,
        contractStartDate: new Date(body.contractStartDate),
        contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : null,
        reportTemplateConfig: body.reportTemplateConfig
          ? (body.reportTemplateConfig as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    })
  })

  app.get<{ Params: { id: string } }>('/:id', { preHandler: [requireAuth, requirePermission('projects.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const id = request.params.id
    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId: request.user.tenantId,
        deletedAt: null,
        ...(request.user.role === 'supervisor'
          ? {
              supervisors: {
                some: {
                  userId: request.user.userId,
                  supervisor: {
                    tenantId: request.user.tenantId,
                    role: 'supervisor',
                    status: 'active',
                  },
                },
              },
            }
          : {}),
      },
    })
    if (!project) throw new NotFoundError('Project', id)
    return project
  })

  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [requireAuth, requirePermission('projects.update')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
      throw new ForbiddenError('Only BO/admin can update projects')
    }
    const id = request.params.id
    const body = ProjectUpdateSchema.parse(request.body)
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.tenantId !== request.user.tenantId) throw new NotFoundError('Project', id)
    const { reportTemplateConfig, contractStartDate, contractEndDate, ...rest } = body
    const nextStart = contractStartDate ? new Date(contractStartDate) : project.contractStartDate
    const nextEnd = contractEndDate ? new Date(contractEndDate) : project.contractEndDate
    if (nextEnd && nextEnd < nextStart) {
      throw new ValidationError('contractEndDate must be on or after contractStartDate')
    }
    return prisma.project.update({
      where: { id },
      data: {
        ...rest,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined,
        reportTemplateConfig: reportTemplateConfig
          ? (reportTemplateConfig as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    })
  })
}
