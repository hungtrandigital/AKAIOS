import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Authentication flow (integration)', () => {
  it('enforces passwords, OTP/TOTP, atomic refresh rotation and logout', { timeout: 60_000 }, async () => {
    process.env.NODE_ENV = 'test'
    process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64')
    const shared = await import('@ak/shared')
    const {
      createEmployeeOtpChallenge, createTotpChallenge, deleteEmployeeOtpChallenge,
      encryptTotpSecret, generateTotpCode, generateTotpSecret, hashPassword,
      consumeTotpChallengeAttempt, prisma, verifyEmployeeOtpChallenge,
    } = shared
    const suffix = randomUUID().slice(0, 8)
    const tenant = await prisma.tenant.create({ data: { name: `Auth ${suffix}` } })
    const employeeUser = await prisma.user.create({
      data: {
        tenantId: tenant.id, phone: phone('1'), passwordHash: await hashPassword('employee-secret'),
        role: 'employee',
      },
    })
    await prisma.employee.create({
      data: {
        tenantId: tenant.id, userId: employeeUser.id, employeeCode: `AUTH-${suffix}`,
        fullName: 'Auth Employee', hireDate: new Date('2026-01-01'),
        baseSalary: '10000000', salaryType: 'monthly',
      },
    })
    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id, phone: phone('2'), email: `auth-${suffix}@ak.local`,
        passwordHash: await hashPassword('admin-secret'), role: 'system_admin',
      },
    })
    const totpSecret = generateTotpSecret()
    await prisma.totpCredential.create({
      data: { userId: adminUser.id, ...encryptTotpSecret(totpSecret, `${tenant.id}:${adminUser.id}`) },
    })
    const { buildServer } = await import('../../src/server.js')
    const { app } = await buildServer()
    const inject = (url: string, payload: object, headers?: Record<string, string>) => app.inject({
      method: 'POST', url, payload, headers,
    })
    try {
      expect((await inject('/v1/auth/login', {
        phone: employeeUser.phone, password: 'wrong-password',
      })).statusCode).toBe(401)
      const employeeLogin = await inject('/v1/auth/login', {
        phone: employeeUser.phone, password: 'employee-secret',
      })
      expect(employeeLogin.statusCode).toBe(200)
      expect(employeeLogin.json()).toMatchObject({
        accessToken: expect.any(String), refreshToken: expect.any(String),
      })
      const originalRefresh = employeeLogin.json().refreshToken as string
      const rotations = await Promise.all([
        inject('/v1/auth/refresh', { refreshToken: originalRefresh }),
        inject('/v1/auth/refresh', { refreshToken: originalRefresh }),
      ])
      expect(rotations.filter((response) => response.statusCode === 200)).toHaveLength(1)
      expect(rotations.filter((response) => response.statusCode === 401)).toHaveLength(1)
      const descendant = rotations.find((response) => response.statusCode === 200)!
        .json().refreshToken as string
      expect((await inject('/v1/auth/refresh', { refreshToken: descendant })).statusCode).toBe(401)

      const knownOtp = '123456'
      expect(await createEmployeeOtpChallenge(
        employeeUser.phone, knownOtp, new Date(Date.now() + 300_000),
      )).toBe(true)
      const otpLogin = await inject('/v1/auth/login-otp', { phone: employeeUser.phone, otp: knownOtp })
      expect(otpLogin.statusCode).toBe(200)
      const otpRefresh = await inject('/v1/auth/refresh', {
        refreshToken: otpLogin.json().refreshToken,
      })
      expect(otpRefresh.statusCode).toBe(200)
      expect((await inject('/v1/auth/logout', {
        refreshToken: otpRefresh.json().refreshToken,
      })).statusCode).toBe(204)
      expect((await inject('/v1/auth/refresh', {
        refreshToken: otpRefresh.json().refreshToken,
      })).statusCode).toBe(401)

      expect(await createEmployeeOtpChallenge(
        employeeUser.phone, '654321', new Date(Date.now() + 300_000),
      )).toBe(true)
      for (let attempt = 0; attempt < 5; attempt += 1) {
        expect(await verifyEmployeeOtpChallenge(employeeUser.phone, '000000')).toBe(false)
      }
      expect(await verifyEmployeeOtpChallenge(employeeUser.phone, '654321')).toBe(false)
      expect(await createEmployeeOtpChallenge(
        employeeUser.phone, '111111', new Date(Date.now() + 300_000),
      )).toBe(false)

      await prisma.employee.update({ where: { userId: employeeUser.id }, data: { status: 'inactive' } })
      expect((await inject('/v1/auth/login', {
        phone: employeeUser.phone, password: 'employee-secret',
      })).statusCode).toBe(401)
      await prisma.employee.update({ where: { userId: employeeUser.id }, data: { status: 'active' } })

      expect((await inject('/v1/auth/admin-login', {
        email: adminUser.email!, password: 'wrong-password',
      })).statusCode).toBe(401)
      await prisma.user.update({ where: { id: adminUser.id }, data: { status: 'suspended' } })
      expect((await inject('/v1/auth/admin-login', {
        email: adminUser.email!, password: 'admin-secret',
      })).statusCode).toBe(401)
      await prisma.user.update({ where: { id: adminUser.id }, data: { status: 'active' } })
      const challenge = await inject('/v1/auth/admin-login', {
        email: adminUser.email!, password: 'admin-secret',
      })
      expect(challenge.statusCode).toBe(200)
      expect(challenge.json().accessToken).toBeUndefined()
      expect(challenge.json().tempToken).toBeUndefined()
      const cookie = challenge.headers['set-cookie']!.split(';', 1)[0]!
      expect((await inject('/v1/auth/verify-2fa', { totpCode: '000000' }, { cookie })).statusCode)
        .toBe(401)
      const counter = BigInt(Math.floor(Date.now() / 30_000))
      const verified = await inject('/v1/auth/verify-2fa', {
        totpCode: generateTotpCode(totpSecret, counter),
      }, { cookie })
      expect(verified.statusCode).toBe(200)
      expect(verified.json().accessToken).toEqual(expect.any(String))
      const capped = await createTotpChallenge(adminUser.id)
      for (let attempt = 0; attempt < 5; attempt += 1) {
        expect(await consumeTotpChallengeAttempt(capped)).toBe(adminUser.id)
      }
      expect(await consumeTotpChallengeAttempt(capped)).toBeNull()
    } finally {
      await app.close()
      await deleteEmployeeOtpChallenge(employeeUser.phone)
      await prisma.refreshToken.deleteMany({ where: { userId: { in: [employeeUser.id, adminUser.id] } } })
      await prisma.employee.deleteMany({ where: { userId: employeeUser.id } })
      await prisma.user.deleteMany({ where: { id: { in: [employeeUser.id, adminUser.id] } } })
      await prisma.tenant.delete({ where: { id: tenant.id } })
      delete process.env.TOTP_ENCRYPTION_KEY
      await prisma.$disconnect()
    }
  })
})

function phone(prefix: string): string {
  return `+849${prefix}${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}
