import { test } from "@playwright/test";

test.use({
  viewport: {
    height: 1256,
    width: 1760,
  },
});

test("test", async ({ page }) => {
  await page.goto("http://localhost:3020/login?redirectTo=%2Fdashboard");
  await page.getByRole("textbox", { name: "E-postadress" }).click();
  await page.getByRole("textbox", { name: "E-postadress" }).fill("admin@crm.se");
  await page.getByRole("textbox", { name: "E-postadress" }).press("Tab");
  await page.getByRole("textbox", { name: /L\u00f6senord/ }).fill("Admin2025!");
  await page.getByRole("button", { name: "Logga in" }).click();
  await page.getByRole("link", { name: /Kommun/ }).click();
  await page.getByRole("cell", { name: /Kommun/ }).first().hover();
  await page.getByRole("link", { name: /F\u00f6reningar/ }).click();
  await page.locator('[placeholder="S\u00f6k f\u00f6reningar..."]').click();
  await page.getByRole("link", { name: /Kontakter/ }).click();
  await page.locator('[placeholder="S\u00f6k p\u00e5 namn, e-post eller telefon\u2026"]').click();
});
