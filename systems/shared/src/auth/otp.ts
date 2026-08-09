// Employee OTP primitives plus encrypted RFC 6238 admin TOTP and Redis challenges.

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto'
import { createClient } from 'redis'

const OTP_TTL_SECONDS = 300 // 5 minutes
const OTP_LENGTH = 6
const TOTP_STEP_SECONDS = 30
const TOTP_DIGITS = 6
const TOTP_CHALLENGE_TTL_SECONDS = 300
const TOTP_MAX_ATTEMPTS = 5
const EMPLOYEE_OTP_TTL_MS = 5 * 60 * 1000
const EMPLOYEE_OTP_COOLDOWN_MS = 60 * 1000
const EMPLOYEE_OTP_LOCKOUT_MS = 15 * 60 * 1000
const EMPLOYEE_OTP_MAX_ATTEMPTS = 5
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export interface GeneratedOtp {
  code: string
  expiresAt: Date
}

export function generateOtp(): GeneratedOtp {
  const code = randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000)
  return { code, expiresAt }
}

export function isOtpValid(code: string, storedCode: string, expiresAt: Date): boolean {
  if (new Date() > expiresAt) return false
  // Constant-time comparison
  if (code.length !== storedCode.length) return false
  let mismatch = 0
  for (let i = 0; i < code.length; i++) {
    mismatch |= code.charCodeAt(i) ^ storedCode.charCodeAt(i)
  }
  return mismatch === 0
}

export function getSmsMode(): 'mock' | 'speedsms' | 'vnpt' | 'esms' {
  const mode = process.env.SMS_MODE ?? 'mock'
  if (mode !== 'mock' && mode !== 'speedsms' && mode !== 'vnpt' && mode !== 'esms') {
    return 'mock'
  }
  return mode
}

export interface TotpSecretEnvelope {
  secretCiphertext: string
  secretIv: string
  secretAuthTag: string
  keyVersion: number
}

export function generateTotpSecret(bytes = 20): string {
  return encodeBase32(randomBytes(bytes))
}

export function encodeBase32(input: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of input) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

export function decodeBase32(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index < 0) throw new Error('Invalid base32 TOTP secret')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

export function loadTotpEncryptionKey(raw = process.env.TOTP_ENCRYPTION_KEY): {
  key: Buffer
  keyVersion: number
} {
  if (!raw) throw new Error('TOTP_ENCRYPTION_KEY is required')
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('TOTP_ENCRYPTION_KEY must decode to exactly 32 bytes')
  const keyVersion = Number.parseInt(process.env.TOTP_ENCRYPTION_KEY_VERSION ?? '1', 10)
  if (!Number.isInteger(keyVersion) || keyVersion < 1) {
    throw new Error('TOTP_ENCRYPTION_KEY_VERSION must be a positive integer')
  }
  return { key, keyVersion }
}

export function encryptTotpSecret(secret: string, aad: string): TotpSecretEnvelope {
  const { key, keyVersion } = loadTotpEncryptionKey()
  const secretIv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, secretIv)
  cipher.setAAD(Buffer.from(aad, 'utf8'))
  const secretCiphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ])
  return {
    secretCiphertext: secretCiphertext.toString('base64'),
    secretIv: secretIv.toString('base64'),
    secretAuthTag: cipher.getAuthTag().toString('base64'),
    keyVersion,
  }
}

