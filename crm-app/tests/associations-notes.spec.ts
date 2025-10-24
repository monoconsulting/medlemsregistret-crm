import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('associations page - navigation and note creation', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('http://localhost:3010/dashboard');

  // Click on Föreningar link
  await page.getByRole('link', { name: 'Föreningar' }).click();

  // Wait for associations to load
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // Click on first association to test note functionality
  const firstAssociation = page.locator('table tbody tr').first();
  await firstAssociation.click();

  // Wait for details panel to load
  await page.waitForTimeout(1000);

  // Scroll down in the details panel to find the textarea
  const detailsPanel = page.locator('.w-1\\/4.bg-gray-50.border-l');
  await detailsPanel.evaluate(el => el.scrollTo(0, el.scrollHeight));

  // Wait for textarea to appear
  await page.waitForSelector('textarea[placeholder="Skriv en anteckning..."]', { timeout: 10000 });

  // Test note creation
  const noteText = `Test anteckning ${new Date().toISOString()}`;
  await page.fill('textarea[placeholder="Skriv en anteckning..."]', noteText);

  // Click save button
  await page.click('button:has-text("Spara anteckning")');

  // Wait for save to complete
  await page.waitForTimeout(2000);

  // Verify the note appears in the notes list
  await expect(page.locator(`text=${noteText}`)).toBeVisible({ timeout: 5000 });

  // Verify textarea is cleared
  await expect(page.locator('textarea[placeholder="Skriv en anteckning..."]')).toHaveValue('');
});

test('associations page - test specific associations', async ({ page }) => {
  await page.goto('http://localhost:3010/dashboard');
  await page.getByRole('link', { name: 'Föreningar' }).click();

  // Wait for page to load
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // Test clicking different associations
  const associations = ['Adelsö Evenemang', 'Adelsö Föreningsråd', 'Adelsö Friluftsteater'];

  for (const assocName of associations) {
    const assocRow = page.getByText(assocName, { exact: false }).first();
    if (await assocRow.isVisible()) {
      await assocRow.click();
      await page.waitForTimeout(500);

      // Verify details panel shows the association name
      await expect(page.locator('.font-bold.text-lg', { hasText: assocName })).toBeVisible();
    }
  }
});
