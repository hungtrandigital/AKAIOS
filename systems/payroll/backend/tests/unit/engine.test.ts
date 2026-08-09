// Smoke test for payroll engine. Full integration tests live in calculator.test.ts.

import { describe, it, expect } from 'vitest'
import { Money } from '@ak/shared'
import { calculateLine, isWeekend } from '../../src/engine/calculator.js'
import type { PayrollRuleSnapshot, AttendanceRecord } from '../../src/engine/calculator.js'

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
  taxMode: 'none',
}

/** Build attendance for the first N Mon-Sat dates of a month, skipping Sundays. */
function buildWeekdayAttendance(year: number, month: number, count: number): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  let day = 1
  while (records.length < count && day <= 31) {
    const date = new Date(year, month, day)
    if (!isWeekend(date)) {
      records.push({
        date,
        status: 'present',
        totalWorkMinutes: 480,
        overtimeMinutes: 0,
        lateMinutes: 0,
        isWeekend: false,
      })
    }
    day++
  }
  return records
}

describe('payroll engine smoke test', () => {
  it('full month (22 Mon-Sat days) returns 10M gross', () => {
    const attendance = buildWeekdayAttendance(2026, 6, 22) // July 2026
    const result = calculateLine(
      { id: 'emp1', baseSalary: Money.fromVNĐ(10000000), salaryType: 'monthly' },
      attendance,
      DEFAULT_RULES,
      { advance: Money.zero(), otherDeductions: Money.zero() }
    )
    // 22 days ÷ 26 standard days × 10M = 8,461,538
    expect(result.proratedBase.toVNĐ()).toBe(8461538)
    expect(result.gross.toVNĐ()).toBe(8461538)
    expect(result.net.toVNĐ()).toBe(8461538)
  })
})
