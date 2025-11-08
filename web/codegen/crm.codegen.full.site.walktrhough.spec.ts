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
  await page.getByRole('textbox', { name: 'Lösenord' }).fill('');
  await page.getByRole('textbox', { name: 'Lösenord' }).click();
  await page.getByRole('textbox', { name: 'Lösenord' }).fill('Admin!2025');
  await page.getByRole('button', { name: 'Logga in' }).click();
  await page.getByRole('link', { name: 'Kommunöversikt' }).click();
  await page.getByText('0').first().click();
  await page.getByText('0').nth(1).click();
  await page.getByText('0').nth(1).click();
  await page.getByText('0').nth(2).click();
  await page.getByRole('textbox', { name: 'Sök kommun' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Alla län' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Alla landskap' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Alla landskap' }).click();
  await page.locator('html').click();
  await page.getByRole('checkbox').click();
  await page.getByRole('checkbox').click();
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Kommunkod' }).click();
  await page.getByRole('cell', { name: 'Befolkning' }).click();
  await page.getByRole('cell', { name: 'Föreningsregister' }).click();
  await page.getByText('Visar 0 av 0 kommuner').click();
  await page.getByRole('cell', { name: 'Inga kommuner matchar din' }).click();
  await page.getByRole('link', { name: 'Föreningar' }).click();
  await page.getByRole('heading', { name: 'Application error: a client-' }).click();
  await page.locator('div').first().click();
  await page.getByRole('link', { name: 'Kontakter' }).click();
  await page.getByText('Funktionalitet för').click();
  await page.getByText('Arbete pågår').click();
  await page.getByRole('link', { name: 'Grupperingar' }).click();
  await page.getByText('Funktion under utveckling').click();
  await page.getByText('Vi arbetar med att flytta ö').click();
  await page.getByRole('link', { name: 'Användare' }).click();
  await page.getByText('Användarhantering planeras').click();
  await page.getByText('Den förenklade plattformen st').click();
  await page.getByRole('link', { name: 'Import' }).click();
  await page.getByText('Importverktyg under uppbyggnad').click();
  await page.getByText('Rutiner för att importera fö').click();
  await page.getByRole('button', { name: 'Exportera' }).click();
  await page.getByRole('button', { name: 'A Användare admin@crm.se' }).click();
  await page.getByRole('menuitem', { name: 'Inställningar' }).click();
  await page.getByRole('button', { name: 'A Användare admin@crm.se' }).click();
  await page.getByRole('menuitem', { name: 'Profil' }).click();
  await page.getByRole('button', { name: 'A Användare admin@crm.se' }).click();
  await page.locator('html').click();
  await page.getByRole('button', { name: 'Notifieringar' }).click();
  await page.getByRole('button', { name: 'A Användare admin@crm.se' }).click();
  await page.getByRole('menuitem', { name: 'Logga ut' }).click();
});