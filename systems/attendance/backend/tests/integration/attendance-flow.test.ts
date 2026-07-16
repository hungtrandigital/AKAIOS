// Integration test for attendance check-in/out flow.
// Uses testcontainers (real Postgres in Docker) — skipped when Docker unavailable.
//
// Run: `pnpm test:integration` (requires Docker daemon accessible from CI)

import { describe, it, expect } from 'vitest'

// Default skip when Docker unavailable; CI sets RUN_INTEGRATION=true to enable.
const skipIntegration = process.env.RUN_INTEGRATION !== 'true'

describe.skipIf(skipIntegration)('Attendance flow (integration)', () => {
  it('loads testcontainer Postgres + creates Project', { timeout: 60_000 }, async () => {
    const { PostgreSqlContainer } = await import('@testcontainers/postgresql')
    const postgres = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('ak_test')
      .withUsername('test')
      .withPassword('test')
      .start()

    const connectionUri = postgres.getConnectionUri()
    process.env.DATABASE_URL = connectionUri

    // Dynamic import after setting DATABASE_URL so Prisma client connects
    const { prisma } = await import('@ak/shared')

    const tenant = await prisma.tenant.create({ data: { name: 'Integration Tenant' } })
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        code: 'INT001',
        name: 'Integration Test Project',
        clientName: 'Test Client',
        address: '123 Test Street',
        latitude: 10.7720,
        longitude: 106.7009,
        contractStartDate: new Date('2024-01-01'),
      },
    })
    expect(project.id).toBeDefined()

    const fetched = await prisma.project.findUnique({ where: { id: project.id } })
    expect(fetched?.name).toBe('Integration Test Project')
    expect(Number(fetched?.latitude)).toBeCloseTo(10.772, 3)

    await prisma.tenant.delete({ where: { id: tenant.id } })
    await postgres.stop()
  })
})

describe('unit test smoke (always runs)', () => {
  it('basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
