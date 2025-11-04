/**
 * Debug script to inspect RBOK modal structure
 * This will help us find the correct selector for the close button
 */

import { chromium } from 'playwright';

async function debugModal() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1760, height: 1256 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Söderhamn...');
    await page.goto('https://soderhamn.rbok.se/foreningsregister');
    await page.waitForTimeout(2000);

    // Accept cookies
    console.log('Accepting cookies...');
    try {
      const acceptButton = page.locator('button:has-text("Accept")').first();
      if (await acceptButton.count() > 0) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    // Click Association register if needed
    try {
      const assocLink = page.getByRole('link', { name: /Association register/i });
      if (await assocLink.count() > 0) {
        await assocLink.click();
        await page.waitForTimeout(1000);
      }
    } catch {}

    // Wait for table
    await page.waitForSelector('table tbody tr');
    console.log('Table loaded');

    // Click first info link
    console.log('Clicking first info link...');
    const firstInfoLink = page.getByRole('link', { name: /Show more information/i }).first();
    await firstInfoLink.click();
    await page.waitForTimeout(2000);

    console.log('\n=== MODAL INSPECTION ===\n');

    // Find the modal
    const modal = page.locator('[role="dialog"]').first();
    const modalExists = await modal.count();
    console.log(`Modal with role="dialog": ${modalExists}`);

    if (modalExists > 0) {
      // Get modal HTML
      const modalHTML = await modal.innerHTML();
      console.log('\n--- Modal HTML (first 1000 chars) ---');
      console.log(modalHTML.substring(0, 1000));
      console.log('...\n');

      // Find all buttons in modal
      const buttons = modal.locator('button');
      const buttonCount = await buttons.count();
      console.log(`\n--- Found ${buttonCount} buttons in modal ---`);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const classes = await button.getAttribute('class');
        const ariaLabel = await button.getAttribute('aria-label');
        const type = await button.getAttribute('type');

        console.log(`\nButton ${i + 1}:`);
        console.log(`  Text: "${text?.trim()}"`);
        console.log(`  Classes: ${classes}`);
        console.log(`  Aria-label: ${ariaLabel}`);
        console.log(`  Type: ${type}`);
      }

      // Find all elements with "Close" or "Stäng" text
      const closeElements = modal.locator('text=/Close|Stäng/i');
      const closeCount = await closeElements.count();
      console.log(`\n--- Found ${closeCount} elements with "Close" or "Stäng" text ---`);

      for (let i = 0; i < closeCount; i++) {
        const elem = closeElements.nth(i);
        const tagName = await elem.evaluate(el => el.tagName);
        const text = await elem.textContent();
        const classes = await elem.getAttribute('class');

        console.log(`\nElement ${i + 1}:`);
        console.log(`  Tag: ${tagName}`);
        console.log(`  Text: "${text?.trim()}"`);
        console.log(`  Classes: ${classes}`);
      }

      // Check for modal footer
      const modalFooter = modal.locator('.modal-footer, [class*="footer"]');
      const footerExists = await modalFooter.count();
      console.log(`\n--- Modal footer exists: ${footerExists} ---`);

      if (footerExists > 0) {
        const footerHTML = await modalFooter.first().innerHTML();
        console.log('Footer HTML:');
        console.log(footerHTML);
      }
    }

    console.log('\n\n=== PAUSING FOR MANUAL INSPECTION ===');
    console.log('The modal is now open. Inspect it in the browser.');
    console.log('Press Ctrl+C to exit when done.');

    // Wait indefinitely for manual inspection
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Don't close automatically
    console.log('\nKeeping browser open for inspection...');
  }
}

debugModal();
