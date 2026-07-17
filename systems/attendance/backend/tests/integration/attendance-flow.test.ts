// Integration test for attendance check-in/out flow.
// Uses the real PostgreSQL service configured by DATABASE_URL.
//
// Run: `RUN_INTEGRATION=true pnpm test:integration` after migrations.

import { describe, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'

// Default skip when Docker unavailable; CI sets RUN_INTEGRATION=true to enable.
const skipIntegration = process.env.RUN_INTEGRATION !== 'true'

describe.skipIf(skipIntegration)('Attendance flow (integration)', () => {
  it('creates and reads a project in PostgreSQL', { timeout: 60_000 }, async () => {
    const { ensureBuckets, prisma } = await import('@ak/shared')
    const suffix = randomUUID().slice(0, 8)
    const tenant = await prisma.tenant.create({
      data: { name: `Integration Tenant ${suffix}` },
    })
    let projectId: string | undefined

    try {
      const project = await prisma.project.create({
        data: {
          tenantId: tenant.id,
          code: `INT-${suffix}`,
          name: 'Integration Test Project',
          clientName: 'Test Client',
          address: '123 Test Street',
          latitude: 10.7720,
          longitude: 106.7009,
          contractStartDate: new Date('2024-01-01'),
        },
      })
      projectId = project.id
      expect(project.id).toBeDefined()

      const fetched = await prisma.project.findUnique({ where: { id: project.id } })
      expect(fetched?.name).toBe('Integration Test Project')
      expect(Number(fetched?.latitude)).toBeCloseTo(10.772, 3)

      await ensureBuckets()
      const { buildServer } = await import('../../src/server.js')
      const { app } = await buildServer()
      try {
        const response = await app.inject({ method: 'GET', url: '/health/ready' })
        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body.ok).toBe(true)
        expect(body.checks.database.ok).toBe(true)
        expect(body.checks.redis.ok).toBe(true)
        expect(body.checks.minio.ok).toBe(true)
      } finally {
        await app.close()
      }
    } finally {
      if (projectId) {
        await prisma.project.deleteMany({ where: { id: projectId } })
      }
      await prisma.tenant.deleteMany({ where: { id: tenant.id } })
      await prisma.$disconnect()
    }
  })
})
