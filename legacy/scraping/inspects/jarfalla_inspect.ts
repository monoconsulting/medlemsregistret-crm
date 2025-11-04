import { chromium } from 'playwright';

async function inspectPagination() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Järfälla...');
    await page.goto('https://jarfalla.fri-go.se/forening/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for pagination elements
    console.log('\n=== CHECKING PAGINATION ELEMENTS ===');

    // Look for "Next" link
    const nextLinks = page.getByRole('link', { name: 'Next' });
    const nextCount = await nextLinks.count();
    console.log(`"Next" links found: ${nextCount}`);
    if (nextCount > 0) {
      const nextText = await nextLinks.first().textContent();
      const nextHref = await nextLinks.first().getAttribute('href');
      const nextDisabled = await nextLinks.first().evaluate((el) => {
        return el.hasAttribute('disabled') ||
               el.getAttribute('aria-disabled') === 'true' ||
               el.classList.contains('disabled');
      });
      console.log(`  Text: "${nextText}"`);
      console.log(`  Href: ${nextHref}`);
      console.log(`  Disabled: ${nextDisabled}`);
    }

    // Look for "Last" link
    const lastLinks = page.getByRole('link', { name: 'Last' });
    const lastCount = await lastLinks.count();
    console.log(`\n"Last" links found: ${lastCount}`);
    for (let i = 0; i < lastCount; i++) {
      const lastText = await lastLinks.nth(i).textContent();
      const lastHref = await lastLinks.nth(i).getAttribute('href');
      console.log(`  [${i}] Text: "${lastText}", Href: ${lastHref}`);
    }

    // Look for numbered page links
    console.log('\n=== CHECKING NUMBERED PAGE LINKS ===');
    const numberedLinks = page.locator('a[href*="page="]');
    const numberedCount = await numberedLinks.count();
    console.log(`Page links found: ${numberedCount}`);
    for (let i = 0; i < Math.min(10, numberedCount); i++) {
      const text = await numberedLinks.nth(i).textContent();
      const href = await numberedLinks.nth(i).getAttribute('href');
      console.log(`  [${i}] Text: "${text}", Href: ${href}`);
    }

    // Look for "Page X/Y" text
    console.log('\n=== CHECKING PAGE INFO TEXT ===');
    const bodyText = await page.locator('body').textContent();
    const pageMatch = bodyText?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
    if (pageMatch) {
      console.log(`Page info found: "${pageMatch[0]}"`);
      console.log(`  Current: ${pageMatch[1]}, Total: ${pageMatch[2]}`);
    } else {
      console.log('No "Page X/Y" pattern found');
      // Look for alternative patterns
      const sidaMatch = bodyText?.match(/Sida\s+(\d+)\s*\/\s*(\d+)/i);
      if (sidaMatch) {
        console.log(`Sida info found: "${sidaMatch[0]}"`);
      }
    }

    // Check table structure
    console.log('\n=== CHECKING TABLE STRUCTURE ===');
    const tables = page.locator('table');
    const tableCount = await tables.count();
    console.log(`Tables found: ${tableCount}`);

    if (tableCount > 0) {
      const rows = tables.first().locator('tbody tr');
      const rowCount = await rows.count();
      console.log(`Rows in first table: ${rowCount}`);

      if (rowCount > 0) {
        const cells = rows.first().locator('td');
        const cellCount = await cells.count();
        console.log(`Cells in first row: ${cellCount}`);
        for (let i = 0; i < cellCount; i++) {
          const cellText = await cells.nth(i).textContent();
          console.log(`  Cell ${i}: "${cellText?.substring(0, 50)}..."`);
        }
      }
    }

    // Now try clicking "Next" and see what happens
    console.log('\n=== TESTING NAVIGATION TO PAGE 2 ===');
    if (nextCount > 0) {
      await nextLinks.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const bodyText2 = await page.locator('body').textContent();
      const pageMatch2 = bodyText2?.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
      if (pageMatch2) {
        console.log(`After clicking Next: "${pageMatch2[0]}"`);
      }

      // Check if Next is still available
      const nextCount2 = await page.getByRole('link', { name: 'Next' }).count();
      console.log(`"Next" still available: ${nextCount2 > 0}`);
    }

    console.log('\n=== Inspection complete. Browser will stay open for 10 seconds ===');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await browser.close();
  }
}

inspectPagination().catch(console.error);
