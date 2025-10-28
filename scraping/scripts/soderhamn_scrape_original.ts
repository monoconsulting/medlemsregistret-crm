import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { getScrapingPaths, createLogger, runDatabaseImport } from '../utils/scraper-base';
import { sanitizeForValidation } from '../utils/sanitize';

// Configuration
const SOURCE_SYSTEM = 'RBOK';
const MUNICIPALITY = 'Söderhamn';
const BASE_URL = 'https://soderhamn.rbok.se/foreningsregister';
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

// Get paths from environment
const paths = getScrapingPaths(MUNICIPALITY, SOURCE_SYSTEM);
const OUTPUT_DIR = paths.outputDir;
const JSONL_PATH = paths.jsonlPath;
const JSON_PATH = paths.jsonPath;
const LOG_PATH = paths.logPath;

// Create logger
const logger = createLogger(LOG_PATH);
const log = (message: string) => logger.info(message);

// Stats tracking
let totalAssociations = 0;
let missingOrgNumber = 0;
let missingContacts = 0;
const homepageDomains = new Set<string>();

interface AssociationRecord {
  source_system: string;
  municipality: string;
  scrape_run_id: string;
  scraped_at: string;
  association: {
    name: string;
    org_number: string | null;
    types: string[];
    activities: string[];
    categories: string[];
    homepage_url: string | null;
    detail_url: string;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    description: string | null;
  };
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
  source_navigation: {
    list_page_index: number;
    position_on_page: number;
    pagination_model: string;
    filter_state: any;
  };
  extras: Record<string, any>;
}

// Utility functions
function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeArray(values: (string | null | undefined)[]): string[] {
  const normalized = values
    .map(normalizeString)
    .filter((v): v is string => v !== null);

  // Deduplicate case-insensitively
  const seen = new Set<string>();
  return normalized.filter(item => {
    const lower = item.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min: number = 200, max: number = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}

async function writeJsonl(record: AssociationRecord): Promise<void> {
  fs.appendFileSync(JSONL_PATH, JSON.stringify(record) + '\n');
}

async function writePrettyJson(records: AssociationRecord[]): Promise<void> {
  fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2));
}

// Scraping functions
async function waitForListReady(page: Page): Promise<void> {
  // Wait for the association table to be visible
  await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 10000 });
  await delay(500); // Additional stability wait
}

async function dismissCookieBanner(page: Page): Promise<void> {
  try {
    // Check for EU cookie popup and dismiss it
    const cookieSelectors = [
      '.eupopup-button',
      'button:has-text("Godkänn")',
      'button:has-text("Acceptera")',
      'button:has-text("Accept")',
      'button:has-text("OK")'
    ];

    for (const selector of cookieSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          await button.click({ timeout: 2000 });
          await delay(500);
          log('Cookie banner dismissed');
          return;
        }
      } catch {}
    }
  } catch (error) {
    // Ignore - cookie banner might not be present
  }
}

async function hasNextPage(page: Page): Promise<boolean> {
  try {
    // Check if "Next" link exists and is not disabled
    const nextLink = page.getByRole('link', { name: 'Next' });
    const count = await nextLink.count();
    if (count === 0) return false;

    // Check if it's disabled
    const isDisabled = await nextLink.evaluate((el) => {
      if (el.hasAttribute('disabled')) return true;
      if (el.getAttribute('aria-disabled') === 'true') return true;
      if (el.classList.contains('disabled')) return true;
      return false;
    });

    return !isDisabled;
  } catch {
    return false;
  }
}

async function goToNextPage(page: Page): Promise<boolean> {
  try {
    const nextLink = page.getByRole('link', { name: 'Next' });
    await nextLink.click();
    await randomDelay();
    await waitForListReady(page);
    return true;
  } catch (error) {
    log(`Error navigating to next page: ${error}`);
    return false;
  }
}

async function closeModal(page: Page, associationName: string): Promise<void> {
  try {
    // Wait a bit for modal to be fully rendered
    await delay(200);

    // Method 1: Direct selector for close button in modal header
    try {
      const closeButton = page.locator('.modal-header button').first();
      await closeButton.waitFor({ state: 'visible', timeout: 3000 });
      await closeButton.click({ timeout: 2000 });
      await delay(500); // Wait for modal to close
      return;
    } catch (error) {
      // Try next method
    }

    // Method 2: Try any visible button in modal-header
    try {
      const modal = page.locator('.modal').first();
      const headerButton = modal.locator('.modal-header button').first();
      await headerButton.click({ timeout: 2000 });
      await delay(500);
      return;
    } catch (error) {
      // Try next method
    }

    // Method 3: Escape key as fallback
    await page.keyboard.press('Escape');
    await delay(500);

  } catch (error) {
    // Silently continue if modal close fails
  }
}

