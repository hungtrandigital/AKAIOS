// Smoke test for payroll API health route

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

// Set required env vars BEFORE any imports of src code
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.PAYROLL_API_PORT = '3001'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.JWT_SECRET = 'test_secret_32_characters_minimum_for_pass'
  process.env.JWT_ACCESS_TTL_SECONDS = '900'
  process.env.INTERNAL_API_KEY = 'test_internal_api_key_32_chars_min'
  process.env.ATTENDANCE_API_URL = 'http://localhost:3000'
})

import { buildServer } from '../../src/server.js'
import { issueAccessToken, prisma } from '@ak/shared'
import { fetchAttendanceForPeriod } from '../../src/clients/attendance-client.js'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const TENANT_ID = '00000000-0000-4000-8000-000000000002'
const ENTITY_ID = '00000000-0000-4000-8000-000000000003'

function authorizationHeader(): string {
  const { token } = issueAccessToken({
    userId: USER_ID,
    tenantId: TENANT_ID,
    role: 'bo_admin',
  })
  return `Bearer ${token}`
}

function grantPermissions(...codes: string[]) {
  return vi.spyOn(prisma.rolePermission, 'findMany').mockResolvedValue(
    codes.map((code) => ({ permission: { code } })) as never
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('payroll health routes', () => {
  it('GET /health/live returns ok', async () => {
    const { app } = await buildServer()
    const response = await app.inject({ method: 'GET', url: '/health/live' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.service).toBe('payroll-api')
    await app.close()
  })
})

describe('payroll route authorization and tenant boundaries', () => {
  it.each([
    ['GET periods', 'payroll.open', { method: 'GET', url: '/v1/payroll/periods' }],
    ['POST calculate', 'payroll.open', { method: 'POST', url: `/v1/payroll/periods/${ENTITY_ID}/calculate` }],
    [
      'POST override',
      'payroll.approve',
      {
        method: 'POST',
        url: `/v1/payroll/lines/${ENTITY_ID}/override`,
        payload: { reason: 'valid override reason' },
      },
    ],
  ] as const)('rejects %s when only %s is granted', async (_name, granted, request) => {
    grantPermissions(granted)
    const { app } = await buildServer()
    const response = await app.inject({
      ...request,
      headers: { authorization: authorizationHeader() },
    })

    expect(response.statusCode).toBe(403)
    await app.close()
  })

  it.each([
    ['GET', `/v1/payroll/periods/${ENTITY_ID}`, 'payroll.view'],
    ['POST', `/v1/payroll/periods/${ENTITY_ID}/calculate`, 'payroll.calculate'],
    ['POST', `/v1/payroll/periods/${ENTITY_ID}/approve`, 'payroll.approve'],
    ['POST', `/v1/payroll/periods/${ENTITY_ID}/lock`, 'payroll.lock'],
    ['POST', `/v1/payroll/periods/${ENTITY_ID}/mark-paid`, 'payroll.approve'],
  ] as const)('%s %s scopes the period lookup to the authenticated tenant', async (method, url, permission) => {
    grantPermissions(permission)
    const periodLookup = vi.spyOn(prisma.payrollPeriod, 'findFirst').mockResolvedValue(null)
    const { app } = await buildServer()
    const response = await app.inject({
      method,
      url,
      headers: { authorization: authorizationHeader() },
    })

    expect(response.statusCode).toBe(404)
    expect(periodLookup).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: ENTITY_ID, tenantId: TENANT_ID },
    }))
    await app.close()
  })

  it('scopes payroll-line override lookup through the authenticated tenant', async () => {
    grantPermissions('payroll.override')
    const lineLookup = vi.spyOn(prisma.payrollLine, 'findFirst').mockResolvedValue(null)
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/lines/${ENTITY_ID}/override`,
      headers: { authorization: authorizationHeader() },
      payload: { reason: 'valid override reason' },
    })

    expect(response.statusCode).toBe(404)
    expect(lineLookup).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: ENTITY_ID,
        payrollPeriod: { tenantId: TENANT_ID },
      },
    }))
    await app.close()
  })

  it('rejects negative override money before touching payroll data', async () => {
    grantPermissions('payroll.override')
    const lineLookup = vi.spyOn(prisma.payrollLine, 'findFirst')
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/lines/${ENTITY_ID}/override`,
      headers: { authorization: authorizationHeader() },
      payload: { reason: 'valid override reason', advance: '-1' },
    })

    expect(response.statusCode).toBe(400)
    expect(lineLookup).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects setting and clearing an allowance override together', async () => {
    grantPermissions('payroll.override')
    const lineLookup = vi.spyOn(prisma.payrollLine, 'findFirst')
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/lines/${ENTITY_ID}/override`,
      headers: { authorization: authorizationHeader() },
      payload: {
        reason: 'valid override reason',
        allowances: '0',
        clearAllowancesOverride: true,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(lineLookup).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects overrides once a payroll period is approved', async () => {
    grantPermissions('payroll.override')
    vi.spyOn(prisma.payrollLine, 'findFirst').mockResolvedValue({
      id: ENTITY_ID,
      payrollPeriod: { status: 'approved' },
    } as never)
    const transaction = vi.spyOn(prisma, '$transaction')
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/lines/${ENTITY_ID}/override`,
      headers: { authorization: authorizationHeader() },
      payload: { reason: 'valid override reason' },
    })

    expect(response.statusCode).toBe(422)
    expect(transaction).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects an executable compliance rule outside ADR-003', async () => {
    grantPermissions('payroll.rules.manage')
    const transaction = vi.spyOn(prisma, '$transaction')
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: '/v1/payroll/rules',
      headers: { authorization: authorizationHeader() },
      payload: {
        effectiveFrom: '2026-08-01',
        otWeekdayMultiplier: 1.5,
        otWeekendMultiplier: 2,
        otHolidayMultiplier: 3,
        taxMode: 'full',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(transaction).not.toHaveBeenCalled()
    await app.close()
  })

  it('does not let payroll approvers mutate payroll rules', async () => {
    grantPermissions('payroll.approve')
    const transaction = vi.spyOn(prisma, '$transaction')
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: '/v1/payroll/rules',
      headers: { authorization: authorizationHeader() },
      payload: {
        effectiveFrom: '2026-08-01',
        otWeekdayMultiplier: 1.5,
        otWeekendMultiplier: 2,
        otHolidayMultiplier: 3,
      },
    })

    expect(response.statusCode).toBe(403)
    expect(transaction).not.toHaveBeenCalled()
    await app.close()
  })
})

