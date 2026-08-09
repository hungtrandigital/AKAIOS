// Payroll service — orchestrates engine + DB to compute and persist lines.

import {
  prisma,
  Money,
  NotFoundError,
  ConflictError,
} from '@ak/shared'
import {
  assertMvpTaxMode,
  calculateLine,
  computeGrossAndNet,
  type CalculatedLine,
  type PayrollRuleSnapshot,
} from '../engine/calculator.js'
import { fetchAttendanceForPeriod } from '../clients/attendance-client.js'
import { VIETNAM_UTC_OFFSET_MS } from '../engine/holidays.js'

export interface PayrollCalculationActor {
  userId: string
  role: string
}

export interface PayrollPeriodBounds {
  fromDate: Date
  toDateExclusive: Date
}

/** Build the complete half-open calendar interval for a payroll month. */
export function getPayrollPeriodBounds(year: number, month: number): PayrollPeriodBounds {
  return {
    fromDate: new Date(Date.UTC(year, month - 1, 1) - VIETNAM_UTC_OFFSET_MS),
    toDateExclusive: new Date(Date.UTC(year, month, 1) - VIETNAM_UTC_OFFSET_MS),
  }
}

/** Recompute gross/net after applying persisted or newly entered BO overrides. */
export function applyPayrollOverrides(
  calculated: CalculatedLine,
  allowances: Money,
  advance: Money,
  otherDeductions: Money
): CalculatedLine {
  const { gross, net } = computeGrossAndNet(
    calculated.proratedBase,
    calculated.overtimeWeekdayAmount,
    calculated.overtimeWeekendAmount,
    calculated.overtimeHolidayAmount,
    calculated.latePenalty,
    allowances,
    advance,
    otherDeductions
  )

  return {
    ...calculated,
    allowances,
    advance,
    otherDeductions,
    gross,
    net,
  }
}

/** Preserve only an explicit allowance override during recalculation. */
export function resolveRecalculationAllowance(
  calculatedAllowance: Money,
  persistedAllowance: Money | undefined,
  isOverridden: boolean
): Money {
  return isOverridden && persistedAllowance ? persistedAllowance : calculatedAllowance
}

