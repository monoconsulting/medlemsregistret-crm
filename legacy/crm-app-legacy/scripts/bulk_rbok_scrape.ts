/**
 * Bulk RBOK Scraper
 *
 * Automatically scrapes all municipalities with RBOK platform.
 * Fetches municipality list from database, scrapes each one sequentially using Playwright, and saves to JSON files.
 *
 * Follows MUNICIPAL_ASSOCIATION_JSON_STANDARD.md for output format.
 */

import { PrismaClient } from '@prisma/client';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { randomUUID } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
    }
  }
});

// Configuration
const SOURCE_SYSTEM = 'RBOK';
const DELAY_BETWEEN_MUNICIPALITIES = 3000; // 3 seconds between municipalities
const DELAY_BETWEEN_REQUESTS = 300; // 300ms between requests
const DELAY_BETWEEN_MODALS = 200; // 200ms between modal interactions

// Output directory - use environment variables from .env
const PROJECT_ROOT = path.join(process.cwd(), '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, process.env.SCRAPING_JSON_DIR || 'scraping/json');
const LOGS_DIR = path.join(PROJECT_ROOT, process.env.SCRAPING_LOGS_DIR || 'scraping/logs');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// JSON Standard Types (following MUNICIPAL_ASSOCIATION_JSON_STANDARD.md)
interface AssociationRecord {
  source_system: string;
  municipality: string;
  scrape_run_id: string;
  scraped_at: string;
  association: {
    detail_url: string;
    name: string;
    org_number: string | null;
    types: string[];
    activities: string[];
    categories: string[];
    homepage_url: string | null;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    description: {
      free_text: string | null;
      sections: Array<{
        title: string;
        data: Record<string, any>;
      }>;
    } | null;
  };
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
  source_navigation: {
    list_page_index: number | null;
    position_on_page: number;
    pagination_model: string;
    filter_state: any;
  };
  extras: Record<string, any>;
}

interface MunicipalityStats {
  municipality: string;
  totalAssociations: number;
  scraped: number;
  missingOrgNumber: number;
  missingEmail: number;
  missingPhone: number;
  withContacts: number;
  errors: number;
  duration: number;
}

/**
 * Normalize municipality name for file naming (remove Swedish characters)
 */
function normalizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Normalize string values
 */
function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Normalize array values and deduplicate
 */
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

/**
 * Random delay for natural browsing behavior
 */
function randomDelay(min: number = 200, max: number = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for list ready
 */
async function waitForListReady(page: Page): Promise<void> {
  await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 10000 });
  await randomDelay(300, 500);
}

/**
 * Dismiss cookie banner
 */
async function dismissCookieBanner(page: Page, log: (msg: string) => void): Promise<void> {
  try {
    const cookieSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Acceptera")',
      'button:has-text("Godkänn")',
      'button:has-text("OK")',
      '.eupopup-button'
    ];

    for (const selector of cookieSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          await button.click({ timeout: 2000 });
          await randomDelay(300, 500);
          log('Cookie banner dismissed');
          return;
        }
      } catch {}
    }
  } catch (error) {
    // Ignore - cookie banner might not be present
  }
}

/**
 * Check if pagination has next page
 */