describe('payroll calculation transaction and recalculation', () => {
  const basePeriod = {
    id: ENTITY_ID,
    tenantId: TENANT_ID,
    year: 2026,
    month: 7,
    status: 'open',
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
    tenant: { id: TENANT_ID },
  }
  const mvpRule = {
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: null,
    otWeekdayMultiplier: 1.5,
    otWeekendMultiplier: 2,
    otHolidayMultiplier: 3,
    latePenaltyPerMinute: null,
    maxLatePenaltyPerDay: null,
    mealAllowancePerDay: null,
    phoneAllowance: null,
    roundingMinutes: 15,
    workingHoursPerDay: 8,
    standardWorkingDaysPerMonth: 26,
    taxMode: 'none',
    bhxhRateNv: null,
    bhxhRateDn: null,
    bhytRateNv: null,
    bhytRateDn: null,
    bhtnRateNv: null,
    bhtnRateDn: null,
  }

  it('queries the tenant-bound Attendance API with an inclusive final day', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchAttendanceForPeriod(
      TENANT_ID,
      ENTITY_ID,
      new Date('2026-06-30T17:00:00.000Z'),
      new Date('2026-07-31T17:00:00.000Z'),
    )

    const requestedUrl = new URL(fetchMock.mock.calls[0]![0] as string)
    expect(requestedUrl.pathname).toBe('/internal/attendance')
    expect(Object.fromEntries(requestedUrl.searchParams)).toEqual({
      tenantId: TENANT_ID,
      employeeId: ENTITY_ID,
      from: '2026-07-01',
      to: '2026-07-31',
    })
    expect(fetchMock.mock.calls[0]![1]).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ 'X-Internal-API-Key': expect.any(String) }),
    }))
  })

  it('validates payroll rules before opening a write transaction', async () => {
    grantPermissions('payroll.calculate')
    vi.spyOn(prisma.payrollPeriod, 'findFirst').mockResolvedValue(basePeriod as never)
    vi.spyOn(prisma.payrollRule, 'findFirst').mockResolvedValue(null)
    const transaction = vi.spyOn(prisma, '$transaction')
    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/periods/${ENTITY_ID}/calculate`,
      headers: { authorization: authorizationHeader() },
    })

    expect(response.statusCode).toBe(404)
    expect(transaction).not.toHaveBeenCalled()
    await app.close()
  })

  it.each([
    {
      label: 'bad gateway',
      arrangeFetch: () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })),
      statusCode: 502,
      code: 'ATTENDANCE_API_ERROR',
      message: 'Attendance service returned an invalid response',
    },
    {
      label: 'unavailable',
      arrangeFetch: () => vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('private network failure details')),
      ),
      statusCode: 503,
      code: 'ATTENDANCE_API_UNAVAILABLE',
      message: 'Attendance service is unavailable',
    },
  ])('returns a safe $statusCode response when Attendance API is $label', async ({
    arrangeFetch,
    statusCode,
    code,
    message,
  }) => {
    grantPermissions('payroll.calculate')
    vi.spyOn(prisma.payrollPeriod, 'findFirst').mockResolvedValue(basePeriod as never)
    vi.spyOn(prisma.payrollRule, 'findFirst').mockResolvedValue(mvpRule as never)
    vi.spyOn(prisma.employee, 'findMany').mockResolvedValue([{
      id: ENTITY_ID,
      tenantId: TENANT_ID,
      baseSalary: '10000000',
      salaryType: 'monthly',
      hourlyRate: null,
    }] as never)
    vi.spyOn(prisma.payrollLine, 'findMany').mockResolvedValue([])
    const transaction = vi.spyOn(prisma, '$transaction')
    arrangeFetch()

    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/periods/${ENTITY_ID}/calculate`,
      headers: { authorization: authorizationHeader() },
    })

    expect(response.statusCode).toBe(statusCode)
    expect(response.json()).toEqual({ error: { code, message } })
    expect(response.body).not.toContain('private network failure details')
    expect(transaction).not.toHaveBeenCalled()
    await app.close()
  })

  it('atomically recalculates a calculated period and writes an audit event', async () => {
    grantPermissions('payroll.calculate')
    vi.spyOn(prisma.payrollPeriod, 'findFirst').mockResolvedValue({
      ...basePeriod,
      status: 'calculated',
    } as never)
    vi.spyOn(prisma.payrollRule, 'findFirst').mockResolvedValue(mvpRule as never)
    vi.spyOn(prisma.employee, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.payrollLine, 'findMany').mockResolvedValue([])

    const updatePeriod = vi.fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
    const audit = vi.fn().mockResolvedValue({})
    const tx = {
      payrollPeriod: { updateMany: updatePeriod },
      payrollLine: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        upsert: vi.fn(),
      },
      auditLog: { create: audit },
    }
    vi.spyOn(prisma, '$transaction').mockImplementation(
      (async (callback: (client: typeof tx) => unknown) => callback(tx)) as never
    )

    const { app } = await buildServer()
    const response = await app.inject({
      method: 'POST',
      url: `/v1/payroll/periods/${ENTITY_ID}/calculate`,
      headers: { authorization: authorizationHeader() },
    })

    expect(response.statusCode).toBe(200)
    expect(updatePeriod).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        id: ENTITY_ID,
        tenantId: TENANT_ID,
        status: 'calculated',
        updatedAt: basePeriod.updatedAt,
      }),
      data: { status: 'calculating' },
    }))
    expect(updatePeriod).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { id: ENTITY_ID, tenantId: TENANT_ID, status: 'calculating' },
      data: expect.objectContaining({ status: 'calculated', totalEmployees: 0 }),
    }))
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'calculate_payroll',
        previousValue: { status: 'calculated', recalculation: true },
      }),
    }))
    await app.close()
  })
})
