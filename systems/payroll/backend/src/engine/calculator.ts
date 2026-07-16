// Payroll calculation engine — pure function, no I/O.
// Implements BR-PAY-001 through BR-PAY-010 from domain-specs.md
//
// Money value object from @ak/shared for Decimal.js-backed exact arithmetic.
// All amounts in VNĐ (integer-decimal). Rules per PayrollRule config.
//
// Coverage target: 100% (pure function, exhaustive edge cases).

import { Money } from '@ak/shared'
import { roundMinutes } from './working-days.js'
import { isVietnamHoliday } from './holidays.js'

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeSnapshot {
  id: string
  baseSalary: Money         // Monthly or hourly rate (see salaryType)
  salaryType: 'monthly' | 'hourly'
}

export interface PayrollRuleSnapshot {
  effectiveFrom: Date
  effectiveTo: Date | null

  // BR-PAY-002 — OT multipliers
  otWeekdayMultiplier: number    // default 1.5
  otWeekendMultiplier: number    // default 2.0
  otHolidayMultiplier: number    // default 3.0

  // BR-PAY-004 — late penalty (null = disabled, per ADR-003 default OFF in MVP)
  latePenaltyPerMinute: Money | null
  maxLatePenaltyPerDay: Money | null

  // BR-PAY-005 — allowances
  mealAllowancePerDay: Money | null  // per day worked
  phoneAllowance: Money | null      // fixed per month

  // BR-PAY-003 — rounding
  roundingMinutes: number  // default 15

  // Working hours config
  workingHoursPerDay: number           // default 8
  standardWorkingDaysPerMonth: number  // default 26 (Mon-Sat, off Sunday)
}

export interface AttendanceRecord {
  date: Date
  status:
    | 'present'
    | 'late'
    | 'early_leave'
    | 'half_day'
    | 'absent'
    | 'on_leave'
    | 'holiday'
  totalWorkMinutes: number      // 0 if absent
  overtimeMinutes: number       // already-rounded in attendance service
  lateMinutes: number           // 0 if not late
  isWeekend: boolean            // computed at attendance time
}

export interface PayrollInputs {
  advance: Money             // BO-entered (employee cash advance)
  otherDeductions: Money     // Other manual deductions
}

export interface CalculatedLine {
  // Inputs (passed through)
  daysWorked: number
  totalWorkMinutes: number
  overtimeWeekdayMinutes: number
  overtimeWeekendMinutes: number
  overtimeHolidayMinutes: number
  lateMinutes: number

  // Money breakdown
  proratedBase: Money
  overtimeWeekdayAmount: Money
  overtimeWeekendAmount: Money
  overtimeHolidayAmount: Money
  latePenalty: Money
  allowances: Money
  gross: Money
  advance: Money
  otherDeductions: Money
  net: Money
}

// ============================================================================
// ENGINE
// ============================================================================

/**
 * Compute attendance totals from a list of attendance records for the period.
 * Returns aggregated counts.
 */
export function aggregateAttendance(
  attendance: AttendanceRecord[]
): {
  daysWorked: number
  totalWorkMinutes: number
  overtimeWeekdayMinutes: number
  overtimeWeekendMinutes: number
  overtimeHolidayMinutes: number
  lateMinutes: number
} {
  let daysWorked = 0
  let totalWorkMinutes = 0
  let overtimeWeekdayMinutes = 0
  let overtimeWeekendMinutes = 0
  let overtimeHolidayMinutes = 0
  let lateMinutes = 0

  for (const r of attendance) {
    if (r.status === 'absent' || r.status === 'on_leave') continue
    daysWorked++
    totalWorkMinutes += r.totalWorkMinutes
    lateMinutes += r.lateMinutes

    // Holiday check uses BOTH status AND actual date (engine agnostic to input quality)
    if (r.status === 'holiday' || isHoliday(r.date)) {
      overtimeHolidayMinutes += r.overtimeMinutes + r.totalWorkMinutes
    } else if (r.isWeekend) {
      overtimeWeekendMinutes += r.overtimeMinutes + r.totalWorkMinutes
    } else {
      overtimeWeekdayMinutes += r.overtimeMinutes
    }
  }

  return {
    daysWorked,
    totalWorkMinutes,
    overtimeWeekdayMinutes,
    overtimeWeekendMinutes,
    overtimeHolidayMinutes,
    lateMinutes,
  }
}

