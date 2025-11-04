import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Söderhamn...');
    await page.goto('https://soderhamn.rbok.se/foreningsregister');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Step 1: Handle cookie banner
    console.log('\n=== STEP 1: Handling Cookie Banner ===');
    try {
      // Look for common cookie banner selectors
      const cookieSelectors = [
        'button:has-text("Godkänn")',
        'button:has-text("Acceptera")',
        'button:has-text("Accept")',
        'button:has-text("OK")',
        '.eupopup-button',
        '#cookie-accept',
        '[id*="cookie"] button',
        '[class*="cookie"] button'
      ];

      let cookieDismissed = false;
      for (const selector of cookieSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.count() > 0 && await button.isVisible()) {
            console.log(`Found cookie button with selector: ${selector}`);
            await button.click();
            await page.waitForTimeout(500);
            console.log('✓ Cookie banner dismissed');
            cookieDismissed = true;
            break;
          }
        } catch {}
      }
      if (!cookieDismissed) {
        console.log('No cookie banner found (or already dismissed)');
      }
    } catch (error) {
      console.log('No cookie banner to dismiss');
    }

    await page.screenshot({ path: 'scraping/out/soderhamn_after_cookies.png' });

    // Close any existing modals first
    console.log('\n=== Closing any existing modals ===');
    for (let attempt = 0; attempt < 10; attempt++) {
      const existingModals = await page.locator('[role="dialog"][aria-modal="true"]').count();
      if (existingModals === 0) {
        console.log('No existing modals found');
        break;
      }
      console.log(`Found ${existingModals} existing modals, closing them...`);
      // Press Escape multiple times
      for (let i = 0; i < existingModals; i++) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    }

    // Step 2: Analyze table structure
    console.log('\n=== STEP 2: Analyzing Table Structure ===');
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`Found ${rowCount} associations on page 1`);

    if (rowCount > 0) {
      const firstRow = rows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      console.log(`Table has ${cellCount} columns`);

      for (let i = 0; i < cellCount; i++) {
        const cellText = await cells.nth(i).textContent();
        console.log(`  Column ${i}: "${cellText?.trim().substring(0, 50)}..."`);
      }
    }

    // Step 3: Test modal opening with first association
    console.log('\n=== STEP 3: Testing Modal Opening/Closing ===');

    for (let i = 0; i < Math.min(3, rowCount); i++) {
      console.log(`\n--- Association ${i + 1} ---`);

      // Re-query rows to avoid stale elements
      const currentRows = table.locator('tbody tr');
      const row = currentRows.nth(i);
      const cells = row.locator('td');

      // Get association name
      const nameCell = cells.nth(1);
      const name = await nameCell.textContent();
      console.log(`Name: ${name?.trim()}`);

      // Look for info link - use the first "Show more information about" link
      const infoLink = row.getByRole('link', { name: /Show more information about/i }).first();
      const linkCount = await infoLink.count();

      if (linkCount === 0) {
        console.log('  ⚠ No info link found');
        continue;
      }

      console.log('  Clicking info link...');
      await infoLink.click();
      await page.waitForTimeout(1000);

      // Check for modal
      const modal = page.locator('[role="dialog"][aria-modal="true"]');
      const modalCount = await modal.count();
      console.log(`  Modals open: ${modalCount}`);

      if (modalCount > 0) {
        // Extract modal text
        const modalText = await modal.first().textContent();
        console.log(`  Modal text (first 200 chars): ${modalText?.substring(0, 200)}...`);

        // Try to find org number
        const orgMatch = modalText?.match(/\b(\d{6}-\d{4})\b/);
        if (orgMatch) {
          console.log(`  ✓ Found org number: ${orgMatch[1]}`);
        }

        // Try to find email
        const emailMatch = modalText?.match(/[\w\.-]+@[\w\.-]+\.\w+/);
        if (emailMatch) {
          console.log(`  ✓ Found email: ${emailMatch[0]}`);
        }

        await page.screenshot({ path: `scraping/out/soderhamn_modal_${i + 1}.png` });

        // Close modal - click the X button in top right corner
        console.log('  Closing modal with X button...');
        let modalClosed = false;
        const initialModals = modalCount;

        // Strategy 1: Click X button (close icon) in the modal header - try various selectors
        const closeSelectors = [
          '.modal-header button.close',
          '.modal-header .close',
          'button.btn-close',
          '[data-dismiss="modal"]',
          '.modal button[aria-label="Close"]',
          '.dialog-close',
          'button.dialog-close'
        ];

        for (const selector of closeSelectors) {
          try {
            const closeBtn = modal.first().locator(selector);
            if (await closeBtn.count() > 0) {
              console.log(`  Trying selector: ${selector}`);
              await closeBtn.click({ timeout: 2000 });
              await page.waitForTimeout(300);
              const remainingModals = await page.locator('[role="dialog"][aria-modal="true"]').count();
              if (remainingModals < initialModals) {
                console.log(`  ✓ Modal closed with ${selector} - remaining: ${remainingModals}`);
                modalClosed = true;
                break;
              }
            }
          } catch (error) {
            // Try next selector
          }
        }

        // Strategy 2: Use the getByLabel + getByText method from template
        if (!modalClosed) {
          try {
            const specificModal = page.getByLabel(name?.trim() || '', { exact: true });
            const closeText = specificModal.getByText('Close');
            if (await closeText.count() > 0) {
              console.log('  Trying getByLabel().getByText("Close")');
              await closeText.click({ timeout: 2000 });
              await page.waitForTimeout(300);
              const remainingModals = await page.locator('[role="dialog"][aria-modal="true"]').count();
              if (remainingModals < initialModals) {
                console.log(`  ✓ Modal closed - remaining: ${remainingModals}`);
                modalClosed = true;
              }
            }
          } catch (error) {
            console.log(`  getByLabel failed: ${error}`);
          }
        }

        if (!modalClosed) {
          const remainingModals = await page.locator('[role="dialog"][aria-modal="true"]').count();
          console.log(`  ⚠ Modal NOT closed! Still have: ${remainingModals} modals`);
        }
      } else {
        console.log('  ⚠ Modal did not open');
      }

      await page.waitForTimeout(500);
    }

    // Step 4: Test pagination
    console.log('\n=== STEP 4: Testing Pagination ===');

    // Check for page indicator
    const bodyText = await page.locator('body').textContent();
    const pageMatch = bodyText?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
    if (pageMatch) {
      console.log(`Current page: ${pageMatch[1]} of ${pageMatch[2]}`);
    }

    // Check Next button
    const nextButton = page.getByRole('link', { name: 'Next' });
    const nextCount = await nextButton.count();
    console.log(`Next button found: ${nextCount > 0}`);

    if (nextCount > 0) {
      const isNextDisabled = await nextButton.evaluate((el) => {
        return el.hasAttribute('disabled') ||
               el.getAttribute('aria-disabled') === 'true' ||
               el.classList.contains('disabled');
      });
      console.log(`Next button disabled: ${isNextDisabled}`);

      if (!isNextDisabled) {
        console.log('Clicking Next...');
        await nextButton.click();
        await page.waitForTimeout(1000);

        const bodyText2 = await page.locator('body').textContent();
        const pageMatch2 = bodyText2?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
        if (pageMatch2) {
          console.log(`Now on page: ${pageMatch2[1]} of ${pageMatch2[2]}`);
        }
      }
    }

    // Check Last button
    const lastButton = page.getByRole('link', { name: 'Last' });
    if (await lastButton.count() > 0) {
      console.log('Clicking Last...');
      await lastButton.click();
      await page.waitForTimeout(1000);

      const bodyText3 = await page.locator('body').textContent();
      const pageMatch3 = bodyText3?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
      if (pageMatch3) {
        console.log(`Last page: ${pageMatch3[1]} of ${pageMatch3[2]}`);
      }

      await page.screenshot({ path: 'scraping/out/soderhamn_last_page.png' });
    }

    console.log('\n=== Inspection Complete ===');
    console.log('Press Ctrl+C to close browser');

    // Keep browser open
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
