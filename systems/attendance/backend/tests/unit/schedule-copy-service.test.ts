import { describe, expect, it } from 'vitest'
import {
  assertCopyRange,
  buildCopyPreviewItems,
  type CopyExistingAssignment,
  type CopySourceAssignment,
} from '../../src/services/schedule-copy-service.js'

const input = {
  projectId: 'project-1',
  sourceFrom: '2026-07-01',
  sourceTo: '2026-07-02',
  targetStart: '2026-08-01',
}

const source: CopySourceAssignment = {
  id: 'source-1',
  employeeId: 'employee-1',
  shiftId: 'shift-1',
  date: new Date('2026-07-01T00:00:00.000Z'),
  notes: 'Sảnh chính',
  startTime: '08:00',
  endTime: '17:00',
  isOvernight: false,
  employeeActive: true,
  shiftActive: true,
}

describe('schedule copy preview', () => {
  it('preserves calendar-day offsets in the target range', () => {
    const range = assertCopyRange(input)
    expect(range.targetTo.toISOString()).toBe('2026-08-02T00:00:00.000Z')
    const items = buildCopyPreviewItems(
      input,
      [source, { ...source, id: 'source-2', date: new Date('2026-07-02T00:00:00.000Z') }],
      [],
      new Date('2026-01-01T00:00:00.000Z'),
      null,
    )
    expect(items.map(({ targetDate }) => targetDate)).toEqual(['2026-08-01', '2026-08-02'])
  })

  it('hard-blocks an exact active target duplicate', () => {
    const existing: CopyExistingAssignment = {
      id: 'target-1',
      projectId: 'project-1',
      employeeId: 'employee-1',
      shiftId: 'shift-1',
      date: new Date('2026-08-01T00:00:00.000Z'),
      startTime: '08:00',
      endTime: '17:00',
      isOvernight: false,
    }
    const [item] = buildCopyPreviewItems(
      input,
      [source],
      [existing],
      new Date('2026-01-01T00:00:00.000Z'),
      null,
    )
    expect(item?.blockingReasons).toContain('exact_duplicate')
    expect(item?.warnings).toEqual([])
  })

  it('returns a soft warning for another target shift on the same day', () => {
    const existing: CopyExistingAssignment = {
      id: 'target-2',
      projectId: 'project-2',
      employeeId: 'employee-1',
      shiftId: 'shift-2',
      date: new Date('2026-08-01T00:00:00.000Z'),
      startTime: '12:00',
      endTime: '20:00',
      isOvernight: false,
    }
    const [item] = buildCopyPreviewItems(
      input,
      [source],
      [existing],
      new Date('2026-01-01T00:00:00.000Z'),
      null,
    )
    expect(item?.blockingReasons).toEqual([])
    expect(item?.warnings).toMatchObject([{ type: 'time_overlap', conflictCount: 1 }])
    expect(item?.conflictingAssignmentIds).toEqual(['target-2'])
  })

  it('describes a non-overlapping same-day target shift as a multiple-shift warning', () => {
    const [item] = buildCopyPreviewItems(
      input,
      [source],
      [{
        id: 'target-3',
        projectId: 'project-2',
        employeeId: 'employee-1',
        shiftId: 'shift-3',
        date: new Date('2026-08-01T00:00:00.000Z'),
        startTime: '18:00',
        endTime: '22:00',
        isOvernight: false,
      }],
      new Date('2026-01-01T00:00:00.000Z'),
      null,
    )

    expect(item?.warnings).toMatchObject([{
      type: 'same_day_multiple_shift',
      message: 'Nhân viên đã có một ca khác trong ngày.',
    }])
  })

  it('warns when copied assignments conflict with each other in the target range', () => {
    const items = buildCopyPreviewItems(
      { ...input, sourceTo: input.sourceFrom },
      [
        source,
        {
          ...source,
          id: 'source-2',
          shiftId: 'shift-2',
          startTime: '16:00',
          endTime: '22:00',
        },
      ],
      [],
      new Date('2026-01-01T00:00:00.000Z'),
      null,
    )
    expect(items).toHaveLength(2)
    expect(items.every(({ warnings }) => warnings[0]?.type === 'time_overlap')).toBe(true)
    expect(items.every(({ conflictingAssignmentIds }) => conflictingAssignmentIds.length === 0)).toBe(true)
  })

  it('marks inactive resources and contract breaches as blockers', () => {
    const [item] = buildCopyPreviewItems(
      input,
      [{ ...source, employeeActive: false, shiftActive: false }],
      [],
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
    )
    expect(item?.blockingReasons).toEqual([
      'employee_inactive',
      'shift_inactive',
      'outside_contract',
    ])
  })

  it('rejects reversed and longer-than-month source ranges', () => {
    expect(() => assertCopyRange({ ...input, sourceTo: '2026-06-30' })).toThrow()
    expect(() => assertCopyRange({ ...input, sourceTo: '2026-08-01' })).toThrow()
  })
})
