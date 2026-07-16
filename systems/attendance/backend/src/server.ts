// Fastify server bootstrap — attendance API
// Phase 1: Health + Auth routes only
// Phase 2: Add attendance, project, employee, shift routes

import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { loadConfig } from './config.js'
import { registerAuthPlugin } from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { healthRoutes } from './routes/health.js'
import { attendanceRoutes } from './routes/attendance.js'
import { projectRoutes } from './routes/projects.js'
import { employeeRoutes } from './routes/employees.js'
import { shiftRoutes } from './routes/shifts.js'
import { reportRoutes } from './routes/reports.js'

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
    trustProxy: true,
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

  await registerAuthPlugin(app)
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/v1/auth' })
  await app.register(attendanceRoutes, { prefix: '/v1/attendance' })
  await app.register(projectRoutes, { prefix: '/v1/projects' })
  await app.register(employeeRoutes, { prefix: '/v1/employees' })
  await app.register(shiftRoutes, { prefix: '/v1/shifts' })
  await app.register(reportRoutes, { prefix: '/v1/reports' })

  // Domain error handler
  app.setErrorHandler(function (error, request, reply) {
    const e = error as Error & { statusCode?: number; code?: string }
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

  return { app, config }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const { app, config } = await buildServer()
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' })
    app.log.info(`attendance-api listening on port ${config.port}`)
  } catch (err) {
    app.log.error(err, 'Failed to start')
    process.exit(1)
  }
}
