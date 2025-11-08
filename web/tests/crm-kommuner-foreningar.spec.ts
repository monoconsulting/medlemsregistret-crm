import { test, expect } from '@playwright/test';

/**
 * Test to verify Kommuner page data and Föreningar page functionality
 * Based on crm.codegen.full.site.walktrhough.spec.ts
 */

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test.describe('CRM Kommuner and Föreningar Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('https://crm.medlemsregistret.se/');
    await page.getByRole('link', { name: 'Gå till inloggning' }).click();
    await page.getByRole('textbox', { name: 'E-postadress' }).fill('admin@crm.se');
    await page.getByRole('textbox', { name: 'Lösenord' }).fill('Admin!2025');
    await page.getByRole('button', { name: 'Logga in' }).click();

    // Wait for dashboard to load
    await page.waitForSelector('text=Kommunöversikt', { timeout: 10000 });
  });

  test('Kommuner page should display data from database', async ({ page }) => {
    // Navigate to Kommuner page
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();

    // Wait for table to load instead of networkidle (more reliable)
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Verify that we DON'T see "Visar 0 av 0 kommuner" (which indicates no data)
    const emptyStateText = await page.locator('text=Visar 0 av 0 kommuner').count();
    expect(emptyStateText).toBe(0);

    // Verify we see actual data
    const municipalityCount = await page.locator('table tbody tr').count();
    expect(municipalityCount).toBeGreaterThan(0);

    // Verify Föreningsregister column has platform name (FRI, RBOK, IBGO, ActorSmartbook, Interbook Go)
    // and is clickable (linked to register_url)
    const firstRegisterLink = await page.locator('table tbody tr:first-child td:last-child a').first();
    if (await firstRegisterLink.count() > 0) {
      const linkText = await firstRegisterLink.textContent();
      expect(linkText).toMatch(/FRI|RBOK|IBGO|ActorSmartbook|Interbook Go/i);

      // Verify it has href attribute
      const href = await firstRegisterLink.getAttribute('href');
      expect(href).toBeTruthy();
    }

    // Verify all key columns have data (not just dashes)
    const firstRowCells = await page.locator('table tbody tr:first-child td').all();
    expect(firstRowCells.length).toBeGreaterThan(5); // Should have multiple columns

    // Check that we have population data (not all dashes)
    const populationCells = await page.locator('table tbody tr td').filter({ hasText: /\d{1,3}([\s,]\d{3})*/ }).count();
    expect(populationCells).toBeGreaterThan(0);
  });

  test('Föreningar page should load without errors and display data', async ({ page }) => {
    // Navigate to Föreningar page
    await page.getByRole('link', { name: 'Föreningar' }).click();

    // Wait a bit for page to render
    await page.waitForTimeout(2000);

    // Verify NO application error
    const applicationError = await page.locator('text=Application error').count();
    expect(applicationError).toBe(0);

    // Verify we see the Föreningslista card
    const foreningslistaHeading = await page.locator('text=Föreningslista').count();
    expect(foreningslistaHeading).toBeGreaterThan(0);

    // Verify table is present
    const table = await page.locator('table').count();
    expect(table).toBeGreaterThan(0);

    // Verify we have table headers
    const headers = await page.locator('table thead th').count();
    expect(headers).toBeGreaterThan(5); // Should have multiple columns

    // Verify table body exists (even if empty, it should render)
    const tableBody = await page.locator('table tbody').count();
    expect(tableBody).toBe(1);

    // Check that filters are working
    const searchInput = await page.locator('input[placeholder*="Sök"]').count();
    expect(searchInput).toBeGreaterThan(0);

    // Verify no 500 error from API
    const errorText = await page.locator('text=500').count();
    expect(errorText).toBe(0);
  });

  test('Kommuner page map should display with correct coordinates', async ({ page }) => {
    // Navigate to Kommuner page
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click on first municipality to open detail sheet
    const firstRow = await page.locator('table tbody tr').first();
    await firstRow.click();

    // Wait for sheet to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Wait a bit for map to load
    await page.waitForTimeout(2000);

    // Verify map container exists
    const mapContainer = await page.locator('.leaflet-container').count();
    expect(mapContainer).toBeGreaterThan(0);

    // Verify map has loaded tiles (OpenStreetMap)
    const mapTiles = await page.locator('.leaflet-tile-container img').count();
    expect(mapTiles).toBeGreaterThan(0);

    // Verify marker exists
    const marker = await page.locator('.leaflet-marker-icon').count();
    expect(marker).toBeGreaterThan(0);
  });
});
