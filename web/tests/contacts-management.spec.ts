import { test, expect } from "@playwright/test"

const LOGIN_EMAIL = process.env.PLAYWRIGHT_LOGIN_EMAIL ?? "admin@crm.se"
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? "Admin2025!"

const EXPECTED_HEADERS = [
  "Namn",
  "Förening",
  "Kommun",
  "Primär kontakt",
  "Adress",
  "Telefonnummer",
  "E-post",
  "Facebook",
  "Instagram",
  "Twitter",
  "Åtgärder",
]

test.describe("Contacts management", () => {
  test.use({
    baseURL: "http://localhost:3020",
  })

  test("lists full contact columns and opens association contact modal", async ({ page }) => {
    await test.step("Authenticate and open contacts view", async () => {
      await page.goto("/login?redirectTo=%2Fcontacts")
      await page.getByRole("textbox", { name: /^E-postadress$/ }).fill(LOGIN_EMAIL)
      await page.locator('input[type="password"]').fill(LOGIN_PASSWORD)
      await page.getByRole("button", { name: "Logga in" }).click()
      await expect.poll(async () => page.url(), {
        message: "Expected redirect to /contacts",
        timeout: 30_000,
        intervals: [500, 1000, 1500, 2000],
      }).toContain("/contacts")
      await expect(page.getByRole("heading", { name: /Kontakter/i })).toBeVisible({ timeout: 15_000 })
    })

    await test.step("Verify the column headers required for auditing contacts", async () => {
      const headerRow = page.locator("table thead tr").first()
      for (const heading of EXPECTED_HEADERS) {
        await expect(headerRow.getByText(new RegExp(heading, "i"))).toBeVisible({ timeout: 10_000 })
      }
    })

    await test.step("Open the new contact hub modal by clicking a table row", async () => {
      const firstRow = page.locator("table tbody tr").first()
      await expect(firstRow).toBeVisible({ timeout: 15_000 })
      await firstRow.click()
      await expect(page.getByRole("heading", { name: /Kontakter ·/i })).toBeVisible({ timeout: 15_000 })
      await page.keyboard.press("Escape")
      await expect(page.getByRole("heading", { name: /Kontakter ·/i })).toHaveCount(0)
    })
  })
})
