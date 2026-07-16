// Runtime config validation for payroll API

import { z } from 'zod'

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().positive().default(3001),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),

  jwtSecret: z.string().min(32),
  jwtAccessTtlSeconds: z.coerce.number().int().positive().default(900),
  internalApiKey: z.string().min(32),

  attendanceApiUrl: z.string().url().default('http://localhost:3000'),
})

export type Config = z.infer<typeof ConfigSchema>

let cachedConfig: Config | undefined

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig
  const parsed = ConfigSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PAYROLL_API_PORT,
    logLevel: process.env.LOG_LEVEL,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtAccessTtlSeconds: process.env.JWT_ACCESS_TTL_SECONDS,
    internalApiKey: process.env.INTERNAL_API_KEY,
    attendanceApiUrl: process.env.ATTENDANCE_API_URL,
  })
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')
    throw new Error(`Invalid config:\n  ${issues}`)
  }
  cachedConfig = parsed.data
  return cachedConfig
}
