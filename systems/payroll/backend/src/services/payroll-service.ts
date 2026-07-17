// Payroll service — orchestrates engine + DB to compute and persist lines.

import { prisma, Money, NotFoundError, ConflictError } from '@ak/shared'
import {
  calculateLine,
  aggregateAttendance,
  type PayrollRuleSnapshot,
} from '../engine/calculator.js'
import { fetchAttendanceLocal } from '../clients/attendance-client.js'

/**
 * Open a new payroll period (idempotent — returns existing if found).
 */
export async function openPayrollPeriod(tenantId: string, year: number, month: number, openedById: string) {
  const existing = await prisma.payrollPeriod.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } },
  })
  if (existing) {
    if (existing.status !== 'open') {
      throw new ConflictError(
        `Period ${year}-${month} already exists with status ${existing.status}`
      )
    }
    return existing
  }
  return prisma.payrollPeriod.create({
    data: {
      tenantId,
      year,
      month,
      status: 'open',
      openedById,
    },
  })
}

/**
 * Calculate payroll for all employees in a period.
 * Returns the count of lines created.
 */
export async function calculatePayroll(
  payrollPeriodId: string
): Promise<{ linesCreated: number }> {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: payrollPeriodId },
    include: { tenant: true },
  })
  if (!period) throw new NotFoundError('PayrollPeriod', payrollPeriodId)
  if (period.status !== 'open') {
    throw new ConflictError(`Cannot calculate period in status ${period.status}`)
  }

  await prisma.payrollPeriod.update({
    where: { id: payrollPeriodId },
    data: { status: 'calculating' },
  })

  // Get current payroll rules
  const rules = await getCurrentRules(period.tenantId, new Date(period.year, period.month - 1, 1))
  if (!rules) {
    throw new NotFoundError('PayrollRule for this period')
  }

  // Date range for the period
  const fromDate = new Date(period.year, period.month - 1, 1)
  const toDate = new Date(period.year, period.month, 0) // last day of month

  // Get active employees
  const employees = await prisma.employee.findMany({
    where: { tenantId: period.tenantId, status: 'active', deletedAt: null },
  })

  let linesCreated = 0
  for (const employee of employees) {
    // Fetch attendance via local DB (in production, switch to fetchAttendanceForPeriod)
    const attendanceRecords = await fetchAttendanceLocal(
      employee.id,
      fromDate,
      toDate
    )

    // Aggregate into engine input
    aggregateAttendance(attendanceRecords)

    // Get advance + other deductions (BO-entered — for MVP, default 0)
    const advance = Money.zero()
    const otherDeductions = Money.zero()

    const result = calculateLine(
      { id: employee.id, baseSalary: Money.fromVNĐ(employee.baseSalary.toString()), salaryType: employee.salaryType as 'monthly' | 'hourly' },
      attendanceRecords,
      rules,
      { advance, otherDeductions }
    )

    // Check if line already exists (idempotent)
    const existingLine = await prisma.payrollLine.findUnique({
      where: { payrollPeriodId_employeeId: { payrollPeriodId, employeeId: employee.id } },
    })

    if (existingLine) {
      await prisma.payrollLine.update({
        where: { id: existingLine.id },
        data: {
          daysWorked: result.daysWorked,
          daysOnLeave: 0,
          totalWorkMinutes: result.totalWorkMinutes,
          overtimeWeekdayMinutes: result.overtimeWeekdayMinutes,
          overtimeWeekendMinutes: result.overtimeWeekendMinutes,
          overtimeHolidayMinutes: result.overtimeHolidayMinutes,
          lateMinutes: result.lateMinutes,
          absentDays: 0,
          baseSalary: employee.baseSalary.toString(),
          proratedBase: result.proratedBase.toDBString(),
          overtimeWeekdayAmount: result.overtimeWeekdayAmount.toDBString(),
          overtimeWeekendAmount: result.overtimeWeekendAmount.toDBString(),
          overtimeHolidayAmount: result.overtimeHolidayAmount.toDBString(),
          latePenalty: result.latePenalty.toDBString(),
          allowances: result.allowances.toDBString(),
          gross: result.gross.toDBString(),
          advance: result.advance.toDBString(),
          otherDeductions: result.otherDeductions.toDBString(),
          net: result.net.toDBString(),
        },
      })
    } else {
      await prisma.payrollLine.create({
        data: {
          payrollPeriodId,
          employeeId: employee.id,
          daysWorked: result.daysWorked,
          totalWorkMinutes: result.totalWorkMinutes,
          overtimeWeekdayMinutes: result.overtimeWeekdayMinutes,
          overtimeWeekendMinutes: result.overtimeWeekendMinutes,
          overtimeHolidayMinutes: result.overtimeHolidayMinutes,
          lateMinutes: result.lateMinutes,
          baseSalary: employee.baseSalary.toString(),
          proratedBase: result.proratedBase.toDBString(),
          overtimeWeekdayAmount: result.overtimeWeekdayAmount.toDBString(),
          overtimeWeekendAmount: result.overtimeWeekendAmount.toDBString(),
          overtimeHolidayAmount: result.overtimeHolidayAmount.toDBString(),
          latePenalty: result.latePenalty.toDBString(),
          allowances: result.allowances.toDBString(),
          gross: result.gross.toDBString(),
          advance: result.advance.toDBString(),
          otherDeductions: result.otherDeductions.toDBString(),
          net: result.net.toDBString(),
        },
      })
    }
    linesCreated++
  }

  // Update period totals
  const allLines = await prisma.payrollLine.findMany({
    where: { payrollPeriodId },
  })
  const totalGross = allLines.reduce(
    (sum, l) => sum.add(Money.fromVNĐ(l.gross.toString())),
    Money.zero()
  )
  const totalNet = allLines.reduce(
    (sum, l) => sum.add(Money.fromVNĐ(l.net.toString())),
    Money.zero()
  )

  await prisma.payrollPeriod.update({
    where: { id: payrollPeriodId },
    data: {
      status: 'calculated',
      calculatedAt: new Date(),
      totalGross: totalGross.toDBString(),
      totalNet: totalNet.toDBString(),
      totalEmployees: allLines.length,
    },
  })

  return { linesCreated }
}

