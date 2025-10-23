import { chromium } from 'playwright';

async function testPagination() {
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

    // Check for next button
    console.log('\n=== Checking for next button ===');

    const strategies = [
      { name: 'button:has-text("Go to the next page")', locator: page.locator('button:has-text("Go to the next page")') },
      { name: 'button:has-text("next")', locator: page.locator('button:has-text("next")') },
      { name: '[aria-label*="next" i]', locator: page.locator('[aria-label*="next" i]') },
      { name: 'button containing "next" (case insensitive)', locator: page.locator('button', { hasText: /next/i }) }
    ];

    for (const strategy of strategies) {
      const count = await strategy.locator.count();
      console.log(`\n${strategy.name}: ${count} found`);

      if (count > 0) {
        for (let i = 0; i < Math.min(3, count); i++) {
          const el = strategy.locator.nth(i);
          const text = await el.textContent();
          const isDisabled = await el.isDisabled();
          const ariaLabel = await el.getAttribute('aria-label');
          console.log(`  [${i}] Text: "${text?.trim()}" | Disabled: ${isDisabled} | aria-label: "${ariaLabel}"`);
        }
      }
    }

    // Check page footer for pagination info
    console.log('\n=== Checking page footer ===');
    const footerText = await page.locator('footer, [class*="pagination"], [class*="pager"]').allTextContents();
    console.log('Footer texts:', footerText);

    // Try to find the exact button
    console.log('\n=== Looking for button with specific text ===');
    const exactButton = page.getByRole('button', { name: /next/i });
    const exactCount = await exactButton.count();
    console.log(`Buttons with 'next' in name: ${exactCount}`);

    if (exactCount > 0) {
      const text = await exactButton.first().textContent();
      const isDisabled = await exactButton.first().isDisabled();
      console.log(`First one: "${text}" | Disabled: ${isDisabled}`);
    }

    console.log('\nWaiting 30s for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testPagination().catch(console.error);
