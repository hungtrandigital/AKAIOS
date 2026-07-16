// E2E tests for AKAIUNSAN web admin — login + attendance realtime + payroll flow.
// Requires running web admin + backends (use playwright.config.ts webServer or pre-started).
// Set E2E_BASE_URL=http://localhost:3002 (default) to override.

import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@ak.local'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123!'

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
    await expect(page.locator('.error')).toBeVisible({ timeout: 5_000 })
  })

  test('admin can log in and view attendance', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', ADMIN_PASSWORD)
    await page.click('button[type=submit]')

    // Should redirect to /attendance after successful login
    await page.waitForURL(/\/attendance$|^http.*\/attendance/, { timeout: 10_000 })
    await expect(page.locator('h1')).toContainText('Chấm công hôm nay')

    // Realtime refresh indicator
    await expect(page.locator('text=/đang tải/i')).toBeHidden({ timeout: 10_000 })
  })

  test('admin can navigate to payroll page and see period controls', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', ADMIN_PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/attendance$/)

    // Navigate
    await page.click('a:has-text("Bảng lương")')
    await expect(page).toHaveURL(/\/payroll$/)
    await expect(page.locator('h1')).toContainText('Bảng lương')

    // Should have period creation controls
    await expect(page.locator('text=/Mở kỳ lương mới/i')).toBeVisible()
  })

  test('admin can navigate to projects list', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', ADMIN_PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/attendance$/)

    await page.click('a:has-text("Dự án")')
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.locator('h1')).toContainText('Dự án')
  })

  test('logout clears session', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', ADMIN_PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/attendance$/)

    await page.click('button:has-text("Đăng xuất")')
    await expect(page).toHaveURL(/\/login$/)

    // Try accessing protected page — should bounce
    await page.goto('/attendance')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Payroll flow (smoke)', () => {
  test('can open a new payroll period', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type=email]', ADMIN_EMAIL)
    await page.fill('input[type=password]', ADMIN_PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/attendance$/)
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
    // We just check no client error
    await page.waitForTimeout(1000)
    const errorVisible = await page.locator('.error').count()
    expect(errorVisible).toBeLessThanOrEqual(0)
  })
})
