// HTTP client to attendance API — reads attendance data for payroll calculation.
// Uses X-Internal-API-Key header for service-to-service auth.

import { DomainError, ForbiddenError, UnauthorizedError } from '@ak/shared'
import { getVietnamCalendarDateKey, isVietnamSunday } from '../engine/holidays.js'

interface AttendanceApiRecord {
  id: string
  shiftAssignmentId: string
  employeeId: string
  workDate: string
  checkInAt: string | null
  checkOutAt: string | null
  totalMinutesWorked: number | null
  overtimeMinutes: number | null
  lateMinutes: number | null
  status: string
}

const ATTENDANCE_STATUSES = new Set<AggregatedAttendanceRecord['status']>([
  'present',
  'late',
  'early_leave',
  'half_day',
  'absent',
  'on_leave',
  'holiday',
])

export interface AggregatedAttendanceRecord {
  date: Date
  status: 'present' | 'late' | 'early_leave' | 'half_day' | 'absent' | 'on_leave' | 'holiday'
  totalWorkMinutes: number
  overtimeMinutes: number
  lateMinutes: number
  isWeekend: boolean
}

const ATTENDANCE_REQUEST_TIMEOUT_MS = 5_000

/**
 * Pull attendance records for given employees in a date range from attendance API.
 * Server-to-server call; uses X-Internal-API-Key.
 */
export async function fetchAttendanceForPeriod(
  tenantId: string,
  employeeId: string,
  fromDate: Date,
  toDateExclusive: Date
): Promise<AggregatedAttendanceRecord[]> {
  const attendanceApiUrl = process.env.ATTENDANCE_API_URL ?? 'http://localhost:3000'
  const internalApiKey = process.env.INTERNAL_API_KEY ?? ''
  const url = new URL('/internal/attendance', attendanceApiUrl)
  url.searchParams.set('tenantId', tenantId)
  url.searchParams.set('employeeId', employeeId)
  url.searchParams.set('from', getVietnamCalendarDateKey(fromDate))
  // The attendance HTTP endpoint accepts an inclusive calendar-day `to`.
  // Convert our payroll half-open bound to its final included instant first.
  const finalIncludedInstant = new Date(toDateExclusive.getTime() - 1)
  url.searchParams.set('to', getVietnamCalendarDateKey(finalIncludedInstant))

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        'X-Internal-API-Key': internalApiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(ATTENDANCE_REQUEST_TIMEOUT_MS),
    })
  } catch {
    throw new DomainError(
      'ATTENDANCE_API_UNAVAILABLE',
      'Attendance API is unavailable',
      503,
    )
  }

  if (response.status === 401) throw new UnauthorizedError('Attendance API rejected the internal key')
  if (response.status === 403) throw new ForbiddenError('Attendance API denied the internal request')
  if (!response.ok) throw new DomainError(
    'ATTENDANCE_API_ERROR',
    `Attendance API returned ${response.status}`,
    502,
  )

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new DomainError('ATTENDANCE_API_ERROR', 'Attendance API returned invalid JSON', 502)
  }
  if (!isObject(json) || !Array.isArray(json.data)) {
    throw new DomainError('ATTENDANCE_API_ERROR', 'Attendance API returned an invalid payload', 502)
  }
  return json.data.map(mapRecord)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNullableNonNegativeInteger(value: unknown): value is number | null {
  return value === null || (Number.isInteger(value) && (value as number) >= 0)
}

function parseWorkDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

function mapRecord(value: unknown): AggregatedAttendanceRecord {
  if (!isObject(value)) {
    throw new DomainError('ATTENDANCE_API_ERROR', 'Attendance API returned an invalid record', 502)
  }
  const r = value as unknown as AttendanceApiRecord
  const date = parseWorkDate(r.workDate)
  if (
    !date
    || typeof r.id !== 'string'
    || typeof r.shiftAssignmentId !== 'string'
    || typeof r.employeeId !== 'string'
    || !ATTENDANCE_STATUSES.has(r.status as AggregatedAttendanceRecord['status'])
    || !isNullableNonNegativeInteger(r.totalMinutesWorked)
    || !isNullableNonNegativeInteger(r.overtimeMinutes)
    || !isNullableNonNegativeInteger(r.lateMinutes)
  ) {
    throw new DomainError('ATTENDANCE_API_ERROR', 'Attendance API returned an invalid record', 502)
  }
  return {
    date,
    status: r.status as AggregatedAttendanceRecord['status'],
    totalWorkMinutes: r.totalMinutesWorked ?? 0,
    overtimeMinutes: r.overtimeMinutes ?? 0,
    lateMinutes: r.lateMinutes ?? 0,
    isWeekend: isVietnamSunday(date),
  }
}
