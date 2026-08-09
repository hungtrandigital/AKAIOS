import { BusinessRuleViolationError } from '@ak/shared'
import {
  findScheduleConflicts,
  type ExistingAssignment,
  type ScheduleConflict,
} from './schedule-service.js'

export interface CopyRangeInput {
  projectId: string
  sourceFrom: string
  sourceTo: string
  targetStart: string
}

export interface CopySourceAssignment {
  id: string
  employeeId: string
  shiftId: string
  date: Date
  notes: string | null
  startTime: string
  endTime: string
  isOvernight: boolean
  employeeActive: boolean
  shiftActive: boolean
}

export interface CopyExistingAssignment extends ExistingAssignment {
  id: string
  projectId: string
}

export interface ScheduleWarning {
  type: ScheduleConflict['type']
  employeeId: string
  date: string
  shiftId: string
  conflictCount: number
  message: string
}

export type CopyBlocker =
  | 'exact_duplicate'
  | 'employee_inactive'
  | 'shift_inactive'
  | 'outside_contract'

export interface CopyPreviewItem {
  sourceAssignmentId: string
  sourceDate: string
  targetDate: string
  employeeId: string
  shiftId: string
  notes: string | null
  warnings: ScheduleWarning[]
  blockingReasons: CopyBlocker[]
  conflictingAssignmentIds: string[]
}

const DAY_MS = 86_400_000

export function assertCopyRange(input: CopyRangeInput): {
  sourceFrom: Date
  sourceTo: Date
  targetFrom: Date
  targetTo: Date
} {
  const sourceFrom = calendarDate(input.sourceFrom)
  const sourceTo = calendarDate(input.sourceTo)
  const targetFrom = calendarDate(input.targetStart)
  const span = Math.round((sourceTo.getTime() - sourceFrom.getTime()) / DAY_MS)
  if (span < 0 || span > 30) {
    throw new BusinessRuleViolationError('Copy source range must contain 1 to 31 calendar days')
  }
  return { sourceFrom, sourceTo, targetFrom, targetTo: addDays(targetFrom, span) }
}

export function buildCopyPreviewItems(
  input: CopyRangeInput,
  sources: CopySourceAssignment[],
  existing: CopyExistingAssignment[],
  contractStart: Date,
  contractEnd: Date | null,
): CopyPreviewItem[] {
  const range = assertCopyRange(input)
  const candidates = sources.map((source) => {
    const offset = Math.round((source.date.getTime() - range.sourceFrom.getTime()) / DAY_MS)
    return { source, targetDate: addDays(range.targetFrom, offset) }
  })
  return candidates.map(({ source, targetDate }) => {
    const targetDateKey = dateKey(targetDate)
    const exact = existing.filter((item) => (
      item.employeeId === source.employeeId
      && item.projectId === input.projectId
      && item.shiftId === source.shiftId
      && dateKey(item.date) === targetDateKey
    ))
    const newAssignment = {
      employeeId: source.employeeId,
      date: targetDate,
      shiftId: source.shiftId,
      startTime: source.startTime,
      endTime: source.endTime,
      isOvernight: source.isOvernight,
    }
    const existingConflicts = findScheduleConflicts(
      newAssignment,
      existing.filter((item) => !exact.some(({ id }) => id === item.id)),
    )
    const candidateConflicts = findScheduleConflicts(
      newAssignment,
      candidates
        .filter((candidate) => candidate.source.id !== source.id)
        .map((candidate) => ({
          employeeId: candidate.source.employeeId,
          date: candidate.targetDate,
          shiftId: candidate.source.shiftId,
          startTime: candidate.source.startTime,
          endTime: candidate.source.endTime,
          isOvernight: candidate.source.isOvernight,
        })),
    )
    const conflicts = [...existingConflicts, ...candidateConflicts]
    const blockingReasons: CopyBlocker[] = []
    if (exact.length > 0) blockingReasons.push('exact_duplicate')
    if (!source.employeeActive) blockingReasons.push('employee_inactive')
    if (!source.shiftActive) blockingReasons.push('shift_inactive')
    if (targetDate < contractStart || (contractEnd && targetDate > contractEnd)) {
      blockingReasons.push('outside_contract')
    }
    return {
      sourceAssignmentId: source.id,
      sourceDate: dateKey(source.date),
      targetDate: targetDateKey,
      employeeId: source.employeeId,
      shiftId: source.shiftId,
      notes: source.notes,
      warnings: groupWarnings(conflicts, source.employeeId, targetDateKey, source.shiftId),
      blockingReasons,
      conflictingAssignmentIds: existingConflicts
        .map(({ existingAssignmentId }) => existingAssignmentId)
        .filter((id): id is string => Boolean(id))
        .sort(),
    }
  })
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function calendarDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function groupWarnings(
  conflicts: ScheduleConflict[],
  employeeId: string,
  date: string,
  shiftId: string,
): ScheduleWarning[] {
  return (['time_overlap', 'same_day_multiple_shift'] as const).flatMap((type) => {
    const conflictCount = conflicts.filter((conflict) => conflict.type === type).length
    if (conflictCount === 0) return []
    return [{
      type,
      employeeId,
      date,
      shiftId,
      conflictCount,
      message: type === 'time_overlap'
        ? 'Ca làm việc bị trùng thời gian với lịch hiện có.'
        : 'Nhân viên đã có một ca khác trong ngày.',
    }]
  })
}
