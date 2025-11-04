import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { getScrapingPaths, createLogger, runDatabaseImport } from '../utils/scraper-base';
import { sanitizeForValidation } from '../utils/sanitize';

// Load environment variables
config();

// Configuration
const SOURCE_SYSTEM = 'ActorSmartbook';
const MUNICIPALITY = 'Boras';
const BASE_URL = 'https://boras.actorsmartbook.se/Associations.aspx';
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

// Get paths from environment
const paths = getScrapingPaths(MUNICIPALITY);
const OUTPUT_DIR = paths.outputDir;
const JSONL_PATH = paths.jsonlPath;
const JSON_PATH = paths.jsonPath;
const LOG_PATH = paths.logPath;

// Logger
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
async function handleCookieConsent(page: Page): Promise<void> {
  try {
    const cookieButton = page.getByRole('button', { name: /Godkänn alla cookies/i });
    const count = await cookieButton.count();
    if (count > 0) {
      await cookieButton.click();
      await delay(500);
      log.info('Accepted cookie consent');
    }
  } catch (error) {
    log.info(`No cookie consent found or already accepted: ${error}`);
  }
}

async function waitForListReady(page: Page): Promise<void> {
  try {
    // Wait for association cards to be visible
    await page.waitForSelector('.association-card, .card, [class*="association"]', {
      state: 'visible',
      timeout: 10000
    });
    await delay(500);
  } catch (error) {
    log.info(`Warning: Could not find association cards, trying alternative selector`);
    await delay(1000);
  }
}

async function hasNextPage(page: Page): Promise<boolean> {
  try {
    const nextButton = page.getByRole('button', { name: 'Nästa' });
    const count = await nextButton.count();
    if (count === 0) return false;

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
    const nextButton = page.getByRole('button', { name: 'Nästa' });
    await nextButton.click();
    await randomDelay(500, 1000);
    await waitForListReady(page);
    return true;
  } catch (error) {
    log.info(`Error navigating to next page: ${error}`);
    return false;
  }
}

async function goToFirstPage(page: Page): Promise<void> {
  try {
    const firstButton = page.getByRole('button', { name: 'Första' });
    const count = await firstButton.count();
    if (count > 0) {
      await firstButton.click();
      await randomDelay(500, 1000);
      await waitForListReady(page);
      log.info('Navigated to first page');
    }
  } catch (error) {
    log.info(`Could not navigate to first page: ${error}`);
  }
}

async function extractFieldFromList(page: Page, labelText: string): Promise<string | null> {
  try {
    // Find list items in ul.assn-info
    const listItems = page.locator('ul.assn-info li');
    const count = await listItems.count();

    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const text = await item.textContent();

      if (text && text.includes(labelText)) {
        // Extract the value part (after the label)
        const spans = item.locator('span');
        const spanCount = await spans.count();

        if (spanCount >= 2) {
          const value = await spans.nth(1).textContent();
          return normalizeString(value);
        }
      }
    }
  } catch (error) {
    log.info(`Warning: Error extracting field "${labelText}": ${error}`);
  }
  return null;
}

