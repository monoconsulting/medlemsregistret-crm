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

    // Look for the table
    console.log('\n=== Looking for table structure ===');
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log('Table rows found:', rowCount);

    if (rowCount > 0) {
      console.log('\nFirst 5 rows:');
      for (let i = 0; i < Math.min(5, rowCount); i++) {
        const row = rows.nth(i);
        const cells = row.locator('td');
        const cellCount = await cells.count();
        console.log(`\nRow ${i} (${cellCount} cells):`);

        for (let j = 0; j < cellCount; j++) {
          const cellText = await cells.nth(j).textContent();
          const cellHtml = await cells.nth(j).innerHTML();
          console.log(`  Cell ${j}: "${cellText?.trim()}"`);

          // Check for buttons in the cell
          const buttons = cells.nth(j).locator('button');
          const buttonCount = await buttons.count();
          if (buttonCount > 0) {
            console.log(`    Contains ${buttonCount} button(s)`);
            const buttonText = await buttons.first().textContent();
            const ariaLabel = await buttons.first().getAttribute('aria-label');
            console.log(`    Button text: "${buttonText?.trim()}"`);
            console.log(`    Button aria-label: "${ariaLabel}"`);
          }
        }
      }

      // Try clicking the first button to open modal
      console.log('\n=== Trying to open first modal ===');
      const firstRowButton = rows.nth(0).locator('button').first();
      const firstRowButtonCount = await firstRowButton.count();

      if (firstRowButtonCount > 0) {
        const buttonText = await firstRowButton.textContent();
        console.log('Clicking button:', buttonText);

        await firstRowButton.click();
        await page.waitForTimeout(2000);

        // Check for modals/dialogs
        const dialogs = page.locator('[role="dialog"]');
        const dialogCount = await dialogs.count();
        console.log('Dialogs found:', dialogCount);

        if (dialogCount > 0) {
          const dialogText = await dialogs.first().textContent();
          console.log('Dialog content (first 1000 chars):');
          console.log(dialogText?.substring(0, 1000));

          // Look for close button
          const closeButtons = dialogs.first().locator('button:has-text("Close"), button:has-text("Stäng")');
          const closeCount = await closeButtons.count();
          console.log('Close buttons found:', closeCount);

          if (closeCount > 0) {
            console.log('Closing dialog...');
            await closeButtons.first().click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }

    // Check for pagination
    console.log('\n=== Checking pagination ===');
    const nextButtons = page.locator('button:has-text("Next"), a:has-text("Next")');
    const nextCount = await nextButtons.count();
    console.log('Next buttons found:', nextCount);

    if (nextCount > 0) {
      const nextText = await nextButtons.first().textContent();
      const isDisabled = await nextButtons.first().isDisabled();
      console.log('Next button text:', nextText);
      console.log('Is disabled:', isDisabled);
    }

    console.log('\nWaiting for manual inspection... Press Ctrl+C when done');
    await page.waitForTimeout(120000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspect().catch(console.error);
