import { chromium } from 'playwright';

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

    // Get first association
    const table = page.locator('table').first();
    const firstRow = table.locator('tbody tr').first();
    const nameCell = firstRow.locator('td').nth(1);
    const name = await nameCell.textContent();
    console.log(`\n=== Opening modal for: ${name?.trim()} ===\n`);

    // Click info link
    const infoLink = firstRow.getByRole('link', { name: /Show more information about/i }).first();
    await infoLink.click();
    await page.waitForTimeout(1500);

    // Get modal with aria-hidden=false
    const modal = page.locator('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])').first();
    await modal.waitFor({ state: 'attached', timeout: 5000 });
    console.log('✓ Modal opened');

    // Take screenshot
    await page.screenshot({ path: 'scraping/out/modal_debug.png', fullPage: true });

    // Extract full HTML
    const modalHtml = await modal.innerHTML();
    console.log('\n=== MODAL HTML ===');
    console.log(modalHtml);

    // Extract all text content
    const modalText = await modal.textContent();
    console.log('\n=== MODAL TEXT CONTENT ===');
    console.log(modalText);

    // Try to find specific elements
    console.log('\n=== SEARCHING FOR SPECIFIC ELEMENTS ===');

    // Look for all divs with classes
    const allDivs = modal.locator('div');
    const divCount = await allDivs.count();
    console.log(`\nTotal divs in modal: ${divCount}`);

    for (let i = 0; i < Math.min(20, divCount); i++) {
      const div = allDivs.nth(i);
      const className = await div.getAttribute('class');
      const text = await div.textContent();
      if (className || (text && text.trim().length > 0 && text.trim().length < 200)) {
        console.log(`\nDiv ${i}:`);
        console.log(`  Class: ${className}`);
        console.log(`  Text: ${text?.trim().substring(0, 100)}`);
      }
    }

    // Look for labels and their content
    console.log('\n=== LABELS AND CONTENT ===');
    const labels = modal.locator('label, .label, [class*="label"]');
    const labelCount = await labels.count();
    console.log(`Found ${labelCount} label-like elements`);

    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const text = await label.textContent();
      console.log(`Label ${i}: ${text?.trim()}`);
    }

    // Look for paragraphs
    console.log('\n=== PARAGRAPHS ===');
    const paragraphs = modal.locator('p');
    const pCount = await paragraphs.count();
    console.log(`Found ${pCount} paragraphs`);

    for (let i = 0; i < pCount; i++) {
      const p = paragraphs.nth(i);
      const text = await p.textContent();
      console.log(`P ${i}: ${text?.trim()}`);
    }

    // Look for any element containing org number pattern
    console.log('\n=== SEARCHING FOR ORG NUMBER PATTERN ===');
    const bodyText = await modal.textContent();
    const orgMatch = bodyText?.match(/\d{6}-\d{4}/g);
    if (orgMatch) {
      console.log(`Found org number patterns: ${orgMatch.join(', ')}`);
    }

    // Look for email pattern
    console.log('\n=== SEARCHING FOR EMAIL PATTERN ===');
    const emailMatch = bodyText?.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
    if (emailMatch) {
      console.log(`Found email patterns: ${emailMatch.join(', ')}`);
    }

    console.log('\n\n=== INSPECTION COMPLETE ===');
    console.log('Screenshot saved to: scraping/out/modal_debug.png');
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
