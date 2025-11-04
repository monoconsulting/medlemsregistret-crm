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
      }
    } catch {}

    await page.waitForTimeout(2000);

    // Click first Info button
    const firstButton = page.getByRole('button', { name: 'Info' }).first();
    await firstButton.click();
    await page.waitForTimeout(1500);

    console.log('\n=== Modal Structure ===\n');

    // Get all text in modal
    const modal = page.locator('.modal-content, [role="dialog"]').first();
    const modalHtml = await modal.innerHTML();
    console.log('Modal HTML:', modalHtml.substring(0, 1000));

    // Look for headers
    const h1 = await page.locator('.modal h1, .modal-header h1').textContent();
    console.log('\nH1:', h1);

    const h2 = await page.locator('.modal h2, .modal-header h2').textContent();
    console.log('H2:', h2);

    const h3 = await page.locator('.modal h3, .modal-header h3').textContent();
    console.log('H3:', h3);

    const h4 = await page.locator('.modal h4, .modal-header h4').textContent();
    console.log('H4:', h4);

    const title = await page.locator('.modal-title').textContent();
    console.log('Modal title:', title);

    // Get all modal body text
    const body = await page.locator('.modal-body').textContent();
    console.log('\nModal body (first 500 chars):', body?.substring(0, 500));

    console.log('\n\nPress Ctrl+C to exit...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
