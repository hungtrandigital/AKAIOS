import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@ak/shared'
import { internalAttendanceRoutes } from '../../src/routes/internal.js'

const INTERNAL_KEY = 'test-internal-key-at-least-32-characters'
const TENANT_ID = '00000000-0000-4000-8000-000000000001'
const EMPLOYEE_ID = '00000000-0000-4000-8000-000000000002'

afterEach(() => {
  vi.restoreAllMocks()
})

async function buildInternalApp(limit?: number) {
  const app = Fastify()
  if (limit) await app.register(rateLimit, { max: limit, timeWindow: '1 minute' })
  await app.register(internalAttendanceRoutes(INTERNAL_KEY), { prefix: '/internal' })
  return app
}

describe('internal attendance projection', () => {
  it('requires the internal key and scopes the query through tenant relations', async () => {
    const lookup = vi.spyOn(prisma.attendanceRecord, 'findMany').mockResolvedValue([{
      id: 'record', shiftAssignmentId: 'assignment', employeeId: EMPLOYEE_ID,
      checkInAt: null, checkOutAt: null, totalMinutesWorked: 0,
      overtimeMinutes: 0, lateMinutes: 0, status: 'holiday',
      shiftAssignment: { date: new Date('2026-07-31T00:00:00.000Z') },
    }] as never)
    const app = await buildInternalApp()
    const query = `tenantId=${TENANT_ID}&employeeId=${EMPLOYEE_ID}&from=2026-07-01&to=2026-07-31`

    const unauthorized = await app.inject({
      method: 'GET',
      url: `/internal/attendance?${query}`,
      headers: { 'x-internal-api-key': 'wrong' },
    })
    expect(unauthorized.statusCode).toBe(401)
    expect(lookup).not.toHaveBeenCalled()

    const response = await app.inject({
      method: 'GET',
      url: `/internal/attendance?${query}`,
      headers: { 'x-internal-api-key': INTERNAL_KEY },
    })
    expect(response.statusCode).toBe(200)
    expect(lookup).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        employeeId: EMPLOYEE_ID,
        shiftAssignment: { date: {
          gte: new Date('2026-07-01T00:00:00.000Z'),
          lte: new Date('2026-07-31T00:00:00.000Z'),
        } },
        employee: { tenantId: TENANT_ID, deletedAt: null },
        project: { tenantId: TENANT_ID, deletedAt: null },
      }),
    }))
    expect(response.json().data).toEqual([expect.objectContaining({
      workDate: '2026-07-31', checkInAt: null, status: 'holiday',
    })])
    await app.close()
  })

  it('rejects invalid or reversed calendar ranges before querying', async () => {
    const lookup = vi.spyOn(prisma.attendanceRecord, 'findMany').mockResolvedValue([])
    const app = await buildInternalApp()
    for (const range of [
      'from=2026-02-31&to=2026-03-01',
      'from=2026-08-01&to=2026-07-31',
      'from=2026-01-01&to=2027-01-02',
    ]) {
      const response = await app.inject({
        method: 'GET',
        url: `/internal/attendance?tenantId=${TENANT_ID}&employeeId=${EMPLOYEE_ID}&${range}`,
        headers: { 'x-internal-api-key': INTERNAL_KEY },
      })
      expect(response.statusCode).toBe(400)
    }
    expect(lookup).not.toHaveBeenCalled()
    await app.close()
  })

  it('is exempt from the public rate limit for full-period payroll reads', async () => {
    vi.spyOn(prisma.attendanceRecord, 'findMany').mockResolvedValue([])
    const app = await buildInternalApp(1)
    const url = `/internal/attendance?tenantId=${TENANT_ID}&employeeId=${EMPLOYEE_ID}&from=2026-07-01&to=2026-07-31`
    for (let requestNumber = 0; requestNumber < 2; requestNumber += 1) {
      const response = await app.inject({
        method: 'GET', url, headers: { 'x-internal-api-key': INTERNAL_KEY },
      })
      expect(response.statusCode).toBe(200)
    }
    await app.close()
  })
})
