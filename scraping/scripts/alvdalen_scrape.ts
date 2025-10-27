import { chromium, Browser, Page, Locator } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeForValidation } from '../utils/sanitize';
import { getScrapingPaths, runDatabaseImport, createLogger } from '../utils/scraper-base';

// Configuration
const SOURCE_SYSTEM = 'ActorSmartbook';
const MUNICIPALITY = 'Älvdalen';
const BASE_URL = 'https://alvdalen.actorsmartbook.se/Associations.aspx';
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

// Output paths
const { jsonDir, logsDir } = getScrapingPaths();
const JSON_PATH = path.join(jsonDir, `${MUNICIPALITY}.json`);
const JSONL_PATH = path.join(jsonDir, `${MUNICIPALITY}.jsonl`);
const LOG_PATH = path.join(logsDir, `${MUNICIPALITY}_log_${new Date().toISOString().split('T')[0]}.log`);

// Logger
const logger = createLogger(MUNICIPALITY);

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
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
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
  try {
    // Wait for page to be ready - just wait for any button to be present
    await page.waitForSelector('button', {
      state: 'visible',
      timeout: 10000
    });
    await delay(800); // Additional stability wait for Actor Smartbook
  } catch (error) {
    logger.info(`Warning: waitForListReady timed out: ${error}`);
  }
}

async function hasNextPage(page: Page): Promise<boolean> {
  try {
    // Actor Smartbook uses "Nästa" button for next page
    const nextButton = page.getByRole('button', { name: 'Nästa' });
    const count = await nextButton.count();
    if (count === 0) return false;

    // Check if it's disabled
    const isDisabled = await nextButton.isDisabled();
    return !isDisabled;
  } catch {
    return false;
  }
}

async function goToNextPage(page: Page, retries: number = 2): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const nextButton = page.getByRole('button', { name: 'Nästa' });
      await nextButton.click();
      await randomDelay(400, 800);
      await waitForListReady(page);
      return true;
    } catch (error) {
      logger.info(`Error navigating to next page (attempt ${attempt + 1}/${retries}): ${error}`);
      if (attempt < retries - 1) {
        await delay(1000);
      }
    }
  }
  return false;
}

async function getAssociationButtons(page: Page): Promise<number> {
  try {
    // Actor Smartbook has "Info" buttons for each association
    const infoButtons = page.getByRole('button', { name: 'Info' });
    return await infoButtons.count();
  } catch {
    return 0;
  }
}

async function openAssociationDetail(page: Page, index: number, retries: number = 2): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const infoButtons = page.getByRole('button', { name: 'Info' });
      await infoButtons.nth(index).click();

      // Wait for the modal to appear
      await page.waitForSelector('.modal-content', {
        state: 'visible',
        timeout: 5000
      });
      await delay(500);
      return true;
    } catch (error) {
      logger.info(`Error opening detail (attempt ${attempt + 1}/${retries}): ${error}`);
      if (attempt < retries - 1) {
        await delay(500);
      }
    }
  }
  return false;
}

async function closeAssociationDetail(page: Page): Promise<void> {
  try {
    // Actor Smartbook uses × button to close modal
    const closeButton = page.getByRole('button', { name: '×' });
    await closeButton.click();
    await delay(300);
  } catch (error) {
    logger.info(`Warning: Error closing detail modal: ${error}`);
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
    logger.info(`Warning: Error extracting field "${labelText}": ${error}`);
  }
  return null;
}

async function extractDetailData(page: Page): Promise<{
  name: string;
  orgNumber: string | null;
  email: string | null;
  homepage: string | null;
  city: string | null;
  description: string | null;
  activities: string[];
  types: string[];
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
}> {
  const result = {
    name: '',
    orgNumber: null as string | null,
    email: null as string | null,
    homepage: null as string | null,
    city: null as string | null,
    description: null as string | null,
    activities: [] as string[],
    types: [] as string[],
    contacts: [] as Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>
  };

  try {
    // Extract name from modal header
    try {
      const heading = page.locator('.modal-header h3').first();
      const headingText = await heading.textContent();
      result.name = normalizeString(headingText) || '';
    } catch {
      logger.info('Warning: Could not extract association name from modal header');
    }

    // Extract fields from ul.assn-info using the helper function
    result.orgNumber = await extractFieldFromList(page, 'Org.nr:');
    result.email = await extractFieldFromList(page, 'Epost:');
    const homepage = await extractFieldFromList(page, 'Hemsida:');
    if (homepage) {
      // Normalize homepage URL
      result.homepage = homepage.startsWith('http') ? homepage : `https://${homepage}`;
    }
    result.city = await extractFieldFromList(page, 'Ort:');

    // Extract contacts from table
    try {
      // Find the table with contact persons
      const table = page.locator('table').filter({
        has: page.locator('th:has-text("Namn")')
      }).first();

      const rows = table.locator('tbody tr[data-ng-repeat]');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const cells = row.locator('td');
        const cellCount = await cells.count();

        if (cellCount >= 4) {
          const name = normalizeString(await cells.nth(0).textContent());
          const email = normalizeString(await cells.nth(1).textContent());
          const phone = normalizeString(await cells.nth(2).textContent());
          const role = normalizeString(await cells.nth(3).textContent());

          if (name) {
            result.contacts.push({
              contact_person_name: name,
              contact_person_role: role,
              contact_person_email: email ? email.toLowerCase() : null,
              contact_person_phone: phone
            });
          }
        }
      }

      logger.info(`  Extracted ${result.contacts.length} contact(s)`);
    } catch (error) {
      logger.info(`Warning: Error extracting contacts table: ${error}`);
    }

  } catch (error) {
    logger.info(`Warning: Error in extractDetailData: ${error}`);
  }

  return result;
}

