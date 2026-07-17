// AttendanceService — implements BR-ATT-001 through BR-ATT-010.
// Pure-ish (no DB calls) — takes snapshots, returns computed status.

import { AttendanceStatus, BusinessRuleViolationError } from '@ak/shared'

export interface ShiftTimeInfo {
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  breakMinutes: number
  lateThresholdMinutes: number
  isOvernight: boolean
}

export interface AttendanceTimes {
  scheduledStart: Date  // shift start as Date on assignment.date
  scheduledEnd: Date
  checkInAt: Date | null
  checkOutAt: Date | null
}

/** Parse "HH:mm" into { hours, minutes }. */
export function parseShiftTime(time: string): { hours: number; minutes: number } {
  const parts = time.split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const m = parseInt(parts[1] ?? '0', 10)
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new BusinessRuleViolationError(`Invalid shift time format: ${time}`)
  }
  return { hours: h, minutes: m }
}

/** Build a Date for a given calendar date + "HH:mm" string. */
export function buildShiftDateTime(date: Date, time: string, isNextDay = false): Date {
  const { hours, minutes } = parseShiftTime(time)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  if (isNextDay) result.setDate(result.getDate() + 1)
  return result
}

/**
 * BR-ATT-002: Compute attendance status based on check-in/out times vs shift.
 * Returns null if checkInAt is null (assignment exists, no check-in yet).
 */
export function computeAttendanceStatus(
  shift: ShiftTimeInfo,
  times: AttendanceTimes
): { status: AttendanceStatus; lateMinutes: number; overtimeMinutes: number } {
  if (!times.checkInAt) {
    return { status: 'absent', lateMinutes: 0, overtimeMinutes: 0 }
  }

  // Compute late minutes
  const checkInMs = times.checkInAt.getTime()
  const scheduledStartMs = times.scheduledStart.getTime()
  const lateThresholdMs = shift.lateThresholdMinutes * 60 * 1000
  const lateMs = Math.max(0, checkInMs - (scheduledStartMs + lateThresholdMs))
  const lateMinutes = Math.floor(lateMs / 60000)
  const isLate = lateMs > 0

  // Compute overtime (if checked out past scheduled end)
  let overtimeMinutes = 0
  if (times.checkOutAt) {
    const checkOutMs = times.checkOutAt.getTime()
    const overtimeMs = Math.max(0, checkOutMs - times.scheduledEnd.getTime())
    overtimeMinutes = Math.floor(overtimeMs / 60000)
  }

  // Determine status
  // - present: on time
  // - late: after threshold
  // - absent: no check-in (handled above)
  // - on_leave / holiday: assigned by supervisor manually, not by computation
  const status: AttendanceStatus = isLate ? 'late' : 'present'

  return { status, lateMinutes, overtimeMinutes }
}

/**
 * BR-ATT-004: Prevent double check-in/out.
 */
export function assertCanCheckIn(record: { checkInAt: Date | null }): void {
  if (record.checkInAt !== null) {
    throw new BusinessRuleViolationError('Already checked in', { checkedInAt: record.checkInAt })
  }
}

export function assertCanCheckOut(record: { checkInAt: Date | null; checkOutAt: Date | null }): void {
  if (record.checkInAt === null) {
    throw new BusinessRuleViolationError('Cannot check out without check-in')
  }
  if (record.checkOutAt !== null) {
    throw new BusinessRuleViolationError('Already checked out', { checkedOutAt: record.checkOutAt })
  }
}
