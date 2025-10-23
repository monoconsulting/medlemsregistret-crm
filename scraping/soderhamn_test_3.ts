import { chromium } from 'playwright';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1760, height: 1256 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Söderhamn...');
    await page.goto('https://soderhamn.rbok.se/foreningsregister');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Dismiss cookie banner
    console.log('Dismissing cookie banner...');
    try {
      const cookieButton = page.locator('.eupopup-button').first();
      if (await cookieButton.count() > 0) {
        await cookieButton.click();
        await page.waitForTimeout(500);
        console.log('✓ Cookie banner dismissed');
      }
    } catch {
      console.log('No cookie banner found');
    }

    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');

    for (let i = 0; i < 3; i++) {
      console.log(`\n=== Processing association ${i + 1} ===`);

      // Re-query rows to avoid stale elements
      const currentRows = table.locator('tbody tr');
      const row = currentRows.nth(i);
      const cells = row.locator('td');

      // Get name
      const nameCell = cells.nth(1);
      const name = (await nameCell.textContent())?.trim() || '';
      console.log(`Name: ${name}`);

      // Click info link
      console.log('Clicking info link...');
      const infoLink = row.getByRole('link', { name: /Show more information about/i }).first();
      await infoLink.click();
      await delay(1000);

      // Wait for modal
      const modal = page.locator('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])').first();
      await modal.waitFor({ state: 'attached', timeout: 5000 });
      await delay(500);

      console.log('Modal opened, extracting data...');

      // Extract modal text
      const modalText = await modal.textContent();
      console.log(`\nModal text (first 500 chars):\n${modalText?.substring(0, 500)}\n`);

      // Extract structured data
      const descMatch = modalText?.match(/(?:^|[\r\n])((?:[^A-ZÅ][^\r\n]*[\r\n]?)+)(?=[\r\n](?:Areas|Contact|Adress|Hemsida))/);
      if (descMatch) {
        console.log(`Description: ${descMatch[1]?.trim().substring(0, 100)}`);
      }

      const areasMatch = modalText?.match(/Areas[\s\r\n]+([\w\såäöÅÄÖ,\s]+?)(?=[\r\n](?:Contact|Close|$))/i);
      if (areasMatch) {
        console.log(`Areas: ${areasMatch[1]?.trim()}`);
      }

      const contactSection = modalText?.match(/Contact([\s\S]+?)(?=Close|$)/i);
      if (contactSection) {
        const contactText = contactSection[1];

        const nameMatch = contactText.match(/[\r\n\s]([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)+)/);
        if (nameMatch) {
          console.log(`Contact name: ${nameMatch[1]?.trim()}`);
        }

        const phoneMatch = contactText.match(/\b(0\d{2,4}[\s\-]?\d{5,})\b/);
        if (phoneMatch) {
          console.log(`Phone: ${phoneMatch[1]?.trim()}`);
        }

        const emailMatch = contactText.match(/\b([\w\.-]+@[\w\.-]+\.\w+)\b/);
        if (emailMatch) {
          console.log(`Email: ${emailMatch[1]}`);
        }

        const urlMatch = contactText.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          console.log(`Homepage: ${urlMatch[1]}`);
        }
      }

      // Close modal using "Close" button (button at bottom, not X at top)
      console.log('\nClosing modal...');
      try {
        // Try clicking the "Close" button at the bottom of the modal
        const closeButton = modal.getByText('Close');
        if (await closeButton.count() > 0) {
          console.log('Found "Close" button');
          await closeButton.click();
          await delay(300);
        }
      } catch (error) {
        console.log(`Failed to click Close button: ${error}`);
        // Fallback: press Escape
        await page.keyboard.press('Escape');
        await delay(300);
      }

      console.log('Modal closed');
      await delay(500);
    }

    console.log('\n\n=== Test Complete ===');
    console.log('Press Ctrl+C to close browser');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
