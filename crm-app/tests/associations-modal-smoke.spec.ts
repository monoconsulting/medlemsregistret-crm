import { test, expect } from "@playwright/test";

const LOGIN_EMAIL = "admin@crm.se";
const LOGIN_PASSWORD = "Admin!2025";

/**
 * Quick smoke test to verify associations modal is deployed and working
 */
test.describe("Associations Modal - Smoke Test", () => {
  test.use({
    baseURL: "https://crm.medlemsregistret.se",
    viewport: {
      height: 1256,
      width: 1760
    }
  });

  test("associations page loads and modal functionality exists", async ({ page }) => {
    // Login using exact codegen flow
    await page.goto('/');
    await page.getByRole('link', { name: 'Gå till inloggning' }).click();
    await page.getByRole('textbox', { name: 'E-postadress' }).fill(LOGIN_EMAIL);
    await page.getByRole('textbox', { name: 'Lösenord' }).fill(LOGIN_PASSWORD);
    await page.getByRole('button', { name: 'Logga in' }).click();

    // Navigate to associations
    await page.getByRole('link', { name: 'Föreningar' }).click();
    await expect(page).toHaveURL(/.*associations.*/i, { timeout: 10_000 });

    // Wait for data to load
    await expect(page.locator("text=Laddar föreningar…")).toHaveCount(0, { timeout: 15_000 });

    // Check that table has data
    const hasRows = await page.locator("table tbody tr").count();
    expect(hasRows).toBeGreaterThan(0);

    // Click first row to open modal
    await page.locator("table tbody tr").first().click();

    // Check that modal opens
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Wait for modal to finish loading
    await expect(page.locator("text=Hämtar föreningsdetaljer…")).toHaveCount(0, { timeout: 10_000 });

    // Verify key sections exist
    await expect(modal.getByText("Grundläggande information")).toBeVisible();
    await expect(modal.getByText("Kopplade Personer")).toBeVisible();
    await expect(modal.getByText("Aktivitetslogg")).toBeVisible();

    // Verify tabs exist
    await expect(modal.getByRole("tab", { name: /Utökad sökning - Organisation/i })).toBeVisible();
    await expect(modal.getByRole("tab", { name: /Utökad sökning - Personer/i })).toBeVisible();

    console.log("✅ Associations modal deployed successfully and working!");
  });
});
