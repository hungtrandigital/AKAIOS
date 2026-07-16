// JWT utilities — issue and verify access tokens.
// Token format: { userId, tenantId, role }
// TTL: 15 minutes (configurable via JWT_ACCESS_TTL_SECONDS)
// Lazy validation: secret checked only when issuing/verifying (enables unit tests).

import jwt from 'jsonwebtoken'
import { z } from 'zod'

export const JwtClaimsSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  role: z.enum(['employee', 'supervisor', 'bo_admin', 'system_admin']),
  exp: z.number().optional(),
  iat: z.number().optional(),
})

export type JwtClaims = z.infer<typeof JwtClaimsSchema>

export interface IssueTokenInput {
  userId: string
  tenantId: string
  role: JwtClaims['role']
}

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET environment variable must be set (>= 32 chars)')
  }
  return s
}

function getAccessTtl(): number {
  return parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10)
}

export function issueAccessToken(input: IssueTokenInput): { token: string; expiresIn: number } {
  const secret = getSecret()
  const ttl = getAccessTtl()
  const payload: JwtClaims = {
    userId: input.userId,
    tenantId: input.tenantId,
    role: input.role,
  }
  const token = jwt.sign(payload, secret, { expiresIn: ttl })
  return { token, expiresIn: ttl }
}

export function verifyAccessToken(token: string): JwtClaims {
  const secret = getSecret()
  try {
    const decoded = jwt.verify(token, secret)
    return JwtClaimsSchema.parse(decoded)
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw err
  }
}
