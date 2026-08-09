import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAttendanceForPeriod } from '../../src/clients/attendance-client.js'

const TENANT_ID = '00000000-0000-4000-8000-000000000001'
const EMPLOYEE_ID = '00000000-0000-4000-8000-000000000002'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('attendance HTTP client', () => {
  it('uses workDate for null-timestamp holiday and weekend classification', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{
          id: 'record', shiftAssignmentId: 'assignment', employeeId: EMPLOYEE_ID,
          workDate: '2026-07-12', checkInAt: null, checkOutAt: null,
          totalMinutesWorked: null, overtimeMinutes: null, lateMinutes: null,
          status: 'holiday',
        }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const records = await fetchAttendanceForPeriod(
      TENANT_ID, EMPLOYEE_ID,
      new Date('2026-06-30T17:00:00.000Z'),
      new Date('2026-07-31T17:00:00.000Z'),
    )

    expect(records[0]).toMatchObject({
      date: new Date('2026-07-12T00:00:00.000Z'), status: 'holiday', isWeekend: true,
    })
    expect(fetchMock.mock.calls[0]![1]).toEqual(expect.objectContaining({
      signal: expect.any(AbortSignal),
    }))
  })

  it('maps transport failures to service unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    await expect(fetchAttendanceForPeriod(
      TENANT_ID, EMPLOYEE_ID, new Date('2026-07-01'), new Date('2026-08-01'),
    )).rejects.toMatchObject({ code: 'ATTENDANCE_API_UNAVAILABLE', statusCode: 503 })
  })

  it('preserves worked assignment identifiers and attendance timestamps', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{
          id: 'record',
          shiftAssignmentId: 'assignment',
          employeeId: EMPLOYEE_ID,
          workDate: '2026-07-13',
          checkInAt: '2026-07-13T01:00:00.000Z',
          checkOutAt: '2026-07-13T09:00:00.000Z',
          totalMinutesWorked: 480,
          overtimeMinutes: 0,
          lateMinutes: 0,
          status: 'present',
        }],
      }),
    }))

    const [record] = await fetchAttendanceForPeriod(
      TENANT_ID, EMPLOYEE_ID, new Date('2026-07-01'), new Date('2026-08-01'),
    )

    expect(record).toMatchObject({
      shiftAssignmentId: 'assignment',
      employeeId: EMPLOYEE_ID,
      checkInAt: new Date('2026-07-13T01:00:00.000Z'),
      checkOutAt: new Date('2026-07-13T09:00:00.000Z'),
    })
  })

  it('distinguishes authentication, authorization, and upstream failures', async () => {
    for (const [status, code, statusCode] of [
      [401, 'UNAUTHORIZED', 401],
      [403, 'FORBIDDEN', 403],
      [503, 'ATTENDANCE_API_ERROR', 502],
    ] as const) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))
      await expect(fetchAttendanceForPeriod(
        TENANT_ID, EMPLOYEE_ID, new Date('2026-07-01'), new Date('2026-08-01'),
      )).rejects.toMatchObject({ code, statusCode })
    }
  })

  it('rejects an invalid upstream payload as a bad gateway', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ records: [] }),
    }))

    await expect(fetchAttendanceForPeriod(
      TENANT_ID, EMPLOYEE_ID, new Date('2026-07-01'), new Date('2026-08-01'),
    )).rejects.toMatchObject({ code: 'ATTENDANCE_API_ERROR', statusCode: 502 })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({
        data: [{
          id: 'record', shiftAssignmentId: 'assignment', employeeId: EMPLOYEE_ID,
          workDate: '2026-02-31', totalMinutesWorked: -1,
          overtimeMinutes: null, lateMinutes: null, status: 'invented',
        }],
      }),
    }))

    await expect(fetchAttendanceForPeriod(
      TENANT_ID, EMPLOYEE_ID, new Date('2026-07-01'), new Date('2026-08-01'),
    )).rejects.toMatchObject({ code: 'ATTENDANCE_API_ERROR', statusCode: 502 })
  })
})
