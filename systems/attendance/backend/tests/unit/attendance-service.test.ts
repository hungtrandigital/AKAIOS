// Unit tests for AttendanceService — BR-ATT-002 (late), status calculation.

import { describe, it, expect } from 'vitest'
import {
  computeAttendanceStatus,
  parseShiftTime,
  buildShiftDateTime,
  computeWorkedMinutes,
  getVietnamDayBounds,
  assertCanCheckIn,
  assertCanCheckOut,
} from '../../src/services/attendance-service.js'

describe('AttendanceService', () => {
  describe('parseShiftTime', () => {
    it('parses valid HH:mm', () => {
      expect(parseShiftTime('06:30')).toEqual({ hours: 6, minutes: 30 })
      expect(parseShiftTime('22:00')).toEqual({ hours: 22, minutes: 0 })
    })

    it('throws on invalid format', () => {
      expect(() => parseShiftTime('25:00')).toThrow()
      expect(() => parseShiftTime('invalid')).toThrow()
    })
  })

  describe('buildShiftDateTime', () => {
    it('builds a UTC instant from Vietnam shift wall time', () => {
      const d = new Date('2026-07-16T00:00:00Z')
      const result = buildShiftDateTime(d, '14:30')
      expect(result.toISOString()).toBe('2026-07-16T07:30:00.000Z')
    })

    it('advances overnight shift end to the next Vietnam calendar day', () => {
      const d = new Date('2026-07-16T00:00:00Z')
      expect(buildShiftDateTime(d, '06:00', true).toISOString()).toBe('2026-07-16T23:00:00.000Z')
    })

    it('returns Vietnam day bounds for early-morning Vietnam time', () => {
      const bounds = getVietnamDayBounds(new Date('2026-07-16T17:30:00.000Z'))
      expect(bounds.start.toISOString()).toBe('2026-07-16T17:00:00.000Z')
      expect(bounds.end.toISOString()).toBe('2026-07-17T17:00:00.000Z')
    })
  })

  describe('computeWorkedMinutes', () => {
    it('persists elapsed work minus the unpaid break', () => {
      expect(computeWorkedMinutes(
        new Date('2026-07-16T23:00:00.000Z'),
        new Date('2026-07-17T07:00:00.000Z'),
        60,
      )).toBe(420)
    })

    it('never produces a negative duration', () => {
      expect(computeWorkedMinutes(
        new Date('2026-07-17T07:00:00.000Z'),
        new Date('2026-07-17T07:15:00.000Z'),
        60,
      )).toBe(0)
    })
  })

  describe('computeAttendanceStatus (BR-ATT-002)', () => {
    const shift = {
      startTime: '06:00',
      endTime: '14:00',
      breakMinutes: 60,
      lateThresholdMinutes: 15,
      isOvernight: false,
    }

    it('returns "absent" if no check-in', () => {
      const result = computeAttendanceStatus(shift, {
        scheduledStart: new Date('2026-07-16T06:00:00'),
        scheduledEnd: new Date('2026-07-16T14:00:00'),
        checkInAt: null,
        checkOutAt: null,
      })
      expect(result.status).toBe('absent')
    })

    it('returns "present" if check-in within threshold', () => {
      const result = computeAttendanceStatus(shift, {
        scheduledStart: new Date('2026-07-16T06:00:00'),
        scheduledEnd: new Date('2026-07-16T14:00:00'),
        checkInAt: new Date('2026-07-16T06:10:00'), // 10 min after start, within 15-min threshold
        checkOutAt: new Date('2026-07-16T14:00:00'),
      })
      expect(result.status).toBe('present')
      expect(result.lateMinutes).toBe(0)
    })

    it('returns "late" if check-in after threshold', () => {
      const result = computeAttendanceStatus(shift, {
        scheduledStart: new Date('2026-07-16T06:00:00'),
        scheduledEnd: new Date('2026-07-16T14:00:00'),
        checkInAt: new Date('2026-07-16T06:25:00'), // 25 min after start, beyond 15-min threshold
        checkOutAt: new Date('2026-07-16T14:00:00'),
      })
      expect(result.status).toBe('late')
      // 25 - 15 = 10 min late
      expect(result.lateMinutes).toBe(10)
    })

    it('computes overtime when check-out past end time', () => {
      const result = computeAttendanceStatus(shift, {
        scheduledStart: new Date('2026-07-16T06:00:00'),
        scheduledEnd: new Date('2026-07-16T14:00:00'),
        checkInAt: new Date('2026-07-16T06:05:00'),
        checkOutAt: new Date('2026-07-16T15:30:00'), // 90 min past end
      })
      expect(result.overtimeMinutes).toBe(90)
    })

    it('handles overnight shifts (BR-ATT edge case)', () => {
      const overnightShift = { ...shift, startTime: '22:00', endTime: '06:00', isOvernight: true }
      const result = computeAttendanceStatus(overnightShift, {
        scheduledStart: new Date('2026-07-16T22:00:00'),
        scheduledEnd: new Date('2026-07-17T06:00:00'),
        checkInAt: new Date('2026-07-16T22:10:00'), // 10 min after start, within 15-min threshold → present
        checkOutAt: new Date('2026-07-17T07:00:00'),
      })
      expect(result.status).toBe('present')
      // 60 min overtime (1 hour past 06:00)
      expect(result.overtimeMinutes).toBe(60)
    })
  })

  describe('assertCanCheckIn (BR-ATT-004)', () => {
    it('throws if already checked in', () => {
      expect(() => assertCanCheckIn({ checkInAt: new Date() })).toThrow(/Already checked in/)
    })

    it('passes if not yet checked in', () => {
      expect(() => assertCanCheckIn({ checkInAt: null })).not.toThrow()
    })
  })

  describe('assertCanCheckOut (BR-ATT-004)', () => {
    it('throws if no check-in', () => {
      expect(() => assertCanCheckOut({ checkInAt: null, checkOutAt: null })).toThrow(/check-in/)
    })

    it('throws if already checked out', () => {
      expect(() =>
        assertCanCheckOut({ checkInAt: new Date(), checkOutAt: new Date() })
      ).toThrow(/Already checked out/)
    })

    it('passes after check-in, before check-out', () => {
      expect(() =>
        assertCanCheckOut({ checkInAt: new Date(), checkOutAt: null })
      ).not.toThrow()
    })
  })
})
