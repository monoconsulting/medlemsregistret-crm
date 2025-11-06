import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeForValidation } from '../utils/sanitize';
import { getScrapingPaths, runDatabaseImport, createLogger } from '../utils/scraper-base';

// Configuration
const SOURCE_SYSTEM = 'FRI';
const MUNICIPALITY = 'Askersund';
const BASE_URL = 'https://friweb.askersund.se/forening/';
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
let missingAddress = 0;
const homepageDomains = new Set<string>();
const uniqueTypes = new Set<string>();
const uniqueActivities = new Set<string>();

interface DescriptionSection {
  title: string;
  data: Record<string, any>;
}

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
    description: {
      sections: DescriptionSection[];
      free_text: string | null;
    } | string | null;
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
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed === '' ? null : trimmed;
}

function normalizeArray(values: (string | null | undefined)[]): string[] {
  const normalized = values
    .map(normalizeString)
    .filter((v): v is string => v !== null);

  // Deduplicate case-insensitively but preserve original casing
  const seen = new Set<string>();
  return normalized.filter(item => {
    const lower = item.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

// Label normalization mapping (from CRM_SCRAPING_INSTRUCTIONS)
const LABEL_MAPPING: Record<string, string> = {
  // Swedish labels
  'bildad år': 'founded_year',
  'grundad': 'founded_year',
  'verksamhetsår börjar (mmdd)': 'fiscal_year_starts_mmdd',
  'verksamhetsår börjar': 'fiscal_year_starts_mmdd',
  'riksorganisation': 'national_affiliation',
  'verksamhet': 'verksamhet_raw',
  'aktivitet': 'verksamhet_raw',
  'kort beskrivning': 'short_description',
  'sammanfattning': 'short_description',
  'område': 'short_description',
  'telefon': 'phone',
  'hem': 'phone_home',
  'arbete': 'phone_work',
  'mobil': 'phone_mobile',
  'e-postadress': 'email',
  'e-post': 'email',
  'hemsida': 'homepage_url',
  'adress': 'address_raw',
  'postadress': 'postal_address_raw',
  'postnr': 'postal_code',
  'ort': 'city',
  'org.nr': 'org_number',
  'organisationsnummer': 'org_number',
  // English labels
  'founded': 'founded_year',
  'financial year begins (mmdd)': 'fiscal_year_starts_mmdd',
  'financial year begins': 'fiscal_year_starts_mmdd',
  'national organisation': 'national_affiliation',
  'activity': 'verksamhet_raw',
  'summary': 'short_description',
  'phone': 'phone',
  'home': 'phone_home',
  'work': 'phone_work',
  'mobile': 'phone_mobile',
  'email': 'email',
  'homepage': 'homepage_url',
  'address': 'address_raw',
  'postal code': 'postal_code',
  'city': 'city',
  'org number': 'org_number'
};

function normalizeLabel(label: string): string {
  const normalized = label.toLowerCase().trim();
  return LABEL_MAPPING[normalized] || normalized.replace(/[^a-z0-9]+/g, '_');
}

// Address parsing function (FRI_SCRAPING_GUIDES.md requirements)
function parseAddress(addressRaw: string): {
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
} {
  const result = {
    street_address: null as string | null,
    postal_code: null as string | null,
    city: null as string | null
  };

  if (!addressRaw) return result;

  // Step 1: Extract postal code using regex \b\d{3}\s?\d{2}\b
  const postalMatch = addressRaw.match(/\b(\d{3})\s?(\d{2})\b/);
  if (postalMatch) {
    result.postal_code = `${postalMatch[1]} ${postalMatch[2]}`;
  }

  // Step 2: Split on commas
  const parts = addressRaw.split(',').map(p => p.trim()).filter(p => p);

  if (parts.length > 0) {
    // First part is street address
    result.street_address = parts[0];

    // Find which part contains the postal code and extract city from next part
    for (let i = 0; i < parts.length; i++) {
      if (result.postal_code && parts[i].includes(result.postal_code.replace(' ', ''))) {
        // City is the next non-empty part
        if (i + 1 < parts.length) {
          result.city = parts[i + 1];
        }
        break;
      } else if (result.postal_code && parts[i].includes(result.postal_code)) {
        if (i + 1 < parts.length) {
          result.city = parts[i + 1];
        }
        break;
      }
    }

    // If no city found yet but we have parts, take the last part as city
    if (!result.city && parts.length > 1) {
      result.city = parts[parts.length - 1];
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
  // Wait for the association list table to be visible
  await page.waitForSelector('table.compact-table', { state: 'visible', timeout: 10000 });
  await delay(500); // Additional stability wait
}

async function getPageInfo(page: Page): Promise<{ current: number; total: number }> {
  try {
    // Swedish: "Sida X/Y" or English: "Page X/Y"
    const bodyText = await page.locator('body').textContent();
    if (bodyText) {
      const match = bodyText.match(/(?:Sida|Page)\s+(\d+)\s*\/\s*(\d+)/i);
      if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        logger.info(`Page info detected: ${current}/${total}`);
        return { current, total };
      }
    }
  } catch (error) {
    logger.info(`Warning: Could not extract page info: ${error}`);
  }
  return { current: 1, total: 999 };
}

async function hasNextPage(page: Page): Promise<boolean> {
  try {
    // Check for Swedish "Nästa" or English "Next"
    const nextLinkSwedish = page.getByRole('link', { name: /nästa/i });
    const nextLinkEnglish = page.getByRole('link', { name: /next/i });

    let nextLink = nextLinkSwedish;
    let count = await nextLink.count();

    if (count === 0) {
      nextLink = nextLinkEnglish;
      count = await nextLink.count();
    }

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

async function goToNextPage(page: Page, currentPage: number): Promise<boolean> {
  try {
    // Try both Swedish and English
    const nextLinkSwedish = page.getByRole('link', { name: /nästa/i });
    const nextLinkEnglish = page.getByRole('link', { name: /next/i });

    let nextLink = nextLinkSwedish;
    let count = await nextLink.count();

    if (count === 0) {
      nextLink = nextLinkEnglish;
      count = await nextLink.count();
    }

    if (count === 0) return false;

    await nextLink.click();
    await randomDelay();
    await waitForListReady(page);

    // Verify page actually changed
    const newPageInfo = await getPageInfo(page);
    if (newPageInfo.current === currentPage) {
      logger.info(`Warning: Page number did not change after clicking Next. Stopping pagination.`);
      return false;
    }

    return true;
  } catch (error) {
    logger.info(`Error navigating to next page: ${error}`);
    return false;
  }
}

async function extractListRowData(page: Page, row: any, rowIndex: number): Promise<{
  name: string;
  type: string | null;
  activity: string | null;
  homepage: string | null;
  detailLink: string | null;
}> {
  const cells = row.locator('td');
  const cellCount = await cells.count();

  let name = '';
  let type: string | null = null;
  let activity: string | null = null;
  let homepage: string | null = null;
  let detailLink: string | null = null;

  // FRI columns: Name (with link), Type of association, Activity, Homepage
  if (cellCount >= 1) {
    const nameCell = cells.nth(0);
    const link = nameCell.locator('a').first();
    name = normalizeString(await link.textContent()) || '';
    detailLink = await link.getAttribute('href');
    if (detailLink && !detailLink.startsWith('http')) {
      detailLink = new URL(detailLink, BASE_URL).href;
    }
  }

  if (cellCount >= 2) {
    type = normalizeString(await cells.nth(1).textContent());
  }

  if (cellCount >= 3) {
    activity = normalizeString(await cells.nth(2).textContent());
  }

  if (cellCount >= 4) {
    const homepageCell = cells.nth(3);
    const homepageLink = homepageCell.locator('a').first();
    const homepageLinkCount = await homepageLink.count();
    if (homepageLinkCount > 0) {
      homepage = await homepageLink.getAttribute('href');
      if (homepage && !homepage.startsWith('http')) {
        homepage = new URL(homepage, BASE_URL).href;
      }
    }
  }

  return { name, type, activity, homepage, detailLink };
}

// Extract data from two-column tables (Övrig information section)
async function extractTwoColumnTable(page: Page, table: any): Promise<Record<string, any>> {
  const data: Record<string, any> = {};

  try {
    const rows = table.locator('tr');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('th, td');
      const cellCount = await cells.count();

      if (cellCount >= 2) {
        // Standard two-column: TH (label) | TD (value)
        const labelText = normalizeString(await cells.nth(0).textContent());
        const valueText = normalizeString(await cells.nth(1).textContent());

        if (labelText) {
          const normalizedKey = normalizeLabel(labelText);
          data[normalizedKey] = valueText;
        }
      } else if (cellCount === 1) {
        // Single cell might contain "Label | Value" or "Label: Value"
        const cellText = await cells.nth(0).textContent();
        if (cellText) {
          const pipeMatch = cellText.match(/^([^|]+)\|(.+)$/);
          const colonMatch = cellText.match(/^([^:]+):(.+)$/);

          if (pipeMatch) {
            const labelText = normalizeString(pipeMatch[1]);
            const valueText = normalizeString(pipeMatch[2]);
            if (labelText) {
              const normalizedKey = normalizeLabel(labelText);
              data[normalizedKey] = valueText;
            }
          } else if (colonMatch) {
            const labelText = normalizeString(colonMatch[1]);
            const valueText = normalizeString(colonMatch[2]);
            if (labelText) {
              const normalizedKey = normalizeLabel(labelText);
              data[normalizedKey] = valueText;
            }
          }
        }
      }
    }
  } catch (error) {
    logger.info(`Error extracting two-column table: ${error}`);
  }

  return data;
}

// Extract contact person from right table (FRI_SCRAPING_GUIDES.md specification)
async function extractContactPerson(page: Page, rightTable: any): Promise<{
  contact_person_name: string;
  contact_person_role: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  extras: Record<string, any>;
}> {
  const result = {
    contact_person_name: '',
    contact_person_role: null as string | null,
    contact_person_email: null as string | null,
    contact_person_phone: null as string | null,
    extras: {} as Record<string, any>
  };

  try {
    const rows = rightTable.locator('tr');
    const rowCount = await rows.count();

    const phones: Record<string, string> = {};

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator('th, td');
      const cellCount = await cells.count();

      // Skip header row (row 0 with TH)
      if (i === 0 && cellCount === 1) {
        const tagName = await cells.nth(0).evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'th') {
          continue; // This is the "Contact" or "Kontaktperson" header
        }
      }

      // First data row (row 1) with single cell is the name
      if (cellCount === 1 && !result.contact_person_name) {
        const cellText = normalizeString(await cells.nth(0).textContent());
        const tagName = await cells.nth(0).evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'td' && cellText) {
          result.contact_person_name = cellText;
          continue;
        }
      }

      if (cellCount >= 2) {
        const labelText = normalizeString(await cells.nth(0).textContent());
        const valueText = normalizeString(await cells.nth(1).textContent());

        if (!labelText) continue;

        const labelLower = labelText.toLowerCase();

        // Phone variants
        if (labelLower === 'hem' || labelLower === 'home') {
          phones.home = valueText || '';
        } else if (labelLower === 'arbete' || labelLower === 'work') {
          phones.work = valueText || '';
        } else if (labelLower === 'mobil' || labelLower === 'mobile') {
          phones.mobile = valueText || '';
        } else if (labelLower.includes('telefon') || labelLower.includes('phone')) {
          if (!result.contact_person_phone) {
            result.contact_person_phone = valueText;
          }
        } else if (labelLower.includes('e-post') || labelLower.includes('email') || labelLower.includes('e-mail')) {
          result.contact_person_email = valueText ? valueText.toLowerCase() : null;
        } else if (labelLower.includes('roll') || labelLower.includes('role')) {
          result.contact_person_role = valueText;
        }
      }
    }

    // Phone selection priority (from FRI_SCRAPING_GUIDES.md):
    // If mobile exists, use it; otherwise if multiple exist, use the first; if only home exists, use it
    if (phones.mobile) {
      result.contact_person_phone = phones.mobile;
    } else if (phones.work) {
      result.contact_person_phone = phones.work;
    } else if (phones.home) {
      result.contact_person_phone = phones.home;
    }

    // Store all phones in extras
    if (Object.keys(phones).length > 0) {
      result.extras.contact_phones = phones;
    }

  } catch (error) {
    logger.info(`Error extracting contact person: ${error}`);
  }

  return result;
}

async function extractDetailPageData(page: Page, associationName: string): Promise<{
  association_email: string | null;
  association_phone: string | null;
  association_homepage: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  org_number: string | null;
  description_sections: DescriptionSection[];
  free_text: string | null;
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
  extras: Record<string, any>;
}> {
  const result = {
    association_email: null as string | null,
    association_phone: null as string | null,
    association_homepage: null as string | null,
    street_address: null as string | null,
    postal_code: null as string | null,
    city: null as string | null,
    org_number: null as string | null,
    description_sections: [] as DescriptionSection[],
    free_text: null as string | null,
    contacts: [] as Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>,
    extras: {} as Record<string, any>
  };

  try {
    await page.waitForLoadState('domcontentloaded');
    await delay(500);

    // Find all tables with class "compact-table" or "clean"
    const tables = page.locator('table.compact-table, table.clean');
    const tableCount = await tables.count();

    logger.info(`Found ${tableCount} tables on detail page for "${associationName}"`);

    let leftTable = null;
    let rightTable = null;

    // Identify left table (association info) and right table (contact person)
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      const firstHeaderCell = table.locator('tr').first().locator('th, td').first();
      const headerText = normalizeString(await firstHeaderCell.textContent());

      if (headerText === associationName) {
        leftTable = table;
        logger.info(`Identified left table (association info) at index ${i}`);
      } else if (headerText && /kontaktperson|contact/i.test(headerText)) {
        rightTable = table;
        logger.info(`Identified right table (contact person) at index ${i}`);
      }
    }

    // Extract from LEFT table (association-level info)
    if (leftTable) {
      const leftData = await extractTwoColumnTable(page, leftTable);
      logger.info(`Extracted ${Object.keys(leftData).length} fields from left table`);

      // Process address
      if (leftData.address_raw) {
        const parsed = parseAddress(leftData.address_raw);
        result.street_address = parsed.street_address;
        result.postal_code = parsed.postal_code;
        result.city = parsed.city;
        logger.info(`Parsed address: street="${result.street_address}", postal="${result.postal_code}", city="${result.city}"`);
      }

      // Separate rows for postal_code, city
      if (leftData.postal_code && !result.postal_code) {
        result.postal_code = leftData.postal_code;
      }
      if (leftData.city && !result.city) {
        result.city = leftData.city;
      }

      // Email (association level)
      if (leftData.email) {
        result.association_email = leftData.email.toLowerCase();
      }

      // Homepage
      if (leftData.homepage_url) {
        result.association_homepage = leftData.homepage_url;
      }

      // Org number
      if (leftData.org_number) {
        result.org_number = leftData.org_number;
      }
    }

    // Extract from RIGHT table (contact person)
    if (rightTable) {
      const contactData = await extractContactPerson(page, rightTable);
      if (contactData.contact_person_name) {
        result.contacts.push({
          contact_person_name: contactData.contact_person_name,
          contact_person_role: contactData.contact_person_role,
          contact_person_email: contactData.contact_person_email,
          contact_person_phone: contactData.contact_person_phone
        });

        // Merge phone extras
        if (contactData.extras.contact_phones) {
          result.extras.contact_phones = contactData.extras.contact_phones;
        }

        logger.info(`Extracted contact: ${contactData.contact_person_name} (email: ${contactData.contact_person_email}, phone: ${contactData.contact_person_phone})`);
      }
    }

    // Find "Övrig information" / "Other information" section
    let foundOvrigInfo = false;
    const sectionHeadings = page.locator('h2, h3, h4, caption');
    const headingCount = await sectionHeadings.count();

    for (let i = 0; i < headingCount; i++) {
      const heading = sectionHeadings.nth(i);
      const headingText = normalizeString(await heading.textContent());

      if (headingText && /övrig information|other information/i.test(headingText)) {
        logger.info(`Found "Övrig information" section via heading`);

        const nextTable = heading.locator('xpath=following::table[contains(@class,"compact-table") or contains(@class,"clean")][1]');
        const nextTableCount = await nextTable.count();

        if (nextTableCount > 0) {
          const sectionData = await extractTwoColumnTable(page, nextTable);
          logger.info(`Extracted ${Object.keys(sectionData).length} fields from Övrig information section`);

          result.description_sections.push({
            title: 'Övrig information',
            data: sectionData
          });

          foundOvrigInfo = true;

          // Process special fields
          if (sectionData.founded_year) {
            const yearMatch = String(sectionData.founded_year).match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
              result.extras.founded_year = parseInt(yearMatch[0]);
            }
          }

          if (sectionData.fiscal_year_starts_mmdd) {
            result.extras.fiscal_year_start = sectionData.fiscal_year_starts_mmdd;
          }

          if (sectionData.national_affiliation) {
            result.extras.national_affiliation = sectionData.national_affiliation;
          }

          if (sectionData.verksamhet_raw) {
            result.extras.verksamhet_raw = sectionData.verksamhet_raw;
          }

          if (sectionData.short_description && String(sectionData.short_description).length > 50) {
            result.free_text = sectionData.short_description;
          }

          if (sectionData.org_number && !result.org_number) {
            result.org_number = sectionData.org_number;
          }
          if (sectionData.email && !result.association_email) {
            result.association_email = sectionData.email.toLowerCase();
          }
          if (sectionData.homepage_url && !result.association_homepage) {
            result.association_homepage = sectionData.homepage_url;
          }
          if (sectionData.address_raw && !result.street_address) {
            const parsed = parseAddress(sectionData.address_raw);
            if (parsed.street_address) result.street_address = parsed.street_address;
            if (parsed.postal_code) result.postal_code = parsed.postal_code;
            if (parsed.city) result.city = parsed.city;
          }
        }
        break;
      }
    }

    // If no heading found, check remaining tables
    if (!foundOvrigInfo && tableCount > 2) {
      for (let i = 0; i < tableCount; i++) {
        const table = tables.nth(i);

        // Skip if this is leftTable or rightTable
        if ((leftTable && i === 0) || (rightTable && (leftTable ? i === 1 : i === 0))) {
          continue;
        }

        // Check if this table has typical "Övrig information" fields
        const firstRow = table.locator('tr').first();
        const firstCells = firstRow.locator('td');
        const firstCellCount = await firstCells.count();

        if (firstCellCount >= 2) {
          const firstLabel = normalizeString(await firstCells.nth(0).textContent());

          if (firstLabel && /founded|bildad|financial year|verksamhetsår|activity|verksamhet|summary|sammanfattning/i.test(firstLabel)) {
            logger.info(`Found "Övrig information" section as table ${i} (no heading)`);

            const sectionData = await extractTwoColumnTable(page, table);
            logger.info(`Extracted ${Object.keys(sectionData).length} fields from Övrig information section`);

            result.description_sections.push({
              title: 'Övrig information',
              data: sectionData
            });

            // Process special fields (same as above)
            if (sectionData.founded_year) {
              const yearMatch = String(sectionData.founded_year).match(/\b(19|20)\d{2}\b/);
              if (yearMatch) {
                result.extras.founded_year = parseInt(yearMatch[0]);
              }
            }

            if (sectionData.fiscal_year_starts_mmdd) {
              result.extras.fiscal_year_start = sectionData.fiscal_year_starts_mmdd;
            }

            if (sectionData.national_affiliation) {
              result.extras.national_affiliation = sectionData.national_affiliation;
            }

            if (sectionData.verksamhet_raw) {
              result.extras.verksamhet_raw = sectionData.verksamhet_raw;
            }

            if (sectionData.short_description && String(sectionData.short_description).length > 50) {
              result.free_text = sectionData.short_description;
            }

            if (sectionData.org_number && !result.org_number) {
              result.org_number = sectionData.org_number;
            }
            if (sectionData.email && !result.association_email) {
              result.association_email = sectionData.email.toLowerCase();
            }
            if (sectionData.homepage_url && !result.association_homepage) {
              result.association_homepage = sectionData.homepage_url;
            }
            if (sectionData.address_raw && !result.street_address) {
              const parsed = parseAddress(sectionData.address_raw);
              if (parsed.street_address) result.street_address = parsed.street_address;
              if (parsed.postal_code) result.postal_code = parsed.postal_code;
              if (parsed.city) result.city = parsed.city;
            }

            foundOvrigInfo = true;
            break;
          }
        }
      }
    }

    // Extract free text from main content area
    try {
      const mainContent = page.locator('main, #content, .content, article').first();
      const mainContentCount = await mainContent.count();

      if (mainContentCount > 0) {
        const paragraphs = mainContent.locator('p');
        const paragraphCount = await paragraphs.count();

        const freeTextParts: string[] = [];

        for (let i = 0; i < paragraphCount; i++) {
          const para = paragraphs.nth(i);
          const paraText = normalizeString(await para.textContent());

          if (!paraText) continue;

          // Exclude utility text
          const excludePatterns = [
            /logga in/i,
            /skriv ut/i,
            /aktuella bokningar/i,
            /sök lediga tider/i,
            /cookie/i,
            /information/i
          ];

          const shouldExclude = excludePatterns.some(pattern => pattern.test(paraText));

          if (!shouldExclude && paraText.length > 20) {
            freeTextParts.push(paraText);
          }
        }

        if (freeTextParts.length > 0 && !result.free_text) {
          result.free_text = freeTextParts.join('\n\n');
          logger.info(`Extracted free text (${result.free_text.length} chars)`);
        }
      }
    } catch (error) {
      logger.info(`Could not extract free text from main content: ${error}`);
    }

    // Fallback: check "Kort beskrivning" row if free_text still empty
    if (!result.free_text && result.description_sections.length > 0) {
      for (const section of result.description_sections) {
        if (section.data.short_description) {
          result.free_text = section.data.short_description;
          break;
        }
      }
    }

  } catch (error) {
    logger.info(`Error extracting detail page data: ${error}`);
  }

  return result;
}

