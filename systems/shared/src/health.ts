// Real connectivity health checks.
// Used by /health/ready endpoint in both attendance-api and payroll-api.

import { prisma } from './db/client.js'
import { getMinIOClient } from './storage/minio.js'
import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { createClient as createRedisClient } from 'redis'

export interface HealthCheckResult {
  ok: boolean
  latencyMs: number
  error?: string
}

export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now()
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379'
  const client = createRedisClient({ url })
  try {
    await client.connect()
    const pong = await client.ping()
    await client.disconnect()
    if (pong !== 'PONG') {
      return { ok: false, latencyMs: Date.now() - start, error: `Unexpected PING reply: ${pong}` }
    }
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function checkMinIO(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const c = getMinIOClient()
    // Check at least one bucket is reachable
    await c.send(new HeadBucketCommand({ Bucket: 'attendance-photos' }))
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export interface AggregateHealth {
  ok: boolean
  service: string
  checks: {
    database: HealthCheckResult
    redis: HealthCheckResult
    minio: HealthCheckResult
  }
  timestamp: string
}

export async function runAllHealthChecks(service: string): Promise<AggregateHealth> {
  const [database, redis, minio] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkMinIO(),
  ])
  const ok = database.ok && redis.ok && minio.ok
  return {
    ok,
    service,
    checks: { database, redis, minio },
    timestamp: new Date().toISOString(),
  }
}
