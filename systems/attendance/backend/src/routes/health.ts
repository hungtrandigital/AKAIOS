// Health check routes — /health/live and /health/ready
// Phase 1: liveness only; readiness checks Postgres + Redis + MinIO added Phase 2

import type { FastifyPluginAsync } from 'fastify'
import { runAllHealthChecks } from '@ak/shared'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/live', async () => ({
    status: 'ok',
    service: 'attendance-api',
    timestamp: new Date().toISOString(),
  }))

  app.get('/ready', async (_request, reply) => {
    const result = await runAllHealthChecks('attendance-api')
    // 200 if ok, 503 if any check fails (so k8s/docker healthcheck knows)
    return reply.status(result.ok ? 200 : 503).send(result)
  })
}
