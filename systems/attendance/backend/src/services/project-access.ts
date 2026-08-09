import { prisma } from '@ak/shared'

/**
 * Explicit supervisor authorization boundary. Shift assignments are operational
 * data and must never grant project-management access.
 */
export async function getSupervisorProjectIds(userId: string, tenantId: string): Promise<string[]> {
  const memberships = await prisma.projectSupervisor.findMany({
    where: {
      userId,
      supervisor: { tenantId, role: 'supervisor', status: 'active' },
      project: { tenantId, deletedAt: null },
    },
    select: { projectId: true },
  })
  return memberships.map((membership) => membership.projectId)
}

export async function supervisorCanAccessProject(
  userId: string,
  tenantId: string,
  projectId: string,
): Promise<boolean> {
  const membership = await prisma.projectSupervisor.findFirst({
    where: {
      projectId,
      userId,
      supervisor: { tenantId, role: 'supervisor', status: 'active' },
      project: { tenantId, deletedAt: null },
    },
    select: { projectId: true },
  })
  return membership !== null
}
