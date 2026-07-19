// Fastify server bootstrap — attendance API
// Phase 1: Health + Auth routes only
// Phase 2: Add attendance, project, employee, shift routes

import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { ZodError } from 'zod'
import { loadConfig } from './config.js'
import { registerAuthPlugin } from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { healthRoutes } from './routes/health.js'
import { attendanceRoutes } from './routes/attendance.js'
import { projectRoutes } from './routes/projects.js'
import { employeeRoutes } from './routes/employees.js'
import { shiftRoutes } from './routes/shifts.js'
import { reportRoutes } from './routes/reports.js'
import { rbacRoutes } from './routes/rbac.js'
import { internalAttendanceRoutes } from './routes/internal.js'
import { ensureBuckets, closeAuthRedisClient } from '@ak/shared'

const MAX_JSON_BODY_BYTES = 7 * 1024 * 1024

export async function buildServer() {
  const config = loadConfig()
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport:
        config.nodeEnv === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss.l' } }
          : undefined,
    },
    // Only honor forwarded client addresses from the configured reverse proxy.
    // Direct callers cannot spoof X-Forwarded-For to rotate rate-limit keys.
    trustProxy: config.trustedProxy.split(',').map((proxy) => proxy.trim()).filter(Boolean),
    // 5 MiB JPEGs expand to ~6.67 MiB as base64 JSON.
    bodyLimit: MAX_JSON_BODY_BYTES,
  })

  await app.register(cors, {
    origin: config.nodeEnv === 'development' ? true : /\.example\.com$/,
    credentials: true,
  })

  await app.register(cookie, {
    secret: config.jwtSecret,
    parseOptions: { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'strict' },
  })

  await app.register(rateLimit, {
    max: config.nodeEnv === 'development' ? 1000 : 100,
    timeWindow: '1 minute',
  })

  // Register before route plugins so encapsulated routes inherit the handler.
  app.setErrorHandler(function (error, request, reply) {
    const e = error as Error & { statusCode?: number; code?: string }
    const validationError = error as Error & {
      issues?: unknown
      errors?: unknown
      aggregateErrors?: unknown
    }
    const isZodError = error instanceof ZodError
      || error.name === 'ZodError'
      || error.constructor?.name === 'ZodError'
      || 'issues' in error
    if (isZodError) {
      const zodIssues = validationError.issues
        ?? validationError.errors
        ?? validationError.aggregateErrors
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: { issues: zodIssues },
        },
      })
    }
    if (e.statusCode && e.statusCode < 500) {
      return reply.status(e.statusCode).send({
        error: { code: e.code ?? 'ERROR', message: e.message },
      })
    }
    request.log.error({ err: error }, 'Unhandled error')
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    })
  })

  await registerAuthPlugin(app)
  app.addHook('onClose', async () => {
    await closeAuthRedisClient()
  })
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/v1/auth' })
  await app.register(attendanceRoutes, { prefix: '/v1/attendance' })
  await app.register(projectRoutes, { prefix: '/v1/projects' })
  await app.register(employeeRoutes, { prefix: '/v1/employees' })
  await app.register(shiftRoutes, { prefix: '/v1/shifts' })
  await app.register(reportRoutes, { prefix: '/v1/reports' })
  await app.register(rbacRoutes, { prefix: '/v1/rbac' })
  await app.register(internalAttendanceRoutes(config.internalApiKey), { prefix: '/internal' })

  return { app, config }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const { app, config } = await buildServer()
  try {
    await ensureBuckets()
    await app.listen({ port: config.port, host: '0.0.0.0' })
    app.log.info(`attendance-api listening on port ${config.port}`)
  } catch (err) {
    app.log.error(err, 'Failed to start')
    process.exit(1)
  }
}
