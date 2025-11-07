import { test, expect } from "@playwright/test";

const LOGIN_EMAIL = process.env.PLAYWRIGHT_LOGIN_EMAIL ?? "admin@crm.se";
const LOGIN_PASSWORD = process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? "Admin2025!";

test.describe("Dashboard design parity", () => {
  test.use({
    baseURL: "http://localhost:3020",
  });

  test("renders Loopia dashboard according to Figma spec", async ({ page }) => {
    await test.step("Navigate to dashboard login", async () => {
      await page.goto("/login?redirectTo=%2Fdashboard");
      await expect(page.getByRole("textbox", { name: /^E-postadress$/ })).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Authenticate with default credentials", async () => {
      await page.getByRole("textbox", { name: /^E-postadress$/ }).fill(LOGIN_EMAIL);
      await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
      await page.getByRole("button", { name: "Logga in" }).click();
    });

    await test.step("Wait for dashboard to load", async () => {
      await expect
        .poll(async () => page.url(), { timeout: 20_000, intervals: [500, 1000, 1500] })
        .toContain("/dashboard");
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Verify header and controls", async () => {
      await expect(page.getByText("Översikt av föreningsdata och systemaktivitet.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Exportera rapport" })).toBeVisible();
      await expect(page.getByRole("combobox")).toBeVisible();
    });

    await test.step("Ensure KPI cards align with Figma layout", async () => {
      const cardIds = [
        "kpi-active-associations",
        "kpi-municipalities",
        "kpi-scanned-associations",
        "kpi-contact-profiles",
        "kpi-contacted-associations",
        "kpi-contacts-week",
        "kpi-contacts-month",
        "kpi-new-members",
      ];

      for (const id of cardIds) {
        await expect(page.getByTestId(id)).toBeVisible();
      }
    });

    await test.step("Verify analytics widgets", async () => {
      await expect(page.getByTestId("chart-trend")).toBeVisible();
      await expect(page.getByTestId("chart-distribution")).toBeVisible();
      await expect(page.getByTestId("recent-members")).toBeVisible();
    });
  });
});
