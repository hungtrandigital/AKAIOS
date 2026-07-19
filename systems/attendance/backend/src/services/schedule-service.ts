// ScheduleService — assigns employees to shifts per project, detects conflicts.

import { BusinessRuleViolationError } from '@ak/shared'
import { getVietnamDateKey } from './attendance-service.js'

export interface ExistingAssignment {
  employeeId: string
  date: Date
  shiftId: string
  startTime: string  // "HH:mm"
  endTime: string    // "HH:mm"
  isOvernight: boolean
}

/**
 * BR-ATT-006: Detect if new shift assignment overlaps with employee's existing assignments on the same date.
 * Returns true if conflict found.
 */
export function detectShiftConflict(
  newAssignment: { employeeId: string; date: Date; shiftId: string; startTime: string; endTime: string; isOvernight: boolean },
  existing: ExistingAssignment[]
): boolean {
  return existing.some((e) => {
    if (e.employeeId !== newAssignment.employeeId) return false
    if (e.shiftId === newAssignment.shiftId) return true // exact duplicate
    // Date match
    const sameDate =
      e.date.getUTCFullYear() === newAssignment.date.getUTCFullYear() &&
      e.date.getUTCMonth() === newAssignment.date.getUTCMonth() &&
      e.date.getUTCDate() === newAssignment.date.getUTCDate()
    if (!sameDate) return false
    // Time overlap (simple: any time range overlap)
    return timeRangesOverlap(
      { start: e.startTime, end: e.endTime, isOvernight: e.isOvernight },
      { start: newAssignment.startTime, end: newAssignment.endTime, isOvernight: newAssignment.isOvernight }
    )
  })
}

function timeRangesOverlap(
  a: { start: string; end: string; isOvernight: boolean },
  b: { start: string; end: string; isOvernight: boolean }
): boolean {
  const aStart = toMinutes(a.start)
  const aEnd = toMinutes(a.end) + (a.isOvernight ? 24 * 60 : 0)
  const bStart = toMinutes(b.start)
  const bEnd = toMinutes(b.end) + (b.isOvernight ? 24 * 60 : 0)
  return aStart < bEnd && bStart < aEnd
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  return h * 60 + (m ?? 0)
}

/**
 * BR-ATT-008: Disallow check-in for assignment more than 7 days in the past.
 */
export function assertNotTooFarInPast(assignmentDate: Date, maxDaysBack = 7): void {
  const today = Date.parse(`${getVietnamDateKey()}T00:00:00.000Z`)
  const assignmentDay = Date.parse(`${assignmentDate.toISOString().slice(0, 10)}T00:00:00.000Z`)
  const daysBack = Math.floor((today - assignmentDay) / (1000 * 60 * 60 * 24))
  if (daysBack > maxDaysBack) {
    throw new BusinessRuleViolationError(
      `Cannot check in for assignment more than ${maxDaysBack} days in the past`,
      { daysBack, maxDaysBack }
    )
  }
}
