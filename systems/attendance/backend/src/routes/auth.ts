// Auth routes — Phase 1 minimal:
// POST /v1/auth/login (employee: phone + password)
// POST /v1/auth/request-otp
// POST /v1/auth/login-otp (phone + otp)
// POST /v1/auth/logout
// GET /v1/auth/me
// Full implementation in Phase 2; stubs here for scaffold

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  issueAccessToken,
  verifyPassword,
  generateOtp,
  createEmployeeOtpChallenge,
  verifyEmployeeOtpChallenge,
  deleteEmployeeOtpChallenge,
  sendEmployeeOtpSms,
  decryptTotpSecret,
  verifyTotpCode,
  createTotpChallenge,
  consumeTotpChallengeAttempt,
  deleteTotpChallenge,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenTtlSeconds,
  UnauthorizedError,
  NotFoundError,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

function isAccountActive(user: {
  status: string
  role: string
  employee?: { status: string } | null
}): boolean {
  if (user.status !== 'active') return false
  if (user.role === 'employee') return user.employee?.status === 'active'
  return user.employee?.status !== 'inactive' && user.employee?.status !== 'suspended'
}

const LoginSchema = z.object({
  phone: z.string().regex(/^\+84[0-9]{9}$/),
  password: z.string().min(6),
})

const OtpRequestSchema = z.object({
  phone: z.string().regex(/^\+84[0-9]{9}$/),
})

const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const OtpLoginSchema = z.object({
  phone: z.string().regex(/^\+84[0-9]{9}$/),
  otp: z.string().regex(/^[0-9]{6}$/),
})

interface AuthRouteOptions {
  devFixedAdmin2faCode?: string
}