async function hasNextPage(page: Page): Promise<boolean> {
  try {
    const nextLink = page.getByRole('link', { name: 'Next' });
    const count = await nextLink.count();
    if (count === 0) return false;

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

/**
 * Navigate to next page
 */
async function goToNextPage(page: Page): Promise<boolean> {
  try {
    const nextLink = page.getByRole('link', { name: 'Next' });
    await nextLink.click();
    await randomDelay();
    await waitForListReady(page);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Close modal dialog
 */
async function closeModal(page: Page, associationName: string): Promise<void> {
  try {
    // Method 1: Stäng button
    try {
      const stangButton = page.getByRole('button', { name: 'Stäng' }).first();
      if (await stangButton.count() > 0) {
        await stangButton.click({ timeout: 2000 });
        await randomDelay(100, 200);
        return;
      }
    } catch {}

    // Method 2: Close button in specific modal
    try {
      const specificModal = page.getByLabel(associationName, { exact: true });
      const closeButton = specificModal.getByText('Close');
      if (await closeButton.count() > 0) {
        await closeButton.click({ timeout: 2000 });
        await randomDelay(100, 200);
        return;
      }
    } catch {}

    // Method 3: Escape key
    await page.keyboard.press('Escape');
    await randomDelay(100, 200);

  } catch (error) {
    // Ignore errors
  }
}

/**
 * Extract data from RBOK modal dialog
 */
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
  operations: string[];
  targetGroups: string[];
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
    operations: [] as string[],
    targetGroups: [] as string[],
    contacts: [] as Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>
  };

  try {
    // Wait for modal to appear
    const modal = page.locator('[role="dialog"][aria-modal="true"]:not([aria-hidden="true"])').first();
    await modal.waitFor({ state: 'attached', timeout: 5000 });
    await randomDelay(300, 500);

    // Extract full modal text
    const modalText = await modal.textContent();
    if (!modalText) return result;

    // Extract description (appears before Areas/Contact/Operations section)
    const descMatch = modalText.match(/(?:^|[\r\n])((?:[^A-ZÅ][^\r\n]*[\r\n]?)+)(?=[\r\n](?:Areas|Contact|Operations|Target groups))/);
    if (descMatch && descMatch[1]) {
      const desc = normalizeString(descMatch[1]);
      if (desc && desc.length > 10 && !desc.match(/^(Areas|Contact|Operations)/)) {
        result.description = desc;
      }
    }

    // Extract Areas (categories)
    const areasMatch = modalText.match(/Areas[\s\r\n]+([\w\såäöÅÄÖ,\/\s]+?)(?=[\r\n](?:Contact|Operations|Target groups|Close|$))/i);
    if (areasMatch && areasMatch[1]) {
      const areasText = normalizeString(areasMatch[1]);
      if (areasText) {
        result.categories = areasText.split(/[,\/]/).map(s => s.trim()).filter(s => s.length > 0);
      }
    }

    // Extract Operations (verksamhet)
    const operationsMatch = modalText.match(/Operations[\s\r\n]+([\w\såäöÅÄÖ,\s]+?)(?=[\r\n](?:Target groups|Areas|Contact|Close|$))/i);
    if (operationsMatch && operationsMatch[1]) {
      const opsText = normalizeString(operationsMatch[1]);
      if (opsText) {
        result.operations = opsText.split(/,/).map(s => s.trim()).filter(s => s.length > 0);
      }
    }

    // Extract Target groups
    const targetGroupsMatch = modalText.match(/Target groups[\s\r\n]+([\w\såäöÅÄÖ(),\s]+?)(?=[\r\n](?:Areas|Contact|Operations|Close|$))/i);
    if (targetGroupsMatch && targetGroupsMatch[1]) {
      const targetText = normalizeString(targetGroupsMatch[1]);
      if (targetText) {
        result.targetGroups = targetText.split(/,/).map(s => s.trim()).filter(s => s.length > 0);
      }
    }

    // Extract Contact section
    const contactSection = modalText.match(/Contact([\s\S]+?)(?=Close|$)/i);
    if (contactSection && contactSection[1]) {
      const contactText = contactSection[1];

      // Look for contact person name
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

      // Extract phone
      const phoneMatch = contactText.match(/\b(0\d{2,4}[\s\-]?\d{5,})\b/);
      if (phoneMatch) {
        result.phone = normalizeString(phoneMatch[1]);
      }

      // Extract email
      const emailMatch = contactText.match(/\b([\w\.-]+@[\w\.-]+\.\w+)\b/);
      if (emailMatch) {
        result.email = emailMatch[1].toLowerCase();
      }

      // Extract website
      const urlMatch = contactText.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        result.homepage = urlMatch[1];
      }
    }

    // Also try to extract homepage from modal links
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

    // Extract organization number if present
    const orgMatch = modalText.match(/\b(\d{6}-\d{4})\b/);
    if (orgMatch) {
      result.orgNumber = orgMatch[1];
    }

  } catch (error) {
    // Ignore errors
  }

  return result;
}

/**
 * Scrape a single page of associations
 */
async function scrapePage(
  page: Page,
  pageIndex: number,
  municipalityName: string,
  scrapeRunId: string,
  scrapedAt: string,
  baseUrl: string,
  log: (msg: string) => void,
  isFirstPage: boolean
): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];

  await waitForListReady(page);

  // Get all table rows
  const table = page.locator('table').first();
  const rows = table.locator('tbody tr');
  const rowCount = await rows.count();

  log(`Page ${pageIndex}: Found ${rowCount} associations`);

  for (let i = 0; i < rowCount; i++) {
    try {
      // Re-query rows to avoid stale element issues
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

      // Extract list data
      const typeCell = cells.nth(2);
      const type = normalizeString(await typeCell.textContent());

      const homepageCell = cells.nth(3);
      const homepageLink = homepageCell.locator('a').first();
      let homepage: string | null = null;
      if (await homepageLink.count() > 0) {
        homepage = await homepageLink.getAttribute('href');
      }

      // Dismiss cookie banner on first row of first page
      if (isFirstPage && i === 0) {
        await dismissCookieBanner(page, log);
      }

      // Click info link to open modal
      const infoLink = currentRow.getByRole('link', { name: /Show more information about/i }).first();
      if (await infoLink.count() === 0) {
        log(`Page ${pageIndex}, Row ${i}: No info link found for "${associationName}"`);
        continue;
      }

      await infoLink.click({ timeout: 10000 });
      await randomDelay(DELAY_BETWEEN_MODALS, DELAY_BETWEEN_MODALS + 200);

      // Extract data from modal
      const modalData = await extractDetailModalData(page, associationName);

      // Close modal
      await closeModal(page, associationName);
      await randomDelay(DELAY_BETWEEN_MODALS, DELAY_BETWEEN_MODALS + 200);

      // Build description object
      let description: AssociationRecord['association']['description'] = null;
      if (modalData.description || modalData.operations.length > 0 || modalData.targetGroups.length > 0) {
        const sections: Array<{ title: string; data: Record<string, any> }> = [];

        if (modalData.operations.length > 0) {
          sections.push({
            title: 'Verksamhet',
            data: {
              operations: modalData.operations
            }
          });
        }

        if (modalData.targetGroups.length > 0) {
          sections.push({
            title: 'Målgrupper',
            data: {
              target_groups: modalData.targetGroups
            }
          });
        }

        description = {
          free_text: modalData.description,
          sections
        };
      }

      // Build record
      const record: AssociationRecord = {
        source_system: SOURCE_SYSTEM,
        municipality: municipalityName,
        scrape_run_id: scrapeRunId,
        scraped_at: scrapedAt,
        association: {
          detail_url: `${baseUrl}#${associationName.replace(/\s+/g, '-')}`,
          name: associationName,
          org_number: modalData.orgNumber,
          types: normalizeArray([type, modalData.type]),
          activities: modalData.operations,
          categories: modalData.categories,
          homepage_url: modalData.homepage || homepage,
          street_address: modalData.address,
          postal_code: modalData.postalCode,
          city: modalData.city,
          email: modalData.email,
          phone: modalData.phone,
          description
        },
        contacts: modalData.contacts,
        source_navigation: {
          list_page_index: pageIndex,
          position_on_page: i,
          pagination_model: 'rbok_next_button',
          filter_state: null
        },
        extras: {
          target_groups: modalData.targetGroups
        }
      };

      records.push(record);

    } catch (error) {
      log(`Page ${pageIndex}, Row ${i}: Error processing row: ${error}`);

      // Try to close any open modal
      try {
        await page.keyboard.press('Escape');
        await randomDelay(200, 300);
      } catch {}
    }
  }

  return records;
}