async function scrapeAssociation(
  page: Page,
  listPageIndex: number,
  positionOnPage: number,
  listData: {
    name: string;
    type: string | null;
    activity: string | null;
    homepage: string | null;
    detailLink: string | null;
  }
): Promise<AssociationRecord> {
  const record: AssociationRecord = {
    source_system: SOURCE_SYSTEM,
    municipality: MUNICIPALITY,
    scrape_run_id: SCRAPE_RUN_ID,
    scraped_at: SCRAPED_AT,
    association: {
      name: listData.name,
      org_number: null,
      types: listData.type ? [listData.type] : [],
      activities: [],
      categories: [],
      homepage_url: listData.homepage,
      detail_url: listData.detailLink || BASE_URL,
      street_address: null,
      postal_code: null,
      city: null,
      email: null,
      phone: null,
      description: null
    },
    contacts: [],
    source_navigation: {
      list_page_index: listPageIndex,
      position_on_page: positionOnPage,
      pagination_model: 'numeric_plus_next_last',
      filter_state: null
    },
    extras: {}
  };

  // Track list-level activity
  if (listData.activity) {
    const activityList = listData.activity.split(/[,;]/).map(a => a.trim()).filter(a => a);
    record.association.activities = normalizeArray(activityList);
  }

  // Visit detail page if link exists
  if (listData.detailLink) {
    let detailPageVisited = false;
    try {
      logger.info(`Visiting detail page: ${listData.detailLink}`);
      await page.goto(listData.detailLink, { timeout: 60000 }); // Increased timeout to 60s
      await randomDelay();
      detailPageVisited = true;

      const detailData = await extractDetailPageData(page, listData.name);

      // Merge detail data into record
      record.association.email = detailData.association_email;
      record.association.phone = detailData.association_phone;
      if (detailData.association_homepage && !record.association.homepage_url) {
        record.association.homepage_url = detailData.association_homepage;
      }
      record.association.street_address = detailData.street_address;
      record.association.postal_code = detailData.postal_code;
      record.association.city = detailData.city;
      record.association.org_number = detailData.org_number;

      // Merge activities from verksamhet_raw
      if (detailData.extras.verksamhet_raw) {
        const detailActivities = String(detailData.extras.verksamhet_raw)
          .split(/[,;]/)
          .map(a => a.trim())
          .filter(a => a);
        record.association.activities = normalizeArray([
          ...record.association.activities,
          ...detailActivities
        ]);
      }

      // Description
      if (detailData.description_sections.length > 0 || detailData.free_text) {
        record.association.description = {
          sections: detailData.description_sections,
          free_text: detailData.free_text
        };
      }

      // Contacts
      record.contacts = detailData.contacts;

      // Extras
      record.extras = { ...record.extras, ...detailData.extras };

      // Navigate back to list
      await page.goBack();
      await randomDelay(300, 500);
      await waitForListReady(page);

    } catch (error) {
      logger.info(`Error visiting detail page for "${listData.name}": ${error}`);

      // Recovery: if we navigated away but failed, try to go back to the list
      if (detailPageVisited) {
        try {
          logger.info(`Attempting to navigate back to list page after error...`);
          await page.goBack();
          await randomDelay(500, 1000);
          await waitForListReady(page);
        } catch (recoveryError) {
          logger.info(`Failed to recover: ${recoveryError}`);
          // Last resort: reload the list page
          try {
            logger.info(`Last resort: reloading list page...`);
            const currentPageInfo = await getPageInfo(page);
            // Navigate to the current page directly
            await page.goto(BASE_URL);
            await waitForListReady(page);

            // Click through to the page we were on
            for (let i = 1; i < currentPageInfo.current; i++) {
              await goToNextPage(page, i);
            }
          } catch (reloadError) {
            logger.info(`Critical error: could not reload list page: ${reloadError}`);
            throw reloadError;
          }
        }
      }
    }
  }

  return record;
}

