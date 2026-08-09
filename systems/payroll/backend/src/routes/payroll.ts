// Payroll routes — periods, calculate, approve, lock, override, export.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  ForbiddenError,
  NotFoundError,
  BusinessRuleViolationError,
  ValidationError,
  Money,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { openPayrollPeriod, calculatePayroll } from '../services/payroll-service.js'
import { generatePayrollExcel } from '../services/excel-exporter.js'
import { computeAllowances, computeGrossAndNet } from '../engine/calculator.js'

export const mvpMoneyString = z
  .string()
  .trim()
  .regex(/^\d{1,13}(?:\.\d{1,2})?$/, 'Must be a non-negative amount with at most 2 decimals')

export const payrollRoutes: FastifyPluginAsync = async (app) => {
  // ===== LIST PERIODS =====
  app.get('/periods', { preHandler: [requireAuth, requirePermission('payroll.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const q = z
      .object({
        year: z.coerce.number().int().optional(),
        status: z
          .enum(['open', 'calculating', 'calculated', 'approved', 'paid', 'locked'])
          .optional(),
      })
      .parse(request.query)

    const periods = await prisma.payrollPeriod.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(q.year ? { year: q.year } : {}),
        ...(q.status ? { status: q.status } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })
    return { data: periods }
  })

  // ===== OPEN PERIOD =====
  app.post('/periods', { preHandler: [requireAuth, requirePermission('payroll.open')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const body = z
      .object({
        year: z.number().int().min(2020).max(2050),
        month: z.number().int().min(1).max(12),
      })
      .parse(request.body)
    return openPayrollPeriod(request.user.tenantId, body.year, body.month, request.user.userId)
  })

  // ===== CALCULATE PERIOD =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/calculate',
    { preHandler: [requireAuth, requirePermission('payroll.calculate')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id

      const result = await calculatePayroll(id, request.user.tenantId, {
        userId: request.user.userId,
        role: request.user.role,
      })
      app.log.info({ periodId: id, linesCreated: result.linesCreated }, 'Payroll calculated')
      return { jobId: `calc-${id}`, message: `Calculated ${result.linesCreated} lines`, ...result }
    }
  )

  // ===== GET PERIOD WITH LINES =====
  app.get<{ Params: { id: string } }>(
    '/periods/:id',
    { preHandler: [requireAuth, requirePermission('payroll.view')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
        include: {
          lines: { include: { employee: { select: { id: true, employeeCode: true, fullName: true } } } },
        },
      })
      if (!period) {
        throw new NotFoundError('PayrollPeriod', id)
      }
      return period
    }
  )

  // ===== APPROVE PERIOD (BR-PAY-008) =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/approve',
    { preHandler: [requireAuth, requirePermission('payroll.approve')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
      })
      if (!period) throw new NotFoundError('PayrollPeriod', id)
      if (period.status !== 'calculated') {
        throw new BusinessRuleViolationError(
          `Cannot approve period in status ${period.status}; must be 'calculated'`
        )
      }
      return prisma.$transaction(async (tx) => {
        const transitioned = await tx.payrollPeriod.updateMany({
          where: { id, tenantId: request.user!.tenantId, status: 'calculated' },
          data: {
            status: 'approved',
            approvedAt: new Date(),
            approvedById: request.user!.userId,
          },
        })
        if (transitioned.count !== 1) {
          throw new BusinessRuleViolationError('Payroll period is no longer approvable')
        }
        await tx.auditLog.create({
          data: {
            tenantId: period.tenantId,
            actorId: request.user!.userId,
            actorRole: request.user!.role,
            action: 'approve_payroll',
            entityType: 'PayrollPeriod',
            entityId: id,
            newValue: { status: 'approved' },
          },
        })
        return tx.payrollPeriod.findFirst({
          where: { id, tenantId: request.user!.tenantId },
        })
      })
    }
  )

  // ===== LOCK PERIOD =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/lock',
    { preHandler: [requireAuth, requirePermission('payroll.lock')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
      })
      if (!period) throw new NotFoundError('PayrollPeriod', id)
      if (period.status !== 'paid') {
        throw new BusinessRuleViolationError(
          `Cannot lock period in status ${period.status}; must be 'paid' first`
        )
      }
      const transitioned = await prisma.payrollPeriod.updateMany({
        where: { id, tenantId: request.user.tenantId, status: 'paid' },
        data: { status: 'locked', lockedAt: new Date() },
      })
      if (transitioned.count !== 1) {
        throw new BusinessRuleViolationError('Payroll period is no longer lockable')
      }
      return prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
      })
    }
  )

  // ===== MARK PAID =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/mark-paid',
    { preHandler: [requireAuth, requirePermission('payroll.approve')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
      })
      if (!period) throw new NotFoundError('PayrollPeriod', id)
      if (period.status !== 'approved') {
        throw new BusinessRuleViolationError(
          `Cannot mark paid period in status ${period.status}`
        )
      }
      const transitioned = await prisma.payrollPeriod.updateMany({
        where: { id, tenantId: request.user.tenantId, status: 'approved' },
        data: { status: 'paid', paidAt: new Date() },
      })
      if (transitioned.count !== 1) {
        throw new BusinessRuleViolationError('Payroll period is no longer payable')
      }
      return prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
      })
    }
  )

  // ===== OVERRIDE PAYROLL LINE =====
  app.post<{ Params: { id: string } }>(
    '/lines/:id/override',
    { preHandler: [requireAuth, requirePermission('payroll.override')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const parsedBody = z
        .object({
          reason: z.string().min(10),
          advance: mvpMoneyString.optional(),
          otherDeductions: mvpMoneyString.optional(),
          allowances: mvpMoneyString.optional(),
          clearAllowancesOverride: z.boolean().optional(),
        })
        .refine(
          (value) => !(value.allowances !== undefined && value.clearAllowancesOverride),
          { message: 'allowances and clearAllowancesOverride are mutually exclusive' }
        )
        .safeParse(request.body)
      if (!parsedBody.success) {
        throw new ValidationError('Invalid payroll override', {
          issues: parsedBody.error.issues,
        })
      }
      const body = parsedBody.data

      const line = await prisma.payrollLine.findFirst({
        where: {
          id,
          payrollPeriod: { tenantId: request.user.tenantId },
        },
        include: { payrollPeriod: true },
      })
      if (!line) throw new NotFoundError('PayrollLine', id)
      if (line.payrollPeriod.status !== 'calculated') {
        throw new BusinessRuleViolationError(
          `Cannot modify lines in ${line.payrollPeriod.status} period; must be 'calculated'`
        )
      }
      const requestedAdvance = body.advance !== undefined ? Money.fromVNĐ(body.advance) : undefined
      const requestedOther = body.otherDeductions !== undefined
        ? Money.fromVNĐ(body.otherDeductions)
        : undefined

      return prisma.$transaction(async (tx) => {
        // Serialize against approve/paid transitions. If approval wins first,
        // this compare-and-set fails and no line or audit mutation is written.
        const editable = await tx.payrollPeriod.updateMany({
          where: {
            id: line.payrollPeriodId,
            tenantId: request.user!.tenantId,
            status: 'calculated',
          },
          data: { status: 'calculated' },
        })
        if (editable.count !== 1) {
          throw new BusinessRuleViolationError('Payroll period is no longer editable')
        }

        // Period-row serialization makes concurrent overrides wait. Re-read
        // the line after acquiring that lock so omitted fields and audit
        // previousValue come from the latest committed override.
        const currentLine = await tx.payrollLine.findFirst({
          where: {
            id,
            payrollPeriod: { tenantId: request.user!.tenantId },
          },
          include: { payrollPeriod: true },
        })
        if (!currentLine) throw new NotFoundError('PayrollLine', id)

        let allowances = body.allowances !== undefined
          ? Money.fromVNĐ(body.allowances)
          : Money.fromVNĐ(currentLine.allowances.toString())
        if (body.clearAllowancesOverride) {
          if (currentLine.daysWorked > 0 && Number(currentLine.workdayUnits) === 0) {
            throw new BusinessRuleViolationError(
              'Recalculate this migrated payroll period before clearing its allowance override'
            )
          }
          const ruleDate = new Date(Date.UTC(
            currentLine.payrollPeriod.year,
            currentLine.payrollPeriod.month - 1,
            1
          ))
          const rule = await tx.payrollRule.findFirst({
            where: {
              tenantId: request.user!.tenantId,
              effectiveFrom: { lte: ruleDate },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: ruleDate } }],
            },
            orderBy: { effectiveFrom: 'desc' },
          })
          if (!rule) throw new NotFoundError('PayrollRule for this period')
          allowances = computeAllowances(
            Number(currentLine.workdayUnits),
            rule.mealAllowancePerDay
              ? Money.fromVNĐ(rule.mealAllowancePerDay.toString())
              : null,
            rule.phoneAllowance ? Money.fromVNĐ(rule.phoneAllowance.toString()) : null
          )
        }
        const allowancesOverridden = body.clearAllowancesOverride
          ? false
          : body.allowances !== undefined || currentLine.allowancesOverridden
        const currentAdvance = requestedAdvance
          ? requestedAdvance
          : Money.fromVNĐ(currentLine.advance.toString())
        const currentOther = requestedOther
          ? requestedOther
          : Money.fromVNĐ(currentLine.otherDeductions.toString())
        const { gross, net } = computeGrossAndNet(
          Money.fromVNĐ(currentLine.proratedBase.toString()),
          Money.fromVNĐ(currentLine.overtimeWeekdayAmount.toString()),
          Money.fromVNĐ(currentLine.overtimeWeekendAmount.toString()),
          Money.fromVNĐ(currentLine.overtimeHolidayAmount.toString()),
          Money.fromVNĐ(currentLine.latePenalty.toString()),
          allowances,
          currentAdvance,
          currentOther
        )

        const lineUpdated = await tx.payrollLine.updateMany({
          where: {
            id,
            payrollPeriod: { tenantId: request.user!.tenantId },
          },
          data: {
            overrideReason: body.reason,
            overrideById: request.user!.userId,
            overrideAt: new Date(),
            advance: currentAdvance.toDBString(),
            otherDeductions: currentOther.toDBString(),
            allowances: allowances.toDBString(),
            allowancesOverridden,
            gross: gross.toDBString(),
            bhxhNhanVien: '0.00',
            bhxhDoanhNghiep: '0.00',
            bhytNhanVien: '0.00',
            bhytDoanhNghiep: '0.00',
            bhtnNhanVien: '0.00',
            bhtnDoanhNghiep: '0.00',
            thueTNCN: '0.00',
            tongKhauTru: '0.00',
            net: net.toDBString(),
          },
        })
        if (lineUpdated.count !== 1) {
          throw new NotFoundError('PayrollLine', id)
        }
        const updated = await tx.payrollLine.findFirst({
          where: {
            id,
            payrollPeriod: { tenantId: request.user!.tenantId },
          },
        })

        const periodLines = await tx.payrollLine.findMany({
          where: { payrollPeriodId: line.payrollPeriodId },
          select: { gross: true, net: true },
        })
        const totalGross = periodLines.reduce(
          (sum, current) => sum.add(Money.fromVNĐ(current.gross.toString())),
          Money.zero()
        )
        const totalNet = periodLines.reduce(
          (sum, current) => sum.add(Money.fromVNĐ(current.net.toString())),
          Money.zero()
        )
        const totalsUpdated = await tx.payrollPeriod.updateMany({
          where: {
            id: line.payrollPeriodId,
            tenantId: request.user!.tenantId,
            status: 'calculated',
          },
          data: {
            totalGross: totalGross.toDBString(),
            totalNet: totalNet.toDBString(),
            totalEmployees: periodLines.length,
          },
        })
        if (totalsUpdated.count !== 1) {
          throw new BusinessRuleViolationError('Payroll period is no longer editable')
        }

        await tx.auditLog.create({
          data: {
            tenantId: currentLine.payrollPeriod.tenantId,
            actorId: request.user!.userId,
            actorRole: request.user!.role,
            action: 'override_payroll_line',
            entityType: 'PayrollLine',
            entityId: id,
            previousValue: {
              allowances: currentLine.allowances.toString(),
              allowancesOverridden: currentLine.allowancesOverridden,
              advance: currentLine.advance.toString(),
              otherDeductions: currentLine.otherDeductions.toString(),
              gross: currentLine.gross.toString(),
              net: currentLine.net.toString(),
            },
            newValue: {
              reason: body.reason,
              allowances: allowances.toDBString(),
              allowancesOverridden,
              overriddenFields: [
                ...(body.allowances !== undefined ? ['allowances'] : []),
                ...(body.advance !== undefined ? ['advance'] : []),
                ...(body.otherDeductions !== undefined ? ['otherDeductions'] : []),
              ],
              clearedFields: body.clearAllowancesOverride ? ['allowances'] : [],
              advance: currentAdvance.toDBString(),
              otherDeductions: currentOther.toDBString(),
              gross: gross.toDBString(),
              net: net.toDBString(),
            },
          },
        })
        return updated
      })
    }
  )

  // ===== EXPORT TO EXCEL =====
  app.get<{ Params: { id: string } }>(
    '/periods/:id/export',
    { preHandler: [requireAuth, requirePermission('payroll.export')] },
    async (request, reply) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, tenantId: request.user.tenantId },
      })
      if (!period) {
        throw new NotFoundError('PayrollPeriod', id)
      }
      const buffer = await generatePayrollExcel(id)

      await prisma.auditLog.create({
        data: {
          tenantId: period.tenantId,
          actorId: request.user.userId,
          actorRole: request.user.role,
          action: 'export_payroll',
          entityType: 'PayrollPeriod',
          entityId: id,
          newValue: { format: 'xlsx', size: buffer.length },
        },
      })

      const filename = `bang-luong-T${String(period.month).padStart(2, '0')}-${period.year}.xlsx`
      reply
        .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', buffer.length.toString())
      return reply.send(buffer)
    }
  )

  // ===== LIST PAYROLL RULES =====
  app.get('/rules', { preHandler: [requireAuth, requirePermission('payroll.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const rules = await prisma.payrollRule.findMany({
      where: { tenantId: request.user.tenantId },
      orderBy: { effectiveFrom: 'desc' },
    })
    return { data: rules }
  })

  // ===== UPDATE PAYROLL RULES =====
  app.post(
    '/rules',
    { preHandler: [requireAuth, requirePermission('payroll.rules.manage')] },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const parsedBody = z
        .object({
          effectiveFrom: z.coerce.date(),
          otWeekdayMultiplier: z.number().min(1).max(5),
          otWeekendMultiplier: z.number().min(1).max(5),
          otHolidayMultiplier: z.number().min(1).max(5),
          latePenaltyPerMinute: mvpMoneyString.optional(),
          maxLatePenaltyPerDay: mvpMoneyString.optional(),
          mealAllowancePerDay: mvpMoneyString.optional(),
          phoneAllowance: mvpMoneyString.optional(),
          roundingMinutes: z.number().int().min(1).default(15),
          workingHoursPerDay: z.number().int().min(1).max(24).default(8),
          standardWorkingDaysPerMonth: z.number().int().min(1).max(31).default(26),
          // ADR-003: compliance calculation is not executable in the MVP.
          taxMode: z.literal('none').default('none'),
        })
        .strict()
        .safeParse(request.body)
      if (!parsedBody.success) {
        throw new ValidationError('Invalid payroll rule', {
          issues: parsedBody.error.issues,
        })
      }
      const body = parsedBody.data

      return prisma.$transaction(async (tx) => {
        await tx.payrollRule.updateMany({
          where: { tenantId: request.user!.tenantId, effectiveTo: null },
          data: { effectiveTo: body.effectiveFrom },
        })

        const created = await tx.payrollRule.create({
          data: {
            tenantId: request.user!.tenantId,
            effectiveFrom: body.effectiveFrom,
            effectiveTo: null,
            otWeekdayMultiplier: body.otWeekdayMultiplier,
            otWeekendMultiplier: body.otWeekendMultiplier,
            otHolidayMultiplier: body.otHolidayMultiplier,
            latePenaltyPerMinute: body.latePenaltyPerMinute,
            maxLatePenaltyPerDay: body.maxLatePenaltyPerDay,
            mealAllowancePerDay: body.mealAllowancePerDay,
            phoneAllowance: body.phoneAllowance,
            roundingMinutes: body.roundingMinutes,
            workingHoursPerDay: body.workingHoursPerDay,
            standardWorkingDaysPerMonth: body.standardWorkingDaysPerMonth,
            taxMode: 'none',
            bhxhRateNv: null,
            bhxhRateDn: null,
            bhytRateNv: null,
            bhytRateDn: null,
            bhtnRateNv: null,
            bhtnRateDn: null,
            updatedBy: request.user!.userId,
          },
        })

        await tx.auditLog.create({
          data: {
            tenantId: request.user!.tenantId,
            actorId: request.user!.userId,
            actorRole: request.user!.role,
            action: 'update_payroll_rules',
            entityType: 'PayrollRule',
            entityId: created.id,
            newValue: {
              effectiveFrom: created.effectiveFrom,
              taxMode: 'none',
            },
          },
        })

        return created
      })
    }
  )
}
