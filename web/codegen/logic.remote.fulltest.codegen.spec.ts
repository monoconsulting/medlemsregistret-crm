import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('https://crm.medlemsregistret.se/');
  await page.getByRole('link', { name: 'Gå till inloggning' }).click();
  await page.getByRole('textbox', { name: 'E-postadress' }).click();
  await page.getByRole('textbox', { name: 'E-postadress' }).fill('admin@crm.se');
  await page.getByRole('textbox', { name: 'E-postadress' }).press('Tab');
  await page.getByRole('textbox', { name: 'Lösenord' }).click();
  await page.getByRole('textbox', { name: 'Lösenord' }).fill('Admin!2025');
  await page.getByRole('button', { name: 'Logga in' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Kommunöversikt' }).click();
  await page.getByRole('link', { name: 'Föreningar' }).click();
  await page.getByRole('link', { name: 'Föreningar' }).click();
  await page.getByRole('link', { name: 'Kontakter' }).click();
  await page.getByRole('link', { name: 'Grupperingar' }).click();
  await page.getByRole('link', { name: 'Användare' }).click();
  await page.getByRole('link', { name: 'Import' }).click();
  await page.getByRole('link', { name: 'Inställningar' }).click();
  await page.getByText('AM', { exact: true }).click();
  await page.getByText('Inloggad användare').click();
  await page.getByText('Administratör').click();
});