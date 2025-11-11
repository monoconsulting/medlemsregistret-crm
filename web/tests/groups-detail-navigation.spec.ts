import { test, expect } from '@playwright/test'

const CRM_BASE_URL = process.env.PLAYWRIGHT_REMOTE_BASE_URL ?? 'https://crm.medlemsregistret.se'
const LOGIN_EMAIL = process.env.PLAYWRIGHT_REMOTE_LOGIN_EMAIL ?? 'admin@crm.se'
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_REMOTE_LOGIN_PASSWORD ?? 'Admin!2025'

test.describe('Group detail navigation', () => {
  test.use({
    baseURL: CRM_BASE_URL,
    viewport: { width: 1900, height: 1200 },
    video: 'on',
    recordVideo: {
      dir: 'web/test-results/media/video',
      size: { width: 1900, height: 120 },
    },
    launchOptions: {
      args: ['--window-position=0,0', '--window-size=1900,1200'],
    },
  })

  test('opens group detail via SPA navigation and serves matching RSC payload', async ({ page }) => {
    await test.step('Authenticate and land on groups overview', async () => {
      await page.goto('/login?redirectTo=%2Fgroups')
      await expect(page.getByRole('textbox', { name: /^E-postadress$/ })).toBeVisible({ timeout: 15_000 })
      await page.getByRole('textbox', { name: /^E-postadress$/ }).fill(LOGIN_EMAIL)
      await page.getByLabel(/^Lösenord$/).fill(LOGIN_PASSWORD)
      await page.getByRole('button', { name: /^Logga in$/ }).click()
      await expect(page).toHaveURL(/\/groups/)
      await expect(page.getByText('Mina grupperingar')).toBeVisible()
    })

    const detailLink = page.getByRole('link', { name: 'Öppna grupp' }).first()
    await expect(detailLink).toBeVisible()
    const targetHref = await detailLink.getAttribute('href')
    expect(targetHref, 'group detail link should include an id query param').toContain('id=')

    await test.step('Static RSC payload is published alongside HTML export', async () => {
      const response = await page.request.get(`${CRM_BASE_URL}/groups/detail/index.txt`)
      expect(response.status()).toBe(200)
      const payloadSnippet = await response.text()
      expect(payloadSnippet.length).toBeGreaterThan(0)
    })

    const navigationPromise = page.waitForURL(/\/groups\/detail/)
    await detailLink.click()
    await navigationPromise

    await expect(page.getByRole('button', { name: /Exportera CSV/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Redigera/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Radera/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Lägg till förening/i })).toBeVisible()

    const detailUrl = new URL(page.url(), CRM_BASE_URL)
    const detailId = detailUrl.searchParams.get('id')
    expect(detailId).not.toBeNull()
  })
})
