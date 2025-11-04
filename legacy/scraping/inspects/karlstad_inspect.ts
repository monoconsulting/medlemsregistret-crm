import { chromium } from 'playwright';

async function inspect() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Karlstad...');
    await page.goto('https://karlstad.rbok.se/foreningsregister');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Get body text sample
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length);
    console.log('First 500 chars:', bodyText?.substring(0, 500));

    // Check for common elements
    const tables = await page.locator('table').count();
    console.log('Tables found:', tables);

    const links = await page.locator('a').count();
    console.log('Links found:', links);

    // Get all link texts
    const allLinks = page.locator('a');
    const linkCount = await allLinks.count();
    console.log('\nFirst 20 links:');
    for (let i = 0; i < Math.min(20, linkCount); i++) {
      const linkText = await allLinks.nth(i).textContent();
      const href = await allLinks.nth(i).getAttribute('href');
      console.log(`  ${i}: "${linkText}" -> ${href}`);
    }

    // Check for buttons
    const buttons = await page.locator('button').count();
    console.log('\nButtons found:', buttons);

    // Get page HTML structure
    const html = await page.content();
    console.log('\nHTML length:', html.length);

    console.log('\nPress Ctrl+C to exit, or wait 60 seconds to auto-close...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspect().catch(console.error);
