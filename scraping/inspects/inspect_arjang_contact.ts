import { chromium } from 'playwright';

async function inspectContactTable() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1760, height: 1256 }
  });
  const page = await context.newPage();

  try {
    // Visit Bufff Värmland detail page
    console.log('Visiting Bufff Värmland detail page...');
    await page.goto('https://fri.arjang.se/FORENING/visa.aspx?id=BUFFF');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Find all tables
    const tables = page.locator('table.compact-table, table.clean');
    const tableCount = await tables.count();
    console.log(`\nFound ${tableCount} tables\n`);

    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      console.log(`\n=== TABLE ${i} ===`);

      // Get all rows
      const rows = table.locator('tr');
      const rowCount = await rows.count();

      for (let j = 0; j < rowCount; j++) {
        const row = rows.nth(j);
        const cells = row.locator('th, td');
        const cellCount = await cells.count();

        const cellContents: string[] = [];
        for (let k = 0; k < cellCount; k++) {
          const cell = cells.nth(k);
          const tagName = await cell.evaluate(el => el.tagName);
          const text = (await cell.textContent())?.trim() || '';
          cellContents.push(`<${tagName}>${text}</${tagName}>`);
        }

        console.log(`  Row ${j}: ${cellContents.join(' | ')}`);
      }
    }

    console.log('\n\nPress Ctrl+C to close...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectContactTable().catch(console.error);
