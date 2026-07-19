// AttendanceService — implements BR-ATT-001 through BR-ATT-010.
// Pure-ish (no DB calls) — takes snapshots, returns computed status.

import { AttendanceStatus, BusinessRuleViolationError } from '@ak/shared'

export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const VIETNAM_UTC_OFFSET = '+07:00'

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

/** Return the Vietnam calendar date (YYYY-MM-DD) containing an instant. */
export function getVietnamDateKey(instant = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

/** Return the UTC instants bounding the current Vietnam calendar day. */
export function getVietnamDayBounds(instant = new Date()): { start: Date; end: Date } {
  const dateKey = getVietnamDateKey(instant)
  const start = new Date(`${dateKey}T00:00:00.000${VIETNAM_UTC_OFFSET}`)
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
}

/** Build a UTC instant for a Vietnam calendar date + "HH:mm" shift time. */
export function buildShiftDateTime(date: Date, time: string, isNextDay = false): Date {
  const { hours, minutes } = parseShiftTime(time)
  const dateKey = date.toISOString().slice(0, 10)
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const result = new Date(`${dateKey}T${hh}:${mm}:00.000${VIETNAM_UTC_OFFSET}`)
  if (isNextDay) result.setUTCDate(result.getUTCDate() + 1)
  return result
}

/** Persistable paid work duration after the shift's unpaid break. */
export function computeWorkedMinutes(checkInAt: Date, checkOutAt: Date, breakMinutes: number): number {
  const elapsedMinutes = Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60_000)
  return Math.max(0, elapsedMinutes - Math.max(0, breakMinutes))
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
