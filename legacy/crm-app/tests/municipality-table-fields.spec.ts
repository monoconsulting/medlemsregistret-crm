import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test.describe('Municipality Table Fields Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/municipalities');
  });

  test('should display all required municipality fields in the table', async ({ page }) => {
    // Vänta på att tabellen ska laddas
    await page.waitForSelector('table', { timeout: 10000 });

    // Verifiera att tabellhuvuden finns
    const expectedHeaders = [
      'Kommun',           // Municipality name
      'Kod',              // Municipality code (4-digit)
      'Län',              // County
      'Länskod',          // County code (2-digit)
      'Landskap',         // Province
      'Befolkning',       // Population
      'Plattform',        // Platform
      'Status'            // Register status
    ];

    for (const header of expectedHeaders) {
      const headerElement = page.getByRole('columnheader', { name: header });
      await expect(headerElement).toBeVisible({
        timeout: 5000
      });
    }
  });

  test('should display formatted codes for municipalities', async ({ page }) => {
    // Vänta på att tabellen ska laddas
    await page.waitForSelector('table', { timeout: 10000 });

    // Test Stockholm (should have code 0180 and county code 01)
    const stockholmRow = page.getByRole('row').filter({ hasText: 'Stockholm' });

    // Verifiera att raden finns
    await expect(stockholmRow).toBeVisible();

    // Verifiera 4-ställig stadskod (0180)
    await expect(stockholmRow.getByText('0180')).toBeVisible();

    // Verifiera 2-ställig länskod (01)
    await expect(stockholmRow.getByText(/^01$/)).toBeVisible();
  });

  test('should display all data fields for a municipality with complete data', async ({ page }) => {
    // Klicka på Arboga (har status "Klar")
    await page.getByRole('link', { name: 'Arboga' }).click();

    // Vänta på detaljsidan
    await page.waitForLoadState('networkidle');

    // Verifiera att alla fält visas på detaljsidan
    const expectedFields = [
      { label: 'Kommun', pattern: /Arboga/i },
      { label: 'Kod', pattern: /1984/ },              // 4-ställig stadskod
      { label: 'Länskod', pattern: /19/ },            // 2-ställig länskod
      { label: 'Län', pattern: /Västmanlands län/i },
      { label: 'Landskap', pattern: /Västmanland/i },
      { label: 'Befolkning', pattern: /\d+/ },        // Något tal
      { label: 'Plattform', pattern: /.*/ },          // Kan vara tom
      { label: 'Status', pattern: /Klar/i }
    ];

    for (const field of expectedFields) {
      // Antag att fält visas som "Label: Value" format eller i en tabell
      const fieldElement = page.locator(`text=${field.label}`);
      await expect(fieldElement).toBeVisible();
    }
  });

  test('should show platform information for municipalities with platform', async ({ page }) => {
    // Filtrera eller hitta en kommun med plattform (t.ex. Falun med Actors Smartbook)
    const falunRow = page.getByRole('row').filter({ hasText: 'Falun' });

    await expect(falunRow).toBeVisible();

    // Verifiera att plattformen visas
    await expect(falunRow.getByText('Actors Smartbook')).toBeVisible();
  });

  test('should verify municipality with all fields populated', async ({ page }) => {
    // Test Gävle som har både plattform och status
    const gavleRow = page.getByRole('row').filter({ hasText: 'Gävle' });

    await expect(gavleRow).toBeVisible();

    // Verifiera alla fält
    await expect(gavleRow.getByText('2180')).toBeVisible();     // 4-ställig kod
    await expect(gavleRow.getByText(/^21$/)).toBeVisible();     // 2-ställig länskod
    await expect(gavleRow.getByText('Gävleborgs län')).toBeVisible();
    await expect(gavleRow.getByText('Gästrikland')).toBeVisible();
    await expect(gavleRow.getByText('FRI')).toBeVisible();      // Platform
    await expect(gavleRow.getByText('Klar')).toBeVisible();     // Status
  });

  test('should verify total number of municipalities', async ({ page }) => {
    // Vänta på att tabellen ska laddas
    await page.waitForSelector('table', { timeout: 10000 });

    // Räkna antal rader (exkluderar header)
    const rows = page.getByRole('row').filter({ hasNotText: 'Kommun' }); // Exkluderar header-rad

    const count = await rows.count();

    // Vi har 289 kommuner
    expect(count).toBeGreaterThanOrEqual(289);
  });

  test('should verify code format consistency', async ({ page }) => {
    // Vänta på att tabellen ska laddas
    await page.waitForSelector('table', { timeout: 10000 });

    // Testa flera kommuner för att säkerställa konsistent formatering
    const testCases = [
      { name: 'Stockholm', code: '0180', countyCode: '01' },
      { name: 'Göteborg', code: '1480', countyCode: '14' },
      { name: 'Malmö', code: '1280', countyCode: '12' },
      { name: 'Karlstad', code: '1780', countyCode: '17' },
      { name: 'Älvdalen', code: '2039', countyCode: '20' }
    ];

    for (const testCase of testCases) {
      const row = page.getByRole('row').filter({ hasText: testCase.name });
      await expect(row).toBeVisible();

      // Verifiera 4-ställig stadskod
      await expect(row.getByText(testCase.code)).toBeVisible();

      // Verifiera 2-ställig länskod
      const countyCodePattern = new RegExp(`^${testCase.countyCode}$`);
      await expect(row.getByText(countyCodePattern)).toBeVisible();
    }
  });

  test('should handle municipalities without platform or status', async ({ page }) => {
    // Hitta en kommun utan plattform (t.ex. Karlshamn)
    const karlshamnRow = page.getByRole('row').filter({ hasText: 'Karlshamn' });

    await expect(karlshamnRow).toBeVisible();

    // Verifiera att grundläggande fält finns
    await expect(karlshamnRow.getByText('1082')).toBeVisible();     // Kod
    await expect(karlshamnRow.getByText(/^10$/)).toBeVisible();     // Länskod
    await expect(karlshamnRow.getByText('Blekinge län')).toBeVisible();
    await expect(karlshamnRow.getByText('Blekinge')).toBeVisible(); // Landskap
  });

  test('should display population data', async ({ page }) => {
    // Verifiera att befolkningsdata visas för Stockholm (största)
    const stockholmRow = page.getByRole('row').filter({ hasText: 'Stockholm' });

    await expect(stockholmRow).toBeVisible();

    // Stockholm har över 2 miljoner invånare
    // Verifiera att något befolkningstal visas
    const populationText = await stockholmRow.locator('td').filter({ hasText: /\d{3,}/ }).first();
    await expect(populationText).toBeVisible();
  });
});
