// Shared test utilities — avoids duplication between engine.test.ts and calculator.test.ts

import type { AttendanceRecord } from '../../src/engine/calculator.js'
import { isWeekend } from '../../src/engine/calculator.js'

export function makeAttendance(
  date: Date,
  status: AttendanceRecord['status'],
  totalWorkMinutes: number,
  overtimeMinutes = 0,
  lateMinutes = 0
): AttendanceRecord {
  return {
    date,
    status,
    totalWorkMinutes,
    overtimeMinutes,
    lateMinutes,
    isWeekend: isWeekend(date),
  }
}

/**
 * Build attendance records for the first N Mon-Sat dates of a month.
 * Skips Sundays automatically — Sunday work counts as weekend OT (different pay).
 */
export function buildWeekdayAttendance(
  year: number,
  month: number,
  count: number,
  opts: {
    totalWorkMinutes?: number
    overtimeMinutes?: number
    lateMinutes?: number
    status?: AttendanceRecord['status']
  } = {}
): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  let day = 1
  while (records.length < count && day <= 31) {
    const date = new Date(year, month, day)
    if (!isWeekend(date)) {
      records.push({
        date,
        status: opts.status ?? 'present',
        totalWorkMinutes: opts.totalWorkMinutes ?? 480,
        overtimeMinutes: opts.overtimeMinutes ?? 0,
        lateMinutes: opts.lateMinutes ?? 0,
        isWeekend: false,
      })
    }
    day++
  }
  return records
}
