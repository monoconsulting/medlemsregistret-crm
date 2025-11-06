import { chromium } from 'playwright';

async function testLastPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Järfälla page 9 (last page)...');
    await page.goto('https://jarfalla.fri-go.se/forening/Default.aspx?page=9');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('\n=== CHECKING LAST PAGE (9) ===');

    // Check page info
    const bodyText = await page.locator('body').textContent();
    const pageMatch = bodyText?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
    if (pageMatch) {
      console.log(`Page info: "${pageMatch[0]}"`);
    }

    // Check "Next" link
    const nextLinks = page.getByRole('link', { name: 'Next' });
    const nextCount = await nextLinks.count();
    console.log(`\n"Next" links found: ${nextCount}`);

    if (nextCount > 0) {
      const nextHref = await nextLinks.first().getAttribute('href');
      const nextDisabled = await nextLinks.first().evaluate((el) => {
        const classList = Array.from(el.classList);
        return {
          hasDisabledAttr: el.hasAttribute('disabled'),
          ariaDisabled: el.getAttribute('aria-disabled'),
          classes: classList,
          hasDisabledClass: el.classList.contains('disabled')
        };
      });
      console.log(`  Href: ${nextHref}`);
      console.log(`  Disabled info:`, nextDisabled);
    } else {
      console.log('  "Next" link NOT FOUND on last page!');
    }

    // Check "Last" link
    const lastLinks = page.getByRole('link', { name: 'Last' });
    const lastCount = await lastLinks.count();
    console.log(`\n"Last" links found: ${lastCount}`);
    if (lastCount > 0) {
      const lastHref = await lastLinks.first().getAttribute('href');
      console.log(`  Href: ${lastHref}`);
    }

    // Count rows on last page
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`\nRows on last page: ${rowCount}`);

    // Now try to click Next (if it exists) and see what happens
    if (nextCount > 0) {
      console.log('\n=== TESTING: Clicking "Next" on last page ===');
      try {
        await nextLinks.first().click({ timeout: 3000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const bodyText2 = await page.locator('body').textContent();
        const pageMatch2 = bodyText2?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
        if (pageMatch2) {
          console.log(`After clicking Next from page 9: "${pageMatch2[0]}"`);
          console.log('WARNING: Next worked from last page! We might loop forever!');
        }
      } catch (error) {
        console.log('Next click failed or timed out:', error.message);
      }
    }

    console.log('\n=== Test complete. Browser will stay open for 5 seconds ===');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testLastPage().catch(console.error);
