import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { getScrapingPaths, createLogger, runDatabaseImport } from '../utils/scraper-base';
import { sanitizeForValidation } from '../utils/sanitize';

// Configuration
const SOURCE_SYSTEM = 'Rbok';
const MUNICIPALITY = 'Karlstad';
const BASE_URL = 'https://karlstad.rbok.se/foreningsregister';
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

// Get paths from environment
const paths = getScrapingPaths(MUNICIPALITY);
const OUTPUT_DIR = paths.outputDir;
const JSONL_PATH = paths.jsonlPath;
const JSON_PATH = paths.jsonPath;
const LOG_PATH = paths.logPath;

// Create logger
const log = createLogger(LOG_PATH);

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

async function hasNextPage(page: Page): Promise<boolean> {
  try {
    // Check if "Next" button/link exists and is not disabled
    const nextButton = page.locator('[aria-label="Next"]');
    const count = await nextButton.count();
    if (count === 0) return false;

    // Check if it's disabled
    const isDisabled = await nextButton.evaluate((el) => {
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
    const nextButton = page.locator('[aria-label="Next"]');
    await nextButton.click();
    await randomDelay();
    await waitForListReady(page);
    return true;
  } catch (error) {
    log(`Error navigating to next page: ${error}`);
    return false;
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
    // Wait for modal to appear with the association name
    const modal = page.getByLabel(associationName, { exact: true });
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    await delay(300);

    // Extract text content from modal
    const modalText = await modal.textContent();
    if (!modalText) return result;

    // Try to extract org number (format: NNNNNN-NNNN)
    const orgMatch = modalText.match(/\b(\d{6}-\d{4})\b/);
    if (orgMatch) {
      result.orgNumber = orgMatch[1];
    }

    // Try to extract email
    const emailMatch = modalText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
    }

    // Try to extract phone/mobile
    const phonePatterns = [
      /(?:Tel|Telefon|Phone|Mobil)[:\s]*([\d\s\-+()]+)/i,
      /\b(\+46[\s\-]?\d{1,3}[\s\-]?\d{5,})\b/,
      /\b(0\d{1,3}[\s\-]?\d{5,})\b/
    ];

    for (const pattern of phonePatterns) {
      const phoneMatch = modalText.match(pattern);
      if (phoneMatch) {
        result.phone = normalizeString(phoneMatch[1]);
        break;
      }
    }

    // Try to extract website/homepage
    const urlMatch = modalText.match(/(?:Hemsida|Website|Webb)[:\s]*(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      result.homepage = urlMatch[1];
    } else {
      // Try to find URLs in the modal
      const links = modal.locator('a[href^="http"]');
      const linkCount = await links.count();
      if (linkCount > 0) {
        const href = await links.first().getAttribute('href');
        if (href) {
          result.homepage = href;
        }
      }
    }

    // Try to extract address
    const addressMatch = modalText.match(/(?:Adress|Address)[:\s]*([^\n]+)/i);
    if (addressMatch) {
      result.address = normalizeString(addressMatch[1]);
    }

    // Try to extract postal code and city
    const postalMatch = modalText.match(/\b(\d{3}\s?\d{2})\s+([A-ZÅÄÖ][a-zåäö]+)/);
    if (postalMatch) {
      result.postalCode = postalMatch[1].replace(/\s/g, '');
      result.city = normalizeString(postalMatch[2]);
    }

    // Try to extract type/category
    const typeMatch = modalText.match(/(?:Typ|Type|Kategori|Category)[:\s]*([^\n]+)/i);
    if (typeMatch) {
      result.type = normalizeString(typeMatch[1]);
    }

    // Try to extract contact person
    const contactPatterns = [
      /(?:Kontaktperson|Ansvarig|Föreningsansvarig)[:\s]*([A-ZÅÄÖ][^\n]+)/i,
      /(?:Ordförande|Kassör|Sekreterare)[:\s]*([A-ZÅÄÖ][^\n]+)/i
    ];

    for (const pattern of contactPatterns) {
      const contactMatch = modalText.match(pattern);
      if (contactMatch) {
        const name = normalizeString(contactMatch[1]);
        if (name && name.split(/\s+/).length >= 2) {
          // Check if this looks like a name (at least two words)
          result.contacts.push({
            contact_person_name: name,
            contact_person_role: null,
            contact_person_email: null,
            contact_person_phone: null
          });
          break;
        }
      }
    }

    // Try to extract description
    const descPatterns = [
      /(?:Beskrivning|Description|Information|Info)[:\s]*([^\n]+(?:\n(?![A-Z][a-zåäö]+:)[^\n]+)*)/i
    ];

    for (const pattern of descPatterns) {
      const descMatch = modalText.match(pattern);
      if (descMatch) {
        result.description = normalizeString(descMatch[1]);
        if (result.description) break;
      }
    }

  } catch (error) {
    log(`Warning: Error extracting modal data: ${error}`);
  }

  return result;
}

async function dismissCookieBanner(page: Page): Promise<void> {
  try {
    // Check for EU cookie popup and dismiss it
    const cookiePopup = page.locator('.eupopup-container');
    const popupCount = await cookiePopup.count();
    if (popupCount > 0) {
      const acceptButton = cookiePopup.locator('button:has-text("Acceptera"), button:has-text("Accept"), button:has-text("Agree")');
      const acceptCount = await acceptButton.count();
      if (acceptCount > 0) {
        await acceptButton.first().click({ timeout: 2000 });
        await delay(500);
        log('Cookie banner dismissed');
      }
    }
  } catch (error) {
    // Ignore - cookie banner might not be present
  }
}

async function closeAllModals(page: Page): Promise<void> {
  try {
    // Close all open modals using multiple strategies
    for (let attempt = 0; attempt < 10; attempt++) {
      const openModals = page.locator('[role="dialog"][aria-modal="true"]');
      const count = await openModals.count();

      if (count === 0) {
        return; // All modals closed
      }

      // Try Escape key
      await page.keyboard.press('Escape');
      await delay(200);

      // Try clicking close buttons
      const closeButtons = page.locator('[role="dialog"] button[aria-label="Stäng"]');
      const closeCount = await closeButtons.count();
      if (closeCount > 0) {
        for (let i = 0; i < Math.min(closeCount, 3); i++) {
          try {
            await closeButtons.nth(i).click({ force: true, timeout: 1000 });
            await delay(200);
          } catch {}
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

async function closeModal(page: Page, associationName: string): Promise<void> {
  try {
    // First try to dismiss any cookie banner that might be blocking
    await dismissCookieBanner(page);

    // Try multiple strategies to close the modal
    const strategies = [
      // Strategy 1: Use Escape key (simplest)
      async () => {
        await page.keyboard.press('Escape');
        await delay(300);
      },
      // Strategy 2: Force click close button
      async () => {
        const closeButtons = page.locator('[role="dialog"] button[aria-label="Stäng"]');
        const count = await closeButtons.count();
        if (count > 0) {
          await closeButtons.first().click({ force: true, timeout: 3000 });
          await delay(300);
        }
      },
      // Strategy 3: Use the exact modal label and Close text with force
      async () => {
        const modal = page.getByLabel(associationName, { exact: true });
        const closeButton = modal.getByText('Close');
        await closeButton.click({ force: true, timeout: 3000 });
        await delay(300);
      }
    ];

    for (const strategy of strategies) {
      try {
        await strategy();

        // Check if modal is actually closed
        const openModals = page.locator('[role="dialog"][aria-modal="true"]');
        const count = await openModals.count();
        if (count === 0) {
          return; // Successfully closed
        }
      } catch (error) {
        // Try next strategy
        continue;
      }
    }

    // If still open, use brute force
    await closeAllModals(page);
  } catch (error) {
    log(`Warning: Error closing modal: ${error}`);
  }
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

      // Dismiss cookie banner if it appears (only once per page)
      if (i === 0) {
        await dismissCookieBanner(page);
      }

      // Click the info link to open modal (cell 4)
      const infoCell = cells.nth(4);
      const infoLink = infoCell.locator('a').first();
      const infoLinkCount = await infoLink.count();

      if (infoLinkCount === 0) {
        log(`Page ${pageIndex}, Row ${i}: No info link found`);
        continue;
      }

      await infoLink.click({ timeout: 10000 });
      await randomDelay();

      // Extract data from modal
      const modalData = await extractDetailModalData(page, associationName);

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
        const anyCloseButton = page.getByText('Close').first();
        const closeCount = await anyCloseButton.count();
        if (closeCount > 0) {
          await anyCloseButton.click();
          await delay(300);
        }
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

    // Safety check - don't exceed 100 pages
    if (pageIndex >= 100) {
      log(`Reached safety limit of 100 pages, stopping`);
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
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL);
    await randomDelay();

    // Scrape all pages
    const allRecords = await scrapeAllPages(page);

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
