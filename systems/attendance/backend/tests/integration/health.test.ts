import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { ensureBuckets, prisma } from '@ak/shared'
import { skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Attendance health (integration)', () => {
  it('reads PostgreSQL and reports real dependency readiness', { timeout: 60_000 }, async () => {
    const suffix = randomUUID().slice(0, 8)
    const tenant = await prisma.tenant.create({ data: { name: `Health ${suffix}` } })
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
      expect((await prisma.project.findUnique({ where: { id: project.id } }))?.name)
        .toBe('Integration Test Project')
      await ensureBuckets()
      const { buildServer } = await import('../../src/server.js')
      const { app } = await buildServer()
      try {
        const response = await app.inject({ method: 'GET', url: '/health/ready' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({
          ok: true,
          checks: { database: { ok: true }, redis: { ok: true }, minio: { ok: true } },
        })
      } finally {
        await app.close()
      }
    } finally {
      if (projectId) await prisma.project.deleteMany({ where: { id: projectId } })
      await prisma.tenant.deleteMany({ where: { id: tenant.id } })
      await prisma.$disconnect()
    }
  })
})
