import { test, expect } from '@playwright/test'

const LOGIN_EMAIL = process.env.PLAYWRIGHT_LOGIN_EMAIL ?? 'admin@crm.se'
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? 'Admin2025!'

test.describe('Login flow', () => {
  test.use({
    baseURL: 'http://localhost:3020',
  })

  test('allows an authenticated user to reach the dashboard', async ({ page }) => {
    await test.step('Open the login page', async () => {
      await page.goto('/login?redirectTo=%2Fdashboard')
      await expect(page.getByRole('textbox', { name: /^E-postadress$/ })).toBeVisible()
    })

    await test.step('Submit valid credentials', async () => {
      await page.getByRole('textbox', { name: /^E-postadress$/ }).fill(LOGIN_EMAIL)
      await page.locator('input[type="password"]').fill(LOGIN_PASSWORD)
      await page.getByRole('button', { name: 'Logga in' }).click()
    })

    await test.step('Verify dashboard content is visible', async () => {
      await expect.poll(async () => page.url(), {
        message: 'Expected to navigate to /dashboard',
        timeout: 20_000,
        intervals: [500, 1000, 1500, 2000, 2500],
      }).toContain('/dashboard')
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
    })
  })
})