async function extractDetailModalData(page: Page): Promise<{
  name: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  orgNumber: string | null;
  homepage: string | null;
  categories: string[];
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
}> {
  const result = {
    name: null as string | null,
    description: null as string | null,
    email: null as string | null,
    phone: null as string | null,
    address: null as string | null,
    postalCode: null as string | null,
    city: null as string | null,
    orgNumber: null as string | null,
    homepage: null as string | null,
    categories: [] as string[],
    contacts: [] as Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>
  };

  try {
    // Wait for modal content
    await delay(800);

    // Extract name from modal header
    try {
      const modalHeader = page.locator('.modal-header h3');
      const headerCount = await modalHeader.count();
      if (headerCount > 0) {
        const headerText = await modalHeader.first().textContent();
        if (headerText) {
          result.name = normalizeString(headerText);
        }
      }
    } catch {}

    // Extract fields from ul.assn-info using extractFieldFromList
    result.orgNumber = await extractFieldFromList(page, 'Org.nr:');
    result.email = await extractFieldFromList(page, 'Epost:');
    const homepage = await extractFieldFromList(page, 'Hemsida:');
    if (homepage) {
      result.homepage = homepage.startsWith('http') ? homepage : `https://${homepage}`;
    }
    result.city = await extractFieldFromList(page, 'Ort:');

    // Extract contact persons from table (Kontaktpersoner)
    try {
      // Look for table with headers: Namn, E-post, Mobil, Roll
      const contactTable = page.locator('table:has-text("Namn"), table:has-text("Kontaktperson")').first();
      const tableCount = await contactTable.count();

      if (tableCount > 0) {
        const rows = contactTable.locator('tbody tr');
        const rowCount = await rows.count();

        for (let i = 0; i < rowCount; i++) {
          const row = rows.nth(i);
          const cells = row.locator('td');
          const cellCount = await cells.count();

          if (cellCount >= 1) {
            const name = normalizeString(await cells.nth(0).textContent());
            const email = cellCount >= 2 ? normalizeString(await cells.nth(1).textContent()) : null;
            const phone = cellCount >= 3 ? normalizeString(await cells.nth(2).textContent()) : null;
            const role = cellCount >= 4 ? normalizeString(await cells.nth(3).textContent()) : null;

            if (name) {
              result.contacts.push({
                contact_person_name: name,
                contact_person_role: role,
                contact_person_email: email,
                contact_person_phone: phone
              });
            }
          }
        }
      }
    } catch {}

    // If no contacts found in table, try to find single contact person
    if (result.contacts.length === 0) {
      try {
        const contactLabels = ['Ansvarig', 'Föreningsansvarig', 'Kontaktperson', 'Kontakt'];
        for (const label of contactLabels) {
          const contactElement = page.locator(`text=/${label}/i`).first();
          const count = await contactElement.count();
          if (count > 0) {
            // Try to get the next text element
            const parent = contactElement.locator('xpath=ancestor::*[1]');
            const parentText = await parent.textContent();
            if (parentText) {
              const nameMatch = parentText.match(/[A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+/);
              if (nameMatch) {
                result.contacts.push({
                  contact_person_name: nameMatch[0],
                  contact_person_role: null,
                  contact_person_email: null,
                  contact_person_phone: null
                });
                break;
              }
            }
          }
        }
      } catch {}
    }

  } catch (error) {
    log.info(`Warning: Error extracting modal data: ${error}`);
  }

  return result;
}

async function scrapePage(page: Page, pageIndex: number): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];

  await waitForListReady(page);

  // Get all "Info" buttons for associations
  const infoButtons = page.getByRole('button', { name: 'Info' });
  const buttonCount = await infoButtons.count();

  log.info(`Page ${pageIndex}: Found ${buttonCount} associations`);

  for (let i = 0; i < buttonCount; i++) {
    try {
      // Re-query buttons each iteration (DOM may have changed)
      const buttons = page.getByRole('button', { name: 'Info' });
      const currentButton = buttons.nth(i);

      log.info(`Page ${pageIndex}, Row ${i}: Opening modal...`);

      // Click the Info button to open modal
      await currentButton.click();
      await randomDelay(400, 800);

      // Extract data from modal (including the name)
      const detailData = await extractDetailModalData(page);

      // Close modal
      const closeButton = page.getByRole('button', { name: '×' });
      const closeCount = await closeButton.count();
      if (closeCount > 0) {
        await closeButton.click();
        await randomDelay(300, 500);
      }

      if (!detailData.name) {
        log.info(`Page ${pageIndex}, Row ${i}: Could not extract name from modal, skipping`);
        continue;
      }

      log.info(`Page ${pageIndex}, Row ${i}: Processing "${detailData.name}"`);

      // Build the record
      const record: AssociationRecord = {
        source_system: SOURCE_SYSTEM,
        municipality: MUNICIPALITY,
        scrape_run_id: SCRAPE_RUN_ID,
        scraped_at: SCRAPED_AT,
        association: {
          name: detailData.name,
          org_number: detailData.orgNumber,
          types: [],
          activities: [],
          categories: detailData.categories,
          homepage_url: detailData.homepage,
          detail_url: `${BASE_URL}#association-${i}`,
          street_address: detailData.address,
          postal_code: detailData.postalCode,
          city: detailData.city,
          email: detailData.email,
          phone: detailData.phone,
          description: detailData.description
        },
        contacts: detailData.contacts,
        source_navigation: {
          list_page_index: pageIndex,
          position_on_page: i,
          pagination_model: 'first_prev_next_last',
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
      log.info(`Page ${pageIndex}, Row ${i}: Error processing association: ${error}`);
      // Try to close any open modal before continuing
      try {
        const closeButton = page.getByRole('button', { name: '×' });
        const closeCount = await closeButton.count();
        if (closeCount > 0) {
          await closeButton.click();
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

  log.info('Starting scrape of all pages...');

  // Go to first page to ensure we start from the beginning
  await goToFirstPage(page);

  // Scrape first page
  const firstPageRecords = await scrapePage(page, pageIndex);
  allRecords.push(...firstPageRecords);

  // Continue with remaining pages
  while (await hasNextPage(page)) {
    pageIndex++;
    log.info(`Navigating to page ${pageIndex}...`);

    const success = await goToNextPage(page);
    if (!success) {
      log.info(`Failed to navigate to page ${pageIndex}, stopping pagination`);
      break;
    }

    const pageRecords = await scrapePage(page, pageIndex);
    allRecords.push(...pageRecords);

    // Safety check - don't exceed 100 pages
    if (pageIndex >= 100) {
      log.info(`Reached safety limit of 100 pages, stopping`);
      break;
    }
  }

  log.info(`Completed scraping ${pageIndex} pages`);
  return allRecords;
}

async function main(): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  log.info('='.repeat(80));
  log.info(`Starting scrape: ${MUNICIPALITY} (${SOURCE_SYSTEM})`);
  log.info(`Run ID: ${SCRAPE_RUN_ID}`);
  log.info(`Base URL: ${BASE_URL}`);
  log.info('='.repeat(80));

  log.info('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    log.info(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL);
    await randomDelay();

    // Handle cookie consent
    await handleCookieConsent(page);

    // Scrape all pages
    const allRecords = await scrapeAllPages(page);

    // Sanitize records
    const sanitizedRecords = sanitizeForValidation(allRecords);

    // Write pretty JSON
    log.info('Writing pretty JSON file...');
    await writePrettyJson(sanitizedRecords);

    // Import to database
    await runDatabaseImport(MUNICIPALITY, log);

    // Log summary
    log.info('='.repeat(80));
    log.info('SCRAPING COMPLETE');
    log.info('='.repeat(80));
    log.info(`Total associations scraped: ${totalAssociations}`);
    log.info(`Distinct homepage domains: ${homepageDomains.size}`);
    log.info(`Records missing org_number: ${missingOrgNumber}`);
    log.info(`Records missing contacts: ${missingContacts}`);
    log.info(`\nOutput files:`);
    log.info(`  JSONL: ${JSONL_PATH}`);
    log.info(`  JSON:  ${JSON_PATH}`);
    log.info(`  Log:   ${LOG_PATH}`);
    log.info('='.repeat(80));

  } catch (error) {
    log.info(`FATAL ERROR: ${error}`);
    throw error;
  } finally {
    await browser.close();
    log.info('\nBrowser closed. Scrape complete.');
  }
}

// Run the scraper
main().catch(console.error);
