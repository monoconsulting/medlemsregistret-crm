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

    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log('Table rows found:', rowCount);

    if (rowCount > 0) {
      console.log('\n=== Inspecting first row in detail ===');
      const firstRow = rows.nth(0);
      const cells = firstRow.locator('td');

      // Check each cell for interactive elements
      for (let i = 0; i < 5; i++) {
        const cell = cells.nth(i);
        const cellHtml = await cell.innerHTML();
        console.log(`\n--- Cell ${i} HTML ---`);
        console.log(cellHtml.substring(0, 300));

        // Check for all clickable elements
        const clickables = cell.locator('button, a, [onclick]');
        const clickCount = await clickables.count();
        console.log(`Clickable elements: ${clickCount}`);

        if (clickCount > 0) {
          for (let j = 0; j < clickCount; j++) {
            const el = clickables.nth(j);
            const tagName = await el.evaluate(e => e.tagName);
            const text = await el.textContent();
            const ariaLabel = await el.getAttribute('aria-label');
            const title = await el.getAttribute('title');
            const role = await el.getAttribute('role');
            console.log(`  Element ${j}: <${tagName}>`);
            console.log(`    Text: "${text?.trim()}"`);
            console.log(`    aria-label: "${ariaLabel}"`);
            console.log(`    title: "${title}"`);
            console.log(`    role: "${role}"`);
          }
        }
      }

      // Try to find and click the info button
      console.log('\n=== Attempting to click info button ===');

      // Try different strategies to find the button
      const strategies = [
        { name: 'Button with aria-label containing "more information"', locator: firstRow.locator('button[aria-label*="more information" i]') },
        { name: 'Button with aria-label containing "information"', locator: firstRow.locator('button[aria-label*="information" i]') },
        { name: 'Button in first cell', locator: cells.nth(0).locator('button').first() },
        { name: 'Button in last cell', locator: cells.nth(4).locator('button').first() },
        { name: 'Any button in row', locator: firstRow.locator('button').first() }
      ];

      for (const strategy of strategies) {
        const count = await strategy.locator.count();
        if (count > 0) {
          console.log(`\nFound button using: ${strategy.name}`);
          const ariaLabel = await strategy.locator.getAttribute('aria-label');
          console.log(`  aria-label: "${ariaLabel}"`);

          console.log('Clicking button...');
          await strategy.locator.click();
          await page.waitForTimeout(2000);

          // Check for dialog
          const dialogs = page.locator('[role="dialog"]');
          const dialogCount = await dialogs.count();
          console.log(`Dialogs after click: ${dialogCount}`);

          if (dialogCount > 0) {
            console.log('SUCCESS! Dialog opened.');
            const dialogText = await dialogs.first().textContent();
            console.log('\nDialog content (first 2000 chars):');
            console.log(dialogText?.substring(0, 2000));

            // Find close button
            const closeBtn = dialogs.first().locator('button:has-text("Close"), button:has-text("Stäng")');
            const closeCount = await closeBtn.count();
            console.log(`\nClose buttons: ${closeCount}`);

            if (closeCount > 0) {
              await closeBtn.first().click();
              await page.waitForTimeout(1000);
              console.log('Dialog closed.');
            }
            break;
          } else {
            console.log('No dialog appeared.');
          }
        }
      }
    }

    console.log('\nWaiting 30s for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspect().catch(console.error);
