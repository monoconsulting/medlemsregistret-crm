import { test, expect } from "@playwright/test";

const LOGIN_EMAIL = process.env.PLAYWRIGHT_LOGIN_EMAIL ?? "admin@crm.se";
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? "Admin2025!";

test.describe("Login flow", () => {
  test.use({
    baseURL: "http://localhost:3020",
  });

  test("login exposes Loopia data across key views", async ({ page }) => {
    await test.step("Open the login page", async () => {
      await page.goto("/login?redirectTo=%2Fdashboard");
      await expect(page.getByRole("textbox", { name: /^E-postadress$/ })).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Submit valid credentials", async () => {
      await page.getByRole("textbox", { name: /^E-postadress$/ }).fill(LOGIN_EMAIL);
      await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
      await page.getByRole("button", { name: "Logga in" }).click();
    });

    await test.step("Verify dashboard content is visible", async () => {
      await expect.poll(async () => page.url(), {
        message: "Expected to navigate to /dashboard",
        timeout: 20_000,
        intervals: [500, 1000, 1500, 2000, 2500],
      }).toContain("/dashboard");
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Kommun\u00f6versikt lists municipalities from Loopia", async () => {
      await Promise.all([
        page.waitForURL(/\/municipalities/, { timeout: 45_000 }),
        page.getByRole("link", { name: /Kommun/i }).click(),
      ]);
      await expect(
        page.locator("table tr").filter({ hasText: /Alings|Alvesta|Ale/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("F\u00f6reningar view surfaces association data", async () => {
      await Promise.all([
        page.waitForURL(/\/associations/, { timeout: 45_000 }),
        page.getByRole("link", { name: /F\u00f6reningar/i }).click(),
      ]);
      await expect(page.locator("text=Laddar f\u00f6reningar\u2026")).toHaveCount(0, { timeout: 15_000 });
      await expect(page.locator("table tr").nth(1)).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Kontakter lists real contact people", async () => {
      await Promise.all([
        page.waitForURL(/\/contacts/, { timeout: 45_000 }),
        page.getByRole("link", { name: /Kontakter/i }).click(),
      ]);
      await expect(page.getByRole("heading", { name: /Kontakter/i })).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("text=Kontaktlista kommer h\u00e4r")).toHaveCount(0);
      await expect(page.getByRole("cell", { name: /@/ }).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
