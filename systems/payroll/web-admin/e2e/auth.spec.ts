// E2E tests for AKAIUNSAN web admin — login + attendance realtime + payroll flow.
// Requires running web admin + backends (use playwright.config.ts webServer or pre-started).
// Set E2E_BASE_URL=http://localhost:3002 (default) to override.

import { test, expect, type Page } from '@playwright/test'
import { generateTotpCode } from '@ak/shared'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@ak.local'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123!'
const BO_EMAIL = 'bo@ak.local'
const BO_PASSWORD = 'admin123!'
const TOTP_SECRET = process.env.E2E_TOTP_SECRET
const FIXED_TOTP_CODE = process.env.E2E_FIXED_TOTP_CODE

async function loginWithTwoFactor(
  page: Page,
  account: { email: string; password: string } | { adminIndex: number },
) {
  if (!TOTP_SECRET && !FIXED_TOTP_CODE) {
    throw new Error('E2E_TOTP_SECRET or E2E_FIXED_TOTP_CODE is required for authenticated E2E tests')
  }
  await page.goto('/login')
  const email = 'adminIndex' in account ? `e2e-admin-${account.adminIndex}@ak.local` : account.email
  const password = 'adminIndex' in account ? ADMIN_PASSWORD : account.password
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/login\/2fa$/)
  const counter = BigInt(Math.floor(Date.now() / 1000 / 30))
  const code = FIXED_TOTP_CODE ?? generateTotpCode(TOTP_SECRET!, counter)
  await page.fill('#totp_code', code)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/attendance$/)
}

