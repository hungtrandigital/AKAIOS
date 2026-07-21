// Runtime config validation. Throws at startup if required env vars missing.

import { z } from 'zod'

const OptionalFixedAdmin2faCodeSchema = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.string().regex(/^[0-9]{4}$/).optional(),
)

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().positive().default(3000),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  trustedProxy: z.string().default('127.0.0.1,::1'),

  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),
  minioEndpoint: z.string(),
  minioRootUser: z.string(),
  minioRootPassword: z.string(),

  jwtSecret: z.string().min(32),
  jwtAccessTtlSeconds: z.coerce.number().int().positive().default(900),
  totpEncryptionKey: z.string().optional(),
  totpEncryptionKeyVersion: z.coerce.number().int().positive().default(1),
  devFixedAdmin2faCode: OptionalFixedAdmin2faCodeSchema,

  internalApiKey: z.string().min(32),
  smsMode: z.enum(['mock', 'speedsms', 'vnpt', 'esms']).default('mock'),
})

export type Config = z.infer<typeof ConfigSchema>

let cachedConfig: Config | undefined

export function loadConfig(): Config {
  if (cachedConfig) return cachedConfig
  const rawNodeEnv = process.env.NODE_ENV
  const parsed = ConfigSchema.safeParse({
    nodeEnv: rawNodeEnv,
    port: process.env.ATTENDANCE_API_PORT,
    logLevel: process.env.LOG_LEVEL,
    trustedProxy: process.env.TRUSTED_PROXY,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioRootUser: process.env.MINIO_ROOT_USER,
    minioRootPassword: process.env.MINIO_ROOT_PASSWORD,
    jwtSecret: process.env.JWT_SECRET,
    jwtAccessTtlSeconds: process.env.JWT_ACCESS_TTL_SECONDS,
    totpEncryptionKey: process.env.TOTP_ENCRYPTION_KEY,
    totpEncryptionKeyVersion: process.env.TOTP_ENCRYPTION_KEY_VERSION,
    devFixedAdmin2faCode: process.env.DEV_FIXED_ADMIN_2FA_CODE,
    internalApiKey: process.env.INTERNAL_API_KEY,
    smsMode: process.env.SMS_MODE,
  })
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')
    throw new Error(`Invalid config:\n  ${issues}`)
  }
  if (parsed.data.devFixedAdmin2faCode
    && rawNodeEnv !== 'development'
    && rawNodeEnv !== 'test') {
    throw new Error(
      'Invalid config:\n  DEV_FIXED_ADMIN_2FA_CODE: allowed only when NODE_ENV is explicitly development or test',
    )
  }
  if (parsed.data.nodeEnv === 'production' && !parsed.data.totpEncryptionKey) {
    throw new Error('Invalid config:\n  totpEncryptionKey: required in production')
  }
  if (parsed.data.totpEncryptionKey) {
    const rawKey = parsed.data.totpEncryptionKey
    const key = /^[0-9a-fA-F]{64}$/.test(rawKey)
      ? Buffer.from(rawKey, 'hex')
      : Buffer.from(rawKey, 'base64')
    if (key.length !== 32) {
      throw new Error('Invalid config:\n  totpEncryptionKey: must decode to exactly 32 bytes')
    }
  }
  if (parsed.data.nodeEnv === 'production' && parsed.data.smsMode === 'mock') {
    throw new Error('Invalid config:\n  smsMode: mock is forbidden in production')
  }
  if (parsed.data.nodeEnv === 'production' && parsed.data.smsMode !== 'speedsms') {
    throw new Error('Invalid config:\n  smsMode: only speedsms is currently implemented in production')
  }
  if (parsed.data.smsMode === 'speedsms' && !process.env.SPEEDSMS_ACCESS_TOKEN) {
    throw new Error('Invalid config:\n  SPEEDSMS_ACCESS_TOKEN: required when smsMode=speedsms')
  }
  cachedConfig = parsed.data
  return cachedConfig
}