async function scrapePage(page: Page, pageIndex: number): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];

  await waitForListReady(page);

  // Check if there are any associations on this page
  const associationCount = await getAssociationButtons(page);

  if (associationCount === 0) {
    logger.info(`Page ${pageIndex}: No associations found`);
    return records;
  }

  logger.info(`Page ${pageIndex}: Found ${associationCount} associations`);

  for (let i = 0; i < associationCount; i++) {
    try {
      logger.info(`Page ${pageIndex}, Position ${i}: Opening detail...`);

      // Open detail modal
      const opened = await openAssociationDetail(page, i);
      if (!opened) {
        logger.info(`Page ${pageIndex}, Position ${i}: Failed to open detail after retries, skipping`);
        continue;
      }

      // Extract data from detail modal
      const detailData = await extractDetailData(page);

      if (!detailData.name) {
        logger.info(`Page ${pageIndex}, Position ${i}: No name found, skipping`);
        await closeAssociationDetail(page);
        continue;
      }

      logger.info(`Page ${pageIndex}, Position ${i}: Processing "${detailData.name}"`);

      // Build the record
      const record: AssociationRecord = {
        source_system: SOURCE_SYSTEM,
        municipality: MUNICIPALITY,
        scrape_run_id: SCRAPE_RUN_ID,
        scraped_at: SCRAPED_AT,
        association: {
          name: detailData.name,
          org_number: detailData.orgNumber,
          types: detailData.types,
          activities: detailData.activities,
          categories: [],
          homepage_url: detailData.homepage,
          detail_url: `${BASE_URL}#association-${pageIndex}-${i}`,
          street_address: null,
          postal_code: null,
          city: detailData.city,
          email: detailData.email ? detailData.email.toLowerCase() : null,
          phone: null,
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

      // Close detail modal
      await closeAssociationDetail(page);
      await randomDelay(300, 500);

    } catch (error) {
      logger.info(`Page ${pageIndex}, Position ${i}: Error processing association: ${error}`);
      // Try to close modal if it's open
      try {
        await closeAssociationDetail(page);
      } catch {}
    }
  }

  return records;
}

async function getTotalPages(page: Page): Promise<number> {
  try {
    // Look for "Sidan X/Y" pattern
    const bodyText = await page.locator('body').textContent();
    const match = bodyText?.match(/Sidan\s+(\d+)\s*\/\s*(\d+)/i);
    if (match) {
      const totalPages = parseInt(match[2]);
      logger.info(`Detected total pages: ${totalPages}`);
      return totalPages;
    }
  } catch (error) {
    logger.info(`Warning: Could not detect total pages: ${error}`);
  }
  return 999; // Fallback to high number
}

async function scrapeAllPages(page: Page): Promise<AssociationRecord[]> {
  const allRecords: AssociationRecord[] = [];
  let pageIndex = 1;

  logger.info('Starting scrape of all pages...');

  // Get total number of pages
  const totalPages = await getTotalPages(page);
  logger.info(`Will scrape ${totalPages} pages`);

  // Scrape first page
  const firstPageRecords = await scrapePage(page, pageIndex);
  allRecords.push(...firstPageRecords);

  // Continue with remaining pages using "Nästa" button
  while (pageIndex < totalPages && await hasNextPage(page)) {
    pageIndex++;
    logger.info(`Navigating to page ${pageIndex}/${totalPages}...`);

    const success = await goToNextPage(page);
    if (!success) {
      logger.info(`Failed to navigate to page ${pageIndex}, stopping pagination`);
      break;
    }

    const pageRecords = await scrapePage(page, pageIndex);
    allRecords.push(...pageRecords);

    // Stop if we've reached the total pages
    if (pageIndex >= totalPages) {
      logger.info(`Reached final page ${pageIndex}/${totalPages}, stopping`);
      break;
    }
  }

  logger.info(`Completed scraping ${pageIndex} pages out of ${totalPages} total`);
  return allRecords;
}

async function main(): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  logger.info('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 3440, height: 1440 }
  });
  const page = await context.newPage();

  try {
    logger.info(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL);
    await randomDelay(1000, 1500);

    // Scrape all pages
    const allRecords = await scrapeAllPages(page);

    // Sanitize records
    const sanitizedRecords = sanitizeForValidation(allRecords);

    // Write pretty JSON
    logger.info('Writing pretty JSON file...');
    await writePrettyJson(sanitizedRecords);

    // Import to database
    await runDatabaseImport();

    // Log summary
    logger.info('\n=== SCRAPE SUMMARY ===');
    logger.info(`Total associations scraped: ${totalAssociations}`);
    logger.info(`Distinct homepage domains: ${homepageDomains.size}`);
    logger.info(`Records missing org_number: ${missingOrgNumber}`);
    logger.info(`Records missing contacts: ${missingContacts}`);
    logger.info(`\nOutput files:`);
    logger.info(`  JSONL: ${JSONL_PATH}`);
    logger.info(`  JSON: ${JSON_PATH}`);
    logger.info(`  Log: ${LOG_PATH}`);

  } catch (error) {
    logger.info(`FATAL ERROR: ${error}`);
    throw error;
  } finally {
    await browser.close();
    logger.info('\nBrowser closed. Scrape complete.');
  }
}

// Run the scraper
main().catch(console.error);
