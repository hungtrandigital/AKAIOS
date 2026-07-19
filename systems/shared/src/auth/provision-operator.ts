import { prisma } from '../db/client.js'
import { hashPassword } from './password.js'

const ALLOWED_ROLES = ['system_admin', 'bo_admin', 'supervisor'] as const
type OperatorRole = (typeof ALLOWED_ROLES)[number]

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function operatorRole(): OperatorRole {
  const role = requiredEnv('OPERATOR_ROLE')
  if (!ALLOWED_ROLES.includes(role as OperatorRole)) {
    throw new Error(`OPERATOR_ROLE must be one of: ${ALLOWED_ROLES.join(', ')}`)
  }
  return role as OperatorRole
}

async function main(): Promise<void> {
  const tenantName = requiredEnv('OPERATOR_TENANT_NAME')
  const email = requiredEnv('OPERATOR_EMAIL').toLowerCase()
  const phone = requiredEnv('OPERATOR_PHONE')
  const password = requiredEnv('OPERATOR_PASSWORD')
  const role = operatorRole()

  if (!/^\+84[0-9]{9}$/.test(phone)) {
    throw new Error('OPERATOR_PHONE must use +84 followed by 9 digits')
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('OPERATOR_EMAIL must be a valid email address')
  }
  if (password.length < 12) {
    throw new Error('OPERATOR_PASSWORD must be at least 12 characters')
  }

  const passwordHash = await hashPassword(password)
  const result = await prisma.$transaction(async (tx) => {
    // Tenant names are not a database unique key. Serialize provisioning for the
    // same normalized name so two first-run operators cannot create duplicates.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenantName.toLowerCase()}, 0))`

    const matchingTenants = await tx.tenant.findMany({
      where: { name: tenantName },
      take: 2,
      orderBy: { createdAt: 'asc' },
    })
    if (matchingTenants.length > 1) {
      throw new Error(`Multiple tenants named ${tenantName}; provisioning requires an unambiguous tenant`)
    }
    if (matchingTenants.length === 0 && role !== 'system_admin') {
      throw new Error('The first operator for a new tenant must be a system_admin')
    }
    const tenant = matchingTenants[0] ?? await tx.tenant.create({ data: { name: tenantName } })

    const matchingUsers = await tx.user.findMany({
      where: { OR: [{ email }, { phone }] },
      take: 2,
    })
    if (matchingUsers.length > 0) {
      const existing = matchingUsers.find(
        (user) => user.email === email && user.phone === phone,
      )
      if (
        matchingUsers.length === 1
        && existing
        && existing.tenantId === tenant.id
        && existing.role === role
        && existing.status === 'active'
      ) {
        return { tenantId: tenant.id, userId: existing.id, created: false }
      }
      throw new Error('Provisioning email or phone is already assigned to another account')
    }

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        phone,
        passwordHash,
        role,
        status: 'active',
      },
    })
    return { tenantId: tenant.id, userId: user.id, created: true }
  })

  console.log(result.created ? `${role} operator created.` : `${role} operator already exists; no password was changed.`)
  console.log(`Tenant ID: ${result.tenantId}`)
  console.log(`Operator user ID: ${result.userId}`)
  console.log(`Next: pnpm --filter @ak/shared auth:enroll-totp ${email}`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
