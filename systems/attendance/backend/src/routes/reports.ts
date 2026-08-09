// Customer report route — generate + download customer reports.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, ForbiddenError, NotFoundError } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { generateAndStoreReport } from '../services/reports/customer-report.js'
import { getSupervisorProjectIds } from '../services/project-access.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'

const ReportRequestSchema = z.object({
  projectId: z.string().uuid(),
  from: CalendarDateSchema,
  to: CalendarDateSchema,
  format: z.enum(['pdf', 'csv']),
}).refine((value) => value.from <= value.to, {
  message: 'from must be on or before to',
})

export const reportRoutes: FastifyPluginAsync = async (app) => {
  // ===== GENERATE CUSTOMER REPORT =====
  app.post('/customer', { preHandler: [requireAuth, requirePermission('reports.generate')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const body = ReportRequestSchema.parse(request.body)

    const project = await prisma.project.findFirst({
      where: {
        id: body.projectId,
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
    if (!project) {
      throw new NotFoundError('Project', body.projectId)
    }

    const result = await generateAndStoreReport(
      body.projectId,
      new Date(body.from),
      new Date(body.to),
      body.format,
      request.user.userId,
      request.user.tenantId
    )

    app.log.info(
      { reportId: result.reportId, projectId: body.projectId, format: body.format, size: result.size },
      'Customer report generated'
    )

    return {
      reportId: result.reportId,
      downloadUrl: result.downloadUrl,
      size: result.size,
      generatedAt: new Date().toISOString(),
    }
  })

  // ===== LIST REPORTS FOR PROJECT =====
  app.get('/customer', { preHandler: [requireAuth, requirePermission('reports.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const q = z
      .object({
        projectId: z.string().uuid().optional(),
      })
      .parse(request.query)

    const supervisorProjectIds = request.user.role === 'supervisor'
      ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      : undefined

    const reports = await prisma.customerReport.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(supervisorProjectIds
          ? { projectId: { in: supervisorProjectIds, ...(q.projectId ? { equals: q.projectId } : {}) } }
          : q.projectId ? { projectId: q.projectId } : {}),
      },
      include: { project: { select: { code: true, name: true, clientName: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 100,
    })
    return { data: reports }
  })
}
