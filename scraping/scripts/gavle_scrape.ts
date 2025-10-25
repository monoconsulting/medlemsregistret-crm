/**
 * Gävle Municipal Association Registry Scraper
 * Platform: FRI Webb-Förening
 * URL: https://fri.gavle.se/forening/
 *
 * This script scrapes all association records from the Gävle municipality registry,
 * visiting each detail page and extracting structured data according to the schema
 * defined in docs/CRM_SCRAPING_INSTRUCTIONS.md
 */

import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ========== TYPE DEFINITIONS ==========

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

interface ListRowData {
  name: string;
  detailLink: string;
  typeOfAssociation: string | null;
  activity: string | null;
  homepage: string | null;
}

interface ScraperStats {
  totalAssociations: number;
  totalPages: number;
  missingOrgNumber: number;
  missingContacts: number;
  missingDetailPages: number;
  homepageDomains: Set<string>;
}

// ========== CONFIGURATION ==========

const CONFIG = {
  baseUrl: 'https://fri.gavle.se/forening/',
  municipality: 'Gävle',
  sourceSystem: 'FRI',
  paginationModel: 'numeric_plus_next_last',
  outputDir: 'scraping/out',
  logFile: 'scraping/gavle.log',
  retryAttempts: 2,
  minDelay: 200,
  maxDelay: 600,
  viewport: { width: 3440, height: 1440 },
};

// ========== LOGGING ==========

