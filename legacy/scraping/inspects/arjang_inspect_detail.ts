import { chromium } from 'playwright';

async function inspectDetailPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1760, height: 1256 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to list page...');
    await page.goto('https://fri.arjang.se/FORENING/default.aspx');
    await page.waitForSelector('table.compact-table', { state: 'visible' });

    console.log('Clicking on first association...');
    await page.getByRole('link', { name: 'Anhörigförening i Årjängs' }).click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('\n=== PAGE TITLE ===');
    const title = await page.title();
    console.log(title);

    console.log('\n=== ALL HEADINGS ===');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    headings.forEach((h, i) => console.log(`[${i}] ${h}`));

    console.log('\n=== ALL TABLES ===');
    const tables = await page.locator('table').all();
    console.log(`Found ${tables.length} tables`);

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      console.log(`\n--- Table ${i} ---`);
      const className = await table.getAttribute('class');
      console.log(`Class: ${className}`);

      const rows = await table.locator('tr').all();
      console.log(`Rows: ${rows.length}`);

      for (let j = 0; j < Math.min(rows.length, 5); j++) {
        const row = rows[j];
        const cells = await row.locator('th, td').allTextContents();
        console.log(`  Row ${j}: ${cells.join(' | ')}`);
      }
    }

    console.log('\n=== SECTION DIVS ===');
    const sections = await page.locator('div[class*="section"], div[class*="info"], div[class*="detail"]').all();
    console.log(`Found ${sections.length} section divs`);

    for (let i = 0; i < Math.min(sections.length, 5); i++) {
      const section = sections[i];
      const className = await section.getAttribute('class');
      const text = await section.textContent();
      console.log(`\nSection ${i} (${className}):`);
      console.log(text?.substring(0, 200));
    }

    console.log('\n=== MAIN CONTENT OUTERHTML (first 3000 chars) ===');
    const mainContent = await page.locator('body').innerHTML();
    console.log(mainContent.substring(0, 3000));

    console.log('\n\nPress any key to close...');
    await page.waitForTimeout(60000); // Wait 1 minute for inspection

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectDetailPage();
