import { chromium } from 'playwright';

async function inspectLastPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Borås...');
    await page.goto('https://boras.actorsmartbook.se/Associations.aspx');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Accept cookies
    try {
      const cookieButton = page.getByRole('button', { name: /Godkänn alla cookies/i });
      const count = await cookieButton.count();
      if (count > 0) {
        await cookieButton.click();
        await page.waitForTimeout(500);
        console.log('Accepted cookies');
      }
    } catch {}

    console.log('\n=== CHECKING INITIAL PAGINATION STATE ===');

    // Check for all pagination buttons
    const forstaButton = page.getByRole('button', { name: 'Första' });
    const forraButton = page.getByRole('button', { name: 'Förra' });
    const nastaButton = page.getByRole('button', { name: 'Nästa' });
    const sistaButton = page.getByRole('button', { name: 'Sista' });

    console.log(`Första: ${await forstaButton.count()}`);
    console.log(`Förra: ${await forraButton.count()}`);
    console.log(`Nästa: ${await nastaButton.count()}`);
    console.log(`Sista: ${await sistaButton.count()}`);

    // Check if Nästa is disabled
    if (await nastaButton.count() > 0) {
      const isDisabled = await nastaButton.evaluate((el) => {
        return {
          disabled: el.hasAttribute('disabled'),
          ariaDisabled: el.getAttribute('aria-disabled'),
          classes: Array.from(el.classList).join(', ')
        };
      });
      console.log('Nästa button state:', isDisabled);
    }

    // Go to last page
    console.log('\n=== CLICKING "SISTA" TO GO TO LAST PAGE ===');
    if (await sistaButton.count() > 0) {
      await sistaButton.click();
      await page.waitForTimeout(2000);
      console.log('Clicked Sista');
    }

    // Check Info buttons count
    const infoButtons = page.getByRole('button', { name: 'Info' });
    const infoCount = await infoButtons.count();
    console.log(`\nInfo buttons on last page: ${infoCount}`);

    // Check pagination state on last page
    console.log('\n=== PAGINATION STATE ON LAST PAGE ===');
    console.log(`Första: ${await forstaButton.count()}`);
    console.log(`Förra: ${await forraButton.count()}`);
    console.log(`Nästa: ${await nastaButton.count()}`);
    console.log(`Sista: ${await sistaButton.count()}`);

    if (await nastaButton.count() > 0) {
      const isDisabled = await nastaButton.evaluate((el) => {
        return {
          disabled: el.hasAttribute('disabled'),
          ariaDisabled: el.getAttribute('aria-disabled'),
          classes: Array.from(el.classList).join(', '),
          innerHTML: el.innerHTML
        };
      });
      console.log('\nNästa button state on LAST page:', JSON.stringify(isDisabled, null, 2));
    } else {
      console.log('\nNästa button NOT FOUND on last page (this is GOOD!)');
    }

    // Try to click Nästa (if it exists)
    if (await nastaButton.count() > 0) {
      console.log('\n=== TESTING: Clicking Nästa from LAST page ===');
      try {
        await nastaButton.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
        console.log('Nästa click succeeded! Checking if page changed...');

        const newInfoCount = await page.getByRole('button', { name: 'Info' }).count();
        console.log(`Info buttons after clicking Nästa: ${newInfoCount}`);

        if (newInfoCount === infoCount) {
          console.log('⚠️ WARNING: Page did not change! We might be stuck on last page.');
        }
      } catch (error) {
        console.log('Nästa click failed or timed out (this is GOOD!):', error.message);
      }
    }

    // Look for page counter text
    console.log('\n=== LOOKING FOR PAGE COUNTER ===');
    const bodyText = await page.locator('body').textContent();
    const pageMatches = [
      /(\d+)\s*-\s*(\d+)\s+av\s+(\d+)/i,  // "1-10 av 640"
      /Sida\s+(\d+)\s*\/\s*(\d+)/i,       // "Sida 1/64"
      /Page\s+(\d+)\s*\/\s*(\d+)/i,       // "Page 1/64"
    ];

    for (const pattern of pageMatches) {
      const match = bodyText?.match(pattern);
      if (match) {
        console.log(`Found page counter: "${match[0]}"`);
        break;
      }
    }

    console.log('\n=== Browser will stay open for 10 seconds ===');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await browser.close();
  }
}

inspectLastPage().catch(console.error);
