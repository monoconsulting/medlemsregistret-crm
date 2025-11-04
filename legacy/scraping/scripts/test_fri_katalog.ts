import { chromium } from 'playwright';

/**
 * Test script to inspect the FRI katalog.aspx view
 * Purpose: Verify that all association data is available on a single page
 */

async function testFriKatalog() {
  console.log('Starting FRI katalog.aspx inspection...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test URL: Fagersta
    const url = 'https://fri.fagersta.se/forening/katalog.aspx';
    console.log(`Navigating to: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for any dynamic content

    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check for main content
    const bodyText = await page.locator('body').textContent();
    console.log(`\nBody text length: ${bodyText?.length || 0} characters`);

    // Look for association entries
    const associations = await page.locator('.association, .forening, [class*="association"], [class*="forening"]').count();
    console.log(`\nAssociation elements found: ${associations}`);

    // Look for tables
    const tables = await page.locator('table').count();
    console.log(`Tables found: ${tables}`);

    // Get all table headers if any
    if (tables > 0) {
      const headers = await page.locator('table th, table td:first-child').allTextContents();
      console.log(`\nTable headers/first cells (first 20):`, headers.slice(0, 20));
    }

    // Look for divs that might contain associations
    const divs = await page.locator('div[class]').count();
    console.log(`\nDivs with class: ${divs}`);

    // Check for any links to detail pages
    const detailLinks = await page.locator('a[href*="forening"], a[href*="association"], a[href*="detail"]').count();
    console.log(`Detail links found: ${detailLinks}`);

    // Take a screenshot
    await page.screenshot({ path: 'E:\\projects\\CRM\\scraping\\json\\test_fri_katalog.png', fullPage: true });
    console.log('\nScreenshot saved to: scraping/json/test_fri_katalog.png');

    // Get HTML structure (first 5000 chars)
    const html = await page.content();
    console.log(`\nHTML snippet (first 2000 chars):\n${html.substring(0, 2000)}`);

    // Wait for user to inspect
    console.log('\n\nBrowser will stay open for manual inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(300000); // Wait 5 minutes

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testFriKatalog().catch(console.error);
