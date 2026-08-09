// ScheduleService — assigns employees to shifts per project, detects conflicts.

import { BusinessRuleViolationError } from '@ak/shared'
import { getVietnamDateKey } from './attendance-service.js'

export interface ExistingAssignment {
  id?: string
  employeeId: string
  date: Date
  shiftId: string
  startTime: string  // "HH:mm"
  endTime: string    // "HH:mm"
  isOvernight: boolean
}

export interface ScheduleConflict {
  type: 'time_overlap' | 'same_day_multiple_shift'
  existingAssignmentId?: string
}

/**
 * BR-ATT-006: Find conflicts that require an explicit scheduler acknowledgement.
 * Same-day non-overlapping shifts still warn; adjacent-day assignments warn only
 * when their absolute time ranges overlap.
 */
export function findScheduleConflicts(
  newAssignment: { employeeId: string; date: Date; shiftId: string; startTime: string; endTime: string; isOvernight: boolean },
  existing: ExistingAssignment[]
): ScheduleConflict[] {
  return existing.flatMap<ScheduleConflict>((e): ScheduleConflict[] => {
    if (e.employeeId !== newAssignment.employeeId) return []
    const existingRange = toAbsoluteRange(e)
    const newRange = toAbsoluteRange(newAssignment)
    const overlaps = existingRange.start < newRange.end && newRange.start < existingRange.end
    if (overlaps) {
      return [{ type: 'time_overlap' as const, existingAssignmentId: e.id }]
    }
    if (sameBusinessDate(e.date, newAssignment.date)) {
      return [{ type: 'same_day_multiple_shift' as const, existingAssignmentId: e.id }]
    }
    return []
  })
}

export function detectShiftConflict(
  newAssignment: Parameters<typeof findScheduleConflicts>[0],
  existing: ExistingAssignment[],
): boolean {
  return findScheduleConflicts(newAssignment, existing).length > 0
}

function sameBusinessDate(left: Date, right: Date): boolean {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10)
}

function toAbsoluteRange(assignment: {
  date: Date
  startTime: string
  endTime: string
  isOvernight: boolean
}): { start: number; end: number } {
  const dayStartMinutes = Date.UTC(
    assignment.date.getUTCFullYear(),
    assignment.date.getUTCMonth(),
    assignment.date.getUTCDate(),
  ) / 60_000
  const start = dayStartMinutes + toMinutes(assignment.startTime)
  const end = dayStartMinutes
    + toMinutes(assignment.endTime)
    + (assignment.isOvernight ? 24 * 60 : 0)
  return { start, end }
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
