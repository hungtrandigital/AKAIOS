// Employee CRUD routes.

import { randomBytes } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  prisma, Prisma, ForbiddenError, NotFoundError, ConflictError, ValidationError, hashPassword,
} from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'
import { requirePermission } from '@ak/shared'
import { getSupervisorProjectIds } from '../services/project-access.js'
import { CalendarDateSchema } from '../schemas/calendar-date.js'

const MoneySchema = z.string().regex(/^\d+(?:\.\d{1,2})?$/, 'Invalid non-negative money amount')

const CreateSchema = z.object({
  phone: z.string().regex(/^\+84[0-9]{9}$/),
  fullName: z.string().min(1),
  employeeCode: z.string().optional(),
  dateOfBirth: CalendarDateSchema.optional(),
  hireDate: CalendarDateSchema,
  baseSalary: MoneySchema,
  salaryType: z.enum(['monthly', 'hourly']),
  hourlyRate: MoneySchema.optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  idNumber: z.string().optional(),
  temporaryPassword: z.string().min(8).optional(),
}).superRefine((body, context) => {
  if (new Date(`${body.hireDate}T00:00:00.000+07:00`) > new Date()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['hireDate'], message: 'Hire date cannot be in the future' })
  }
  if (body.salaryType === 'hourly' && (!body.hourlyRate || Number(body.hourlyRate) <= 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['hourlyRate'], message: 'Positive hourlyRate is required for hourly salary' })
  }
})

const UpdateSchema = z.object({
  fullName: z.string().optional(),
  baseSalary: MoneySchema.optional(),
  salaryType: z.enum(['monthly', 'hourly']).optional(),
  hourlyRate: MoneySchema.optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

const safeUserSelect = {
  id: true,
  phone: true,
  email: true,
  role: true,
  status: true,
} as const

const supervisorEmployeeSelect = {
  id: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  status: true,
  user: { select: safeUserSelect },
} as const

const adminEmployeeSelect = {
  id: true,
  tenantId: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  dateOfBirth: true,
  hireDate: true,
  baseSalary: true,
  salaryType: true,
  hourlyRate: true,
  bankAccount: true,
  bankName: true,
  idNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: safeUserSelect },
} as const

export const employeeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [requireAuth, requirePermission('employees.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const query = z.object({
      status: z.enum(['active', 'inactive']).optional(),
      search: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(50),
    }).parse(request.query)

    const where: any = {
      tenantId: request.user.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    }
    if (request.user.role === 'supervisor') {
      const projectIds = await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      where.shiftAssignments = { some: { projectId: { in: projectIds } } }
    }
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { user: { phone: { contains: query.search } } },
      ]
    }
    const total = await prisma.employee.count({ where })
    const data = request.user.role === 'supervisor'
      ? await prisma.employee.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          select: supervisorEmployeeSelect,
        })
      : await prisma.employee.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          select: adminEmployeeSelect,
        })
    return { data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
  })

  app.post('/', { preHandler: [requireAuth, requirePermission('employees.create')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin', 'supervisor'].includes(request.user.role)) {
      throw new ForbiddenError('Only admins/supervisors can create employees')
    }
    const body = CreateSchema.parse(request.body)
    const tempPassword = body.temporaryPassword ?? randomBytes(18).toString('base64url')
    const passwordHash = await hashPassword(tempPassword)
    const employeeCode = body.employeeCode ?? `NV${Date.now().toString().slice(-6)}`
    let employee
    try {
      employee = await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({ where: { phone: body.phone } })
        if (existingUser) throw new ConflictError('Phone already registered')
        const user = await tx.user.create({
          data: {
            tenantId: request.user!.tenantId,
            phone: body.phone,
            passwordHash,
            role: 'employee',
          },
        })
        return tx.employee.create({
          data: {
            tenantId: request.user!.tenantId,
            userId: user.id,
            employeeCode,
            fullName: body.fullName,
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            hireDate: new Date(body.hireDate),
            baseSalary: body.baseSalary,
            salaryType: body.salaryType,
            hourlyRate: body.hourlyRate,
            bankAccount: body.bankAccount,
            bankName: body.bankName,
            idNumber: body.idNumber,
          },
          include: { user: { select: safeUserSelect } },
        })
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Phone or employee code already registered')
      }
      throw error
    }
    if (request.user.role === 'supervisor') {
      return {
        id: employee.id,
        userId: employee.userId,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        status: employee.status,
        user: employee.user,
        temporaryPassword: tempPassword,
      }
    }
    return { ...employee, temporaryPassword: tempPassword }
  })

  app.get<{ Params: { id: string } }>('/:id', { preHandler: [requireAuth, requirePermission('employees.view')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const supervisorProjectIds = request.user.role === 'supervisor'
      ? await getSupervisorProjectIds(request.user.userId, request.user.tenantId)
      : undefined
    const where = {
      id: request.params.id,
      tenantId: request.user.tenantId,
      deletedAt: null,
      ...(supervisorProjectIds
        ? { shiftAssignments: { some: { projectId: { in: supervisorProjectIds } } } }
        : {}),
    }
    const employee = request.user.role === 'supervisor'
      ? await prisma.employee.findFirst({ where, select: supervisorEmployeeSelect })
      : await prisma.employee.findFirst({ where, select: adminEmployeeSelect })
    if (!employee) throw new NotFoundError('Employee')
    return employee
  })

  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [requireAuth, requirePermission('employees.update')] }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin'].includes(request.user.role)) {
      throw new ForbiddenError('Only admins can update employees')
    }
    const body = UpdateSchema.parse(request.body)
    const employee = await prisma.employee.findUnique({ where: { id: request.params.id } })
    if (!employee || employee.tenantId !== request.user.tenantId) throw new NotFoundError('Employee')
    const salaryType = body.salaryType ?? employee.salaryType
    const hourlyRate = body.hourlyRate ?? employee.hourlyRate?.toString()
    if (salaryType === 'hourly' && (!hourlyRate || Number(hourlyRate) <= 0)) {
      throw new ValidationError('Positive hourlyRate is required for hourly salary')
    }
    return prisma.employee.update({ where: { id: request.params.id }, data: body })
  })
}