export function decryptTotpSecret(envelope: TotpSecretEnvelope, aad: string): string {
  const { key, keyVersion } = loadTotpEncryptionKey()
  if (envelope.keyVersion !== keyVersion) {
    throw new Error(`Unsupported TOTP key version: ${envelope.keyVersion}`)
  }
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.secretIv, 'base64'))
  decipher.setAAD(Buffer.from(aad, 'utf8'))
  decipher.setAuthTag(Buffer.from(envelope.secretAuthTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.secretCiphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export function generateTotpCode(secret: string, counter: bigint): string {
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(counter)
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest()
  const offset = digest[digest.length - 1]! & 0x0f
  const binary = (
    ((digest[offset]! & 0x7f) << 24)
    | ((digest[offset + 1]! & 0xff) << 16)
    | ((digest[offset + 2]! & 0xff) << 8)
    | (digest[offset + 3]! & 0xff)
  ) >>> 0
  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0')
}

export function verifyTotpCode(input: {
  code: string
  secret: string
  now?: Date
  window?: number
  lastUsedCounter?: bigint | null
}): bigint | null {
  if (!/^\d{6}$/.test(input.code)) return null
  const currentCounter = BigInt(Math.floor((input.now ?? new Date()).getTime() / 1000 / TOTP_STEP_SECONDS))
  const window = input.window ?? 1
  const submitted = Buffer.from(input.code)
  for (let delta = -window; delta <= window; delta += 1) {
    const counter = currentCounter + BigInt(delta)
    if (counter < 0n || (input.lastUsedCounter !== undefined
      && input.lastUsedCounter !== null && counter <= input.lastUsedCounter)) continue
    const expected = Buffer.from(generateTotpCode(input.secret, counter))
    if (expected.length === submitted.length && timingSafeEqual(expected, submitted)) return counter
  }
  return null
}

export function buildTotpUri(input: { issuer: string; accountName: string; secret: string }): string {
  const label = encodeURIComponent(`${input.issuer}:${input.accountName}`)
  const params = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

let redisClient: ReturnType<typeof createClient> | undefined
let redisConnectPromise: Promise<ReturnType<typeof createClient>> | undefined

async function getAuthRedisClient(): Promise<ReturnType<typeof createClient>> {
  if (redisClient?.isOpen) return redisClient
  if (redisConnectPromise) return redisConnectPromise
  redisClient = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
  redisClient.on('error', () => undefined)
  redisConnectPromise = redisClient.connect().then(() => redisClient!)
  try {
    return await redisConnectPromise
  } finally {
    redisConnectPromise = undefined
  }
}

function totpChallengeKey(rawToken: string): string {
  const hash = createHash('sha256').update(rawToken).digest('hex')
  return `auth:totp:${hash}`
}

function employeeOtpKey(phone: string): string {
  return `auth:employee-otp:${createHash('sha256').update(phone).digest('hex')}`
}

function employeeOtpHash(phone: string, code: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is required for employee OTP hashing')
  return createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex')
}

/**
 * Atomically create/replace an employee OTP challenge if the per-phone
 * cooldown and lockout allow it. Only an HMAC of the OTP is stored in Redis.
 */
export async function createEmployeeOtpChallenge(
  phone: string,
  code: string,
  expiresAt: Date,
  now = new Date(),
): Promise<boolean> {
  const client = await getAuthRedisClient()
  const result = await client.eval(
    `
      local now = tonumber(ARGV[1])
      if redis.call('EXISTS', KEYS[1]) == 1 then
        local lockedUntil = tonumber(redis.call('HGET', KEYS[1], 'lockedUntil') or '0')
        local requestedAt = tonumber(redis.call('HGET', KEYS[1], 'requestedAt') or '0')
        if lockedUntil > now or requestedAt + tonumber(ARGV[2]) > now then return 0 end
      end
      redis.call('HSET', KEYS[1],
        'codeHash', ARGV[3],
        'expiresAt', ARGV[4],
        'attempts', '0',
        'requestedAt', ARGV[1],
        'lockedUntil', '0')
      redis.call('PEXPIRE', KEYS[1], ARGV[5])
      return 1
    `,
    {
      keys: [employeeOtpKey(phone)],
      arguments: [
        String(now.getTime()),
        String(EMPLOYEE_OTP_COOLDOWN_MS),
        employeeOtpHash(phone, code),
        String(expiresAt.getTime()),
        String(Math.max(EMPLOYEE_OTP_TTL_MS, EMPLOYEE_OTP_LOCKOUT_MS)),
      ],
    },
  )
  return result === 1
}

/** Atomically consume one verification attempt and delete a successful OTP. */
export async function verifyEmployeeOtpChallenge(
  phone: string,
  code: string,
  now = new Date(),
): Promise<boolean> {
  const client = await getAuthRedisClient()
  const result = await client.eval(
    `
      if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
      local now = tonumber(ARGV[1])
      local lockedUntil = tonumber(redis.call('HGET', KEYS[1], 'lockedUntil') or '0')
      if lockedUntil > now then return 0 end
      local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt') or '0')
      if expiresAt < now then redis.call('DEL', KEYS[1]); return 0 end
      local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
      local matches = redis.call('HGET', KEYS[1], 'codeHash') == ARGV[2]
      if matches then redis.call('DEL', KEYS[1]); return 1 end
      if attempts >= tonumber(ARGV[3]) then
        redis.call('HSET', KEYS[1], 'lockedUntil', now + tonumber(ARGV[4]))
        redis.call('HDEL', KEYS[1], 'codeHash')
        redis.call('PEXPIRE', KEYS[1], ARGV[4])
      end
      return 0
    `,
    {
      keys: [employeeOtpKey(phone)],
      arguments: [
        String(now.getTime()),
        employeeOtpHash(phone, code),
        String(EMPLOYEE_OTP_MAX_ATTEMPTS),
        String(EMPLOYEE_OTP_LOCKOUT_MS),
      ],
    },
  )
  return result === 1
}

export async function deleteEmployeeOtpChallenge(phone: string): Promise<void> {
  const client = await getAuthRedisClient()
  await client.del(employeeOtpKey(phone))
}

/** Deliver an employee OTP through the configured provider without logging it. */
export async function sendEmployeeOtpSms(phone: string, code: string): Promise<boolean> {
  const mode = process.env.SMS_MODE ?? 'mock'
  if (mode === 'mock') return false
  if (mode !== 'speedsms') throw new Error(`SMS provider ${mode} is not implemented`)

  const accessToken = process.env.SPEEDSMS_ACCESS_TOKEN
  if (!accessToken) throw new Error('SPEEDSMS_ACCESS_TOKEN is required')
  const response = await fetch('https://api.speedsms.vn/index.php/sms/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accessToken}:x`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [phone.replace(/^\+/, '')],
      content: `Ma OTP AKAIUNSAN cua ban la ${code}. Hieu luc 5 phut.`,
      sms_type: Number.parseInt(process.env.SPEEDSMS_SMS_TYPE ?? '4', 10),
      sender: process.env.SPEEDSMS_SENDER ?? 'AKAIUNSAN',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const payload = await response.json().catch(() => null) as { status?: string; code?: string } | null
  if (!response.ok || payload?.status !== 'success' || payload.code !== '00') {
    throw new Error(`SpeedSMS delivery failed (${response.status}/${payload?.code ?? 'invalid-response'})`)
  }
  return true
}

export async function createTotpChallenge(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('base64url')
  const client = await getAuthRedisClient()
  await client.multi()
    .hSet(totpChallengeKey(rawToken), { userId, attempts: '0' })
    .expire(totpChallengeKey(rawToken), TOTP_CHALLENGE_TTL_SECONDS)
    .exec()
  return rawToken
}

export async function consumeTotpChallengeAttempt(rawToken: string): Promise<string | null> {
  const client = await getAuthRedisClient()
  const result = await client.eval(
    `
      if redis.call('EXISTS', KEYS[1]) == 0 then return nil end
      local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
      if attempts > tonumber(ARGV[1]) then
        redis.call('DEL', KEYS[1])
        return nil
      end
      return redis.call('HGET', KEYS[1], 'userId')
    `,
    { keys: [totpChallengeKey(rawToken)], arguments: [String(TOTP_MAX_ATTEMPTS)] },
  )
  return typeof result === 'string' ? result : null
}

export async function deleteTotpChallenge(rawToken: string): Promise<void> {
  const client = await getAuthRedisClient()
  await client.del(totpChallengeKey(rawToken))
}

export async function closeAuthRedisClient(): Promise<void> {
  if (redisClient?.isOpen) await redisClient.quit()
  redisClient = undefined
  redisConnectPromise = undefined
}
