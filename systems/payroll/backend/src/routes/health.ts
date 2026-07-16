// Health check routes for payroll API
import type { FastifyPluginAsync } from 'fastify'
import { runAllHealthChecks } from '@ak/shared'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/live', async () => ({
    status: 'ok',
    service: 'payroll-api',
    timestamp: new Date().toISOString(),
  }))

  app.get('/ready', async (_request, reply) => {
    const result = await runAllHealthChecks('payroll-api')
    return reply.status(result.ok ? 200 : 503).send(result)
  })
}
