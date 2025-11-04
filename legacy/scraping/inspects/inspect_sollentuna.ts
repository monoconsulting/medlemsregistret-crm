import { chromium } from 'playwright';

async function inspect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 3440, height: 1440 } });

  console.log('Navigating to Sollentuna...');
  await page.goto('https://boka.sollentuna.se/forening/');

  console.log('Waiting for page to load...');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Check what's on the page
  console.log('\n=== Page Title ===');
  console.log(await page.title());

  console.log('\n=== Looking for tables ===');
  const tables = await page.locator('table').all();
  console.log(`Found ${tables.length} tables`);

  for (let i = 0; i < tables.length; i++) {
    const className = await tables[i].getAttribute('class');
    const id = await tables[i].getAttribute('id');
    console.log(`Table ${i}: class="${className}", id="${id}"`);
  }

  console.log('\n=== Looking for association links ===');
  const links = await page.locator('a:has-text("Förening"), a:has-text("Association")').all();
  console.log(`Found ${links.length} association-like links`);

  console.log('\n=== Page content sample ===');
  const bodyText = await page.locator('body').textContent();
  console.log(bodyText?.substring(0, 500));

  console.log('\n\nPress Ctrl+C to close...');
  await page.waitForTimeout(60000);

  await browser.close();
}

inspect().catch(console.error);
