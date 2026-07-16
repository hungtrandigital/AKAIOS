// Health check routes for payroll API
import type { FastifyPluginAsync } from 'fastify'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/live', async () => ({
    status: 'ok',
    service: 'payroll-api',
    timestamp: new Date().toISOString(),
  }))

  app.get('/ready', async () => ({
    status: 'ok',
    checks: {
      database: 'not-checked',
      redis: 'not-checked',
      attendanceApi: 'not-checked',
    },
  }))
}
