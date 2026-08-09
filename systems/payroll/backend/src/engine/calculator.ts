// Payroll calculation engine — pure function, no I/O.
// Implements BR-PAY-001 through BR-PAY-010 from domain-specs.md
//
// Money value object from @ak/shared for Decimal.js-backed exact arithmetic.
// All amounts in VNĐ (integer-decimal). Rules per PayrollRule config.
//
// Coverage target: 100% (pure function, exhaustive edge cases).

import { BusinessRuleViolationError, Money } from '@ak/shared'
import { roundMinutes } from './working-days.js'
import { computeVietnamTax, type TaxBreakdown } from './vietnam-tax.js'
import type { TaxMode } from '@prisma/client'
import { isVietnamHoliday, isVietnamSunday } from './holidays.js'

// ============================================================================
// TYPES
// ============================================================================

export interface EmployeeSnapshot {
  id: string
  baseSalary: Money
  salaryType: 'monthly' | 'hourly'
  hourlyRate?: Money | null
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

  // VN tax/insurance (BR-VN-TAX-001..005)
  taxMode: TaxMode                     // 'none' | 'tncn_only' | 'full' | 'custom'
  bhxhRateNv?: number | null          // 0.08 default
  bhxhRateDn?: number | null
  bhytRateNv?: number | null
  bhytRateDn?: number | null
  bhtnRateNv?: number | null
  bhtnRateDn?: number | null
  dependentCount?: number             // Số người phụ thuộc (default 0)
}

export interface AttendanceRecord {
  shiftAssignmentId?: string
  employeeId?: string
  date: Date
  status:
    | 'present'
    | 'late'
    | 'early_leave'
    | 'half_day'
    | 'absent'
    | 'on_leave'
    | 'holiday'
  checkInAt?: Date | null
  checkOutAt?: Date | null
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
  daysOnLeave: number
  absentDays: number
  workdayUnits: number
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

  // Vietnam tax/insurance (per VN_RATES_DEFAULT; controlled by taxMode)
  tax: TaxBreakdown

  // Other deductions
  advance: Money
  otherDeductions: Money

  // Final take-home = gross - total tax deductions - advance - other
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
  attendance: AttendanceRecord[],
): {
  daysWorked: number
  daysOnLeave: number
  absentDays: number
  workdayUnits: number
  totalWorkMinutes: number
  overtimeWeekdayMinutes: number
  overtimeWeekendMinutes: number
  overtimeHolidayMinutes: number
  lateMinutes: number
} {
  let daysWorked = 0
  let daysOnLeave = 0
  let absentDays = 0
  let workdayUnits = 0
  let totalWorkMinutes = 0
  let overtimeWeekdayMinutes = 0
  let overtimeWeekendMinutes = 0
  let overtimeHolidayMinutes = 0
  let lateMinutes = 0

  for (const [workDate, dayRecords] of groupAttendanceByDate(attendance)) {
    const payableRecords = dayRecords.filter((record) => (
      record.status !== 'absent' && record.status !== 'on_leave'
    ))
    if (payableRecords.length === 0) {
      if (dayRecords.some(({ status }) => status === 'on_leave')) {
        daysOnLeave++
      } else {
        absentDays++
      }
      continue
    }

    assertSingleWorkedAssignment(workDate, payableRecords)
    daysWorked++
    workdayUnits += Math.min(1, payableRecords.reduce(
      (units, record) => units + (record.status === 'half_day' ? 0.5 : 1),
      0,
    ))
    const dayWorkMinutes = payableRecords.reduce(
      (minutes, record) => minutes + record.totalWorkMinutes,
      0,
    )
    totalWorkMinutes += dayWorkMinutes
    lateMinutes += payableRecords.reduce(
      (minutes, record) => minutes + record.lateMinutes,
      0,
    )

    // OT category follows the Vietnam calendar date. A separate terminal
    // `holiday` record can represent paid non-working time and must never
    // reclassify minutes worked by another assignment on a non-holiday date.
    if (isHoliday(payableRecords[0]!.date)) {
      // totalWorkMinutes already includes the overtime portion. On a holiday,
      // every worked minute receives the holiday multiplier exactly once.
      overtimeHolidayMinutes += dayWorkMinutes
    } else if (payableRecords[0]!.isWeekend) {
      // totalWorkMinutes already includes the overtime portion. Adding
      // overtimeMinutes again would double-count the tail of the shift.
      overtimeWeekendMinutes += dayWorkMinutes
    } else {
      const recordOvertime = payableRecords.reduce(
        (minutes, record) => minutes + record.overtimeMinutes,
        0,
      )
      overtimeWeekdayMinutes += recordOvertime
    }
  }

  return {
    daysWorked,
    daysOnLeave,
    absentDays,
    workdayUnits,
    totalWorkMinutes,
    overtimeWeekdayMinutes,
    overtimeWeekendMinutes,
    overtimeHolidayMinutes,
    lateMinutes,
  }
}

function groupAttendanceByDate(attendance: AttendanceRecord[]): Map<string, AttendanceRecord[]> {
  const grouped = new Map<string, AttendanceRecord[]>()
  for (const record of attendance) {
    const key = record.date.toISOString().slice(0, 10)
    grouped.set(key, [...(grouped.get(key) ?? []), record])
  }
  return grouped
}