/**
 * Scrape all pages for a municipality
 */
async function scrapeAllPages(
  page: Page,
  municipalityName: string,
  baseUrl: string,
  scrapeRunId: string,
  scrapedAt: string,
  log: (msg: string) => void
): Promise<AssociationRecord[]> {
  const allRecords: AssociationRecord[] = [];
  let pageIndex = 1;
  let isFirstPage = true;

  log('Starting scrape of all pages...');

  // Scrape first page
  const firstPageRecords = await scrapePage(page, pageIndex, municipalityName, scrapeRunId, scrapedAt, baseUrl, log, isFirstPage);
  allRecords.push(...firstPageRecords);
  isFirstPage = false;

  // Continue with remaining pages
  while (await hasNextPage(page)) {
    pageIndex++;
    log(`Navigating to page ${pageIndex}...`);

    const success = await goToNextPage(page);
    if (!success) {
      log(`Failed to navigate to page ${pageIndex}, stopping pagination`);
      break;
    }

    const pageRecords = await scrapePage(page, pageIndex, municipalityName, scrapeRunId, scrapedAt, baseUrl, log, isFirstPage);
    allRecords.push(...pageRecords);

    // Safety limit
    if (pageIndex >= 200) {
      log(`Reached safety limit of 200 pages, stopping`);
      break;
    }
  }

  log(`Completed scraping ${pageIndex} pages`);
  return allRecords;
}

