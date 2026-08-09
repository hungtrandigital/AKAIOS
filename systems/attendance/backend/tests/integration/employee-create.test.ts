import { describe, expect, it } from 'vitest'
import { prisma, verifyPassword } from '@ak/shared'
import { createScopeFixture, skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Employee creation (integration)', () => {
  it('validates dates/hourly pay and rolls back user creation on employee conflict', async () => {
    const f = await createScopeFixture()
    const headers = { authorization: `Bearer ${f.adminToken}` }
    const phone = (prefix: string) => `+84${prefix}${String(Date.now()).slice(-7)}`
    const base = {
      fullName: 'Created Employee', hireDate: '2026-01-01',
      baseSalary: '10000000', salaryType: 'monthly',
    }
    try {
      const futurePhone = phone('71')
      const future = await f.app.inject({
        method: 'POST', url: '/v1/employees', headers,
        payload: { ...base, phone: futurePhone, hireDate: '2099-01-01' },
      })
      expect(future.statusCode).toBe(400)
      expect(await prisma.user.findUnique({ where: { phone: futurePhone } })).toBeNull()

      const incompleteHourly = await f.app.inject({
        method: 'POST', url: '/v1/employees', headers,
        payload: { ...base, phone: phone('72'), salaryType: 'hourly' },
      })
      expect(incompleteHourly.statusCode).toBe(400)

      const createdPhone = phone('73')
      const created = await f.app.inject({
        method: 'POST', url: '/v1/employees', headers,
        payload: { ...base, phone: createdPhone, employeeCode: `CREATE-${Date.now()}` },
      })
      expect(created.statusCode, created.body).toBe(200)
      const createdBody = created.json() as { id: string; temporaryPassword: string }
      expect(createdBody.temporaryPassword).toMatch(/^[A-Za-z0-9_-]{24}$/)
      const createdUser = await prisma.user.findUniqueOrThrow({ where: { phone: createdPhone } })
      expect(await verifyPassword(createdUser.passwordHash!, createdBody.temporaryPassword)).toBe(true)

      const invalidUpdate = await f.app.inject({
        method: 'PATCH', url: `/v1/employees/${createdBody.id}`, headers,
        payload: { salaryType: 'hourly' },
      })
      expect(invalidUpdate.statusCode).toBe(400)
      const validUpdate = await f.app.inject({
        method: 'PATCH', url: `/v1/employees/${createdBody.id}`, headers,
        payload: { salaryType: 'hourly', hourlyRate: '60000' },
      })
      expect(validUpdate.statusCode, validUpdate.body).toBe(200)

      const conflictPhone = phone('74')
      const conflict = await f.app.inject({
        method: 'POST', url: '/v1/employees', headers,
        payload: {
          ...base, phone: conflictPhone,
          employeeCode: f.teamMember.employee.employeeCode,
        },
      })
      expect(conflict.statusCode).toBe(409)
      expect(await prisma.user.findUnique({ where: { phone: conflictPhone } })).toBeNull()
    } finally {
      await f.cleanup()
    }
  })
})
