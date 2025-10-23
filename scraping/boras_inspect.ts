import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Borås...');
    await page.goto('https://boras.actorsmartbook.se/Associations.aspx');

    // Handle cookie consent
    try {
      const cookieButton = page.getByRole('button', { name: /Godkänn alla cookies/i });
      const count = await cookieButton.count();
      if (count > 0) {
        await cookieButton.click();
        await page.waitForTimeout(500);
        console.log('Accepted cookies');
      }
    } catch {}

    await page.waitForTimeout(2000);

    // Try different selectors to find association cards/items
    console.log('\n=== Inspecting page structure ===\n');

    // Look for all divs with Info buttons
    const infoButtons = page.getByRole('button', { name: 'Info' });
    const buttonCount = await infoButtons.count();
    console.log(`Found ${buttonCount} Info buttons`);

    // For each button, try to find the parent card and extract data
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      console.log(`\n--- Association ${i} ---`);
      const button = infoButtons.nth(i);

      // Try to find parent container
      const parentDiv = button.locator('xpath=ancestor::div[contains(@class, "col") or contains(@class, "card") or contains(@class, "row")][1]');
      const parentText = await parentDiv.textContent();
      console.log('Parent div text:', parentText?.trim());

      // Try to find heading/title
      const headings = parentDiv.locator('h1, h2, h3, h4, h5, h6, strong, b');
      const headingCount = await headings.count();
      console.log(`Found ${headingCount} headings in parent`);

      for (let j = 0; j < headingCount; j++) {
        const heading = headings.nth(j);
        const text = await heading.textContent();
        const tagName = await heading.evaluate(el => el.tagName);
        console.log(`  ${tagName}: "${text?.trim()}"`);
      }

      // Get all text content split by lines
      if (parentText) {
        const lines = parentText.split('\n').map(l => l.trim()).filter(l => l && l !== 'Info');
        console.log('All lines:', lines);
      }
    }

    // Try to click first Info button and inspect modal
    console.log('\n\n=== Inspecting modal structure ===\n');
    const firstButton = infoButtons.first();
    await firstButton.click();
    await page.waitForTimeout(1000);

    // Look for modal content
    const modal = page.locator('.modal, [role="dialog"], .popup');
    const modalCount = await modal.count();
    console.log(`Found ${modalCount} modals`);

    if (modalCount > 0) {
      const modalText = await modal.first().textContent();
      console.log('Modal text:', modalText?.substring(0, 500));

      // Look for specific fields
      const hasOrgNr = await page.locator('text=/Org\\.?\\s*nr/i').count();
      console.log(`Has Org.nr: ${hasOrgNr > 0}`);

      const hasEmail = await page.locator('text=/E-?post/i').count();
      console.log(`Has Email label: ${hasEmail > 0}`);

      const hasHemsida = await page.locator('text=/Hemsida/i').count();
      console.log(`Has Hemsida: ${hasHemsida > 0}`);

      const hasKontakt = await page.locator('text=/Kontaktperson/i').count();
      console.log(`Has Kontaktperson: ${hasKontakt > 0}`);
    }

    console.log('\n\nPress Ctrl+C to exit...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
