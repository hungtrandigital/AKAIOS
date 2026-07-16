// Health check routes — /health/live and /health/ready
// Phase 1: liveness only; readiness checks Postgres + Redis + MinIO added Phase 2

import type { FastifyPluginAsync } from 'fastify'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/live', async () => ({
    status: 'ok',
    service: 'attendance-api',
    timestamp: new Date().toISOString(),
  }))

  app.get('/ready', async () => {
    // Placeholder — checks DB / Redis / MinIO in Phase 2
    return {
      status: 'ok',
      checks: {
        database: 'not-checked',
        redis: 'not-checked',
        minio: 'not-checked',
      },
    }
  })
}
