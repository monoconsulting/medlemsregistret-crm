import { chromium } from 'playwright';

async function inspectPagination() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Älvdalen Actor Smartbook...');
    await page.goto('https://alvdalen.actorsmartbook.se/Associations.aspx');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== INSPECTING PAGINATION ===\n');

    // Look for pagination controls
    const paginationText = await page.locator('body').textContent();
    console.log('\nSearching for pagination info in page text...\n');

    // Look for patterns like "1 / 10" or "Sida 1 av 10" or similar
    const patterns = [
      /(\d+)\s*\/\s*(\d+)/,  // "1 / 10"
      /(\d+)\s+av\s+(\d+)/i,  // "1 av 10"
      /sida\s+(\d+)\s+av\s+(\d+)/i,  // "Sida 1 av 10"
      /page\s+(\d+)\s+of\s+(\d+)/i,  // "Page 1 of 10"
    ];

    for (const pattern of patterns) {
      const match = paginationText?.match(pattern);
      if (match) {
        console.log(`Found pagination pattern: "${match[0]}"`);
        console.log(`Current page: ${match[1]}, Total pages: ${match[2]}`);
      }
    }

    // Look for pagination buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`\nFound ${buttonCount} buttons on page`);

    // Check for specific pagination buttons
    const forstaButton = page.getByRole('button', { name: 'Första' });
    const forraButton = page.getByRole('button', { name: 'Förra' });
    const nastaButton = page.getByRole('button', { name: 'Nästa' });
    const sistaButton = page.getByRole('button', { name: 'Sista' });

    console.log('\nPagination buttons:');
    console.log(`  Första: ${await forstaButton.count()}`);
    console.log(`  Förra: ${await forraButton.count()}`);
    console.log(`  Nästa: ${await nastaButton.count()}`);
    console.log(`  Sista: ${await sistaButton.count()}`);

    // Check if Nästa is enabled
    if (await nastaButton.count() > 0) {
      const isDisabled = await nastaButton.isDisabled();
      console.log(`  Nästa is disabled: ${isDisabled}`);
    }

    // Look for any element that might contain page info
    const pageInfoElements = page.locator('text=/\\d+\\s*\\/\\s*\\d+|\\d+\\s+av\\s+\\d+/i');
    const pageInfoCount = await pageInfoElements.count();
    console.log(`\nFound ${pageInfoCount} elements with page info pattern`);

    for (let i = 0; i < Math.min(pageInfoCount, 5); i++) {
      const text = await pageInfoElements.nth(i).textContent();
      console.log(`  Element ${i}: "${text?.trim()}"`);
    }

    // Click Sista button to see what happens
    if (await sistaButton.count() > 0) {
      console.log('\n--- Clicking "Sista" button ---');
      await sistaButton.click();
      await page.waitForTimeout(2000);

      // Check page info again
      const newPageText = await page.locator('body').textContent();
      for (const pattern of patterns) {
        const match = newPageText?.match(pattern);
        if (match) {
          console.log(`After clicking Sista: "${match[0]}"`);
          console.log(`Current page: ${match[1]}, Total pages: ${match[2]}`);
        }
      }

      // Count associations on last page
      const infoButtons = page.getByRole('button', { name: 'Info' });
      const infoCount = await infoButtons.count();
      console.log(`Associations on last page: ${infoCount}`);
    }

    // Keep browser open
    console.log('\n\nBrowser will stay open. Press Ctrl+C to close.');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectPagination().catch(console.error);