async function extractDetailModalData(page: Page, associationName: string): Promise<{
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  orgNumber: string | null;
  homepage: string | null;
  type: string | null;
  categories: string[];
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
}> {
  const result = {
    description: null as string | null,
    email: null as string | null,
    phone: null as string | null,
    address: null as string | null,
    postalCode: null as string | null,
    city: null as string | null,
    orgNumber: null as string | null,
    homepage: null as string | null,
    type: null as string | null,
    categories: [] as string[],
    contacts: [] as Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>
  };

  try {
    // Wait for modal to appear and become visible (aria-hidden should be false or removed)
    const modal = page.locator('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])').first();
    await modal.waitFor({ state: 'attached', timeout: 5000 });
    await delay(500);

    // Extract full modal text content
    const modalText = await modal.textContent();
    if (!modalText) return result;

    // The modal has structured content - look for specific sections and icons
    // Description appears after the logo image, before the "Areas" section
    const descMatch = modalText.match(/(?:^|[\r\n])((?:[^A-ZÅ][^\r\n]*[\r\n]?)+)(?=[\r\n](?:Areas|Contact|Adress|Hemsida))/);
    if (descMatch && descMatch[1]) {
      const desc = normalizeString(descMatch[1]);
      if (desc && desc.length > 10 && !desc.match(/^(Söderhamn|Areas|Contact)/)) {
        result.description = desc;
      }
    }

    // Extract Areas section
    const areasMatch = modalText.match(/Areas[\s\r\n]+([\w\såäöÅÄÖ,\s]+?)(?=[\r\n](?:Contact|Close|$))/i);
    if (areasMatch && areasMatch[1]) {
      const areasText = normalizeString(areasMatch[1]);
      if (areasText) {
        result.categories = areasText.split(/,\s*/).map(s => s.trim()).filter(s => s.length > 0);
      }
    }

    // Extract Contact section content
    // The Contact section contains icon-based fields with person, phone, email, website
    const contactSection = modalText.match(/Contact([\s\S]+?)(?=Close|$)/i);
    if (contactSection && contactSection[1]) {
      const contactText = contactSection[1];

      // Look for person name (first line after "Contact" that looks like a name)
      const nameMatch = contactText.match(/[\r\n\s]([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)+)/);
      if (nameMatch && nameMatch[1]) {
        const name = normalizeString(nameMatch[1]);
        if (name && name.split(/\s+/).length >= 2) {
          result.contacts.push({
            contact_person_name: name,
            contact_person_role: null,
            contact_person_email: null,
            contact_person_phone: null
          });
        }
      }

      // Extract phone number (format: 0270-NNNNNN or similar)
      const phoneMatch = contactText.match(/\b(0\d{2,4}[\s\-]?\d{5,})\b/);
      if (phoneMatch) {
        result.phone = normalizeString(phoneMatch[1]);
      }

      // Extract email
      const emailMatch = contactText.match(/\b([\w\.-]+@[\w\.-]+\.\w+)\b/);
      if (emailMatch) {
        result.email = emailMatch[1].toLowerCase();
      }

      // Extract website/homepage - look for http URLs
      const urlMatch = contactText.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        result.homepage = urlMatch[1];
      }
    }

    // Also try to extract homepage from modal links if not found in text
    if (!result.homepage) {
      const links = modal.locator('a[href^="http"]');
      const linkCount = await links.count();
      if (linkCount > 0) {
        const href = await links.first().getAttribute('href');
        if (href && !href.includes('mailto:')) {
          result.homepage = href;
        }
      }
    }

    // Try to extract org number if present (format: NNNNNN-NNNN)
    const orgMatch = modalText.match(/\b(\d{6}-\d{4})\b/);
    if (orgMatch) {
      result.orgNumber = orgMatch[1];
    }

  } catch (error) {
    log(`Warning: Error extracting modal data: ${error}`);
  }

  return result;
}