/**
 * Scrape a single municipality
 */
async function scrapeMunicipality(
  browser: Browser,
  municipalityName: string,
  registerUrl: string
): Promise<MunicipalityStats> {
  const startTime = Date.now();
  const scrapeRunId = randomUUID();
  const scrapedAt = new Date().toISOString();
  const normalizedName = normalizeFilename(municipalityName);

  // Create log file
  const logPath = path.join(LOGS_DIR, `${normalizedName}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    logStream.write(logMessage + '\n');
    console.log(`[${municipalityName}] ${message}`);
  };

  log(`Starting RBOK scrape for ${municipalityName}`);
  log(`URL: ${registerUrl}`);
  log(`Scrape Run ID: ${scrapeRunId}`);

  const stats: MunicipalityStats = {
    municipality: municipalityName,
    totalAssociations: 0,
    scraped: 0,
    missingOrgNumber: 0,
    missingEmail: 0,
    missingPhone: 0,
    withContacts: 0,
    errors: 0,
    duration: 0,
  };

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    // Create new context and page for this municipality
    context = await browser.newContext({
      viewport: { width: 1760, height: 1256 }
    });
    page = await context.newPage();

    log('Navigating to association register...');
    await page.goto(registerUrl, { waitUntil: 'domcontentloaded' });
    await randomDelay(1000, 1500);

    // Accept cookies if needed
    await dismissCookieBanner(page, log);

    // Navigate to Association register link if needed
    try {
      const associationRegisterLink = page.getByRole('link', { name: /Association register|Föreningsregister/i });
      if (await associationRegisterLink.count() > 0) {
        await associationRegisterLink.click();
        await randomDelay(500, 1000);
      }
    } catch {}

    // Set items per page to maximum (100)
    try {
      const itemsPerPageSelect = page.locator('select').first();
      if (await itemsPerPageSelect.count() > 0) {
        await itemsPerPageSelect.selectOption('100');
        await randomDelay(500, 1000);
      }
    } catch (error) {
      log(`Could not set items per page: ${error}`);
    }

    // Scrape all pages
    const records = await scrapeAllPages(page, municipalityName, registerUrl, scrapeRunId, scrapedAt, log);

    stats.totalAssociations = records.length;
    stats.scraped = records.length;

    // Calculate statistics
    records.forEach(record => {
      if (!record.association.org_number) stats.missingOrgNumber++;
      if (!record.association.email) stats.missingEmail++;
      if (!record.association.phone) stats.missingPhone++;
      if (record.contacts.length > 0) stats.withContacts++;
    });

    // Save to JSON file
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-');
    const jsonPath = path.join(OUTPUT_DIR, `${normalizedName}_RBOK_${dateStr}_${timeStr}.json`);

    fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
    log(`Saved JSON to: ${jsonPath}`);

    stats.duration = Date.now() - startTime;

    // Log summary
    log('=== SCRAPING COMPLETED ===');
    log(`Total associations: ${stats.totalAssociations}`);
    log(`Successfully scraped: ${stats.scraped}`);
    log(`Missing org_number: ${stats.missingOrgNumber}`);
    log(`Missing email: ${stats.missingEmail}`);
    log(`Missing phone: ${stats.missingPhone}`);
    log(`With contacts: ${stats.withContacts}`);
    log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);

  } catch (error) {
    log(`FATAL ERROR: ${error}`);
    stats.errors = 1;
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    logStream.end();
  }

  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('=== BULK RBOK SCRAPER ===\n');

  // Fetch municipalities with RBOK platform
  const municipalities = await prisma.municipality.findMany({
    where: {
      platform: 'RBOK',
      registerUrl: { not: null },
    },
    select: {
      name: true,
      registerUrl: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Found ${municipalities.length} municipalities with RBOK platform\n`);

  if (municipalities.length === 0) {
    console.log('No municipalities found with RBOK platform.');
    return;
  }

  // Launch browser once for all municipalities (reuse for performance)
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });

  const allStats: MunicipalityStats[] = [];
  const overallStartTime = Date.now();

  for (let i = 0; i < municipalities.length; i++) {
    const muni = municipalities[i];

    if (!muni.registerUrl) {
      console.log(`Skipping ${muni.name}: No register URL`);
      continue;
    }

    console.log(`\n[${i + 1}/${municipalities.length}] Starting ${muni.name}...`);

    try {
      const stats = await scrapeMunicipality(browser, muni.name, muni.registerUrl);
      allStats.push(stats);

      // Delay between municipalities
      if (i < municipalities.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_MUNICIPALITIES}ms before next municipality...\n`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MUNICIPALITIES));
      }
    } catch (error) {
      console.error(`Failed to scrape ${muni.name}:`, error);
      allStats.push({
        municipality: muni.name,
        totalAssociations: 0,
        scraped: 0,
        missingOrgNumber: 0,
        missingEmail: 0,
        missingPhone: 0,
        withContacts: 0,
        errors: 1,
        duration: 0,
      });
    }
  }

  await browser.close();

  const overallDuration = Date.now() - overallStartTime;

  // Print summary
  console.log('\n=== BULK SCRAPING SUMMARY ===\n');
  console.log('Municipality                 | Total | Scraped | Missing Org | Missing Email | Missing Phone | With Contacts | Errors | Duration');
  console.log('------------------------------|-------|---------|-------------|---------------|---------------|---------------|--------|----------');

  let totalAssociations = 0;
  let totalScraped = 0;
  let totalErrors = 0;

  allStats.forEach(stat => {
    const name = stat.municipality.padEnd(28);
    const total = stat.totalAssociations.toString().padStart(5);
    const scraped = stat.scraped.toString().padStart(7);
    const missingOrg = stat.missingOrgNumber.toString().padStart(11);
    const missingEmail = stat.missingEmail.toString().padStart(13);
    const missingPhone = stat.missingPhone.toString().padStart(13);
    const withContacts = stat.withContacts.toString().padStart(13);
    const errors = stat.errors.toString().padStart(6);
    const duration = `${(stat.duration / 1000).toFixed(1)}s`.padStart(8);

    console.log(`${name} | ${total} | ${scraped} | ${missingOrg} | ${missingEmail} | ${missingPhone} | ${withContacts} | ${errors} | ${duration}`);

    totalAssociations += stat.totalAssociations;
    totalScraped += stat.scraped;
    totalErrors += stat.errors;
  });

  console.log('------------------------------|-------|---------|-------------|---------------|---------------|---------------|--------|----------');
  console.log(`TOTAL                         | ${totalAssociations.toString().padStart(5)} | ${totalScraped.toString().padStart(7)} |             |               |               |               | ${totalErrors.toString().padStart(6)} | ${(overallDuration / 1000).toFixed(1)}s`);

  console.log(`\n✅ Bulk scraping completed in ${(overallDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`📁 Output files saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Log files saved to: ${LOGS_DIR}`);

  // Save summary
  const summaryPath = path.join(OUTPUT_DIR, `bulk_rbok_scrape_summary_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalMunicipalities: municipalities.length,
    totalAssociations,
    totalScraped,
    totalErrors,
    durationSeconds: overallDuration / 1000,
    municipalities: allStats
  }, null, 2), 'utf-8');
  console.log(`📊 Summary saved to: ${summaryPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