/** Sum exactly the Decimal(15,2) values that payroll lines will persist. */
export function sumPersistedMoney(amounts: Money[]): Money {
  return amounts.reduce(
    (sum, amount) => sum.add(Money.fromVNĐ(amount.toDBString())),
    Money.zero()
  )
}

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
  payrollPeriodId: string,
  tenantId: string,
  actor: PayrollCalculationActor
): Promise<{ linesCreated: number }> {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id: payrollPeriodId, tenantId },
    include: { tenant: true },
  })
  if (!period) throw new NotFoundError('PayrollPeriod', payrollPeriodId)
  if (period.status !== 'open' && period.status !== 'calculated') {
    throw new ConflictError(`Cannot calculate period in status ${period.status}`)
  }

  // Validate all prerequisites before attempting a state transition.
  const rules = await getCurrentRules(
    period.tenantId,
    new Date(Date.UTC(period.year, period.month - 1, 1))
  )
  if (!rules) {
    throw new NotFoundError('PayrollRule for this period')
  }
  assertMvpTaxMode(rules.taxMode)

  const { fromDate, toDateExclusive } = getPayrollPeriodBounds(period.year, period.month)

  const [employees, existingLines] = await Promise.all([
    prisma.employee.findMany({
      where: { tenantId: period.tenantId, status: 'active', deletedAt: null },
    }),
    prisma.payrollLine.findMany({
      where: { payrollPeriodId },
    }),
  ])
  const existingByEmployee = new Map(existingLines.map((line) => [line.employeeId, line]))

  // Finish all fallible attendance reads and calculations before writing any
  // state. A failed employee cannot leave a partial period behind.
  const calculatedLines = await Promise.all(employees.map(async (employee) => {
    const attendanceRecords = await fetchAttendanceForPeriod(
      period.tenantId,
      employee.id,
      fromDate,
      toDateExclusive,
    )
    const existing = existingByEmployee.get(employee.id)
    const advance = existing ? Money.fromVNĐ(existing.advance.toString()) : Money.zero()
    const otherDeductions = existing
      ? Money.fromVNĐ(existing.otherDeductions.toString())
      : Money.zero()
    const calculated = calculateLine(
      {
        id: employee.id,
        baseSalary: Money.fromVNĐ(employee.baseSalary.toString()),
        salaryType: employee.salaryType as 'monthly' | 'hourly',
        hourlyRate: employee.hourlyRate
          ? Money.fromVNĐ(employee.hourlyRate.toString())
          : null,
      },
      attendanceRecords,
      rules,
      { advance, otherDeductions }
    )
    const allowances = resolveRecalculationAllowance(
      calculated.allowances,
      existing ? Money.fromVNĐ(existing.allowances.toString()) : undefined,
      existing?.allowancesOverridden ?? false
    )

    return {
      employee,
      result: applyPayrollOverrides(calculated, allowances, advance, otherDeductions),
    }
  }))

  const totalGross = sumPersistedMoney(calculatedLines.map((line) => line.result.gross))
  const totalNet = sumPersistedMoney(calculatedLines.map((line) => line.result.net))

  await prisma.$transaction(async (tx) => {
    // updatedAt closes the calculated→calculating→calculated ABA race during
    // concurrent recalculations.
    const claimed = await tx.payrollPeriod.updateMany({
      where: {
        id: payrollPeriodId,
        tenantId,
        status: period.status,
        updatedAt: period.updatedAt,
      },
      data: { status: 'calculating' },
    })
    if (claimed.count !== 1) {
      throw new ConflictError('Payroll period changed while calculation was in progress')
    }

    const activeEmployeeIds = calculatedLines.map(({ employee }) => employee.id)
    await tx.payrollLine.deleteMany({
      where: {
        payrollPeriodId,
        ...(activeEmployeeIds.length > 0
          ? { employeeId: { notIn: activeEmployeeIds } }
          : {}),
      },
    })

    for (const { employee, result } of calculatedLines) {
      const lineData = {
        daysWorked: result.daysWorked,
        workdayUnits: result.workdayUnits.toString(),
        daysOnLeave: result.daysOnLeave,
        totalWorkMinutes: result.totalWorkMinutes,
        overtimeWeekdayMinutes: result.overtimeWeekdayMinutes,
        overtimeWeekendMinutes: result.overtimeWeekendMinutes,
        overtimeHolidayMinutes: result.overtimeHolidayMinutes,
        lateMinutes: result.lateMinutes,
        absentDays: result.absentDays,
        baseSalary: employee.baseSalary.toString(),
        proratedBase: result.proratedBase.toDBString(),
        overtimeWeekdayAmount: result.overtimeWeekdayAmount.toDBString(),
        overtimeWeekendAmount: result.overtimeWeekendAmount.toDBString(),
        overtimeHolidayAmount: result.overtimeHolidayAmount.toDBString(),
        latePenalty: result.latePenalty.toDBString(),
        allowances: result.allowances.toDBString(),
        gross: result.gross.toDBString(),
        bhxhNhanVien: '0.00',
        bhxhDoanhNghiep: '0.00',
        bhytNhanVien: '0.00',
        bhytDoanhNghiep: '0.00',
        bhtnNhanVien: '0.00',
        bhtnDoanhNghiep: '0.00',
        thueTNCN: '0.00',
        tongKhauTru: '0.00',
        advance: result.advance.toDBString(),
        otherDeductions: result.otherDeductions.toDBString(),
        net: result.net.toDBString(),
      }
      await tx.payrollLine.upsert({
        where: {
          payrollPeriodId_employeeId: {
            payrollPeriodId,
            employeeId: employee.id,
          },
        },
        create: {
          payrollPeriodId,
          employeeId: employee.id,
          ...lineData,
        },
        update: lineData,
      })
    }

    const finalized = await tx.payrollPeriod.updateMany({
      where: { id: payrollPeriodId, tenantId, status: 'calculating' },
      data: {
        status: 'calculated',
        calculatedAt: new Date(),
        approvedAt: null,
        approvedById: null,
        totalGross: totalGross.toDBString(),
        totalNet: totalNet.toDBString(),
        totalEmployees: calculatedLines.length,
      },
    })
    if (finalized.count !== 1) {
      throw new ConflictError('Payroll period could not be finalized atomically')
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        actorId: actor.userId,
        actorRole: actor.role,
        action: 'calculate_payroll',
        entityType: 'PayrollPeriod',
        entityId: payrollPeriodId,
        previousValue: {
          status: period.status,
          recalculation: period.status === 'calculated',
        },
        newValue: {
          status: 'calculated',
          totalEmployees: calculatedLines.length,
          totalGross: totalGross.toDBString(),
          totalNet: totalNet.toDBString(),
        },
      },
    })
  })

  return { linesCreated: calculatedLines.length }
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
