import { chromium } from 'playwright';

/**
 * Test if clicking association links opens modals with all data already in DOM
 * or if it navigates to new pages
 */

async function testDetailView() {
  console.log('Testing FRI detail view behavior...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const url = 'https://fri.fagersta.se/forening/katalog.aspx';
    console.log(`Navigating to: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get the first association link
    const firstLink = page.locator('table tbody tr').first().locator('a').first();
    const linkText = await firstLink.textContent();
    const linkHref = await firstLink.getAttribute('href');

    console.log(`\nFirst association: ${linkText}`);
    console.log(`Link href: ${linkHref}`);

    // Check if all data is already in the DOM by inspecting the page HTML
    const html = await page.content();

    // Look for contact info patterns in the existing HTML
    const hasOrgNumber = html.includes('Organisationsnummer') || html.includes('Org.nr');
    const hasAddress = html.includes('Adress') || html.includes('Postadress');
    const hasContactPerson = html.includes('Kontaktperson');
    const hasDescription = html.includes('Kort beskrivning') || html.includes('Beskrivning');

    console.log('\n=== Data already in DOM? ===');
    console.log(`Organisationsnummer: ${hasOrgNumber}`);
    console.log(`Address: ${hasAddress}`);
    console.log(`Contact person: ${hasContactPerson}`);
    console.log(`Description: ${hasDescription}`);

    // Now click the link and see what happens
    console.log('\n=== Clicking first association link ===');
    const currentUrl = page.url();

    await firstLink.click();
    await page.waitForTimeout(3000);

    const newUrl = page.url();

    if (currentUrl !== newUrl) {
      console.log('✓ Navigation occurred to new page');
      console.log(`New URL: ${newUrl}`);

      // Check what's on the detail page
      const detailHtml = await page.content();
      console.log('\n=== Detail page content ===');

      // Look for specific fields
      const orgNumberMatch = detailHtml.match(/(?:Organisationsnummer|Org\.nr)[:\s]*([0-9\-]+)/i);
      const addressMatch = detailHtml.match(/(?:Adress|Postadress)[:\s]*([^<\n]+)/i);

      console.log(`Org number found: ${orgNumberMatch ? orgNumberMatch[1] : 'No'}`);
      console.log(`Address found: ${addressMatch ? addressMatch[1] : 'No'}`);

      // Take screenshot of detail page
      await page.screenshot({ path: 'E:\\projects\\CRM\\scraping\\json\\test_fri_detail.png', fullPage: true });
      console.log('\nDetail page screenshot saved');

    } else {
      console.log('✓ No navigation - might be a modal or AJAX content');

      // Check if a modal appeared
      const modal = await page.locator('.modal, .dialog, [role="dialog"], .popup').count();
      console.log(`Modals found: ${modal}`);

      if (modal > 0) {
        const modalHtml = await page.locator('.modal, .dialog, [role="dialog"], .popup').first().innerHTML();
        console.log('\nModal content (first 1000 chars):');
        console.log(modalHtml.substring(0, 1000));
      }
    }

    console.log('\n\nBrowser will stay open for manual inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testDetailView().catch(console.error);
