// Runtime config validation. Throws at startup if required env vars missing.

import { z } from 'zod'

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().positive().default(3000),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),
  minioEndpoint: z.string(),
  minioRootUser: z.string(),
  minioRootPassword: z.string(),

  jwtSecret: z.string().min(32),
  jwtAccessTtlSeconds: z.coerce.number().int().positive().default(900),

  internalApiKey: z.string().min(32),
  smsMode: z.enum(['mock', 'speedsms', 'vnpt', 'esms']).default('mock'),
})

export type Config = z.infer<typeof ConfigSchema>

let cachedConfig: Config | undefined

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig
  const parsed = ConfigSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.ATTENDANCE_API_PORT,
    logLevel: process.env.LOG_LEVEL,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioRootUser: process.env.MINIO_ROOT_USER,
    minioRootPassword: process.env.MINIO_ROOT_PASSWORD,
    jwtSecret: process.env.JWT_SECRET,
    jwtAccessTtlSeconds: process.env.JWT_ACCESS_TTL_SECONDS,
    internalApiKey: process.env.INTERNAL_API_KEY,
    smsMode: process.env.SMS_MODE,
  })
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')
    throw new Error(`Invalid config:\n  ${issues}`)
  }
  cachedConfig = parsed.data
  return cachedConfig
}
