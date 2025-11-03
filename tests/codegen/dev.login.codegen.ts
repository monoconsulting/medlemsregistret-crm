import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('http://localhost:3020/login?redirectTo=%2Fdashboard');
  await page.getByRole('textbox', { name: 'E-postadress' }).click();
  await page.getByRole('textbox', { name: 'E-postadress' }).fill('admin@crm.se');
  await page.getByRole('textbox', { name: 'E-postadress' }).press('Tab');
  await page.getByRole('textbox', { name: 'Lösenord' }).fill('Admin2025!');
  await page.getByRole('button', { name: 'Logga in' }).click();
  await page.getByRole('link', { name: 'Kommunöversikt' }).click();
  await page.getByRole('link', { name: 'Föreningar' }).dblclick();
  await page.getByRole('link', { name: 'Kontakter' }).click();
});