/**
 * BR-PAY-001: Pro-rated base salary.
 * Formula: proratedBase = baseSalary × (daysWorked / standardWorkingDaysInMonth)
 * Note: if daysWorked > standardWorkingDays, proratedBase = baseSalary (no cap)
 */
export function computeProratedBase(
  baseSalary: Money,
  daysWorked: number,
  standardWorkingDays: number
): Money {
  if (daysWorked <= 0) return Money.zero()
  if (standardWorkingDays <= 0) return baseSalary
  const effectiveDays = Math.min(daysWorked, standardWorkingDays)
  return baseSalary.multiply(effectiveDays).divide(standardWorkingDays)
}

/**
 * BR-PAY-002: OT calculation.
 * Formula: hourlyRate × OT_minutes × multiplier
 * hourlyRate = baseSalary / (standardWorkingDays × workingHoursPerDay) / 60
 */
export function computeOvertimeAmount(
  baseSalary: Money,
  otMinutes: number,
  standardWorkingDays: number,
  workingHoursPerDay: number,
  multiplier: number
): Money {
  if (otMinutes <= 0) return Money.zero()
  const hourlyRate = baseSalary
    .divide(standardWorkingDays)
    .divide(workingHoursPerDay)
    .divide(60)
  return hourlyRate.multiply(otMinutes).multiply(multiplier)
}

/**
 * BR-PAY-003: Round OT minutes to nearest N (default 15).
 */
export function applyOTRounding(
  overtimeMinutesByCategory: { weekday: number; weekend: number; holiday: number },
  roundingMinutes: number
): { weekday: number; weekend: number; holiday: number } {
  return {
    weekday: roundMinutes(overtimeMinutesByCategory.weekday, roundingMinutes),
    weekend: roundMinutes(overtimeMinutesByCategory.weekend, roundingMinutes),
    holiday: roundMinutes(overtimeMinutesByCategory.holiday, roundingMinutes),
  }
}

/**
 * BR-PAY-004: Late penalty calculation.
 * Returns 0 if rules disabled (null).
 * Formula: pen = min(lateMinutes × perMinute, maxPerDay) × daysLate
 */
export function computeLatePenalty(
  lateMinutes: number,
  daysLate: number,
  perMinute: Money | null,
  maxPerDay: Money | null
): Money {
  if (!perMinute || lateMinutes <= 0 || daysLate <= 0) return Money.zero()
  const perDayPenalty = perMinute.multiply(lateMinutes)
  const capped = maxPerDay ? Money.min(perDayPenalty, maxPerDay) : perDayPenalty
  return capped.multiply(daysLate)
}

/**
 * BR-PAY-005: Allowances.
 * total = mealAllowancePerDay × daysWorked + phoneAllowance
 */
export function computeAllowances(
  daysWorked: number,
  mealPerDay: Money | null,
  phone: Money | null
): Money {
  const meal = mealPerDay ? mealPerDay.multiply(daysWorked) : Money.zero()
  const phoneAllow = phone ?? Money.zero()
  return meal.add(phoneAllow)
}

/**
 * BR-PAY-006 + BR-PAY-007: Gross and Net calculation.
 * gross = proratedBase + otWeekday + otWeekend + otHoliday - latePenalty + allowances
 * net = gross - advance - otherDeductions
 *
 * MVP scope: NO BHXH/PIT/BHYT/BHTN (see ADR-003).
 */
export function computeGrossAndNet(
  proratedBase: Money,
  otWeekday: Money,
  otWeekend: Money,
  otHoliday: Money,
  latePenalty: Money,
  allowances: Money,
  advance: Money,
  otherDeductions: Money
): { gross: Money; net: Money } {
  const gross = proratedBase
    .add(otWeekday)
    .add(otWeekend)
    .add(otHoliday)
    .subtract(latePenalty)
    .add(allowances)

  // Negative gross → cap at 0 (edge case: NV không đủ giờ + nhiều penalty)
  const grossSafe = gross.isLessThan(Money.zero()) ? Money.zero() : gross

  const net = grossSafe.subtract(advance).subtract(otherDeductions)
  const netSafe = net.isLessThan(Money.zero()) ? Money.zero() : net

  return { gross: grossSafe, net: netSafe }
}

