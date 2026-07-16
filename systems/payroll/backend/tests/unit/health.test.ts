// Smoke test for payroll API health route

import { describe, it, expect, beforeAll } from 'vitest'

// Set required env vars BEFORE any imports of src code
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.PAYROLL_API_PORT = '3001'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.REDIS_URL = 'redis://localhost:6379'
  process.env.JWT_SECRET = 'test_secret_32_characters_minimum_for_pass'
  process.env.JWT_ACCESS_TTL_SECONDS = '900'
  process.env.INTERNAL_API_KEY = 'test_internal_api_key_32_chars_min'
  process.env.ATTENDANCE_API_URL = 'http://localhost:3000'
})

import { buildServer } from '../../src/server.js'

describe('payroll health routes', () => {
  it('GET /health/live returns ok', async () => {
    const { app } = await buildServer()
    const response = await app.inject({ method: 'GET', url: '/health/live' })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.service).toBe('payroll-api')
    await app.close()
  })
})
