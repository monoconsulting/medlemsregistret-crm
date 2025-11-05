import path from 'node:path'
import { expect, test } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_REMOTE_BASE_URL ?? 'https://crm.medlemsregistret.se'
const LOGIN_EMAIL = process.env.PLAYWRIGHT_REMOTE_LOGIN_EMAIL ?? 'admin@crm.se'
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_REMOTE_LOGIN_PASSWORD ?? 'Admin!2025'

test.use({
  viewport: { width: 1900, height: 1200 },
  video: 'on',
  recordVideo: {
    size: { width: 1900, height: 120 },
  },
  screenshot: 'on',
})

test.describe('Remote CRM smoke', () => {
  test('login surfaces dashboard and association data', async ({ page }) => {
    await test.step('Open landing page and follow login link', async () => {
      await page.goto(BASE_URL)
      const loginLink = page.getByRole('link', { name: 'G\u00e5 till inloggning' })
      await expect(loginLink).toBeVisible({ timeout: 15_000 })
      await loginLink.click()
      await expect(page).toHaveURL(/\/login\/?$/, { timeout: 10_000 })
    })

    await test.step('Authenticate with remote credentials', async () => {
      const emailInput = page.getByLabel('E-postadress')
      await expect(emailInput).toBeVisible({ timeout: 10_000 })
      await emailInput.fill(LOGIN_EMAIL)
      await page.getByLabel('L\u00f6senord').fill(LOGIN_PASSWORD)
      await page.getByRole('button', { name: 'Logga in' }).click()
    })

    await test.step('Validate dashboard layout', async () => {
      await expect(page).toHaveURL(/\/dashboard\/?/, { timeout: 30_000 })
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('button', { name: 'G\u00e5 till f\u00f6reningar' })).toBeVisible()
    })

    await test.step('Inspect associations table', async () => {
      await Promise.all([
        page.waitForURL(/\/associations\/?/, { timeout: 45_000 }),
        page.getByRole('link', { name: 'F\u00f6reningar' }).click(),
      ])
      await expect(page.getByRole('heading', { level: 1, name: 'F\u00f6reningar' })).toBeVisible()
      await expect(page.getByPlaceholder('S\u00f6k efter namn eller beskrivning')).toBeVisible()
      const tableHead = page.locator('table thead')
      await expect(tableHead).toBeVisible({ timeout: 15_000 })
      await expect(tableHead).toContainText('Namn')
      await expect(tableHead).toContainText('Kommun')
      await expect(tableHead).toContainText('Taggar')
      await expect(tableHead).toContainText('\u00c5tg\u00e4rder')
      const firstRow = page.locator('table tbody tr').first()
      await expect(firstRow).toBeVisible({ timeout: 15_000 })
      await expect(firstRow.locator('td').first()).not.toHaveText('')
    })

    await test.step('Capture dashboard snapshot', async () => {
      await page.goto(`${BASE_URL}/dashboard`)
      await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
      const screenshotPath = path.join('web', 'test-results', 'media', 'snapshots', 'remote-dashboard.png')
      await page.screenshot({
        path: screenshotPath,
        clip: { x: 0, y: 0, width: 1900, height: 1200 },
      })
    })
  })
})
