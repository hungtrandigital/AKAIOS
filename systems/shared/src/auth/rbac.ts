// =====================================================
// RBAC: Permission check helpers (Option B)
// =====================================================
// requirePermission(permCode) loads user's role-permission mapping
// from DB and 403s if not granted. Cached per-request via request.rbacCache.

import type { UserRole } from '@prisma/client'
import { prisma } from '../db/client.js'
import { UnauthorizedError, ForbiddenError } from '../types/errors.js'

export interface RequestLike {
  user?: { userId: string; tenantId: string; role: UserRole } | undefined
  rbacCache?: Map<string, boolean>
}

/**
 * Load all permission codes granted to a user via their role.
 * Cached per-request to avoid hitting DB on every route.
 */
export async function loadUserPermissions(role: UserRole): Promise<Set<string>> {
  const rows = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: { select: { code: true } } },
  })
  return new Set(rows.map((r) => r.permission.code))
}

/**
 * Check if a user has a specific permission. Cached per-request.
 */
export async function userHasPermission(
  request: RequestLike,
  permissionCode: string
): Promise<boolean> {
  if (!request.user) return false
  if (!request.rbacCache) request.rbacCache = new Map()
  const cached = request.rbacCache.get(permissionCode)
  if (cached !== undefined) return cached
  const perms = await loadUserPermissions(request.user.role)
  // Cache all at once for next call
  if (request.rbacCache.size === 0) {
    for (const p of perms) request.rbacCache.set(p, true)
  }
  return perms.has(permissionCode)
}

/**
 * Middleware factory: require a specific permission code.
 * Throws UnauthorizedError if no user, ForbiddenError if not granted.
 */
export function requirePermission(permissionCode: string) {
  return async (request: RequestLike) => {
    if (!request.user) throw new UnauthorizedError('Authentication required')
    const has = await userHasPermission(request, permissionCode)
    if (!has) {
      throw new ForbiddenError(
        `Missing required permission: ${permissionCode} (role=${request.user.role})`
      )
    }
  }
}