async function scrapePage(page: Page, pageIndex: number): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];

  try {
    await waitForListReady(page);

    const table = page.locator('table.compact-table');
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    logger.info(`Page ${pageIndex}: Found ${rowCount} associations`);

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const listData = await extractListRowData(page, row, i);

      if (!listData.name) {
        logger.info(`Skipping row ${i} - no name found`);
        continue;
      }

      logger.info(`[${pageIndex}.${i}] Processing: ${listData.name}`);

      const record = await scrapeAssociation(page, pageIndex, i, listData);
      records.push(record);
      await writeJsonl(record);

      // Update stats
      totalAssociations++;
      if (!record.association.org_number) missingOrgNumber++;
      if (record.contacts.length === 0) missingContacts++;
      if (!record.association.street_address) missingAddress++;

      if (record.association.homepage_url) {
        const domain = extractDomain(record.association.homepage_url);
        if (domain) homepageDomains.add(domain);
      }
      record.association.types.forEach(t => uniqueTypes.add(t));
      record.association.activities.forEach(a => uniqueActivities.add(a));

      await randomDelay();
    }

  } catch (error) {
    logger.info(`Error scraping page ${pageIndex}: ${error}`);
  }

  return records;
}


async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  logger.info('='.repeat(80));
  logger.info(`Starting scrape: ${MUNICIPALITY} (${SOURCE_SYSTEM})`);
  logger.info(`Run ID: ${SCRAPE_RUN_ID}`);
  logger.info(`Base URL: ${BASE_URL}`);
  logger.info('='.repeat(80));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1760, height: 1256 }
  });
  const page = await context.newPage();

  const allRecords: AssociationRecord[] = [];

  try {
    // Navigate to list page
    logger.info(`Navigating to ${BASE_URL}`);
    await page.goto(BASE_URL);
    await waitForListReady(page);

    // Get total pages
    const pageInfo = await getPageInfo(page);
    logger.info(`Detected ${pageInfo.total} total pages`);

    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      logger.info(`\nScraping page ${currentPage}...`);
      const pageRecords = await scrapePage(page, currentPage);
      allRecords.push(...pageRecords);

      // Check if there's a next page
      const pageInfoAfter = await getPageInfo(page);
      if (pageInfoAfter.current >= pageInfoAfter.total) {
        logger.info(`Reached last page (${pageInfoAfter.current}/${pageInfoAfter.total})`);
        hasMore = false;
      } else {
        hasMore = await hasNextPage(page);
        if (hasMore) {
          logger.info(`Navigating to page ${currentPage + 1}...`);
          const success = await goToNextPage(page, currentPage);
          if (!success) {
            logger.info('Failed to navigate to next page. Stopping.');
            hasMore = false;
          } else {
            currentPage++;
          }
        } else {
          logger.info('No next page available. Stopping.');
        }
      }
    }

  } catch (error) {
    logger.info(`Fatal error during scraping: ${error}`);
  } finally {
    await browser.close();
  }

  // Sanitize records
  const sanitizedRecords = sanitizeForValidation(allRecords);

  // Write pretty JSON
  await writePrettyJson(sanitizedRecords);

  // Import to database
  await runDatabaseImport();

  // Final stats
  logger.info('='.repeat(80));
  logger.info('SCRAPING COMPLETE');
  logger.info('='.repeat(80));
  logger.info(`Total associations scraped: ${totalAssociations}`);
  logger.info(`Missing org_number: ${missingOrgNumber} (${((missingOrgNumber / totalAssociations) * 100).toFixed(1)}%)`);
  logger.info(`Missing contacts: ${missingContacts} (${((missingContacts / totalAssociations) * 100).toFixed(1)}%)`);
  logger.info(`Missing address: ${missingAddress} (${((missingAddress / totalAssociations) * 100).toFixed(1)}%)`);
  logger.info(`Unique types: ${uniqueTypes.size}`);
  logger.info(`Unique activities: ${uniqueActivities.size}`);
  logger.info(`Homepage domains: ${homepageDomains.size}`);
  logger.info(`\nOutput files:`);
  logger.info(`  JSONL: ${JSONL_PATH}`);
  logger.info(`  JSON:  ${JSON_PATH}`);
  logger.info(`  Log:   ${LOG_PATH}`);
  logger.info('='.repeat(80));
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