/**
 * Main entry: calculate a single employee's payroll line.
 * Pure function; does not touch DB.
 */
export function calculateLine(
  employee: EmployeeSnapshot,
  attendance: AttendanceRecord[],
  rules: PayrollRuleSnapshot,
  inputs: PayrollInputs
): CalculatedLine {
  // 1. Aggregate attendance
  const totals = aggregateAttendance(attendance)

  // 2. BR-PAY-003: Round OT minutes
  const roundedOT = applyOTRounding(
    {
      weekday: totals.overtimeWeekdayMinutes,
      weekend: totals.overtimeWeekendMinutes,
      holiday: totals.overtimeHolidayMinutes,
    },
    rules.roundingMinutes
  )

  // 3. BR-PAY-001: Pro-rated base
  const proratedBase = computeProratedBase(
    employee.baseSalary,
    totals.daysWorked,
    rules.standardWorkingDaysPerMonth
  )

  // 4. BR-PAY-002: OT amounts
  const otWeekdayAmount = computeOvertimeAmount(
    employee.baseSalary,
    roundedOT.weekday,
    rules.standardWorkingDaysPerMonth,
    rules.workingHoursPerDay,
    rules.otWeekdayMultiplier
  )
  const otWeekendAmount = computeOvertimeAmount(
    employee.baseSalary,
    roundedOT.weekend,
    rules.standardWorkingDaysPerMonth,
    rules.workingHoursPerDay,
    rules.otWeekendMultiplier
  )
  const otHolidayAmount = computeOvertimeAmount(
    employee.baseSalary,
    roundedOT.holiday,
    rules.standardWorkingDaysPerMonth,
    rules.workingHoursPerDay,
    rules.otHolidayMultiplier
  )

  // 5. BR-PAY-004: Late penalty
  // Count distinct days with late (not just total minutes)
  const daysLate = attendance.filter((r) => r.lateMinutes > 0 && r.status !== 'absent' && r.status !== 'on_leave').length
  const latePenalty = computeLatePenalty(
    totals.lateMinutes,
    daysLate,
    rules.latePenaltyPerMinute,
    rules.maxLatePenaltyPerDay
  )

  // 6. BR-PAY-005: Allowances
  const allowances = computeAllowances(
    totals.daysWorked,
    rules.mealAllowancePerDay,
    rules.phoneAllowance
  )

  // 7. BR-PAY-006 + BR-PAY-007
  const { gross, net } = computeGrossAndNet(
    proratedBase,
    otWeekdayAmount,
    otWeekendAmount,
    otHolidayAmount,
    latePenalty,
    allowances,
    inputs.advance,
    inputs.otherDeductions
  )

  return {
    daysWorked: totals.daysWorked,
    totalWorkMinutes: totals.totalWorkMinutes,
    overtimeWeekdayMinutes: roundedOT.weekday,
    overtimeWeekendMinutes: roundedOT.weekend,
    overtimeHolidayMinutes: roundedOT.holiday,
    lateMinutes: totals.lateMinutes,
    proratedBase,
    overtimeWeekdayAmount: otWeekdayAmount,
    overtimeWeekendAmount: otWeekendAmount,
    overtimeHolidayAmount: otHolidayAmount,
    latePenalty,
    allowances,
    gross,
    advance: inputs.advance,
    otherDeductions: inputs.otherDeductions,
    net,
  }
}

// ============================================================================
// UTILITIES for holiday/weekend detection (used at attendance feed)
// ============================================================================

/** Is given date a weekend (Sunday) in Vietnam work calendar? */
export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 // Sunday
}

/**
 * Detect if a given date falls on a Vietnamese holiday.
 * Used to assign OT holiday multiplier.
 */
export function isHoliday(date: Date): boolean {
  return isVietnamHoliday(date)
}
