// E2E tests for AKAIUNSAN web admin — login + attendance realtime + payroll flow.
// Requires running web admin + backends (use playwright.config.ts webServer or pre-started).
// Set E2E_BASE_URL=http://localhost:3002 (default) to override.

import { test, expect, type Page } from '@playwright/test'
import { generateTotpCode } from '@ak/shared'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@ak.local'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123!'
const TOTP_SECRET = process.env.E2E_TOTP_SECRET

async function loginWithTwoFactor(page: Page, accountIndex: number) {
  if (!TOTP_SECRET) throw new Error('E2E_TOTP_SECRET is required for authenticated E2E tests')
  await page.goto('/login')
  await page.fill('input[type=email]', `e2e-admin-${accountIndex}@ak.local`)
  await page.fill('input[type=password]', ADMIN_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/login\/2fa$/)
  const counter = BigInt(Math.floor(Date.now() / 1000 / 30))
  await page.fill('#totp_code', generateTotpCode(TOTP_SECRET, counter))
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
    await loginWithTwoFactor(page, 0)
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
    await loginWithTwoFactor(page, 1)

    // Navigate
    await page.click('a:has-text("Bảng lương")')
    await expect(page).toHaveURL(/\/payroll$/)
    await expect(page.locator('h1')).toContainText('Bảng lương')

    // Should have period creation controls
    await expect(page.locator('text=/Mở kỳ lương mới/i')).toBeVisible()
  })

  test('admin can navigate to projects list', async ({ page }) => {
    await loginWithTwoFactor(page, 2)

    await page.click('a:has-text("Dự án")')
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.locator('h1')).toContainText('Dự án')
  })

  test('logout clears session', async ({ page }) => {
    await loginWithTwoFactor(page, 3)

    await page.click('button:has-text("Đăng xuất")')
    await expect(page).toHaveURL(/\/login$/)

    // Try accessing protected page — should bounce
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Payroll flow (smoke)', () => {
  test('can open a new payroll period', async ({ page }) => {
    await loginWithTwoFactor(page, 4)
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
