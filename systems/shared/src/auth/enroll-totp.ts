import { prisma } from '../db/client.js'
import { buildTotpUri, encryptTotpSecret, generateTotpSecret } from './otp.js'

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) throw new Error('Usage: pnpm --filter @ak/shared auth:enroll-totp <admin-email>')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role === 'employee') throw new Error('Active admin user not found')
  if (user.status !== 'active') throw new Error('Cannot enroll TOTP for an inactive admin')

  const secret = process.env.TOTP_ENROLLMENT_SECRET?.trim() || generateTotpSecret()
  const envelope = encryptTotpSecret(secret, `${user.tenantId}:${user.id}`)
  await prisma.totpCredential.upsert({
    where: { userId: user.id },
    update: {
      ...envelope,
      lastUsedCounter: null,
      rotatedAt: new Date(),
    },
    create: {
      userId: user.id,
      ...envelope,
    },
  })

  const uri = buildTotpUri({ issuer: 'AKAIUNSAN', accountName: email, secret })
  console.log('TOTP enrollment created. Scan this URI once, then clear terminal history:')
  console.log(uri)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
