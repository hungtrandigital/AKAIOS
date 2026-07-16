// Project CRUD routes — for admin/supervisor to manage customer sites.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, Prisma, ProjectStatus, ForbiddenError, NotFoundError, ConflictError } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'

const ProjectSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  clientName: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().int().positive().default(100),
  contractStartDate: z.string(),
  contractEndDate: z.string().optional(),
  reportTemplateConfig: z.record(z.unknown()).optional(),
})

const ProjectUpdateSchema = ProjectSchema.partial().extend({
  status: z.enum(['active', 'paused', 'ended']).optional(),
})

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const status = (request.query as { status?: ProjectStatus }).status
    const projects = await prisma.project.findMany({
      where: {
        tenantId: request.user.tenantId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      orderBy: { code: 'asc' },
    })
    return { data: projects }
  })

  app.post('/', { preHandler: requireAuth }, async (request) => {
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

  app.get<{ Params: { id: string } }>('/:id', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const id = request.params.id
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.tenantId !== request.user.tenantId) throw new NotFoundError('Project', id)
    return project
  })

  app.patch<{ Params: { id: string } }>('/:id', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (request.user.role !== 'bo_admin' && request.user.role !== 'system_admin') {
      throw new ForbiddenError('Only BO/admin can update projects')
    }
    const id = request.params.id
    const body = ProjectUpdateSchema.parse(request.body)
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project || project.tenantId !== request.user.tenantId) throw new NotFoundError('Project', id)
    const { reportTemplateConfig, contractStartDate, contractEndDate, ...rest } = body
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
