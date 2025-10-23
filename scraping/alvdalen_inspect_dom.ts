import { chromium } from 'playwright';

async function inspectDOM() {
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

    console.log('\n=== INSPECTING LIST PAGE ===\n');

    // Find Info buttons
    const infoButtons = page.getByRole('button', { name: 'Info' });
    const buttonCount = await infoButtons.count();
    console.log(`Found ${buttonCount} Info buttons on page`);

    if (buttonCount > 0) {
      console.log('\n--- Opening first association detail ---');
      await infoButtons.first().click();
      await page.waitForTimeout(1500);

      // Get all text from modal
      const modalContent = await page.locator('.modal-dialog, .modal-content, [role="dialog"]').first().textContent();
      console.log('\nModal content:\n', modalContent);

      // Try to extract specific fields
      console.log('\n--- Attempting to extract fields ---\n');

      // Get modal HTML structure
      const modalHTML = await page.locator('.modal-dialog, .modal-content, [role="dialog"]').first().innerHTML();
      console.log('\nModal HTML structure (first 1000 chars):\n', modalHTML.substring(0, 1000));

      // Look for all labels
      const labels = page.locator('.modal-dialog label, .modal-body label, .modal-content dt');
      const labelCount = await labels.count();
      console.log(`\nFound ${labelCount} labels in modal`);

      for (let i = 0; i < Math.min(labelCount, 20); i++) {
        const labelText = await labels.nth(i).textContent();
        console.log(`Label ${i}: "${labelText?.trim()}"`);
      }

      // Look for all links in modal
      const links = page.locator('.modal-dialog a, .modal-body a, .modal-content a');
      const linkCount = await links.count();
      console.log(`\nFound ${linkCount} links in modal`);

      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const linkText = await links.nth(i).textContent();
        const linkHref = await links.nth(i).getAttribute('href');
        console.log(`Link ${i}: Text="${linkText?.trim()}" Href="${linkHref}"`);
      }

      // Look for tables
      const tables = page.locator('.modal-dialog table, .modal-body table, .modal-content table');
      const tableCount = await tables.count();
      console.log(`\nFound ${tableCount} tables in modal`);

      if (tableCount > 0) {
        for (let i = 0; i < tableCount; i++) {
          console.log(`\n--- Table ${i} ---`);
          const tableHTML = await tables.nth(i).innerHTML();
          console.log(tableHTML.substring(0, 500));
        }
      }

      // Get all paragraphs
      const paragraphs = page.locator('.modal-dialog p, .modal-body p, .modal-content p');
      const pCount = await paragraphs.count();
      console.log(`\nFound ${pCount} paragraphs in modal`);

      for (let i = 0; i < Math.min(pCount, 5); i++) {
        const pText = await paragraphs.nth(i).textContent();
        console.log(`Paragraph ${i}: "${pText?.trim()}"`);
      }

      // Take a screenshot
      await page.screenshot({ path: 'scraping/out/alvdalen_modal_screenshot.png', fullPage: true });
      console.log('\nScreenshot saved to scraping/out/alvdalen_modal_screenshot.png');

      // Keep browser open for manual inspection
      console.log('\n\nBrowser will stay open for manual inspection. Press Ctrl+C to close.');
      await page.waitForTimeout(300000); // Wait 5 minutes
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

inspectDOM().catch(console.error);
