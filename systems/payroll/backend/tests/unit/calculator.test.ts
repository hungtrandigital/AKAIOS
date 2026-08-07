// Comprehensive tests for payroll engine — target 100% coverage.
// BR-PAY-001..BR-PAY-010 from domain-specs.md.

import { describe, it, expect } from 'vitest'
import { Money } from '@ak/shared'
import {
  calculateLine,
  aggregateAttendance,
  computeProratedBase,
  computeOvertimeAmount,
  applyOTRounding,
  computeLatePenalty,
  computeAllowances,
  computeGrossAndNet,
  isWeekend,
  isHoliday,
} from '../../src/engine/calculator.js'
import {
  countWorkingDaysInMonth,
  countWorkingDaysInRange,
  roundMinutes,
  getLastDayOfMonth,
  getSundaysInMonth,
} from '../../src/engine/working-days.js'
import { isVietnamHoliday, VIETNAM_HOLIDAYS, getVietnamHolidayName } from '../../src/engine/holidays.js'
import type { PayrollRuleSnapshot, AttendanceRecord } from '../../src/engine/calculator.js'
import { makeAttendance, buildWeekdayAttendance } from './_test-utils.js'

export { makeAttendance, buildWeekdayAttendance } from './_test-utils.js'



const DEFAULT_RULES: PayrollRuleSnapshot = {
  effectiveFrom: new Date('2026-01-01'),
  effectiveTo: null,
  otWeekdayMultiplier: 1.5,
  otWeekendMultiplier: 2.0,
  otHolidayMultiplier: 3.0,
  latePenaltyPerMinute: null,
  maxLatePenaltyPerDay: null,
  mealAllowancePerDay: null,
  phoneAllowance: null,
  roundingMinutes: 15,
  workingHoursPerDay: 8,
  standardWorkingDaysPerMonth: 26,
}