function assertSingleWorkedAssignment(
  workDate: string,
  records: AttendanceRecord[],
): void {
  const worked = records.filter((record) => (
    record.totalWorkMinutes > 0 || record.checkInAt || record.checkOutAt
  ))
  if (worked.length > 1) {
    throw new BusinessRuleViolationError(
      'Multiple worked assignments on one business date must be reconciled before payroll calculation',
      {
        workDate,
        employeeId: worked.find(({ employeeId }) => employeeId)?.employeeId,
        shiftAssignmentIds: worked
          .map(({ shiftAssignmentId }) => shiftAssignmentId)
          .filter((id): id is string => Boolean(id)),
      },
    )
  }
}

/**
 * BR-PAY-001: Pro-rated base salary.
 * Formula: proratedBase = baseSalary × (workdayUnits / standardWorkingDaysInMonth)
 * Workday units above the configured standard are capped at the monthly base.
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
 * Formula for monthly employees: derived minute rate × OT minutes × multiplier.
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
 * Formula: sum(min(dayLateMinutes × perMinute, maxPerDay))
 */
export function computeLatePenalty(
  lateMinutesByDay: number[],
  perMinute: Money | null,
  maxPerDay: Money | null
): Money {
  if (!perMinute) return Money.zero()
  return lateMinutesByDay.reduce((total, minutes) => {
    if (minutes <= 0) return total
    const dailyPenalty = perMinute.multiply(minutes)
    return total.add(maxPerDay ? Money.min(dailyPenalty, maxPerDay) : dailyPenalty)
  }, Money.zero())
}

function requireHourlyRate(employee: EmployeeSnapshot): Money {
  if (!employee.hourlyRate || !employee.hourlyRate.isGreaterThan(Money.zero())) {
    throw new BusinessRuleViolationError('Hourly employee requires a positive hourlyRate')
  }
  return employee.hourlyRate
}

/**
 * BR-PAY-005: Allowances.
 * total = mealAllowancePerDay × workdayUnits + phoneAllowance
 */
export function computeAllowances(
  workdayUnits: number,
  mealPerDay: Money | null,
  phone: Money | null
): Money {
  const meal = mealPerDay ? mealPerDay.multiply(workdayUnits) : Money.zero()
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
  assertMvpTaxMode(rules.taxMode)

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
  const hourlyRate = employee.salaryType === 'hourly' ? requireHourlyRate(employee) : null
  const regularHourlyMinutes = Math.max(0, totals.totalWorkMinutes
    - totals.overtimeWeekdayMinutes
    - totals.overtimeWeekendMinutes
    - totals.overtimeHolidayMinutes)
  const proratedBase = hourlyRate
    ? hourlyRate.multiply(regularHourlyMinutes).divide(60)
    : computeProratedBase(
        employee.baseSalary,
        totals.workdayUnits,
        rules.standardWorkingDaysPerMonth
      )

  // 4. BR-PAY-002: OT amounts
  const overtimeAmount = (minutes: number, multiplier: number) => hourlyRate
    ? hourlyRate.multiply(minutes).divide(60).multiply(multiplier)
    : computeOvertimeAmount(
        employee.baseSalary,
        minutes,
        rules.standardWorkingDaysPerMonth,
        rules.workingHoursPerDay,
        multiplier
      )
  const otWeekdayAmount = overtimeAmount(roundedOT.weekday, rules.otWeekdayMultiplier)
  const otWeekendAmount = overtimeAmount(roundedOT.weekend, rules.otWeekendMultiplier)
  const otHolidayAmount = overtimeAmount(roundedOT.holiday, rules.otHolidayMultiplier)

  // 5. BR-PAY-004: Late penalty
  const lateMinutesByDay = [...groupAttendanceByDate(attendance).values()]
    .map((records) => records
      .filter((record) => record.status !== 'absent' && record.status !== 'on_leave')
      .reduce((minutes, record) => minutes + record.lateMinutes, 0))
  const latePenalty = computeLatePenalty(
    lateMinutesByDay,
    rules.latePenaltyPerMinute,
    rules.maxLatePenaltyPerDay
  )

  // 6. BR-PAY-005: Allowances
  const allowances = computeAllowances(
    totals.workdayUnits,
    rules.mealAllowancePerDay,
    rules.phoneAllowance
  )

  // 7. BR-PAY-006 + BR-PAY-007 — one MVP money invariant.
  // ADR-003 permits only BO-entered advance and other deductions.
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

  // Keep the existing response shape while guaranteeing a zero compliance
  // breakdown throughout the approved MVP path.
  const tax = computeVietnamTax(gross, 'none')

  return {
    daysWorked: totals.daysWorked,
    daysOnLeave: totals.daysOnLeave,
    absentDays: totals.absentDays,
    workdayUnits: totals.workdayUnits,
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
    tax,
    advance: inputs.advance,
    otherDeductions: inputs.otherDeductions,
    net,
  }
}

/** ADR-003 gate: compliance modes are not executable in the MVP. */
export function assertMvpTaxMode(taxMode: TaxMode): void {
  if (taxMode !== 'none') {
    throw new BusinessRuleViolationError(
      `Tax mode '${taxMode}' is outside the approved MVP scope; use 'none'`
    )
  }
}

// ============================================================================
// UTILITIES for holiday/weekend detection (used at attendance feed)
// ============================================================================

/** Is given date a weekend (Sunday) in Vietnam work calendar? */
export function isWeekend(date: Date): boolean {
  return isVietnamSunday(date)
}

/**
 * Detect if a given date falls on a Vietnamese holiday.
 * Used to assign OT holiday multiplier.
 */
export function isHoliday(date: Date): boolean {
  return isVietnamHoliday(date)
}
