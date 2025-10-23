import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function investigateRbok() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const outDir = path.join(__dirname, 'out', 'investigation');
  fs.mkdirSync(outDir, { recursive: true });

  const report: any = {
    url: 'https://soderhamn.rbok.se/foreningsregister',
    timestamp: new Date().toISOString(),
    findings: {}
  };

  try {
    console.log('=== 1. INITIAL PAGE LOAD ===');
    await page.goto('https://soderhamn.rbok.se/foreningsregister', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Accept cookies if banner exists
    const cookieSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Acceptera")',
      'button:has-text("Godkänn")',
      'button:has-text("OK")',
      'button:has-text("Jag förstår")',
    ];

    let cookieFound = false;
    for (const selector of cookieSelectors) {
      const cookieBanner = page.locator(selector).first();
      if (await cookieBanner.count() > 0 && await cookieBanner.isVisible()) {
        console.log(`Accepting cookies with selector: ${selector}`);
        await cookieBanner.click();
        await page.waitForTimeout(1000);
        cookieFound = true;
        break;
      }
    }

    if (!cookieFound) {
      console.log('No cookie banner found or already dismissed');
    }

    // Take screenshot
    await page.screenshot({ path: path.join(outDir, '01_initial_page.png'), fullPage: true });
    console.log('Screenshot saved: 01_initial_page.png');

    // Count associations on page 1
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`Number of table rows on page 1: ${tableRows}`);

    // Document table structure
    const headerCells = await page.locator('table thead th').allTextContents();
    console.log(`Table headers: ${JSON.stringify(headerCells)}`);

    // Get first few rows to understand structure
    const firstRowCells = await page.locator('table tbody tr').first().locator('td').allTextContents();
    console.log(`First row cells: ${JSON.stringify(firstRowCells)}`);

    report.findings.initialPage = {
      totalRowsOnPage1: tableRows,
      tableHeaders: headerCells,
      firstRowSample: firstRowCells
    };

    console.log('\n=== 2. MODAL BEHAVIOR (First 3 Associations) ===');
    const modalData: any[] = [];

    for (let i = 0; i < Math.min(3, tableRows); i++) {
      console.log(`\n--- Testing association ${i + 1} ---`);

      // Get association name before clicking
      const row = page.locator('table tbody tr').nth(i);
      const cells = await row.locator('td').all();

      // Column structure: [Icon, Name, Type, Homepage, Info button]
      const nameCell = cells.length > 1 ? cells[1] : null;
      const associationName = nameCell ? await nameCell.textContent() : 'Unknown';
      console.log(`Association name: ${associationName?.trim()}`);

      // The info button is in the last column (info icon)
      const infoButton = row.locator('td').last().locator('a[title*="information"], a i.fa-info-circle').first();
      const infoExists = await infoButton.count();

      if (infoExists === 0) {
        console.log(`WARNING: Could not find info button for association ${i + 1}`);
        continue;
      }

      console.log('Clicking info button...');
      await infoButton.click();
      await page.waitForTimeout(1500);

      // Wait for modal to appear - try multiple selectors
      let modal = page.locator('[role="dialog"]').first();
      let modalExists = await modal.count();

      if (modalExists === 0) {
        modal = page.locator('.modal').first();
        modalExists = await modal.count();
      }

      if (modalExists === 0) {
        modal = page.locator('[class*="modal"]').first();
        modalExists = await modal.count();
      }

      if (modalExists === 0) {
        console.log('WARNING: Could not find modal');
        await page.screenshot({ path: path.join(outDir, `02_no_modal_association_${i + 1}.png`), fullPage: true });
        continue;
      }

      console.log('Modal opened successfully');
      await page.screenshot({ path: path.join(outDir, `02_modal_association_${i + 1}.png`), fullPage: true });

      // Extract ALL text from modal
      const modalText = await modal.textContent();
      console.log(`Modal text length: ${modalText?.length} characters`);

      // Try to extract structured data
      const modalData_i: any = {
        associationIndex: i + 1,
        name: associationName?.trim(),
        rawModalText: modalText,
        extractedFields: {},
        selectors: {}
      };

      // Extract modal title
      const modalTitle = await modal.locator('.modal-title, h5').first().textContent().catch(() => null);
      if (modalTitle) {
        modalData_i.extractedFields.modalTitle = modalTitle.trim();
      }

      // Extract description (text after image/logo)
      const descriptionEl = modal.locator('p').first();
      if (await descriptionEl.count() > 0) {
        modalData_i.extractedFields.description = await descriptionEl.textContent();
      }

      // Extract Areas section
      const areasText = await modal.locator('text=/Areas|Områd/i').first().textContent().catch(() => null);
      if (areasText) {
        // Get the next sibling or following text
        const areaValue = await modal.locator('text=/Söderhamn|Areas/i').last().textContent().catch(() => null);
        modalData_i.extractedFields.areas = areaValue;
      }

      // Extract Contact section
      const contactSection = modal.locator('text=/Contact|Kontakt/i').first();
      if (await contactSection.count() > 0) {
        // Look for contact person name (icon with person)
        const contactName = await modal.locator('svg.fa-user, i.fa-user').locator('..').textContent().catch(() => null);
        if (contactName) {
          modalData_i.extractedFields.contactPerson = contactName.trim();
        }

        // Look for phone (icon with phone)
        const phone = await modal.locator('svg.fa-phone, i.fa-phone').locator('..').textContent().catch(() => null);
        if (phone) {
          modalData_i.extractedFields.phone = phone.trim();
        }

        // Look for email (icon with envelope or @ symbol)
        const emailLink = await modal.locator('a[href^="mailto:"]').first().textContent().catch(() => null);
        if (emailLink) {
          modalData_i.extractedFields.email = emailLink.trim();
        }

        // Look for website (icon with globe or link)
        const websiteLink = await modal.locator('svg.fa-globe, i.fa-globe, svg.fa-link, i.fa-link').locator('..').locator('a').first().getAttribute('href').catch(() => null);
        if (websiteLink) {
          modalData_i.extractedFields.website = websiteLink.trim();
        }
      }

      // Fallback: regex extraction from full text
      const orgNrMatch = modalText?.match(/(\d{6}-\d{4})/);
      if (orgNrMatch) {
        modalData_i.extractedFields.orgNumber = orgNrMatch[1];
      }

      const emailMatch = modalText?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch && !modalData_i.extractedFields.email) {
        modalData_i.extractedFields.emailFromText = emailMatch[1];
      }

      const phoneMatch = modalText?.match(/(0\d{2,3}-?\d{5,7})/);
      if (phoneMatch && !modalData_i.extractedFields.phone) {
        modalData_i.extractedFields.phoneFromText = phoneMatch[1];
      }

      modalData.push(modalData_i);

      // Find close button - try multiple approaches
      // Based on screenshot, there's an X button in the top-right of the modal header
      let closeButton = modal.locator('button.btn-close, button.rbok-btn-close').first();
      let closeExists = await closeButton.count();

      if (closeExists === 0) {
        closeButton = modal.locator('button[aria-label="Stäng"], button[aria-label="Close"]').first();
        closeExists = await closeButton.count();
      }

      if (closeExists === 0) {
        closeButton = modal.locator('.modal-header button').first();
        closeExists = await closeButton.count();
      }

      modalData_i.selectors.closeButton = closeExists > 0 ? 'Found' : 'Not found';

      if (closeExists > 0) {
        console.log('Found close button, attempting to close modal...');

        // Try clicking the backdrop area or using JavaScript click
        try {
          // Use evaluate to click via JavaScript (bypasses visibility checks)
          await closeButton.evaluate((btn: HTMLElement) => btn.click());
          console.log('Clicked close button via JavaScript');
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log('JavaScript click failed, trying Escape key');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }

        // Verify modal closed
        const modalStillVisible = await modal.isVisible().catch(() => false);
        if (modalStillVisible) {
          console.log('Modal still visible, trying Escape key as backup');
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        } else {
          console.log('Modal closed successfully');
        }
      } else {
        console.log('Could not find close button, using Escape key');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      await page.screenshot({ path: path.join(outDir, `03_after_close_association_${i + 1}.png`), fullPage: true });
    }

    report.findings.modalBehavior = modalData;

    console.log('\n=== 3. PAGINATION ===');

    // Look for pagination controls at bottom
    // Based on screenshot: "Page 1 of 6" with arrow buttons
    const paginationContainer = page.locator('.k-pager-info, [class*="pager"]').first();
    const paginationText = await paginationContainer.textContent().catch(() => null);
    console.log(`Pagination text: ${paginationText}`);

    // Look for page info (e.g., "Page 1 of 6")
    const pageInfo = await page.locator('text=/Page\\s+\\d+\\s+of\\s+\\d+/i').first().textContent().catch(() => null);
    console.log(`Page indicator: ${pageInfo}`);

    // Extract total pages
    let totalPages = null;
    if (pageInfo) {
      const match = pageInfo.match(/of\s+(\d+)/i);
      if (match) {
        totalPages = parseInt(match[1]);
        console.log(`Total pages: ${totalPages}`);
      }
    }

    // Look for item count (e.g., "1 - 20 of 107 items")
    const itemCount = await page.locator('text=/\\d+\\s*-\\s*\\d+\\s+of\\s+\\d+\\s+items/i').first().textContent().catch(() => null);
    console.log(`Item count info: ${itemCount}`);

    // Look for Next button - try navigation arrows
    let nextButton = page.locator('a[title*="next"], button[title*="next"]').first();
    let nextExists = await nextButton.count();

    if (nextExists === 0) {
      // Try aria-label
      nextButton = page.locator('a[aria-label*="next"], button[aria-label*="next"]').first();
      nextExists = await nextButton.count();
    }

    if (nextExists === 0) {
      // Try icon-based selector
      nextButton = page.locator('a:has(i.fa-angle-right), button:has(i.fa-angle-right)').first();
      nextExists = await nextButton.count();
    }

    if (nextExists === 0) {
      // Try single arrow
      nextButton = page.locator('a:has-text("›"), button:has-text("›")').first();
      nextExists = await nextButton.count();
    }

    console.log(`Next button found: ${nextExists > 0}`);

    report.findings.pagination = {
      pageInfo: pageInfo,
      itemCount: itemCount,
      totalPages: totalPages,
      selectors: {}
    };

    if (nextExists > 0) {
      const nextButtonTitle = await nextButton.getAttribute('title').catch(() => null);
      console.log(`Next button title: "${nextButtonTitle}"`);

      // Check if disabled
      const isDisabled = await nextButton.evaluate((el) => {
        return el.classList.contains('disabled') ||
               el.hasAttribute('disabled') ||
               el.getAttribute('aria-disabled') === 'true' ||
               el.classList.contains('k-state-disabled');
      });
      console.log(`Next button disabled: ${isDisabled}`);

      report.findings.pagination.selectors.nextButton = nextButtonTitle || 'Found';

      if (!isDisabled) {
        console.log('Clicking Next to go to page 2...');
        await nextButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(outDir, '04_page_2.png'), fullPage: true });

        // Check page indicator updated
        const page2Info = await page.locator('text=/Page\\s+\\d+\\s+of\\s+\\d+/i').first().textContent().catch(() => null);
        console.log(`Page 2 indicator: ${page2Info}`);

        // Extract one association from page 2
        const page2Row = await page.locator('table tbody tr').first().locator('td').allTextContents();
        console.log(`Page 2 first row: ${JSON.stringify(page2Row)}`);

        report.findings.pagination.page2Info = page2Info;
        report.findings.pagination.page2Sample = page2Row;

        // Look for Last button
        let lastButton = page.locator('a[title*="last"], button[title*="last"]').first();
        let lastExists = await lastButton.count();

        if (lastExists === 0) {
          lastButton = page.locator('a:has-text("»"), button:has-text("»")').first();
          lastExists = await lastButton.count();
        }

        if (lastExists === 0) {
          lastButton = page.locator('a:has(i.fa-angle-double-right), button:has(i.fa-angle-double-right)').first();
          lastExists = await lastButton.count();
        }

        console.log(`Last button found: ${lastExists > 0}`);

        if (lastExists > 0) {
          const lastButtonTitle = await lastButton.getAttribute('title').catch(() => null);
          console.log(`Last button title: "${lastButtonTitle}"`);

          report.findings.pagination.selectors.lastButton = lastButtonTitle || 'Found';

          console.log('Clicking Last to go to final page...');
          await lastButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(outDir, '05_last_page.png'), fullPage: true });

          // Check current page indicator
          const finalPageText = await page.locator('text=/Page\\s+\\d+\\s+of\\s+\\d+/i').first().textContent().catch(() => null);
          console.log(`Final page indicator: ${finalPageText}`);

          report.findings.pagination.finalPageIndicator = finalPageText;

          // Check if Next is disabled on last page
          const nextDisabledOnLast = await nextButton.evaluate((el) => {
            return el.classList.contains('disabled') ||
                   el.hasAttribute('disabled') ||
                   el.getAttribute('aria-disabled') === 'true' ||
                   el.classList.contains('k-state-disabled');
          });
          console.log(`Next button disabled on last page: ${nextDisabledOnLast}`);
          report.findings.pagination.nextDisabledOnLastPage = nextDisabledOnLast;
        }
      } else {
        console.log('Next button is disabled on page 1 (only 1 page)');
        report.findings.pagination.singlePageOnly = true;
      }
    } else {
      console.log('No Next button found - different pagination mechanism');
      report.findings.pagination.noPaginationFound = true;
    }

  } catch (error: any) {
    console.error('Error during investigation:', error);
    report.error = error.message;
    await page.screenshot({ path: path.join(outDir, 'error.png'), fullPage: true });
  } finally {
    // Save report
    fs.writeFileSync(
      path.join(outDir, 'investigation_report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('\nInvestigation report saved to investigation_report.json');

    await browser.close();
  }
}

investigateRbok();
