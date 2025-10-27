import { chromium } from 'playwright';

/**
 * Test the "Catalog" and "Catalog (compact mode)" presentation options
 */

async function testCatalogMode() {
  console.log('Testing FRI Catalog mode...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const baseUrl = 'https://fri.fagersta.se/forening/';
    console.log(`Navigating to: ${baseUrl}`);

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 1: Select "Selection" in searchMethod
    console.log('\n=== Step 1: Selecting "Selection" in searchMethod ===');
    await page.locator('#searchMethod').selectOption('Selection');
    await page.waitForTimeout(1000);

    // Step 2: Select "Catalog" in ForeningVal
    console.log('\n=== Step 2: Selecting "Catalog" in ForeningVal ===');
    await page.locator('#ForeningVal').selectOption({ label: 'Catalog' });
    await page.waitForTimeout(2000);

    // Check if there's a search/submit button
    const searchButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Sök")').first();
    const buttonExists = await searchButton.count();

    if (buttonExists > 0) {
      console.log('\n=== Clicking search button ===');
      await searchButton.click();
      await page.waitForTimeout(3000);
    }

    // Check the current URL
    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);

    // Analyze the page content
    console.log('\n=== Analyzing catalog view ===');

    // Look for associations
    const bodyText = await page.locator('body').textContent() || '';
    const bodyLength = bodyText.length;
    console.log(`Body text length: ${bodyLength} characters`);

    // Look for detailed fields in the HTML
    const html = await page.content();
    const hasOrgNumber = html.match(/(?:Organisationsnummer|Org\.nr)/gi)?.length || 0;
    const hasAddress = html.match(/(?:Adress|Address)/gi)?.length || 0;
    const hasContact = html.match(/(?:Kontaktperson|Contact)/gi)?.length || 0;
    const hasEmail = html.match(/(?:E-postadress|E-post|Email)/gi)?.length || 0;
    const hasPhone = html.match(/(?:Telefon|Mobile|Mobil)/gi)?.length || 0;

    console.log(`\nDetailed fields found in HTML:`);
    console.log(`  Organisationsnummer: ${hasOrgNumber} occurrences`);
    console.log(`  Address: ${hasAddress} occurrences`);
    console.log(`  Contact person: ${hasContact} occurrences`);
    console.log(`  Email: ${hasEmail} occurrences`);
    console.log(`  Phone: ${hasPhone} occurrences`);

    // Check for tables
    const tables = await page.locator('table').count();
    console.log(`\nTables found: ${tables}`);

    // Check for pagination
    const hasPagination = bodyText.includes('Page ') || bodyText.includes('Sida ') ||
                          bodyText.includes('Next') || bodyText.includes('Nästa');
    console.log(`Pagination detected: ${hasPagination}`);

    // Get a sample of visible text to see structure
    const firstAssociation = await page.locator('.association, .forening, [class*="catalog"]').first().textContent().catch(() => 'Not found');
    console.log(`\nFirst association sample:\n${firstAssociation.substring(0, 500)}`);

    // Take screenshot
    await page.screenshot({ path: 'E:\\projects\\CRM\\scraping\\json\\test_fri_catalog.png', fullPage: true });
    console.log('\nScreenshot saved to: scraping/json/test_fri_catalog.png');

    // Save HTML for inspection
    const fs = require('fs');
    fs.writeFileSync('E:\\projects\\CRM\\scraping\\json\\test_fri_catalog.html', html);
    console.log('HTML saved to: scraping/json/test_fri_catalog.html');

    console.log('\n\n=== Now testing "Catalog (compact mode)" ===');

    // Go back and try compact mode
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.locator('#searchMethod').selectOption('Selection');
    await page.waitForTimeout(1000);

    await page.locator('#ForeningVal').selectOption({ label: 'Catalog (compact mode)' });
    await page.waitForTimeout(2000);

    if (buttonExists > 0) {
      await searchButton.click();
      await page.waitForTimeout(3000);
    }

    const compactUrl = page.url();
    console.log(`\nCompact mode URL: ${compactUrl}`);

    const compactHtml = await page.content();
    const compactHasOrgNumber = compactHtml.match(/(?:Organisationsnummer|Org\.nr)/gi)?.length || 0;
    const compactHasAddress = compactHtml.match(/(?:Adress|Address)/gi)?.length || 0;

    console.log(`\nCompact mode - Detailed fields:`);
    console.log(`  Organisationsnummer: ${compactHasOrgNumber} occurrences`);
    console.log(`  Address: ${compactHasAddress} occurrences`);

    await page.screenshot({ path: 'E:\\projects\\CRM\\scraping\\json\\test_fri_catalog_compact.png', fullPage: true });
    console.log('Screenshot saved to: scraping/json/test_fri_catalog_compact.png');

    fs.writeFileSync('E:\\projects\\CRM\\scraping\\json\\test_fri_catalog_compact.html', compactHtml);
    console.log('HTML saved to: scraping/json/test_fri_catalog_compact.html');

    console.log('\n\nBrowser will stay open for manual inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testCatalogMode().catch(console.error);