function matchesFixedAdmin2faCode(candidate: string, expected?: string): boolean {
  if (!expected || candidate.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
}

function isLoopbackAddress(address: string): boolean {
  if (address === '::1') return true
  const ipv4 = address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address
  return isIP(ipv4) === 4 && ipv4.startsWith('127.')
}

export const authRoutes: FastifyPluginAsync<AuthRouteOptions> = async (app, options) => {
  const fixedAdmin2faCode = options.devFixedAdmin2faCode
  const VerifyTwoFactorSchema = z.object({
    totpCode: fixedAdmin2faCode
      ? z.string().regex(/^[0-9]{4}$/)
      : z.string().regex(/^[0-9]{6}$/),
  })
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body)
    const user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { employee: true },
    })
    if (!user || !user.passwordHash || user.role !== 'employee') {
      throw new UnauthorizedError('Invalid credentials')
    }
    const passwordMatches = await verifyPassword(user.passwordHash, body.password)
    if (!passwordMatches || !isAccountActive(user)) {
      throw new UnauthorizedError('Invalid credentials')
    }
    const { token } = issueAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    })

    // Issue refresh token (stored hashed; sent in httpOnly cookie)
    const refresh = generateRefreshToken()
    const family = randomUUID()
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.tokenHash,
        family,
        expiresAt: refresh.expiresAt,
      },
    })
    reply.setCookie('refreshToken', refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: getRefreshTokenTtlSeconds(),
      path: '/v1/auth',
    })

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    app.log.info({ userId: user.id }, 'Employee login')
    return {
      accessToken: token,
      expiresIn: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
      refreshToken: refresh.token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        employee: user.employee,
      },
    }
  })

  app.post('/request-otp', async (request) => {
    const body = OtpRequestSchema.parse(request.body)
    const user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { employee: true },
    })
    if (!user || user.role !== 'employee' || !isAccountActive(user)) {
      return { message: 'OTP sent (if account exists)' }
    }

    const { code, expiresAt } = generateOtp()
    const challengeCreated = await createEmployeeOtpChallenge(body.phone, code, expiresAt)
    if (!challengeCreated) return { message: 'OTP sent (if account exists)' }
    try {
      await sendEmployeeOtpSms(body.phone, code)
    } catch (error) {
      await deleteEmployeeOtpChallenge(body.phone)
      request.log.error({ err: error }, 'Employee OTP delivery failed')
      throw error
    }
    // OTP material is intentionally never returned or logged.
    return { message: 'OTP sent (if account exists)' }
  })

  app.post('/login-otp', async (request) => {
    const body = OtpLoginSchema.parse(request.body)
    if (!await verifyEmployeeOtpChallenge(body.phone, body.otp)) {
      throw new UnauthorizedError('Invalid OTP')
    }
    const user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { employee: true },
    })
    if (!user || user.role !== 'employee' || !isAccountActive(user)) {
      throw new UnauthorizedError('Invalid or expired OTP')
    }
    const { token } = issueAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    })

    const refresh = generateRefreshToken()
    const family = randomUUID()
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.tokenHash,
        family,
        expiresAt: refresh.expiresAt,
      },
    })

    return {
      accessToken: token,
      expiresIn: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
      refreshToken: refresh.token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        employee: user.employee,
      },
    }
  })

  app.post('/refresh', async (request, reply) => {
    // Accept refresh token from cookie OR body
    // Browser refresh calls commonly have no request body when the token is in
    // the httpOnly cookie, so treat an absent body as an empty object.
    const body = z.object({ refreshToken: z.string().optional() }).parse(request.body ?? {})
    const cookieToken = request.cookies.refreshToken
    const token = body.refreshToken ?? cookieToken
    if (!token) throw new UnauthorizedError('Missing refresh token')

    const tokenHash = hashRefreshToken(token)
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { employee: true } } },
    })
    if (!stored) throw new UnauthorizedError('Invalid refresh token')
    if (stored.revokedAt !== null) {
      // Token reuse detected — revoke entire family (BR-SEC-002)
      await prisma.refreshToken.updateMany({
        where: { family: stored.family },
        data: { revokedAt: new Date() },
      })
      throw new UnauthorizedError('Refresh token reuse detected; all sessions revoked')
    }
    if (new Date() > stored.expiresAt) {
      throw new UnauthorizedError('Refresh token expired')
    }
    if (!isAccountActive(stored.user)) {
      throw new UnauthorizedError('Account not active')
    }

    // Rotate with a compare-and-set claim. Concurrent reuse cannot mint two
    // descendants; a losing request revokes the whole family.
    const newRefresh = generateRefreshToken()
    const rotated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      if (claimed.count !== 1) return false
      const newStored = await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newRefresh.tokenHash,
          family: stored.family,
          expiresAt: newRefresh.expiresAt,
        },
      })
      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { replacedBy: newStored.id },
      })
      return true
    })
    if (!rotated) {
      await prisma.refreshToken.updateMany({
        where: { family: stored.family },
        data: { revokedAt: new Date() },
      })
      throw new UnauthorizedError('Refresh token reuse detected; all sessions revoked')
    }

    const access = issueAccessToken({
      userId: stored.user.id,
      tenantId: stored.user.tenantId,
      role: stored.user.role,
    })

    // Set refreshed cookie if came from cookie
    if (cookieToken) {
      reply.setCookie('refreshToken', newRefresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: getRefreshTokenTtlSeconds(),
        path: '/v1/auth',
      })
    }

    return {
      accessToken: access.token,
      expiresIn: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
      refreshToken: body.refreshToken ? newRefresh.token : undefined,
    }
  })

  app.post('/logout', async (_request, reply) => {
    const body = z.object({ refreshToken: z.string().optional() }).parse(_request.body ?? {})
    // Browser sessions use the cookie; native sessions send the token body.
    const cookieToken = _request.cookies.refreshToken
    const sessionTokens = [cookieToken, body.refreshToken].filter(
      (token): token is string => typeof token === 'string' && token.length > 0,
    )
    if (sessionTokens.length > 0) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: { in: sessionTokens.map((token) => hashRefreshToken(token)) },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      })
    }
    const totpChallenge = _request.cookies.totpChallenge
    if (totpChallenge) await deleteTotpChallenge(totpChallenge)
    reply.clearCookie('refreshToken', { path: '/v1/auth' })
    reply.clearCookie('totpChallenge', { path: '/' })
    return reply.status(204).send()
  })

  // Admin login (email + password) — for web admin and admin users
  app.post('/admin-login', async (request, reply) => {
    const body = AdminLoginSchema.parse(request.body)
    if (fixedAdmin2faCode && !isLoopbackAddress(request.ip)) {
      throw new UnauthorizedError('Invalid credentials')
    }
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { employee: true, totpCredential: true },
    })
    if (!user || !user.passwordHash || user.status !== 'active' || user.role === 'employee') {
      throw new UnauthorizedError('Invalid credentials')
    }
    const passwordMatches = await verifyPassword(user.passwordHash, body.password)
    if (!passwordMatches || !isAccountActive(user)) {
      throw new UnauthorizedError('Invalid credentials')
    }

    if (!user.totpCredential && !fixedAdmin2faCode) {
      throw new UnauthorizedError('Two-factor authentication enrollment required')
    }

    const challenge = await createTotpChallenge(user.id)
    reply.setCookie('totpChallenge', challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 300,
      path: '/',
    })
    return {
      message: '2FA verification required',
      expiresIn: 300,
    }
  })

  app.post('/verify-2fa', async (request, reply) => {
    const body = VerifyTwoFactorSchema.parse(request.body)
    if (fixedAdmin2faCode && !isLoopbackAddress(request.ip)) {
      throw new UnauthorizedError('Invalid or expired 2FA challenge')
    }
    const challenge = request.cookies.totpChallenge
    if (!challenge) throw new UnauthorizedError('Invalid or expired 2FA challenge')
    const userId = await consumeTotpChallengeAttempt(challenge)
    if (!userId) {
      reply.clearCookie('totpChallenge', { path: '/' })
      throw new UnauthorizedError('Invalid or expired 2FA challenge')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true, totpCredential: true },
    })
    if (!user || user.role === 'employee' || !isAccountActive(user)) {
      await deleteTotpChallenge(challenge)
      reply.clearCookie('totpChallenge', { path: '/' })
      throw new UnauthorizedError('Account not active')
    }

    if (fixedAdmin2faCode) {
      if (!matchesFixedAdmin2faCode(body.totpCode, fixedAdmin2faCode)) {
        throw new UnauthorizedError('Invalid 2FA code')
      }
    } else {
      if (!user.totpCredential) {
        await deleteTotpChallenge(challenge)
        reply.clearCookie('totpChallenge', { path: '/' })
        throw new UnauthorizedError('Two-factor authentication enrollment required')
      }
      const secret = decryptTotpSecret(user.totpCredential, `${user.tenantId}:${user.id}`)
      const acceptedCounter = verifyTotpCode({
        code: body.totpCode,
        secret,
        lastUsedCounter: user.totpCredential.lastUsedCounter,
      })
      if (acceptedCounter === null) throw new UnauthorizedError('Invalid 2FA code')

      const replayGuard = await prisma.totpCredential.updateMany({
        where: {
          userId: user.id,
          OR: [
            { lastUsedCounter: null },
            { lastUsedCounter: { lt: acceptedCounter } },
          ],
        },
        data: { lastUsedCounter: acceptedCounter },
      })
      if (replayGuard.count !== 1) throw new UnauthorizedError('TOTP code already used')
    }
    await deleteTotpChallenge(challenge)
    reply.clearCookie('totpChallenge', { path: '/' })

    const { token } = issueAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    })
    const refresh = generateRefreshToken()
    const family = randomUUID()
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.tokenHash,
        family,
        expiresAt: refresh.expiresAt,
      },
    })
    reply.setCookie('refreshToken', refresh.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: getRefreshTokenTtlSeconds(),
      path: '/v1/auth',
    })
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    app.log.info({
      userId: user.id,
      email: user.email,
      authFactor: fixedAdmin2faCode ? 'dev-fixed' : 'totp',
    }, 'Admin 2FA login')

    return {
      accessToken: token,
      expiresIn: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        employee: user.employee,
      },
    }
  })

  app.get('/me', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new UnauthorizedError()
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { employee: true },
    })
    if (!user) throw new NotFoundError('User')
    if (!isAccountActive(user)) {
      throw new UnauthorizedError('Account not active')
    }
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      employee: user.employee,
    }
  })
}
