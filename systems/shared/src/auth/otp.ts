// OTP generation + verification.
// Phase 1: MOCK mode — OTPs printed to server log instead of sent via SMS.
// Phase 2: Integrate real SMS gateway (SpeedSMS, VNPT, eSMS).

import { randomInt } from 'node:crypto'

const OTP_TTL_SECONDS = 300 // 5 minutes
const OTP_LENGTH = 6

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