async function scrapePage(page: Page, pageIndex: number): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];

  await waitForListReady(page);

  // Get all table rows
  const table = page.locator('table').first();
  const rows = table.locator('tbody tr');
  const rowCount = await rows.count();

  log(`Page ${pageIndex}: Found ${rowCount} associations`);

  for (let i = 0; i < rowCount; i++) {
    try {
      // Re-query the rows to avoid stale element issues
      const currentRows = table.locator('tbody tr');
      const currentRow = currentRows.nth(i);

      // Get association name from cell 1
      const cells = currentRow.locator('td');
      const nameCell = cells.nth(1);
      const associationName = normalizeString(await nameCell.textContent());

      if (!associationName) {
        log(`Page ${pageIndex}, Row ${i}: Could not extract association name`);
        continue;
      }

      log(`Page ${pageIndex}, Row ${i}: Processing "${associationName}"`);

      // Extract list data
      const typeCell = cells.nth(2);
      const type = normalizeString(await typeCell.textContent());

      const homepageCell = cells.nth(3);
      const homepageLink = homepageCell.locator('a').first();
      const homepageLinkCount = await homepageLink.count();
      let homepage: string | null = null;
      if (homepageLinkCount > 0) {
        homepage = await homepageLink.getAttribute('href');
      }

      // Click the info link to open modal - use first "Show more information about" link
      const infoLink = currentRow.getByRole('link', { name: /Show more information about/i }).first();
      const infoLinkCount = await infoLink.count();

      if (infoLinkCount === 0) {
        log(`Page ${pageIndex}, Row ${i}: No info link found`);
        continue;
      }

      log(`Page ${pageIndex}, Row ${i}: Clicking info link for "${associationName}"`);
      await infoLink.click({ timeout: 10000 });
      await randomDelay();

      log(`Page ${pageIndex}, Row ${i}: Extracting modal data...`);
      // Extract data from modal
      const modalData = await extractDetailModalData(page, associationName);
      log(`Page ${pageIndex}, Row ${i}: Modal data extracted`);

      // Close the modal
      await closeModal(page, associationName);
      await randomDelay(200, 400);

      // Build the record - merge list data with modal data
      const record: AssociationRecord = {
        source_system: SOURCE_SYSTEM,
        municipality: MUNICIPALITY,
        scrape_run_id: SCRAPE_RUN_ID,
        scraped_at: SCRAPED_AT,
        association: {
          name: associationName,
          org_number: modalData.orgNumber,
          types: normalizeArray([type, modalData.type]),
          activities: [],
          categories: modalData.categories,
          homepage_url: modalData.homepage || homepage,
          detail_url: `${BASE_URL}#${associationName.replace(/\s+/g, '-')}`,
          street_address: modalData.address,
          postal_code: modalData.postalCode,
          city: modalData.city,
          email: modalData.email,
          phone: modalData.phone,
          description: modalData.description
        },
        contacts: modalData.contacts,
        source_navigation: {
          list_page_index: pageIndex,
          position_on_page: i,
          pagination_model: 'rbok_controls',
          filter_state: null
        },
        extras: {}
      };

      // Update stats
      totalAssociations++;
      if (!record.association.org_number) missingOrgNumber++;
      if (record.contacts.length === 0) missingContacts++;

      const domain = extractDomain(record.association.homepage_url);
      if (domain) homepageDomains.add(domain);

      // Write to JSONL
      await writeJsonl(record);
      records.push(record);

    } catch (error) {
      log(`Page ${pageIndex}, Row ${i}: Error processing row: ${error}`);

      // Try to close any open modal
      try {
        await page.keyboard.press('Escape');
        await delay(300);
      } catch {}
    }
  }

  return records;
}

async function scrapeAllPages(page: Page): Promise<AssociationRecord[]> {
  const allRecords: AssociationRecord[] = [];
  let pageIndex = 1;

  log('Starting scrape of all pages...');

  // Scrape first page
  const firstPageRecords = await scrapePage(page, pageIndex);
  allRecords.push(...firstPageRecords);

  // Continue with remaining pages
  while (await hasNextPage(page)) {
    pageIndex++;
    log(`Navigating to page ${pageIndex}...`);

    const success = await goToNextPage(page);
    if (!success) {
      log(`Failed to navigate to page ${pageIndex}, stopping pagination`);
      break;
    }

    const pageRecords = await scrapePage(page, pageIndex);
    allRecords.push(...pageRecords);

    // Safety check - don't exceed 200 pages
    if (pageIndex >= 200) {
      log(`Reached safety limit of 200 pages, stopping`);
      break;
    }
  }

  log(`Completed scraping ${pageIndex} pages`);
  return allRecords;
}

