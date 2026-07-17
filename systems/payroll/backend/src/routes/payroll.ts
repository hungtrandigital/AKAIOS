// Payroll routes — periods, calculate, approve, lock, override, export.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, ForbiddenError, NotFoundError, BusinessRuleViolationError, Money } from '@ak/shared'
import { requireAuth, requireRole } from '../plugins/auth.js'
import { openPayrollPeriod, calculatePayroll } from '../services/payroll-service.js'
import { generatePayrollExcel } from '../services/excel-exporter.js'

export const payrollRoutes: FastifyPluginAsync = async (app) => {
  // ===== LIST PERIODS =====
  app.get('/periods', { preHandler: requireAuth }, async (request) => {
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
  app.post('/periods', { preHandler: requireRole('bo_admin', 'system_admin') }, async (request) => {
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
    { preHandler: requireRole('bo_admin', 'system_admin') },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id

      const result = await calculatePayroll(id)
      app.log.info({ periodId: id, linesCreated: result.linesCreated }, 'Payroll calculated')
      return { jobId: `calc-${id}`, message: `Calculated ${result.linesCreated} lines`, ...result }
    }
  )

  // ===== GET PERIOD WITH LINES =====
  app.get<{ Params: { id: string } }>('/periods/:id', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const id = request.params.id
    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        lines: { include: { employee: { select: { id: true, employeeCode: true, fullName: true } } } },
      },
    })
    if (!period || period.tenantId !== request.user.tenantId) {
      throw new NotFoundError('PayrollPeriod', id)
    }
    return period
  })

  // ===== APPROVE PERIOD (BR-PAY-008) =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/approve',
    { preHandler: requireRole('bo_admin') },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findUnique({ where: { id } })
      if (!period) throw new NotFoundError('PayrollPeriod', id)
      if (period.status !== 'calculated') {
        throw new BusinessRuleViolationError(
          `Cannot approve period in status ${period.status}; must be 'calculated'`
        )
      }
      const updated = await prisma.payrollPeriod.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedById: request.user.userId,
        },
      })
      await prisma.auditLog.create({
        data: {
          tenantId: period.tenantId,
          actorId: request.user.userId,
          actorRole: request.user.role,
          action: 'approve_payroll',
          entityType: 'PayrollPeriod',
          entityId: id,
          newValue: { status: 'approved' },
        },
      })
      return updated
    }
  )

  // ===== LOCK PERIOD =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/lock',
    { preHandler: requireRole('system_admin') },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findUnique({ where: { id } })
      if (!period) throw new NotFoundError('PayrollPeriod', id)
      if (period.status !== 'paid') {
        throw new BusinessRuleViolationError(
          `Cannot lock period in status ${period.status}; must be 'paid' first`
        )
      }
      return prisma.payrollPeriod.update({
        where: { id },
        data: { status: 'locked', lockedAt: new Date() },
      })
    }
  )

  // ===== MARK PAID =====
  app.post<{ Params: { id: string } }>(
    '/periods/:id/mark-paid',
    { preHandler: requireRole('bo_admin') },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findUnique({ where: { id } })
      if (!period) throw new NotFoundError('PayrollPeriod', id)
      if (period.status !== 'approved') {
        throw new BusinessRuleViolationError(
          `Cannot mark paid period in status ${period.status}`
        )
      }
      return prisma.payrollPeriod.update({
        where: { id },
        data: { status: 'paid', paidAt: new Date() },
      })
    }
  )

  // ===== OVERRIDE PAYROLL LINE =====
  app.post<{ Params: { id: string } }>(
    '/lines/:id/override',
    { preHandler: requireRole('bo_admin') },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const body = z
        .object({
          reason: z.string().min(10),
          advance: z.string().optional(),
          otherDeductions: z.string().optional(),
          allowances: z.string().optional(),
        })
        .parse(request.body)

      const line = await prisma.payrollLine.findUnique({
        where: { id },
        include: { payrollPeriod: true },
      })
      if (!line) throw new NotFoundError('PayrollLine', id)
      if (line.payrollPeriod.status === 'locked' || line.payrollPeriod.status === 'paid') {
        throw new BusinessRuleViolationError(
          `Cannot modify lines in ${line.payrollPeriod.status} period`
        )
      }
      const advance = body.advance ? Money.fromVNĐ(body.advance) : Money.fromVNĐ(line.advance.toString())
      const other = body.otherDeductions ? Money.fromVNĐ(body.otherDeductions) : Money.fromVNĐ(line.otherDeductions.toString())
      const allowances = body.allowances ? Money.fromVNĐ(body.allowances) : Money.fromVNĐ(line.allowances.toString())

      const newNet = Money.fromVNĐ(line.gross.toString()).subtract(advance).subtract(other)

      const updated = await prisma.payrollLine.update({
        where: { id },
        data: {
          overrideReason: body.reason,
          overrideById: request.user.userId,
          overrideAt: new Date(),
          advance: advance.toDBString(),
          otherDeductions: other.toDBString(),
          allowances: allowances.toDBString(),
          net: newNet.toDBString(),
        },
      })

      await prisma.auditLog.create({
        data: {
          tenantId: line.payrollPeriod.tenantId,
          actorId: request.user.userId,
          actorRole: request.user.role,
          action: 'override_payroll_line',
          entityType: 'PayrollLine',
          entityId: id,
          previousValue: {
            advance: line.advance.toString(),
            otherDeductions: line.otherDeductions.toString(),
            net: line.net.toString(),
          },
          newValue: { reason: body.reason, net: newNet.toDBString() },
        },
      })
      return updated
    }
  )

  // ===== EXPORT TO EXCEL =====
  app.get<{ Params: { id: string } }>(
    '/periods/:id/export',
    { preHandler: requireRole('bo_admin', 'system_admin') },
    async (request, reply) => {
      if (!request.user) throw new ForbiddenError()
      const id = request.params.id
      const period = await prisma.payrollPeriod.findUnique({ where: { id } })
      if (!period || period.tenantId !== request.user.tenantId) {
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
  app.get('/rules', { preHandler: requireAuth }, async (request) => {
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
    { preHandler: requireRole('system_admin') },
    async (request) => {
      if (!request.user) throw new ForbiddenError()
      const body = z
        .object({
          effectiveFrom: z.string(),
          otWeekdayMultiplier: z.number().min(1).max(5),
          otWeekendMultiplier: z.number().min(1).max(5),
          otHolidayMultiplier: z.number().min(1).max(5),
          latePenaltyPerMinute: z.string().optional(),
          maxLatePenaltyPerDay: z.string().optional(),
          mealAllowancePerDay: z.string().optional(),
          phoneAllowance: z.string().optional(),
          roundingMinutes: z.number().int().min(1).default(15),
          workingHoursPerDay: z.number().int().min(1).max(24).default(8),
          standardWorkingDaysPerMonth: z.number().int().min(1).max(31).default(26),
          // VN tax/insurance (BR-VN-TAX-001..005)
          taxMode: z.enum(['none', 'tncn_only', 'full', 'custom']).default('none'),
          bhxhRateNv: z.number().min(0).max(0.2).optional(),
          bhxhRateDn: z.number().min(0).max(0.2).optional(),
          bhytRateNv: z.number().min(0).max(0.2).optional(),
          bhytRateDn: z.number().min(0).max(0.2).optional(),
          bhtnRateNv: z.number().min(0).max(0.2).optional(),
          bhtnRateDn: z.number().min(0).max(0.2).optional(),
        })
        .parse(request.body)

      // Close current rules
      await prisma.payrollRule.updateMany({
        where: { tenantId: request.user.tenantId, effectiveTo: null },
        data: { effectiveTo: new Date(body.effectiveFrom) },
      })

      const created = await prisma.payrollRule.create({
        data: {
          tenantId: request.user.tenantId,
          effectiveFrom: new Date(body.effectiveFrom),
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
          taxMode: body.taxMode,
          bhxhRateNv: body.bhxhRateNv,
          bhxhRateDn: body.bhxhRateDn,
          bhytRateNv: body.bhytRateNv,
          bhytRateDn: body.bhytRateDn,
          bhtnRateNv: body.bhtnRateNv,
          bhtnRateDn: body.bhtnRateDn,
          updatedBy: request.user.userId,
        },
      })

      await prisma.auditLog.create({
        data: {
          tenantId: request.user.tenantId,
          actorId: request.user.userId,
          actorRole: request.user.role,
          action: 'update_payroll_rules',
          entityType: 'PayrollRule',
          entityId: created.id,
          newValue: { effectiveFrom: created.effectiveFrom },
        },
      })

      return created
    }
  )
}
