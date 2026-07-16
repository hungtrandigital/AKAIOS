// Employee CRUD routes.

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, ForbiddenError, NotFoundError, ConflictError, hashPassword } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'

const CreateSchema = z.object({
  phone: z.string().regex(/^\+84[0-9]{9}$/),
  fullName: z.string().min(1),
  employeeCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  hireDate: z.string(),
  baseSalary: z.string(),
  salaryType: z.enum(['monthly', 'hourly']),
  hourlyRate: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  idNumber: z.string().optional(),
  temporaryPassword: z.string().optional(),
})

const UpdateSchema = z.object({
  fullName: z.string().optional(),
  baseSalary: z.string().optional(),
  salaryType: z.enum(['monthly', 'hourly']).optional(),
  hourlyRate: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export const employeeRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: requireAuth }, async (request) => {
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
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { user: { phone: { contains: query.search } } },
      ]
    }
    const [total, data] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, include: { user: true } }),
    ])
    return { data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
  })

  app.post('/', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin', 'supervisor'].includes(request.user.role)) {
      throw new ForbiddenError('Only admins/supervisors can create employees')
    }
    const body = CreateSchema.parse(request.body)
    const existingUser = await prisma.user.findUnique({ where: { phone: body.phone } })
    if (existingUser) throw new ConflictError('Phone already registered')

    const tempPassword = body.temporaryPassword ?? Math.random().toString(36).slice(-10)
    const passwordHash = await hashPassword(tempPassword)

    const employeeCode = body.employeeCode ?? `NV${Date.now().toString().slice(-6)}`

    const user = await prisma.user.create({
      data: {
        tenantId: request.user.tenantId,
        phone: body.phone,
        passwordHash,
        role: 'employee',
      },
    })
    const employee = await prisma.employee.create({
      data: {
        tenantId: request.user.tenantId,
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
      include: { user: true },
    })
    return { ...employee, temporaryPassword: tempPassword }
  })

  app.get<{ Params: { id: string } }>('/:id', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    const employee = await prisma.employee.findUnique({
      where: { id: request.params.id },
      include: { user: true },
    })
    if (!employee || employee.tenantId !== request.user.tenantId) throw new NotFoundError('Employee')
    return employee
  })

  app.patch<{ Params: { id: string } }>('/:id', { preHandler: requireAuth }, async (request) => {
    if (!request.user) throw new ForbiddenError()
    if (!['bo_admin', 'system_admin'].includes(request.user.role)) {
      throw new ForbiddenError('Only admins can update employees')
    }
    const body = UpdateSchema.parse(request.body)
    const employee = await prisma.employee.findUnique({ where: { id: request.params.id } })
    if (!employee || employee.tenantId !== request.user.tenantId) throw new NotFoundError('Employee')
    return prisma.employee.update({ where: { id: request.params.id }, data: body })
  })
}
