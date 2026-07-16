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
  generateOtp,
  getSmsMode,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenTtlSeconds,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { randomUUID } from 'node:crypto'

const otpStore = new Map<string, { code: string; expiresAt: Date }>()

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

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body)
    const user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { employee: true },
    })
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials')
    }
    if (body.password.length < 8) {
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
    const { code, expiresAt } = generateOtp()
    otpStore.set(body.phone, { code, expiresAt })
    if (getSmsMode() === 'mock') {
      app.log.info({ phone: body.phone, otp: code }, 'MOCK MODE — OTP would be sent via SMS')
    }
    return { message: 'OTP sent (if account exists)' }
  })

  app.post('/login-otp', async (request) => {
    const body = OtpLoginSchema.parse(request.body)
    const stored = otpStore.get(body.phone)
    if (!stored) throw new ValidationError('No OTP requested for this phone')
    if (new Date() > stored.expiresAt) {
      otpStore.delete(body.phone)
      throw new ValidationError('OTP expired')
    }
    if (stored.code !== body.otp) {
      throw new UnauthorizedError('Invalid OTP')
    }
    otpStore.delete(body.phone)
    const user = await prisma.user.findUnique({
      where: { phone: body.phone },
      include: { employee: true },
    })
    if (!user) throw new NotFoundError('User', body.phone)
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
    const body = z.object({ refreshToken: z.string().optional() }).parse(request.body)
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
    if (stored.user.status !== 'active') {
      throw new UnauthorizedError('Account not active')
    }

    // Rotate: revoke old, issue new in same family
    const newRefresh = generateRefreshToken()
    const newStored = await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: newRefresh.tokenHash,
        family: stored.family,
        expiresAt: newRefresh.expiresAt,
      },
    })
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: newStored.id },
    })

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
    // Revoke all refresh tokens for this session
    const cookieToken = _request.cookies.refreshToken
    if (cookieToken) {
      const tokenHash = hashRefreshToken(cookieToken)
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    reply.clearCookie('refreshToken', { path: '/v1/auth' })
    return reply.status(204).send()
  })

  // Admin login (email + password) — for web admin and admin users
  app.post('/admin-login', async (request, reply) => {
    const body = AdminLoginSchema.parse(request.body)
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { employee: true },
    })
    if (!user || !user.passwordHash || user.status !== 'active') {
      throw new UnauthorizedError('Invalid credentials')
    }
    if (body.password.length < 8) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const { token } = issueAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    })

    const refresh = generateRefreshToken()
    const { randomUUID } = await import('node:crypto')
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
    app.log.info({ userId: user.id, email: user.email }, 'Admin login')

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
