import { afterEach, describe, expect, it, vi } from 'vitest'
import { BusinessRuleViolationError } from '@ak/shared'
import {
  assertNotTooFarInPast,
  detectShiftConflict,
  findScheduleConflicts,
  type ExistingAssignment,
} from '../../src/services/schedule-service.js'

const existing: ExistingAssignment = {
  employeeId: 'employee-1',
  date: new Date('2026-07-17T00:00:00.000Z'),
  shiftId: 'shift-morning',
  startTime: '06:00',
  endTime: '14:00',
  isOvernight: false,
}

describe('detectShiftConflict', () => {
  it('returns false for another employee', () => {
    expect(detectShiftConflict({ ...existing, employeeId: 'employee-2' }, [existing])).toBe(false)
  })

  it('returns true for an exact duplicate shift', () => {
    expect(detectShiftConflict({ ...existing }, [existing])).toBe(true)
  })

  it('returns false for the same employee on another date', () => {
    const candidate = { ...existing, date: new Date('2026-07-18T00:00:00.000Z') }
    expect(detectShiftConflict(candidate, [existing])).toBe(false)
  })

  it('rejects overlapping and adjacent second shifts on the same work date', () => {
    const overlapping = { ...existing, shiftId: 'shift-overlap', startTime: '13:00', endTime: '18:00' }
    const adjacent = { ...existing, shiftId: 'shift-adjacent', startTime: '14:00', endTime: '22:00' }
    expect(detectShiftConflict(overlapping, [existing])).toBe(true)
    expect(detectShiftConflict(adjacent, [existing])).toBe(true)
  })

  it('classifies overlap separately from another non-overlapping same-day shift', () => {
    const overlapping = { ...existing, shiftId: 'shift-overlap', startTime: '13:00', endTime: '18:00' }
    const adjacent = { ...existing, shiftId: 'shift-adjacent', startTime: '14:00', endTime: '22:00' }
    expect(findScheduleConflicts(overlapping, [{ ...existing, id: 'existing-1' }]))
      .toEqual([{ type: 'time_overlap', existingAssignmentId: 'existing-1' }])
    expect(findScheduleConflicts(adjacent, [{ ...existing, id: 'existing-1' }]))
      .toEqual([{ type: 'same_day_multiple_shift', existingAssignmentId: 'existing-1' }])
  })

  it('detects overlap between overnight shifts', () => {
    const overnight = { ...existing, shiftId: 'shift-night', startTime: '22:00', endTime: '06:00', isOvernight: true }
    const overlapping = { ...overnight, shiftId: 'shift-late', startTime: '23:00', endTime: '01:00' }
    expect(detectShiftConflict(overlapping, [overnight])).toBe(true)
  })

  it('detects an overnight shift overlapping the following calendar date', () => {
    const overnight = {
      ...existing,
      shiftId: 'shift-night',
      startTime: '22:00',
      endTime: '06:00',
      isOvernight: true,
    }
    const nextMorning = {
      ...existing,
      date: new Date('2026-07-18T00:00:00.000Z'),
      shiftId: 'shift-next-morning',
      startTime: '05:00',
      endTime: '12:00',
    }
    expect(detectShiftConflict(nextMorning, [overnight])).toBe(true)
  })
})

describe('assertNotTooFarInPast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts today and dates inside the allowed window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T05:00:00.000Z'))
    expect(() => assertNotTooFarInPast(new Date('2026-07-17T00:00:00.000Z'))).not.toThrow()
    expect(() => assertNotTooFarInPast(new Date('2026-07-10T00:00:00.000Z'))).not.toThrow()
  })

  it('rejects assignments older than the configured window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-17T05:00:00.000Z'))
    expect(() => assertNotTooFarInPast(new Date('2026-07-09T00:00:00.000Z')))
      .toThrow(BusinessRuleViolationError)
    expect(() => assertNotTooFarInPast(new Date('2026-07-15T00:00:00.000Z'), 1))
      .toThrow('Cannot check in for assignment more than 1 days in the past')
  })
})
