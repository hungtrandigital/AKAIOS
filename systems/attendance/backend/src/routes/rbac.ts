// RBAC management API (system_admin only).
// GET   /v1/rbac/permissions          — list all available permissions
// GET   /v1/rbac/roles                — list all role-permission mappings
// PUT   /v1/rbac/roles/:role          — set permissions for a role (replace all)

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, NotFoundError, requirePermission, type UserRole } from '@ak/shared'
import { requireAuth } from '../plugins/auth.js'

const RoleEnum = z.enum(['employee', 'supervisor', 'bo_admin', 'system_admin'])

export const rbacRoutes: FastifyPluginAsync = async (app) => {
  // ===== LIST ALL PERMISSIONS =====
  app.get(
    '/permissions',
    { preHandler: [requireAuth, requirePermission('rbac.manage')] },
    async () => {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      })
      return { data: permissions }
    }
  )

  // ===== LIST ALL ROLE -> PERMISSIONS MAPPINGS =====
  app.get(
    '/roles',
    { preHandler: [requireAuth, requirePermission('rbac.manage')] },
    async () => {
      const mappings = await prisma.rolePermission.findMany({
        include: { permission: true },
      })
      // Group by role
      const grouped: Record<UserRole, { role: UserRole; permissions: any[] }> = {
        employee: { role: 'employee', permissions: [] },
        supervisor: { role: 'supervisor', permissions: [] },
        bo_admin: { role: 'bo_admin', permissions: [] },
        system_admin: { role: 'system_admin', permissions: [] },
      }
      for (const m of mappings) {
        grouped[m.role].permissions.push(m.permission)
      }
      return { data: Object.values(grouped) }
    }
  )

  // ===== UPDATE ROLE PERMISSIONS (replace all) =====
  app.put<{ Params: { role: string } }>(
    '/roles/:role',
    { preHandler: [requireAuth, requirePermission('rbac.manage')] },
    async (request) => {
      const role = RoleEnum.parse(request.params.role)
      const body = z.object({
        permissionCodes: z.array(z.string().min(1)).min(1),
      }).parse(request.body)

      // Validate all permission codes exist
      const validPerms = await prisma.permission.findMany({
        where: { code: { in: body.permissionCodes } },
        select: { id: true, code: true },
      })
      if (validPerms.length !== body.permissionCodes.length) {
        const foundCodes = new Set(validPerms.map((p) => p.code))
        const missing = body.permissionCodes.filter((c) => !foundCodes.has(c))
        throw new NotFoundError(`Unknown permissions: ${missing.join(', ')}`)
      }

      // Replace all mappings for this role
      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { role } }),
        prisma.rolePermission.createMany({
          data: validPerms.map((p) => ({ role, permissionId: p.id })),
        }),
      ])

      // Audit
      if (request.user) {
        await prisma.auditLog.create({
          data: {
            tenantId: request.user.tenantId,
            actorId: request.user.userId,
            actorRole: request.user.role,
            action: 'update_payroll_rules' as any, // closest existing action
            entityType: 'RolePermission',
            entityId: role,
            previousValue: { action: 'role_permission_replace' },
            newValue: { role, permissionCodes: body.permissionCodes },
          },
        })
      }

      return { role, permissionCodes: body.permissionCodes, count: validPerms.length }
    }
  )
}