test.describe('Web admin auth + navigation', () => {
  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('h1')).toContainText('AKAIUNSAN')
  })

  test('rejects invalid password', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', 'wrongpassword')
    await page.click('button[type=submit]')
    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 5_000 })
  })

  test('admin can log in and view attendance', async ({ page }) => {
    await loginWithTwoFactor(page, { adminIndex: 0 })
    await expect(page.locator('h1')).toContainText('Chấm công hôm nay')

    // Realtime refresh indicator
    await expect(page.locator('text=/đang tải/i')).toBeHidden({ timeout: 10_000 })

    // 18:30 UTC is already the next business day in Vietnam. The page must not
    // derive its API date from UTC, or the pre-07:00 local window queries yesterday.
    let attendanceRequest = ''
    await page.route('**/api/attendance/records**', async (route) => {
      attendanceRequest = route.request().url()
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' })
    })
    await page.clock.setFixedTime(new Date('2026-07-01T18:30:00.000Z'))
    await page.reload()
    await expect.poll(() => attendanceRequest).toContain('from=2026-07-02')
    expect(attendanceRequest).toContain('to=2026-07-02')

    attendanceRequest = ''
    await page.click('a:has-text("CEO Dashboard")')
    await expect(page).toHaveURL(/\/executive$/)
    await expect(page.locator('h1')).toContainText('CEO Dashboard')
    await expect.poll(() => attendanceRequest).toContain('from=2026-07-02')
    expect(attendanceRequest).toContain('to=2026-07-02')
    await expect(page.getByText('Bảng lương tháng 7/2026')).toBeVisible()
  })

  test('admin can navigate to payroll page and see period controls', async ({ page }) => {
    await loginWithTwoFactor(page, { adminIndex: 1 })

    // Navigate
    await page.click('a:has-text("Bảng lương")')
    await expect(page).toHaveURL(/\/payroll$/)
    await expect(page.locator('h1')).toContainText('Bảng lương')

    // Should have period creation controls
    await expect(page.locator('text=/Mở kỳ lương mới/i')).toBeVisible()
  })

  test('admin can navigate to projects list', async ({ page }) => {
    await loginWithTwoFactor(page, { adminIndex: 2 })

    await page.click('a:has-text("Dự án")')
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.locator('h1')).toContainText('Dự án')
  })

  test('BO can create and cancel a shift assignment from the operations board', async ({ page }) => {
    await loginWithTwoFactor(page, { email: BO_EMAIL, password: BO_PASSWORD })

    const employee = { id: '10000000-0000-4000-8000-000000000001', employeeCode: 'NV001', fullName: 'Nguyễn Minh An' }
    const project = { id: '20000000-0000-4000-8000-000000000002', code: 'DA-01', name: 'Tòa nhà trung tâm' }
    const shift = {
      id: '30000000-0000-4000-8000-000000000003', name: 'Ca sáng', startTime: '08:00', endTime: '17:00',
      breakMinutes: 60, lateThresholdMinutes: 15, isOvernight: false, color: '#0289f7',
    }
    let assignments: Array<Record<string, unknown>> = []
    let createPayload: Record<string, unknown> | undefined
    let cancelPayload: Record<string, unknown> | undefined
    let copyPreviewPayload: Record<string, unknown> | undefined
    let copyPayload: Record<string, unknown> | undefined
    let monthlyQuery: URLSearchParams | undefined

    await page.route('**/api/attendance/projects**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ data: [project] }),
    }))
    await page.route('**/api/attendance/employees**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ data: [employee] }),
    }))
    await page.route('**/api/attendance/shifts**', async (route) => {
      const request = route.request()
      const pathname = new URL(request.url()).pathname
      if (request.method() === 'GET' && pathname.endsWith('/shifts')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [shift] }) })
      }
      if (request.method() === 'GET' && pathname.endsWith('/shifts/assignments')) {
        monthlyQuery = new URL(request.url()).searchParams
        const summary = { scheduled: 0, checked_in: 0, checked_out: 0, completed: 0, missed: 0, cancelled: 0 }
        for (const assignment of assignments) summary[assignment.status as keyof typeof summary] += 1
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: assignments,
            pagination: { page: 1, limit: 50, total: assignments.length, totalPages: assignments.length ? 1 : 0 },
            summary,
          }),
        })
      }
      if (request.method() === 'POST' && pathname.endsWith('/shifts/assignments/copy-preview')) {
        copyPreviewPayload = request.postDataJSON()
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            previewToken: 'a'.repeat(64),
            projectId: project.id,
            sourceFrom: copyPreviewPayload?.sourceFrom,
            sourceTo: copyPreviewPayload?.sourceTo,
            targetFrom: copyPreviewPayload?.targetStart,
            targetTo: copyPreviewPayload?.targetStart,
            items: [
              ...Array.from({ length: 21 }, (_, index) => ({
                sourceAssignmentId: `safe-${index}`,
                sourceDate: copyPreviewPayload?.sourceFrom,
                targetDate: copyPreviewPayload?.targetStart,
                employee,
                shift,
                notes: null,
                warnings: [],
                blockingReasons: [],
              })),
              {
                sourceAssignmentId: 'warning-after-first-page',
                sourceDate: copyPreviewPayload?.sourceFrom,
                targetDate: copyPreviewPayload?.targetStart,
                employee,
                shift,
                notes: 'Sảnh chính',
                warnings: [{
                  type: 'same_day_multiple_shift',
                  employeeId: employee.id,
                  date: copyPreviewPayload?.targetStart,
                  shiftId: shift.id,
                  conflictCount: 2,
                  message: 'Nhân viên đã có một ca khác trong ngày.',
                }],
                blockingReasons: [],
              },
            ],
            summary: { total: 22, warningCount: 1, blockingCount: 0 },
          }),
        })
      }
      if (request.method() === 'POST' && pathname.endsWith('/shifts/assignments/copy')) {
        copyPayload = request.postDataJSON()
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ assignments: [{ id: 'copied-assignment' }] }),
        })
      }
      if (request.method() === 'POST' && pathname.endsWith('/shifts/assignments')) {
        createPayload = request.postDataJSON()
        if (createPayload?.notes === 'Cảnh báo stale' && !createPayload?.confirmConflicts) {
          await new Promise((resolve) => setTimeout(resolve, 150))
          return route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'CONFLICT',
                message: 'Schedule conflict requires confirmation',
                details: {
                  requiresConfirmation: true,
                  conflictToken: 'b'.repeat(64),
                  warnings: [{
                    type: 'same_day_multiple_shift',
                    employeeId: employee.id,
                    date: createPayload?.date,
                    shiftId: shift.id,
                    conflictCount: 1,
                    message: 'Nhân viên đã có một ca khác trong ngày.',
                  }],
                },
              },
            }),
          })
        }
        const assignment = {
          id: '40000000-0000-4000-8000-000000000004',
          date: `${createPayload?.date}T00:00:00.000Z`,
          status: 'scheduled', notes: createPayload?.notes, employee, project, shift, attendanceRecord: null,
        }
        assignments = [assignment]
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(assignment) })
      }
      if (request.method() === 'POST' && pathname.endsWith('/cancel')) {
        cancelPayload = request.postDataJSON()
        assignments = assignments.map((item) => ({ ...item, status: 'cancelled' }))
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(assignments[0]) })
      }
      return route.abort()
    })

    await page.getByRole('tab', { name: 'Lịch ca' }).click()
    await expect(page.getByRole('heading', { name: 'Lịch dự án theo tháng' })).toBeVisible()
    await expect.poll(() => monthlyQuery?.get('projectId')).toBe(project.id)
    await expect.poll(() => monthlyQuery?.get('from')?.endsWith('-01')).toBe(true)
    await page.getByLabel('Nhân viên phân ca').selectOption(employee.id)
    await page.getByLabel('Dự án phân ca').selectOption(project.id)
    await page.getByLabel('Khung giờ phân ca').selectOption(shift.id)
    await page.getByLabel('Ghi chú phân ca').fill('Sảnh chính')
    await page.getByRole('button', { name: 'Xếp ca' }).click()

    await expect.poll(() => createPayload?.employeeId).toBe(employee.id)
    await expect.poll(() => createPayload?.projectId).toBe(project.id)
    await expect(page.locator('.schedule-table')).toContainText('Nguyễn Minh An')
    await expect(page.locator('.schedule-table')).toContainText('Đã xếp ca')

    await page.getByRole('button', { name: 'Hủy ca' }).click()
    await page.getByLabel('Lý do hủy ca').fill('Nhân viên đổi lịch trực theo điều phối')
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click()

    await expect.poll(() => cancelPayload?.reason).toBe('Nhân viên đổi lịch trực theo điều phối')
    await expect(page.locator('.schedule-table')).toContainText('Đã hủy')
    await expect(page.getByRole('button', { name: 'Hủy ca' })).toHaveCount(0)

    await page.getByLabel('Nhân viên phân ca').selectOption(employee.id)
    await page.getByLabel('Dự án phân ca').selectOption(project.id)
    await page.getByLabel('Khung giờ phân ca').selectOption(shift.id)
    await page.getByLabel('Ghi chú phân ca').fill('Cảnh báo stale')
    await page.getByRole('button', { name: 'Xếp ca' }).click()
    await expect(page.getByLabel('Ngày làm việc')).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Vẫn lưu lịch' })).toBeVisible()
    const selectedMonthStart = monthlyQuery?.get('from')
    expect(selectedMonthStart).toMatch(/^\d{4}-\d{2}-01$/)
    const currentScheduleDate = await page.getByLabel('Ngày làm việc').inputValue()
    const alternateScheduleDate = currentScheduleDate === selectedMonthStart
      ? `${selectedMonthStart!.slice(0, -2)}02`
      : selectedMonthStart!
    await page.getByLabel('Ngày làm việc').fill(alternateScheduleDate)
    await expect(page.getByRole('button', { name: 'Vẫn lưu lịch' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Xếp ca' }).click()
    await expect(page.getByRole('button', { name: 'Vẫn lưu lịch' })).toBeVisible()
    await page.getByRole('button', { name: 'Vẫn lưu lịch' }).click()
    await expect.poll(() => createPayload?.conflictToken).toBe('b'.repeat(64))
    await expect.poll(() => createPayload?.confirmConflicts).toBe(true)

    await page.getByRole('button', { name: 'Xem trước copy' }).click()
    await expect.poll(() => copyPreviewPayload?.projectId).toBe(project.id)
    await expect(page.getByText('Có lịch trùng thời gian hoặc nhân viên có nhiều ca trong ngày.')).toBeVisible()
    await expect(page.getByText('Nhân viên đã có một ca khác trong ngày. (2)')).toBeVisible()
    await expect(page.getByText('Đang hiển thị đầy đủ 22 lịch; lịch có cảnh báo hoặc bị chặn được đưa lên đầu.')).toBeVisible()
    await expect(page.getByText('Hợp lệ')).toHaveCount(21)
    await page.getByRole('button', { name: 'Xác nhận cảnh báo và copy' }).click()
    await expect.poll(() => copyPayload?.confirmConflicts).toBe(true)
    await expect.poll(() => copyPayload?.previewToken).toBe('a'.repeat(64))
    await expect.poll(() => typeof copyPayload?.requestId).toBe('string')
    await expect(page.getByText('Đã copy 1 lịch và lưu audit.')).toBeVisible()
  })

  test('system admin can record and see an audited manual attendance exception', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ak_access_token', 'manual-attendance-test-token'))
    await page.route('**/api/attendance/auth/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: '60000000-0000-4000-8000-000000000016',
        email: 'system-admin@test.local',
        phone: '+84900000000',
        role: 'system_admin',
      }),
    }))
    await page.route('**/api/attendance/records**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: '{"data":[]}',
    }))
    const employee = { id: '10000000-0000-4000-8000-000000000011', employeeCode: 'NV011', fullName: 'Lê Thị Hoa' }
    const project = { id: '20000000-0000-4000-8000-000000000012', code: 'DA-02', name: 'Bệnh viện trung tâm' }
    const shift = {
      id: '30000000-0000-4000-8000-000000000013', name: 'Ca sáng', startTime: '06:00', endTime: '14:00',
      breakMinutes: 0, lateThresholdMinutes: 15, isOvernight: false, color: '#0289f7',
    }
    const assignmentId = '40000000-0000-4000-8000-000000000014'
    let manualPayload: Record<string, unknown> | undefined
    let assignment: Record<string, unknown> = {
      id: assignmentId, date: '2026-07-20T00:00:00.000Z', status: 'scheduled', notes: null,
      employee, project, shift, attendanceRecord: null,
    }

    await page.route('**/api/attendance/projects**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ data: [project] }),
    }))
    await page.route('**/api/attendance/employees**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ data: [employee] }),
    }))
    await page.route('**/api/attendance/shifts**', async (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (pathname.endsWith('/shifts')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [shift] }) })
      }
      if (pathname.endsWith('/shifts/assignments')) {
        const status = assignment.status as string
        const summary = { scheduled: 0, checked_in: 0, checked_out: 0, completed: 0, missed: 0, cancelled: 0 }
        summary[status as keyof typeof summary] = 1
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [assignment], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }, summary }),
        })
      }
      return route.abort()
    })
    await page.route(`**/api/attendance/assignments/${assignmentId}/manual-event`, async (route) => {
      manualPayload = route.request().postDataJSON()
      const attendanceRecord = {
        id: '50000000-0000-4000-8000-000000000015',
        checkInAt: manualPayload?.occurredAt,
        checkOutAt: null,
        overrideById: '60000000-0000-4000-8000-000000000016',
        overrideReason: `${manualPayload?.reasonCode}: ${manualPayload?.reason}`,
      }
      assignment = { ...assignment, status: 'checked_in', attendanceRecord }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(attendanceRecord) })
    })

    await page.goto('/attendance')
    await page.getByRole('tab', { name: 'Lịch ca' }).click()
    await expect(page.locator('.schedule-table')).toContainText('Lê Thị Hoa')
    const manualTrigger = page.getByRole('button', { name: 'Ghi vào ca' })
    await manualTrigger.click()
    await expect(page.getByRole('heading', { name: 'Ghi nhận chấm công thủ công' })).toBeVisible()
    await expect(page.getByLabel('Ghi chú xác minh thủ công')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Ghi nhận chấm công thủ công' })).toHaveCount(0)
    await expect(manualTrigger).toBeFocused()
    await manualTrigger.click()
    await page.getByLabel('Ghi chú xác minh thủ công').fill('Giám sát xác nhận trực tiếp tại sảnh dự án')
    await page.getByRole('button', { name: 'Xác nhận và lưu audit' }).click()

    await expect.poll(() => manualPayload?.event).toBe('check_in')
    await expect.poll(() => manualPayload?.reasonCode).toBe('device_failure')
    await expect(page.locator('.schedule-table')).toContainText('Thủ công')
    await expect(page.getByText('Đã ghi nhận vào ca thủ công và lưu audit.')).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    await loginWithTwoFactor(page, { adminIndex: 3 })

    await page.click('button:has-text("Đăng xuất")')
    await expect(page).toHaveURL(/\/login$/)

    // Try accessing protected page — should bounce
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Payroll flow (smoke)', () => {
  test('can open a new payroll period', async ({ page }) => {
    await loginWithTwoFactor(page, { adminIndex: 4 })
    await page.click('a:has-text("Bảng lương")')
    await expect(page).toHaveURL(/\/payroll$/)

    // Open period form should be visible
    await expect(page.locator('h3:has-text("Mở kỳ lương mới")')).toBeVisible()

    // Select current month + year
    const now = new Date()
    await page.locator('select').first().selectOption(String(now.getMonth() + 1))
    await page.locator('select').nth(1).selectOption(String(now.getFullYear()))

    // Click open period
    await page.click('button:has-text("Mở kỳ")')

    // Either success or "already exists" (uniqueness) — both are valid responses
    const periodCell = page.getByText(`T${now.getMonth() + 1}/${now.getFullYear()}`, { exact: true })
    const alert = page.locator('.alert-error')
    await expect(periodCell.or(alert).first()).toBeVisible({ timeout: 5_000 })
    if (await alert.isVisible()) {
      await expect(alert).toContainText(/409|already exists|đã tồn tại/i)
    }
  })
})
