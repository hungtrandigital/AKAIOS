// OTP generation/verification and refresh-token primitives.
// Provider dispatch and Redis-backed OTP persistence live in otp.ts.

import { randomBytes, randomInt, createHash } from 'node:crypto'

const OTP_TTL_SECONDS = 300 // 5 minutes
const OTP_LENGTH = 6
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

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

// ===== Refresh tokens =====

export interface RefreshTokenRecord {
  token: string       // raw token to send to client
  tokenHash: string   // SHA-256 hash to persist
  expiresAt: Date
}

/** Generate a new refresh token (random URL-safe string). */
export function generateRefreshToken(): RefreshTokenRecord {
  const token = randomBytes(32).toString('base64url') // ~43 chars
  const tokenHash = hashRefreshToken(token)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
  return { token, tokenHash, expiresAt }
}

/** SHA-256 hash a refresh token for storage (don't store raw). */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Get refresh token TTL in seconds (for cookie Max-Age). */
export function getRefreshTokenTtlSeconds(): number {
  return REFRESH_TOKEN_TTL_SECONDS
}
