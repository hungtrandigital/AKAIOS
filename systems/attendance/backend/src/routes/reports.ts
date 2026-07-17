// Customer report route — generate + download customer reports.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, ForbiddenError, NotFoundError } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { generateAndStoreReport } from '../services/reports/customer-report.js'

export const reportRoutes: FastifyPluginAsync = async (app) => {
  // ===== GENERATE CUSTOMER REPORT =====
  app.post('/customer', { preHandler: [requireAuth, requirePermission('reports.generate')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const body = z
      .object({
        projectId: z.string().uuid(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        format: z.enum(['pdf', 'csv']),
      })
      .parse(request.body)

    const project = await prisma.project.findUnique({ where: { id: body.projectId } })
    if (!project || project.tenantId !== request.user.tenantId) {
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
  app.get('/customer', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const q = z
      .object({
        projectId: z.string().uuid().optional(),
      })
      .parse(request.query)

    const reports = await prisma.customerReport.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(q.projectId ? { projectId: q.projectId } : {}),
      },
      include: { project: { select: { code: true, name: true, clientName: true } } },
      orderBy: { generatedAt: 'desc' },
      take: 100,
    })
    return { data: reports }
  })
}