class Logger {
  private logEntries: string[] = [];

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}`;
    console.log(entry);
    this.logEntries.push(entry);
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const errorMsg = error ? `${message}: ${error.message || error}` : message;
    const entry = `[${timestamp}] ERROR: ${errorMsg}`;
    console.error(entry);
    this.logEntries.push(entry);
  }

  saveToFile(filePath: string): void {
    fs.writeFileSync(filePath, this.logEntries.join('\n'), 'utf-8');
  }
}

// ========== UTILITIES ==========

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function deduplicateArray(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }
  return result;
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

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ========== SCRAPER CLASS ==========

class GavleScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logger: Logger;
  private scrapeRunId: string;
  private scrapedAt: string;
  private records: AssociationRecord[] = [];
  private stats: ScraperStats;

  constructor() {
    this.logger = new Logger();
    this.scrapeRunId = uuidv4();
    this.scrapedAt = new Date().toISOString();
    this.stats = {
      totalAssociations: 0,
      totalPages: 0,
      missingOrgNumber: 0,
      missingContacts: 0,
      missingDetailPages: 0,
      homepageDomains: new Set(),
    };
  }

  async initialize(): Promise<void> {
    this.logger.log('Initializing browser and page...');
    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext({
      viewport: CONFIG.viewport,
    });
    this.page = await context.newPage();
    this.logger.log('Browser initialized successfully');
  }

  async scrape(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    this.logger.log(`Starting scrape for ${CONFIG.municipality} (${CONFIG.sourceSystem})`);
    this.logger.log(`Scrape run ID: ${this.scrapeRunId}`);

    await this.page.goto(CONFIG.baseUrl);
    await this.page.waitForLoadState('networkidle');
    await randomDelay(CONFIG.minDelay, CONFIG.maxDelay);

    let pageIndex = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      this.logger.log(`Processing page ${pageIndex}...`);

      const listRows = await this.collectListRows();
      this.logger.log(`Found ${listRows.length} associations on page ${pageIndex}`);

      for (let i = 0; i < listRows.length; i++) {
        const row = listRows[i];
        this.logger.log(`  [${pageIndex}:${i}] Processing: ${row.name}`);

        const record = await this.processAssociation(row, pageIndex, i);
        if (record) {
          this.records.push(record);
          this.updateStats(record);
        }

        await randomDelay(CONFIG.minDelay, CONFIG.maxDelay);
      }

      this.stats.totalPages = pageIndex;
      hasNextPage = await this.goToNextPage();
      if (hasNextPage) {
        pageIndex++;
        await randomDelay(CONFIG.minDelay, CONFIG.maxDelay);
      }
    }

    this.logger.log('Scraping completed!');
    this.logStats();
  }

  private async collectListRows(): Promise<ListRowData[]> {
    if (!this.page) throw new Error('Page not initialized');

    const rows: ListRowData[] = [];

    try {
      // Wait for the association list table to be visible
      await this.page.waitForSelector('table', { state: 'visible', timeout: 10000 });

      // Extract all rows from the table
      const rowElements = await this.page.$$('table tbody tr');

      for (const rowElement of rowElements) {
        try {
          // Extract name and detail link
          const nameLink = await rowElement.$('td:nth-child(1) a');
          const name = nameLink ? await nameLink.textContent() : null;
          const detailHref = nameLink ? await nameLink.getAttribute('href') : null;

          if (!name || !detailHref) continue;

          // Extract other columns
          const typeCell = await rowElement.$('td:nth-child(2)');
          const activityCell = await rowElement.$('td:nth-child(3)');
          const homepageCell = await rowElement.$('td:nth-child(4) a');

          const typeOfAssociation = typeCell ? await typeCell.textContent() : null;
          const activity = activityCell ? await activityCell.textContent() : null;
          const homepage = homepageCell ? await homepageCell.getAttribute('href') : null;

          // Resolve detail link to absolute URL
          const detailLink = new URL(detailHref, CONFIG.baseUrl).href;

          rows.push({
            name: name.trim(),
            detailLink,
            typeOfAssociation: normalizeString(typeOfAssociation),
            activity: normalizeString(activity),
            homepage: homepage ? new URL(homepage, CONFIG.baseUrl).href : null,
          });
        } catch (error) {
          this.logger.error('Failed to extract row data', error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to collect list rows', error);
    }

    return rows;
  }

  private async processAssociation(
    row: ListRowData,
    pageIndex: number,
    position: number
  ): Promise<AssociationRecord | null> {
    if (!this.page) throw new Error('Page not initialized');

    let attempt = 0;
    while (attempt < CONFIG.retryAttempts) {
      try {
        // Navigate to detail page
        await this.page.goto(row.detailLink);
        await this.page.waitForLoadState('networkidle');

        // Extract detail page data
        const detailData = await this.extractDetailPageData();

        // Build the record
        const record: AssociationRecord = {
          source_system: CONFIG.sourceSystem,
          municipality: CONFIG.municipality,
          scrape_run_id: this.scrapeRunId,
          scraped_at: this.scrapedAt,
          association: {
            name: row.name,
            org_number: detailData.org_number,
            types: row.typeOfAssociation ? deduplicateArray([row.typeOfAssociation]) : [],
            activities: row.activity ? deduplicateArray([row.activity]) : [],
            categories: detailData.categories,
            homepage_url: row.homepage,
            detail_url: row.detailLink,
            street_address: detailData.street_address,
            postal_code: detailData.postal_code,
            city: detailData.city,
            email: detailData.email,
            phone: detailData.phone,
            description: detailData.description,
          },
          contacts: detailData.contacts,
          source_navigation: {
            list_page_index: pageIndex,
            position_on_page: position,
            pagination_model: CONFIG.paginationModel,
            filter_state: null,
          },
          extras: detailData.extras,
        };

        // Navigate back to list
        await this.page.goBack();
        await this.page.waitForLoadState('networkidle');

        return record;
      } catch (error) {
        attempt++;
        this.logger.error(
          `Failed to process ${row.name} (attempt ${attempt}/${CONFIG.retryAttempts})`,
          error
        );
        if (attempt >= CONFIG.retryAttempts) {
          return null;
        }
        await randomDelay(CONFIG.minDelay * 2, CONFIG.maxDelay * 2);
      }
    }

    return null;
  }

  private async extractDetailPageData(): Promise<{
    org_number: string | null;
    categories: string[];
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    description: string | null;
    contacts: Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>;
    extras: Record<string, any>;
  }> {
    if (!this.page) throw new Error('Page not initialized');

    const result = {
      org_number: null as string | null,
      categories: [] as string[],
      street_address: null as string | null,
      postal_code: null as string | null,
      city: null as string | null,
      email: null as string | null,
      phone: null as string | null,
      description: null as string | null,
      contacts: [] as Array<{
        contact_person_name: string;
        contact_person_role: string | null;
        contact_person_email: string | null;
        contact_person_phone: string | null;
      }>,
      extras: {} as Record<string, any>,
    };

    try {
      // Wait for content to be visible
      await this.page.waitForSelector('body', { state: 'visible', timeout: 5000 });

      // Extract all text content for pattern matching
      const bodyText = await this.page.textContent('body') || '';

      // Look for common patterns in FRI detail pages
      // Organization number pattern: NNNNNN-NNNN
      const orgNumberMatch = bodyText.match(/(?:Org\.?\s*nr|Organisationsnummer)[:\s]+(\d{6}-\d{4})/i);
      if (orgNumberMatch) {
        result.org_number = normalizeString(orgNumberMatch[1]);
      }

      // Look for contact person labels
      const contactLabels = ['Ansvarig', 'Föreningsansvarig', 'Kontaktperson', 'Kontakt'];
      for (const label of contactLabels) {
        const contactElements = await this.page.$$(`text=${label}`);
        for (const elem of contactElements) {
          const parent = await elem.evaluateHandle(el => el.parentElement);
          const contactText = await parent.asElement()?.textContent();
          if (contactText) {
            const contactName = normalizeString(contactText.replace(label, '').replace(':', ''));
            if (contactName) {
              result.contacts.push({
                contact_person_name: contactName,
                contact_person_role: label,
                contact_person_email: null,
                contact_person_phone: null,
              });
            }
          }
        }
      }

      // Look for email addresses
      const emailMatch = bodyText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        result.email = normalizeString(emailMatch[1].toLowerCase());
      }

      // Look for phone numbers (Swedish format)
      const phoneMatch = bodyText.match(/(?:Tel|Telefon|Mobil)[:\s]+([\d\s\-+()]{8,})/i);
      if (phoneMatch) {
        result.phone = normalizeString(phoneMatch[1]);
      }

      // Try to extract description from common content areas
      const descriptionSelectors = [
        'div.description',
        'div.info',
        'p.description',
        'div[class*="content"]',
      ];

      for (const selector of descriptionSelectors) {
        try {
          const descElement = await this.page.$(selector);
          if (descElement) {
            const desc = await descElement.textContent();
            if (desc && desc.trim().length > 20) {
              result.description = normalizeString(desc);
              break;
            }
          }
        } catch {
          // Selector didn't match, continue
        }
      }
    } catch (error) {
      this.logger.error('Failed to extract detail page data', error);
    }

    return result;
  }

  private async goToNextPage(): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Look for the "Next" button
      const nextButton = await this.page.getByRole('link', { name: 'Next' });

      // Check if Next button exists and is enabled
      const isDisabled = await nextButton.evaluate((el) => {
        return el.classList.contains('disabled') ||
               el.getAttribute('disabled') !== null ||
               el.getAttribute('aria-disabled') === 'true';
      }).catch(() => true);

      if (isDisabled) {
        this.logger.log('Next button is disabled - reached last page');
        return false;
      }

      // Click Next button
      await nextButton.click();
      await this.page.waitForLoadState('networkidle');

      return true;
    } catch (error) {
      this.logger.log('No Next button found - reached last page');
      return false;
    }
  }

  private updateStats(record: AssociationRecord): void {
    this.stats.totalAssociations++;

    if (!record.association.org_number) {
      this.stats.missingOrgNumber++;
    }

    if (record.contacts.length === 0) {
      this.stats.missingContacts++;
    }

    const domain = extractDomain(record.association.homepage_url);
    if (domain) {
      this.stats.homepageDomains.add(domain);
    }
  }

  private logStats(): void {
    this.logger.log('=== SCRAPE STATISTICS ===');
    this.logger.log(`Total associations scraped: ${this.stats.totalAssociations}`);
    this.logger.log(`Total pages processed: ${this.stats.totalPages}`);
    this.logger.log(`Missing org_number: ${this.stats.missingOrgNumber}`);
    this.logger.log(`Missing contacts: ${this.stats.missingContacts}`);
    this.logger.log(`Distinct homepage domains: ${this.stats.homepageDomains.size}`);
    this.logger.log(`Homepage domains: ${Array.from(this.stats.homepageDomains).join(', ')}`);
  }

  async saveResults(): Promise<void> {
    ensureDirectoryExists(CONFIG.outputDir);

    const jsonlPath = path.join(
      CONFIG.outputDir,
      `${CONFIG.municipality.toLowerCase()}_associations_${this.scrapeRunId}.jsonl`
    );
    const jsonPath = path.join(
      CONFIG.outputDir,
      `${CONFIG.municipality.toLowerCase()}_associations_${this.scrapeRunId}.json`
    );

    // Write JSONL
    this.logger.log(`Writing JSONL to ${jsonlPath}...`);
    const jsonlContent = this.records.map((r) => JSON.stringify(r)).join('\n');
    fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');

    // Write pretty JSON
    this.logger.log(`Writing JSON to ${jsonPath}...`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.records, null, 2), 'utf-8');

    // Save log file
    this.logger.log(`Saving log to ${CONFIG.logFile}...`);
    this.logger.saveToFile(CONFIG.logFile);

    this.logger.log('All files saved successfully!');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Browser closed');
    }
  }
}

// ========== MAIN EXECUTION ==========

async function main() {
  const scraper = new GavleScraper();

  try {
    await scraper.initialize();
    await scraper.scrape();
    await scraper.saveResults();
  } catch (error) {
    console.error('Fatal error during scraping:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
