// Basic health check test — verifies server starts and /health/live responds.

import { describe, it, expect, beforeAll } from 'vitest'

// Set required env vars BEFORE any imports of src code
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.ATTENDANCE_API_PORT = '3000'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.MINIO_ENDPOINT = 'localhost:9000'
  process.env.MINIO_ROOT_USER = 'test_user'
  process.env.MINIO_ROOT_PASSWORD = 'test_password_32_characters_min'
  process.env.JWT_SECRET = 'test_secret_32_characters_minimum_for_pass'
  process.env.JWT_ACCESS_TTL_SECONDS = '900'
  process.env.INTERNAL_API_KEY = 'test_internal_api_key_32_chars_min'
})

import { buildServer } from '../../src/server.js'

describe('health routes', () => {
  it('GET /health/live returns ok', async () => {
    const { app } = await buildServer()
    const response = await app.inject({ method: 'GET', url: '/health/live' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.status).toBe('ok')
    expect(body.service).toBe('attendance-api')
    await app.close()
  })

  it('GET /health/ready returns placeholder', async () => {
    const { app } = await buildServer()
    const response = await app.inject({ method: 'GET', url: '/health/ready' })
    expect(response.statusCode).toBe(200)
    await app.close()
  })
})