async function main(): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Initialize log file
  fs.writeFileSync(LOG_PATH, `Scrape started at ${SCRAPED_AT}\n`);
  fs.appendFileSync(LOG_PATH, `Run ID: ${SCRAPE_RUN_ID}\n`);
  fs.appendFileSync(LOG_PATH, `Municipality: ${MUNICIPALITY}\n`);
  fs.appendFileSync(LOG_PATH, `Source System: ${SOURCE_SYSTEM}\n\n`);

  log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1760, height: 1256 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate and accept cookies
    log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL);
    await randomDelay(1000, 1500);

    log('Step 1: Dismissing cookie banner...');
    await dismissCookieBanner(page);
    await randomDelay(500, 1000);

    // Step 2: Click on "Association register" link in menu
    log('Step 2: Clicking on Association register link...');
    try {
      const associationRegisterLink = page.getByRole('link', { name: /Association register|Föreningsregister/i });
      if (await associationRegisterLink.count() > 0) {
        await associationRegisterLink.click();
        await randomDelay(1000, 1500);
        log('Association register link clicked');
      } else {
        log('Association register link not found, assuming already on correct page');
      }
    } catch (error) {
      log(`Could not click association register link: ${error}`);
    }

    // Step 3: Set items per page to maximum (100)
    log('Step 3: Setting items per page to maximum (100)...');
    try {
      const itemsPerPageSelect = page.locator('select').first();
      if (await itemsPerPageSelect.count() > 0) {
        await itemsPerPageSelect.selectOption('100');
        await randomDelay(1000, 1500);
        await waitForListReady(page);
        log('Items per page set to 100');
      }
    } catch (error) {
      log(`Could not set items per page: ${error}`);
    }

    // Step 4: Go to last page to count total associations
    log('Step 4: Navigating to last page to count total associations...');
    let totalAssociationsExpected = 0;
    try {
      const lastPageLink = page.getByRole('link', { name: 'Last' });
      if (await lastPageLink.count() > 0) {
        await lastPageLink.click();
        await randomDelay(1000, 1500);
        await waitForListReady(page);

        // Extract total count from pagination text (e.g., "501 - 586 of 586 items")
        const paginationText = await page.locator('text=/\\d+ of \\d+ items/i').first().textContent();
        const match = paginationText?.match(/of (\d+) items/i);
        if (match) {
          totalAssociationsExpected = parseInt(match[1], 10);
          log(`Total associations found: ${totalAssociationsExpected}`);
        }
      }
    } catch (error) {
      log(`Could not navigate to last page or extract count: ${error}`);
    }

    // Step 5: Go back to first page
    log('Step 5: Navigating back to first page...');
    try {
      const firstPageLink = page.getByRole('link', { name: 'First' });
      if (await firstPageLink.count() > 0) {
        await firstPageLink.click();
        await randomDelay(1000, 1500);
        await waitForListReady(page);
        log('Back on first page');
      }
    } catch (error) {
      log(`Could not navigate to first page: ${error}`);
    }

    // Step 6-10: Scrape all pages
    log('Steps 6-10: Scraping all associations...');
    const allRecords = await scrapeAllPages(page);

    // Step 11: Verify count matches
    log('Step 11: Verifying total count...');
    if (totalAssociationsExpected > 0) {
      if (allRecords.length === totalAssociationsExpected) {
        log(`✓ SUCCESS: Scraped ${allRecords.length} associations, matches expected count of ${totalAssociationsExpected}`);
      } else {
        log(`⚠ WARNING: Scraped ${allRecords.length} associations, but expected ${totalAssociationsExpected}`);
      }
    } else {
      log(`Scraped ${allRecords.length} associations (could not verify expected count)`);
    }

    // Write pretty JSON
    log('Writing pretty JSON file...');
    await writePrettyJson(allRecords);

    // Sanitize records for validation
    log('Sanitizing records for validation...');
    const sanitizedRecords = sanitizeForValidation(allRecords);

    // Write sanitized pretty JSON
    await writePrettyJson(sanitizedRecords);

    // Import to database
    await runDatabaseImport(MUNICIPALITY, log);

    // Log summary
    log('\n=== SCRAPE SUMMARY ===');
    log(`Total associations scraped: ${totalAssociations}`);
    log(`Distinct homepage domains: ${homepageDomains.size}`);
    log(`Records missing org_number: ${missingOrgNumber}`);
    log(`Records missing contacts: ${missingContacts}`);
    log(`\nOutput files:`);
    log(`  JSONL: ${JSONL_PATH}`);
    log(`  JSON: ${JSON_PATH}`);
    log(`  Log: ${LOG_PATH}`);

  } catch (error) {
    log(`FATAL ERROR: ${error}`);
    throw error;
  } finally {
    await browser.close();
    log('\nBrowser closed. Scrape complete.');
  }
}

// Run the scraper
main().catch(console.error);
