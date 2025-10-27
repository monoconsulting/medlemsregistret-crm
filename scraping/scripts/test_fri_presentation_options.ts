import { chromium } from 'playwright';

/**
 * Test to find different presentation options in FRI
 * Looking for: "Typ av presentation", "föreningskatalog", etc.
 */

async function testPresentationOptions() {
  console.log('Testing FRI presentation options...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Start from the main page
    const baseUrl = 'https://fri.fagersta.se/forening/';
    console.log(`Navigating to: ${baseUrl}`);

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    // Look for presentation options
    const bodyText = await page.locator('body').textContent();

    console.log('\n=== Searching for presentation options ===');
    const hasPresentationType = bodyText?.includes('Typ av presentation') || bodyText?.includes('presentation');
    const hasKatalog = bodyText?.includes('katalog') || bodyText?.includes('Katalog');
    const hasUrval = bodyText?.includes('urval') || bodyText?.includes('Urval');

    console.log(`Contains "Typ av presentation": ${hasPresentationType}`);
    console.log(`Contains "katalog": ${hasKatalog}`);
    console.log(`Contains "urval": ${hasUrval}`);

    // Look for dropdowns/selects
    const selects = await page.locator('select').count();
    console.log(`\n=== Form elements ===`);
    console.log(`Select dropdowns found: ${selects}`);

    if (selects > 0) {
      for (let i = 0; i < selects; i++) {
        const select = page.locator('select').nth(i);
        const selectId = await select.getAttribute('id');
        const selectName = await select.getAttribute('name');
        const options = await select.locator('option').allTextContents();

        console.log(`\nSelect #${i + 1}:`);
        console.log(`  ID: ${selectId}`);
        console.log(`  Name: ${selectName}`);
        console.log(`  Options: ${options.join(', ')}`);
      }
    }

    // Look for radio buttons
    const radios = await page.locator('input[type="radio"]').count();
    console.log(`\nRadio buttons found: ${radios}`);

    if (radios > 0) {
      const radioLabels = await page.locator('label').allTextContents();
      console.log(`Radio labels: ${radioLabels.slice(0, 10).join(', ')}`);
    }

    // Check for different URL patterns
    console.log('\n=== Looking for catalog/list URLs ===');
    const links = await page.locator('a').all();
    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href && (href.includes('katalog') || href.includes('list') || href.includes('sok') || href.includes('urval'))) {
        console.log(`${text?.trim()}: ${href}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'E:\\projects\\CRM\\scraping\\json\\test_fri_main.png', fullPage: true });
    console.log('\nScreenshot saved');

    // Try to find and click on "Sökmetod" or similar
    const searchMethodButton = page.locator('text=Sökmetod, text=Search method').first();
    const searchMethodExists = await searchMethodButton.count();

    if (searchMethodExists > 0) {
      console.log('\n=== Found search method button, clicking ===');
      await searchMethodButton.click();
      await page.waitForTimeout(2000);

      const afterClickHtml = await page.content();
      console.log('Checking for new options after click...');
      console.log(`Contains "urval": ${afterClickHtml.includes('urval')}`);
      console.log(`Contains "katalog": ${afterClickHtml.includes('katalog')}`);
    }

    console.log('\n\nBrowser will stay open for manual inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testPresentationOptions().catch(console.error);