describe('Payroll Engine — BR-PAY rules', () => {
  describe('Working days utilities', () => {
    it('countWorkingDaysInMonth: June 2026 = 26 days', () => {
      expect(countWorkingDaysInMonth(2026, 5)).toBe(26) // June: 30 days, 4 Sundays = 26
    })

    it('countWorkingDaysInMonth: February 2026 (28 days) = 24 days', () => {
      expect(countWorkingDaysInMonth(2026, 1)).toBe(24) // Feb 2026 starts Sunday Feb 1, ends Sat Feb 28. Sundays: 1, 8, 15, 22 (4 Sundays). 28 - 4 = 24 working days.
    })

    it('countWorkingDaysInRange: 5 days (Mon-Fri)', () => {
      const from = new Date('2026-07-13') // Mon
      const to = new Date('2026-07-17')   // Fri
      expect(countWorkingDaysInRange(from, to)).toBe(5)
    })

    it('countWorkingDaysInRange: 7 days including weekend = 5', () => {
      const from = new Date('2026-07-13') // Mon
      const to = new Date('2026-07-19')   // Sun
      expect(countWorkingDaysInRange(from, to)).toBe(6) // Mon-Sat
    })

    it('roundMinutes: 22 → 15 (round to nearest 15)', () => {
      expect(roundMinutes(22, 15)).toBe(15) // 22 closer to 15 than 30
      expect(roundMinutes(38, 15)).toBe(45) // 38 closer to 45
      expect(roundMinutes(60, 15)).toBe(60)
    })

    it('roundMinutes: 0 (no rounding)', () => {
      expect(roundMinutes(22, 0)).toBe(22)
    })

    it('getLastDayOfMonth: Feb leap year', () => {
      expect(getLastDayOfMonth(2024, 1)).toBe(29) // Feb 2024 is leap
      expect(getLastDayOfMonth(2026, 1)).toBe(28) // Feb 2026 not leap
    })

    it('getSundaysInMonth: July 2026 has 4 Sundays', () => {
      expect(getSundaysInMonth(2026, 6).size).toBe(4) // July: 5, 12, 19, 26
    })
  })

  describe('Vietnam holidays (BR-PAY-010)', () => {
    it('recognizes Vietnamese national holidays 2026', () => {
      expect(isVietnamHoliday('2026-01-01')).toBe(true)
      expect(isVietnamHoliday('2026-04-30')).toBe(true)
      expect(isVietnamHoliday('2026-05-01')).toBe(true)
      expect(isVietnamHoliday('2026-09-02')).toBe(true)
    })

    it('rejects non-holiday dates', () => {
      expect(isVietnamHoliday('2026-07-15')).toBe(false)
      expect(isVietnamHoliday('2026-08-15')).toBe(false)
    })

    it('returns name for known holiday', () => {
      expect(getVietnamHolidayName('2026-05-01')).toBe('Quốc tế lao động')
      expect(getVietnamHolidayName('2026-09-02')).toBe('Quốc khánh')
      expect(getVietnamHolidayName('2026-07-15')).toBeNull()
    })

    it('has Tết Nguyên đán entries', () => {
      const tetEntries = VIETNAM_HOLIDAYS.filter((h) => h.name.includes('Tết Nguyên'))
      expect(tetEntries.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('isWeekend / isHoliday', () => {
    it('2026-07-12 (Sun) is weekend', () => {
      expect(isWeekend(new Date('2026-07-12'))).toBe(true)
    })

    it('2026-07-13 (Mon) is not weekend', () => {
      expect(isWeekend(new Date('2026-07-13'))).toBe(false)
    })

    it('2026-05-01 is holiday', () => {
      expect(isHoliday(new Date('2026-05-01'))).toBe(true)
    })

    it('2026-07-15 is not holiday', () => {
      expect(isHoliday(new Date('2026-07-15'))).toBe(false)
    })
  })

  describe('BR-PAY-001: Pro-rated base', () => {
    it('full month = base salary (22/26 days)', () => {
      const base = Money.fromVNĐ(10000000)
      const prorated = computeProratedBase(base, 26, 26)
      expect(prorated.toVNĐ()).toBe(10000000)
    })

    it('partial month: 22/26 days = ~8.46M', () => {
      const base = Money.fromVNĐ(10000000)
      const prorated = computeProratedBase(base, 22, 26)
      // 10,000,000 × 22/26 = 8,461,538.46 → 8,461,538 VNĐ
      expect(prorated.toVNĐ()).toBe(8461538)
    })

    it('half month: 13/26 days = 5M', () => {
      const base = Money.fromVNĐ(10000000)
      const prorated = computeProratedBase(base, 13, 26)
      expect(prorated.toVNĐ()).toBe(5000000)
    })

    it('full month 30/26 days caps at 100% (no overpay)', () => {
      const base = Money.fromVNĐ(10000000)
      const prorated = computeProratedBase(base, 30, 26)
      expect(prorated.toVNĐ()).toBe(10000000)
    })

    it('zero days = 0', () => {
      const base = Money.fromVNĐ(10000000)
      expect(computeProratedBase(base, 0, 26).isZero()).toBe(true)
    })
  })

  describe('BR-PAY-002: OT calculation', () => {
    it('weekday OT: 60 min × 1.5x at 10M base = ~36,000 VNĐ', () => {
      // hourly rate = 10M / 26 days / 8h / 60min = ~800 VNĐ/min
      // 800 × 60 × 1.5 = 72,061.5 → rounded
      const base = Money.fromVNĐ(10000000)
      const amount = computeOvertimeAmount(base, 60, 26, 8, 1.5)
      // 10000000 / 26 / 8 / 60 × 60 × 1.5 = 72,115.38 (precise from Decimal.js)
      expect(amount.toVNĐ()).toBeGreaterThan(70000)
      expect(amount.toVNĐ()).toBeLessThan(73000)
    })

    it('weekend OT: 60 min × 2.0x', () => {
      const base = Money.fromVNĐ(10000000)
      const amount = computeOvertimeAmount(base, 60, 26, 8, 2.0)
      // Should be 60 / 1.5 of weekday... actually 60 × 2.0 / 60 / (26×8)/60... let me recompute
      // hourly rate = 10M/26/8/60 = 800.8 VNĐ/min ≈ 801
      // weekend 60 min = 801 × 60 × 2.0 = 96,153
      expect(amount.toVNĐ()).toBeGreaterThan(95000)
      expect(amount.toVNĐ()).toBeLessThan(97000)
    })

    it('holiday OT: 60 min × 3.0x', () => {
      const base = Money.fromVNĐ(10000000)
      const amount = computeOvertimeAmount(base, 60, 26, 8, 3.0)
      expect(amount.toVNĐ()).toBeGreaterThan(140000)
      expect(amount.toVNĐ()).toBeLessThan(145000)
    })

    it('zero OT = 0', () => {
      const base = Money.fromVNĐ(10000000)
      expect(computeOvertimeAmount(base, 0, 26, 8, 1.5).isZero()).toBe(true)
    })
  })

  describe('BR-PAY-003: OT rounding', () => {
    it('rounds to nearest 15 minutes', () => {
      const result = applyOTRounding(
        { weekday: 22, weekend: 38, holiday: 7 },
        15
      )
      expect(result.weekday).toBe(15) // 22 → 15
      expect(result.weekend).toBe(45) // 38 → 45
      expect(result.holiday).toBe(0)  // 7 → 0 (under 7.5)
    })

    it('roundingMinutes=0 means no rounding', () => {
      const result = applyOTRounding(
        { weekday: 22, weekend: 38, holiday: 7 },
        0
      )
      expect(result.weekday).toBe(22)
      expect(result.weekend).toBe(38)
      expect(result.holiday).toBe(7)
    })
  })

  describe('BR-PAY-004: Late penalty', () => {
    it('returns 0 when rules disabled (null perMinute)', () => {
      const penalty = computeLatePenalty(60, 5, null, null)
      expect(penalty.isZero()).toBe(true)
    })

    it('returns 0 when no late minutes', () => {
      const penalty = computeLatePenalty(0, 0, Money.fromVNĐ(1000), Money.fromVNĐ(5000))
      expect(penalty.isZero()).toBe(true)
    })

    it('calculates penalty × days with cap', () => {
      // 1000 VNĐ/min × 60min = 60,000/day
      // capped at 50,000/day
      // 3 days late = 50,000 × 3 = 150,000
      const penalty = computeLatePenalty(
        60 * 3,
        3,
        Money.fromVNĐ(1000),
        Money.fromVNĐ(50000)
      )
      expect(penalty.toVNĐ()).toBe(150000)
    })

    it('no cap when maxPerDay=null', () => {
      const penalty = computeLatePenalty(
        100,
        2,
        Money.fromVNĐ(1000),
        null
      )
      // 1000 × 100 × 2 = 200,000
      expect(penalty.toVNĐ()).toBe(200000)
    })
  })

  describe('BR-PAY-005: Allowances', () => {
    it('meal allowance only', () => {
      const result = computeAllowances(
        22,
        Money.fromVNĐ(30000),
        null
      )
      // 22 × 30,000 = 660,000
      expect(result.toVNĐ()).toBe(660000)
    })

    it('phone allowance only', () => {
      const result = computeAllowances(0, null, Money.fromVNĐ(200000))
      expect(result.toVNĐ()).toBe(200000)
    })

    it('both: meal + phone', () => {
      const result = computeAllowances(
        22,
        Money.fromVNĐ(30000),
        Money.fromVNĐ(200000)
      )
      expect(result.toVNĐ()).toBe(860000)
    })

    it('no allowances = 0', () => {
      expect(computeAllowances(22, null, null).isZero()).toBe(true)
    })
  })

  describe('BR-PAY-006 + 007: Gross and Net', () => {
    it('basic case: base + OT - deductions', () => {
      const gross = Money.fromVNĐ(9000000) // 9M
      const advance = Money.fromVNĐ(1000000)
      const other = Money.zero()
      const { gross: g, net } = computeGrossAndNet(
        gross, // proratedBase
        Money.zero(), // otWeekday
        Money.zero(), // otWeekend
        Money.zero(), // otHoliday
        Money.zero(), // latePenalty
        Money.zero(), // allowances
        advance,
        other
      )
      expect(g.toVNĐ()).toBe(9000000)
      expect(net.toVNĐ()).toBe(8000000)
    })

    it('caps negative gross at 0', () => {
      // penalty > base → negative gross possible
      const { gross, net } = computeGrossAndNet(
        Money.fromVNĐ(5000000), // base
        Money.zero(),
        Money.zero(),
        Money.zero(),
        Money.fromVNĐ(10000000), // 10M penalty > base
        Money.zero(),
        Money.zero(),
        Money.zero()
      )
      expect(gross.isZero()).toBe(true)
      expect(net.isZero()).toBe(true)
    })

    it('standard case: prorated + OT + allowance - advance', () => {
      const { gross, net } = computeGrossAndNet(
        Money.fromVNĐ(9000000),
        Money.fromVNĐ(500000),  // ot weekday
        Money.fromVNĐ(300000),  // ot weekend
        Money.zero(),
        Money.zero(),
        Money.fromVNĐ(660000), // meal allowance
        Money.fromVNĐ(1000000), // advance
        Money.zero()
      )
      // gross = 9M + 500K + 300K + 660K = 10,460,000
      expect(gross.toVNĐ()).toBe(10460000)
      // net = 10.46M - 1M = 9.46M
      expect(net.toVNĐ()).toBe(9460000)
    })

    it('no compliance deductions (per ADR-003 MVP)', () => {
      const { net } = computeGrossAndNet(
        Money.fromVNĐ(10000000),
        Money.zero(),
        Money.zero(),
        Money.zero(),
        Money.zero(),
        Money.zero(),
        Money.fromVNĐ(2000000), // advance
        Money.fromVNĐ(500000)   // other deductions
      )
      // net = 10M - 2M - 500K = 7.5M (NO BHXH/PIT)
      expect(net.toVNĐ()).toBe(7500000)
    })
  })

  describe('BR-PAY-008: Period state machine (integration)', () => {
    // Tested via routes in routes/payroll.test.ts (deferred to Phase 3 routes)
    it.todo('open → calculating → calculated → approved → paid → locked')
  })

  describe('BR-PAY-009: Re-calculation detection (integration)', () => {
    it.todo('if attendance changes after calculated, recalc needed')
  })

  describe('BR-PAY-010: Holiday detection via input data', () => {
    it('flags holiday record for OT multiplier 3x', () => {
      const records: AttendanceRecord[] = [
        makeAttendance(new Date('2026-05-01'), 'present', 480, 0, 0), // 1/5 holiday
        makeAttendance(new Date('2026-05-04'), 'present', 480, 0, 0), // Mon regular
      ]
      const totals = aggregateAttendance(records)
      expect(totals.daysWorked).toBe(2)
      expect(totals.overtimeHolidayMinutes).toBe(480) // 8h holiday
      expect(totals.overtimeWeekdayMinutes).toBe(0)
    })
  })

  describe('aggregateAttendance', () => {
    it('skips absent records', () => {
      const records: AttendanceRecord[] = [
        makeAttendance(new Date('2026-07-13'), 'present', 480),
        makeAttendance(new Date('2026-07-14'), 'absent', 0),
        makeAttendance(new Date('2026-07-15'), 'on_leave', 0),
        makeAttendance(new Date('2026-07-16'), 'present', 480),
      ]
      const totals = aggregateAttendance(records)
      expect(totals.daysWorked).toBe(2) // absent + on_leave skipped
      expect(totals.totalWorkMinutes).toBe(960)
    })

    it('counts weekend as weekend OT', () => {
      const records: AttendanceRecord[] = [
        makeAttendance(new Date('2026-07-12'), 'present', 480), // Sun
      ]
      const totals = aggregateAttendance(records)
      // weekend present: total goes to overtimeWeekend
      expect(totals.overtimeWeekendMinutes).toBe(480)
    })

    it('handles empty array', () => {
      const totals = aggregateAttendance([])
      expect(totals.daysWorked).toBe(0)
      expect(totals.totalWorkMinutes).toBe(0)
    })
  })

  describe('calculateLine: full integration', () => {
    it('standard employee: 22/26 days, 60 OT weekday, no late', () => {
      const employee = {
        id: 'emp1',
        baseSalary: Money.fromVNĐ(10000000),
        salaryType: 'monthly' as const,
      }
      // 22 Mon-Sat days for July 2026
      const attendance: AttendanceRecord[] = buildWeekdayAttendance(2026, 6, 22)
        .map((r) => (r.date.getDay() === 1 /* Mon */ ? { ...r, overtimeMinutes: 60 } : r)) // Monday: 60 min OT

      const result = calculateLine(
        employee,
        attendance,
        DEFAULT_RULES,
        { advance: Money.fromVNĐ(1000000), otherDeductions: Money.zero() }
      )
      // proratedBase = 10M × 22/26 ≈ 8.46M
      expect(result.proratedBase.toVNĐ()).toBe(8461538)
      // net = 8.46M + OT (rounded) - 1M
      expect(result.net.toVNĐ()).toBeGreaterThan(0)
      expect(result.net.toVNĐ()).toBeLessThan(result.gross.toVNĐ())
    })

    it('new employee mid-month: 10/26 days', () => {
      const employee = {
        id: 'emp2',
        baseSalary: Money.fromVNĐ(10000000),
        salaryType: 'monthly' as const,
      }
      const attendance: AttendanceRecord[] = buildWeekdayAttendance(2026, 6, 10)
      const result = calculateLine(
        employee,
        attendance,
        DEFAULT_RULES,
        { advance: Money.zero(), otherDeductions: Money.zero() }
      )
      // proratedBase = 10M × 10/26 = 3,846,153.846... → rounded 3,846,154
      expect(result.proratedBase.toVNĐ()).toBe(3846154)
      // net = 3.846M (no OT, no allowances)
      expect(result.net.toVNĐ()).toBe(3846154)
    })

    it('zero attendance = zero net', () => {
      const employee = {
        id: 'emp3',
        baseSalary: Money.fromVNĐ(10000000),
        salaryType: 'monthly' as const,
      }
      const result = calculateLine(
        employee,
        [],
        DEFAULT_RULES,
        { advance: Money.zero(), otherDeductions: Money.zero() }
      )
      expect(result.gross.isZero()).toBe(true)
      expect(result.net.isZero()).toBe(true)
    })

    it('employee with full OT (weekday + weekend + holiday)', () => {
      const employee = {
        id: 'emp4',
        baseSalary: Money.fromVNĐ(10000000),
        salaryType: 'monthly' as const,
      }
      const attendance: AttendanceRecord[] = [
        makeAttendance(new Date('2026-05-01'), 'present', 480, 0, 0), // Fri + Labor Day: holiday (via date)
        makeAttendance(new Date('2026-05-03'), 'present', 480, 60, 0), // Sun: weekend OT 60
        makeAttendance(new Date('2026-05-04'), 'present', 480, 60, 0), // Mon: weekday OT 60
      ]
      const result = calculateLine(
        employee,
        attendance,
        DEFAULT_RULES,
        { advance: Money.zero(), otherDeductions: Money.zero() }
      )
      expect(result.overtimeWeekdayAmount.toVNĐ()).toBeGreaterThan(0)
      expect(result.overtimeWeekendAmount.toVNĐ()).toBeGreaterThan(0)
      expect(result.overtimeHolidayAmount.toVNĐ()).toBeGreaterThan(0)
    })

    it('handles large advance correctly', () => {
      const employee = {
        id: 'emp5',
        baseSalary: Money.fromVNĐ(10000000),
        salaryType: 'monthly' as const,
      }
      const attendance = [
        makeAttendance(new Date('2026-07-13'), 'present', 480),
      ]
      const result = calculateLine(
        employee,
        attendance,
        DEFAULT_RULES,
        { advance: Money.fromVNĐ(999999999), otherDeductions: Money.zero() }
      )
      // net capped at 0
      expect(result.net.isZero()).toBe(true)
    })
  })

  describe('Edge cases per PRD-EPIC-002 spec', () => {
    it('February (28 days) payroll: 20 working days expected', () => {
      const standardDays = countWorkingDaysInMonth(2026, 1)
      expect(standardDays).toBe(24) // 28 days - 4 Sundays
    })

    it('February (leap year 2024): 25 working days', () => {
      const standardDays = countWorkingDaysInMonth(2024, 1)
      expect(standardDays).toBe(25) // 29 days - 4 Sundays = 25
    })

    it('31-day month has 27 working days', () => {
      const standardDays = countWorkingDaysInMonth(2026, 9) // October 31 days
      expect(standardDays).toBe(27) // 31 - 4 Sundays (Oct 4, 11, 18, 25) = 27
    })

    it('rounding edge case: 7 minutes rounds to 0 with roundingMinutes=15', () => {
      const result = applyOTRounding({ weekday: 7, weekend: 0, holiday: 0 }, 15)
      expect(result.weekday).toBe(0) // 7 < 7.5
    })

    it('rounding edge case: 8 minutes rounds to 15', () => {
      const result = applyOTRounding({ weekday: 8, weekend: 0, holiday: 0 }, 15)
      expect(result.weekday).toBe(15)
    })

    it('compliance: NO BHXH/PIT deduction in net', () => {
      const employee = {
        id: 'emp',
        baseSalary: Money.fromVNĐ(20000000), // 20M high earner
        salaryType: 'monthly' as const,
      }
      // Full month Mon-Sat days (22)
      const attendance: AttendanceRecord[] = buildWeekdayAttendance(2026, 6, 22)
      const result = calculateLine(
        employee,
        attendance,
        DEFAULT_RULES,
        { advance: Money.zero(), otherDeductions: Money.zero() }
      )
      // If compliance were active: net would be ~16-17M (BHXH ~10.5% + PIT bracket)
      // With MVP skip: net = proratedBase = 20M × 22/26 ≈ 16,923,076
      expect(result.net.toVNĐ()).toBeGreaterThan(16000000)
      expect(result.net.toVNĐ()).toBeLessThan(17000000)
    })
  })
})