async function getCurrentRules(tenantId: string, atDate: Date): Promise<PayrollRuleSnapshot | null> {
  const rule = await prisma.payrollRule.findFirst({
    where: {
      tenantId,
      effectiveFrom: { lte: atDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: atDate } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  })
  if (!rule) return null
  return {
    effectiveFrom: rule.effectiveFrom,
    effectiveTo: rule.effectiveTo,
    otWeekdayMultiplier: Number(rule.otWeekdayMultiplier),
    otWeekendMultiplier: Number(rule.otWeekendMultiplier),
    otHolidayMultiplier: Number(rule.otHolidayMultiplier),
    latePenaltyPerMinute: rule.latePenaltyPerMinute ? Money.fromVNĐ(rule.latePenaltyPerMinute.toString()) : null,
    maxLatePenaltyPerDay: rule.maxLatePenaltyPerDay ? Money.fromVNĐ(rule.maxLatePenaltyPerDay.toString()) : null,
    mealAllowancePerDay: rule.mealAllowancePerDay ? Money.fromVNĐ(rule.mealAllowancePerDay.toString()) : null,
    phoneAllowance: rule.phoneAllowance ? Money.fromVNĐ(rule.phoneAllowance.toString()) : null,
    roundingMinutes: rule.roundingMinutes,
    workingHoursPerDay: rule.workingHoursPerDay,
    standardWorkingDaysPerMonth: rule.standardWorkingDaysPerMonth,
    taxMode: rule.taxMode,
    bhxhRateNv: rule.bhxhRateNv ? Number(rule.bhxhRateNv) : null,
    bhxhRateDn: rule.bhxhRateDn ? Number(rule.bhxhRateDn) : null,
    bhytRateNv: rule.bhytRateNv ? Number(rule.bhytRateNv) : null,
    bhytRateDn: rule.bhytRateDn ? Number(rule.bhytRateDn) : null,
    bhtnRateNv: rule.bhtnRateNv ? Number(rule.bhtnRateNv) : null,
    bhtnRateDn: rule.bhtnRateDn ? Number(rule.bhtnRateDn) : null,
  }
}
