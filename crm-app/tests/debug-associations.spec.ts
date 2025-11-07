import { test, expect } from "@playwright/test";

const LOGIN_EMAIL = "admin@crm.se";
const LOGIN_PASSWORD = "Admin!2025";

test.describe("Debug Associations Page", () => {
  test.use({
    baseURL: "https://crm.medlemsregistret.se",
    viewport: { height: 1256, width: 1760 }
  });

  test("capture console errors on associations page", async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    // Capture console logs
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
    });

    // Login
    await page.goto('/');
    await page.getByRole('link', { name: 'Gå till inloggning' }).click();
    await page.getByRole('textbox', { name: 'E-postadress' }).fill(LOGIN_EMAIL);
    await page.getByRole('textbox', { name: 'Lösenord' }).fill(LOGIN_PASSWORD);
    await page.getByRole('button', { name: 'Logga in' }).click();

    // Navigate to associations
    await page.getByRole('link', { name: 'Föreningar' }).click();
    await expect(page).toHaveURL(/.*associations.*/i, { timeout: 10_000 });

    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000);

    // Print all captured errors
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== PAGE ERRORS ===');
    errors.forEach(err => console.log(err));

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-associations.png', fullPage: true });

    // Check if error message is visible
    const errorVisible = await page.locator('text=Application error').count();
    if (errorVisible > 0) {
      console.log('\n❌ Application error is visible on page');
    } else {
      console.log('\n✅ No application error visible');
    }
  });
});
