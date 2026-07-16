// HTTP client to attendance API — reads attendance data for payroll calculation.
// Uses X-Internal-API-Key header for service-to-service auth.

import { prisma, Money, UnauthorizedError } from '@ak/shared'

const ATTENDANCE_API_URL = process.env.ATTENDANCE_API_URL ?? 'http://localhost:3000'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? ''

interface AttendanceApiRecord {
  id: string
  shiftAssignmentId: string
  employeeId: string
  checkInAt: string | null
  checkOutAt: string | null
  totalMinutesWorked: number | null
  overtimeMinutes: number | null
  lateMinutes: number | null
  status: string
}

export interface AggregatedAttendanceRecord {
  date: Date
  status: 'present' | 'late' | 'early_leave' | 'half_day' | 'absent' | 'on_leave' | 'holiday'
  totalWorkMinutes: number
  overtimeMinutes: number
  lateMinutes: number
  isWeekend: boolean
}

/**
 * Pull attendance records for given employees in a date range from attendance API.
 * Server-to-server call; uses X-Internal-API-Key.
 */
export async function fetchAttendanceForPeriod(
  employeeId: string,
  fromDate: Date,
  toDate: Date
): Promise<AggregatedAttendanceRecord[]> {
  const url = new URL('/api/internal/attendance', ATTENDANCE_API_URL)
  url.searchParams.set('employeeId', employeeId)
  url.searchParams.set('from', fromDate.toISOString().split('T')[0]!)
  url.searchParams.set('to', toDate.toISOString().split('T')[0]!)

  const response = await fetch(url.toString(), {
    headers: {
      'X-Internal-API-Key': INTERNAL_API_KEY,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new UnauthorizedError(`Attendance API error: ${response.status}`)
  }

  const json = (await response.json()) as { data: AttendanceApiRecord[] }
  return json.data.map(mapRecord)
}

function mapRecord(r: AttendanceApiRecord): AggregatedAttendanceRecord {
  const date = r.checkInAt ? new Date(r.checkInAt) : new Date()
  return {
    date,
    status: r.status as AggregatedAttendanceRecord['status'],
    totalWorkMinutes: r.totalMinutesWorked ?? 0,
    overtimeMinutes: r.overtimeMinutes ?? 0,
    lateMinutes: r.lateMinutes ?? 0,
    isWeekend: date.getDay() === 0, // Sunday only
  }
}

/**
 * Local fallback: query attendance directly via Prisma (used during development
 * or when internal API is unavailable). Reuses the same attendance DB.
 */
export async function fetchAttendanceLocal(
  employeeId: string,
  fromDate: Date,
  toDate: Date
): Promise<AggregatedAttendanceRecord[]> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      checkInAt: { gte: fromDate, lte: toDate },
    },
    orderBy: { checkInAt: 'asc' },
  })

  return records.map((r) => {
    const date = r.checkInAt ?? new Date()
    return {
      date,
      status: r.status as AggregatedAttendanceRecord['status'],
      totalWorkMinutes: r.totalMinutesWorked ?? 0,
      overtimeMinutes: r.overtimeMinutes ?? 0,
      lateMinutes: r.lateMinutes ?? 0,
      isWeekend: date.getDay() === 0,
    }
  })
}

/** Load all active employees for the tenant. */
export async function listActiveEmployees(tenantId: string): Promise<Array<{ id: string; baseSalary: Money; salaryType: 'monthly' | 'hourly' }>> {
  const employees = await prisma.employee.findMany({
    where: { tenantId, status: 'active', deletedAt: null },
  })
  return employees.map((e) => ({
    id: e.id,
    baseSalary: Money.fromVNĐ(e.baseSalary.toString()),
    salaryType: e.salaryType as 'monthly' | 'hourly',
  }))
}

// Re-export Money for callers
export { Money }

