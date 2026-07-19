// Basic health check test — verifies server starts and /health/live responds.

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

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
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpCode,
  sendEmployeeOtpSms,
  verifyTotpCode,
  ValidationError,
  BusinessRuleViolationError,
} from '@ak/shared'
import { generateReportPdf } from '../../src/services/reports/customer-report.js'
import { decodePhotoBase64, MAX_PHOTO_BYTES } from '../../src/services/photo-service.js'

afterEach(() => {
  delete process.env.TOTP_ENCRYPTION_KEY
  delete process.env.SPEEDSMS_ACCESS_TOKEN
  delete process.env.SPEEDSMS_SENDER
  delete process.env.SMS_MODE
  vi.unstubAllGlobals()
})

describe('employee OTP delivery', () => {
  it('sends through the configured SpeedSMS adapter without returning the OTP', async () => {
    process.env.SMS_MODE = 'speedsms'
    process.env.SPEEDSMS_ACCESS_TOKEN = 'test-access-token'
    process.env.SPEEDSMS_SENDER = 'AKAIUNSAN'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', code: '00' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendEmployeeOtpSms('+84912345678', '123456')).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
    const options = fetchMock.mock.calls[0]![1] as { body: string; headers: Record<string, string> }
    expect(JSON.parse(options.body)).toMatchObject({
      to: ['84912345678'],
      sms_type: 4,
      sender: 'AKAIUNSAN',
    })
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('test-access-token:x').toString('base64')}`,
    )
  })
})

describe('TOTP security', () => {
  it('matches the RFC 6238 SHA-1 vector truncated to six digits', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    expect(generateTotpCode(secret, 1n)).toBe('287082')
    expect(verifyTotpCode({
      code: '287082',
      secret,
      now: new Date(59_000),
      window: 0,
    })).toBe(1n)
  })

  it('encrypts secrets with tenant/user AAD and rejects another identity', () => {
    process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64')
    const envelope = encryptTotpSecret('JBSWY3DPEHPK3PXP', 'tenant-a:user-a')
    expect(envelope.secretCiphertext).not.toContain('JBSWY3DPEHPK3PXP')
    expect(decryptTotpSecret(envelope, 'tenant-a:user-a')).toBe('JBSWY3DPEHPK3PXP')
    expect(() => decryptTotpSecret(envelope, 'tenant-b:user-a')).toThrow()
  })

  it('rejects a counter that has already been consumed', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    expect(verifyTotpCode({
      code: '287082',
      secret,
      now: new Date(59_000),
      window: 0,
      lastUsedCounter: 1n,
    })).toBeNull()
  })
})

describe('customer PDF privacy', () => {
  it('does not render employee codes or names', async () => {
    const buffer = await generateReportPdf({
      project: {
        code: 'PROJECT',
        name: 'Privacy Project',
        clientName: 'Client',
        address: 'Address',
        reportTemplateConfig: {},
      },
      period: { from: new Date('2026-07-01'), to: new Date('2026-07-31') },
      generatedAt: new Date('2026-08-01T00:00:00.000Z'),
      attendanceByDay: [],
      attendanceByEmployee: [{
        employeeCode: 'SECRET_EMPLOYEE_CODE',
        employeeName: 'SECRET_EMPLOYEE_NAME',
        daysWorked: 20,
        totalHours: 160,
      }],
      totals: { totalShifts: 20, totalCheckIns: 20, totalHours: 160, totalEmployees: 1 },
    })
    expect(buffer.includes(Buffer.from('SECRET_EMPLOYEE_CODE'))).toBe(false)
    expect(buffer.includes(Buffer.from('SECRET_EMPLOYEE_NAME'))).toBe(false)
  })
})

describe('photo payload validation', () => {
  it('uses typed client errors for empty, non-JPEG, and oversized payloads', () => {
    expect(() => decodePhotoBase64('')).toThrow(ValidationError)
    expect(() => decodePhotoBase64(Buffer.alloc(10).toString('base64')))
      .toThrow(ValidationError)
    expect(() => decodePhotoBase64(Buffer.alloc(MAX_PHOTO_BYTES + 1, 0xff).toString('base64')))
      .toThrow(BusinessRuleViolationError)
  })
})

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

  it('accepts photo-sized JSON but keeps a bounded body limit', async () => {
    const { app } = await buildServer()
    const accepted = await app.inject({
      method: 'POST',
      url: '/not-a-route',
      payload: { photoBase64: 'a'.repeat(2 * 1024 * 1024) },
    })
    expect(accepted.statusCode).not.toBe(413)

    const rejected = await app.inject({
      method: 'POST',
      url: '/not-a-route',
      payload: { photoBase64: 'a'.repeat(8 * 1024 * 1024) },
    })
    expect(rejected.statusCode).toBe(413)
    await app.close()
  })
})
