import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SOURCE_SYSTEM = 'FRI';
const MUNICIPALITY = 'Årjäng';
const BASE_URL = 'https://fri.arjang.se/FORENING/';
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

// Output paths
const OUTPUT_DIR = path.join(__dirname, 'out');
const JSONL_PATH = path.join(OUTPUT_DIR, `${MUNICIPALITY}_associations_${SCRAPE_RUN_ID}.jsonl`);
const JSON_PATH = path.join(OUTPUT_DIR, `${MUNICIPALITY}_associations_${SCRAPE_RUN_ID}.json`);
const LOG_PATH = path.join(OUTPUT_DIR, `${MUNICIPALITY}.log`);

// Stats tracking
let totalAssociations = 0;
let missingOrgNumber = 0;
let missingContacts = 0;
let tablesExtracted = 0;
const homepageDomains = new Set<string>();

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
    description: { sections: DescriptionSection[]; free_text: string | null } | string | null;
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
function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_PATH, logMessage + '\n');
}

function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
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

// Label normalization mapping (Swedish -> snake_case)
const LABEL_MAPPING: Record<string, string> = {
  'founded': 'founded_year',
  'bildad år': 'founded_year',
  'grundad': 'founded_year',
  'grundad år': 'founded_year',
  'financial year begins (mmdd)': 'fiscal_year_starts_mmdd',
  'verksamhetsår börjar (mmdd)': 'fiscal_year_starts_mmdd',
  'räkenskapsår start': 'fiscal_year_starts_mmdd',
  'national organisation': 'national_affiliation',
  'riksorganisation': 'national_affiliation',
  'huvudorganisation': 'national_affiliation',
  'activity': 'verksamhet_raw',
  'verksamhet': 'verksamhet_raw',
  'summary': 'short_description',
  'kort beskrivning': 'short_description',
  'beskrivning': 'short_description',
  'home': 'phone_home',
  'work': 'phone_work',
  'telefon': 'phone',
  'telefon arbete': 'phone_work',
  'telefon hem': 'phone_home',
  'e-postadress': 'email',
  'epost': 'email',
  'email': 'email',
  'hemsida': 'homepage_url',
  'homepage': 'homepage_url',
  'address': 'address_raw',
  'adress': 'address_raw',
  'mobil': 'mobile',
  'mobile': 'mobile',
  'org.nr': 'org_number',
  'organisationsnummer': 'org_number',
  'postadress': 'postal_address_raw',
  'ort': 'city',
  'postnr': 'postal_code',
};

function normalizeLabel(label: string): string {
  const lower = label.toLowerCase().trim();
  return LABEL_MAPPING[lower] || lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseValue(key: string, value: string): any {
  if (!value || value.trim() === '') return null;

  const trimmed = value.trim();

  // founded_year: extract 4-digit year
  if (key === 'founded_year') {
    const match = trimmed.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0]) : trimmed;
  }

  // fiscal_year_starts_mmdd: keep as 4 digits
  if (key === 'fiscal_year_starts_mmdd') {
    const match = trimmed.match(/(\d{4})/);
    return match ? match[1] : trimmed;
  }

  return trimmed;
}

function splitActivities(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Extract contact information from tables 0 and 1 (under "General" heading)
 * Structure:
 * Row 0: "Association name" or "Contact"
 * Row 1: Person name (e.g., "Thomas Forsberg")
 * Row 2: Address | value
 * Row 3: Home | phone
 * Row 4: Work | phone
 */
async function extractContactsFromTables(page: Page): Promise<Array<{
  contact_person_name: string;
  contact_person_role: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
}>> {
  const contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }> = [];

  try {
    // Find all tables with class "compact-table"
    const tables = page.locator('table.compact-table, table.clean');
    const tableCount = await tables.count();

    // Process first two tables (0 and 1) - these are contact tables
    for (let tableIdx = 0; tableIdx < Math.min(tableCount, 2); tableIdx++) {
      const table = tables.nth(tableIdx);
      const rows = table.locator('tr');
      const rowCount = await rows.count();

      let contactName: string | null = null;
      let contactRole: string | null = null;
      let contactEmail: string | null = null;
      let contactPhone: string | null = null;

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const allText = normalizeString(await row.textContent()) || '';

        // Row 0 is header - check if it says "Contact" for role detection
        if (i === 0) {
          if (allText.match(/contact|kontakt/i)) {
            contactRole = 'Contact';
          }
          continue;
        }

        // Row 1 typically contains the person name (no label, just the name)
        if (i === 1 && !allText.includes('|')) {
          // This is likely a name if it has 2+ words with capital letters
          const nameMatch = allText.match(/^([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)+)$/);
          if (nameMatch) {
            contactName = normalizeString(nameMatch[1]);
          }
          continue;
        }

        // Subsequent rows are label | value format
        const cells = row.locator('td, th');
        const cellCount = await cells.count();

        if (cellCount === 2) {
          const labelText = normalizeString(await cells.nth(0).textContent());
          const valueText = normalizeString(await cells.nth(1).textContent());

          if (labelText && valueText) {
            const key = normalizeLabel(labelText);

            if (key === 'email') {
              contactEmail = valueText.toLowerCase();
            } else if (key === 'phone_home' || key === 'phone_work' || key === 'phone' || key === 'mobile') {
              if (!contactPhone) contactPhone = valueText;
            }
          }
        } else if (cellCount === 1) {
          // Single cell might contain "Label | Value" in one cell
          const cellText = normalizeString(await cells.nth(0).textContent());
          if (cellText && cellText.includes('|')) {
            const parts = cellText.split('|').map(s => s.trim());
            if (parts.length === 2) {
              const label = parts[0];
              const value = parts[1];
              const key = normalizeLabel(label);

              if (key === 'email' && value) {
                contactEmail = value.toLowerCase();
              } else if ((key === 'phone_home' || key === 'phone_work' || key === 'phone' || key === 'mobile') && value) {
                if (!contactPhone) contactPhone = value;
              }
            }
          }
        }
      }

      // Add contact if we found a name
      if (contactName) {
        contacts.push({
          contact_person_name: contactName,
          contact_person_role: contactRole,
          contact_person_email: contactEmail,
          contact_person_phone: contactPhone
        });
      }
    }
  } catch (error) {
    log(`  Warning: Error extracting contacts from tables: ${error}`);
  }

  return contacts;
}

/**
 * Extract the "Other information" table (table 2) into structured sections
 * This table contains: Founded, Financial year begins, National organisation, Activity, Summary
 */
async function extractOtherInformationTable(page: Page): Promise<DescriptionSection | null> {
  try {
    // Look for "Other information" heading (h2)
    const headings = page.locator('h2, h3');
    const headingCount = await headings.count();

    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const headingText = normalizeString(await heading.textContent());

      if (headingText && headingText.match(/other information|övrig information/i)) {
        // Found the heading, now get the next table
        const nextTable = page.locator('table.compact-table, table.clean').nth(2); // Table 2 (0-indexed)
        const tableExists = await nextTable.count() > 0;

        if (tableExists) {
          const data: Record<string, any> = {};
          const rows = nextTable.locator('tr');
          const rowCount = await rows.count();

          for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            const row = rows.nth(rowIdx);
            const cells = row.locator('td, th');
            const cellCount = await cells.count();

            if (cellCount === 2) {
              // Standard two-column format
              const labelText = normalizeString(await cells.nth(0).textContent());
              const valueText = normalizeString(await cells.nth(1).textContent());

              if (labelText) {
                const key = normalizeLabel(labelText);
                data[key] = parseValue(key, valueText || '');
              }
            } else if (cellCount === 1) {
              // Single cell might contain "Label | Value"
              const cellText = normalizeString(await cells.nth(0).textContent());
              if (cellText && cellText.includes('|')) {
                const parts = cellText.split('|').map(s => s.trim());
                if (parts.length === 2) {
                  const label = parts[0];
                  const value = parts[1];
                  const key = normalizeLabel(label);
                  data[key] = parseValue(key, value);
                }
              }
            }
          }

          if (Object.keys(data).length > 0) {
            tablesExtracted++;
            return {
              title: headingText,
              data
            };
          }
        }
      }
    }

    // Alternative: directly access table 2 if heading method failed
    const allTables = page.locator('table.compact-table, table.clean');
    const allTableCount = await allTables.count();

    if (allTableCount >= 3) {
      const table2 = allTables.nth(2);
      const data: Record<string, any> = {};
      const rows = table2.locator('tr');
      const rowCount = await rows.count();

      for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
        const row = rows.nth(rowIdx);
        const cells = row.locator('td, th');
        const cellCount = await cells.count();

        if (cellCount === 2) {
          const labelText = normalizeString(await cells.nth(0).textContent());
          const valueText = normalizeString(await cells.nth(1).textContent());

          if (labelText) {
            const key = normalizeLabel(labelText);
            data[key] = parseValue(key, valueText || '');
          }
        } else if (cellCount === 1) {
          const cellText = normalizeString(await cells.nth(0).textContent());
          if (cellText && cellText.includes('|')) {
            const parts = cellText.split('|').map(s => s.trim());
            if (parts.length === 2) {
              const label = parts[0];
              const value = parts[1];
              const key = normalizeLabel(label);
              data[key] = parseValue(key, value);
            }
          }
        }
      }

      if (Object.keys(data).length > 0) {
        tablesExtracted++;
        return {
          title: 'Other information',
          data
        };
      }
    }
  } catch (error) {
    log(`  Warning: Error extracting Other information table: ${error}`);
  }

  return null;
}

async function extractFreeText(page: Page): Promise<string | null> {
  try {
    const paragraphs = await page.locator('p, div.description, div.free-text').allTextContents();
    const combined = paragraphs
      .map(p => normalizeString(p))
      .filter(p => p && p.length > 30) // Only meaningful paragraphs
      .join('\n\n');

    return combined || null;
  } catch {
    return null;
  }
}

function buildDescription(sections: DescriptionSection[], freeText: string | null): any {
  if (sections.length > 0) {
    return {
      sections,
      free_text: freeText
    };
  } else if (freeText) {
    return freeText;
  }
  return null;
}

/**
 * Merge data from description sections into core fields and extras
 */
function mergeDataFromSections(
  sections: DescriptionSection[],
  coreData: any,
  extras: Record<string, any>
): void {
  for (const section of sections) {
    for (const [key, value] of Object.entries(section.data)) {
      // Map to core fields
      if (key === 'org_number' && value) {
        coreData.org_number = value;
      } else if (key === 'email' && value) {
        coreData.email = typeof value === 'string' ? value.toLowerCase() : value;
      } else if (key === 'homepage_url' && value) {
        coreData.homepage_url = value;
      } else if (key === 'phone' && value) {
        coreData.phone = value;
      } else if (key === 'city' && value) {
        coreData.city = value;
      } else if (key === 'postal_code' && value) {
        coreData.postal_code = value;
      } else if (key === 'verksamhet_raw' && value) {
        // Split and merge into activities
        const newActivities = splitActivities(value);
        coreData.activities = normalizeArray([...coreData.activities, ...newActivities]);
      } else if (key === 'address_raw' && value) {
        // Try to parse address components
        const addrParts = value.split(',').map((s: string) => s.trim());
        if (addrParts.length >= 1 && !coreData.street_address) {
          coreData.street_address = addrParts[0];
        }
        if (addrParts.length >= 2 && !coreData.postal_code) {
          const postalMatch = addrParts[1].match(/\d{3}\s?\d{2}/);
          if (postalMatch) coreData.postal_code = postalMatch[0];
        }
        if (addrParts.length >= 3 && !coreData.city) {
          coreData.city = addrParts[2];
        }
      }

      // Store metadata in extras
      if (key === 'founded_year' || key === 'fiscal_year_starts_mmdd' || key === 'national_affiliation' || key === 'short_description') {
        extras[key] = value;
      }
    }
  }
}

async function writeJsonl(record: AssociationRecord): Promise<void> {
  fs.appendFileSync(JSONL_PATH, JSON.stringify(record) + '\n');
}

async function writePrettyJson(records: AssociationRecord[]): Promise<void> {
  fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2));
}

// Scraping functions
async function waitForListReady(page: Page): Promise<void> {
  await page.waitForSelector('table.compact-table', { state: 'visible', timeout: 10000 });
  await delay(500);
}

async function getPageInfo(page: Page): Promise<{ current: number; total: number }> {
  try {
    const bodyText = await page.locator('body').textContent();
    if (bodyText) {
      const match = bodyText.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
      if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        log(`Page info detected: ${current}/${total}`);
        return { current, total };
      }
    }
  } catch (error) {
    log(`Warning: Could not extract page info: ${error}`);
  }
  return { current: 1, total: 999 };
}

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

async function goToNextPage(page: Page, currentPageIndex: number): Promise<boolean> {
  try {
    const beforePageInfo = await getPageInfo(page);

    const nextLink = page.getByRole('link', { name: 'Next' });
    await nextLink.click();
    await randomDelay();
    await waitForListReady(page);

    // Verify page actually changed
    const afterPageInfo = await getPageInfo(page);
    if (afterPageInfo.current <= beforePageInfo.current && beforePageInfo.current < 999) {
      log(`Warning: Page number did not increase (${beforePageInfo.current} -> ${afterPageInfo.current})`);
      return false;
    }

    return true;
  } catch (error) {
    log(`Error navigating to next page: ${error}`);
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

  // FRI columns: Name (with link), Type, Activity, Homepage
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

async function extractDetailPageData(page: Page): Promise<{
  description: any;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  orgNumber: string | null;
  categories: string[];
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
}> {
  const result = {
    description: null as any,
    email: null as string | null,
    phone: null as string | null,
    address: null as string | null,
    postalCode: null as string | null,
    city: null as string | null,
    orgNumber: null as string | null,
    categories: [] as string[],
    contacts: [] as Array<{
      contact_person_name: string;
      contact_person_role: string | null;
      contact_person_email: string | null;
      contact_person_phone: string | null;
    }>
  };

  try {
    await page.waitForLoadState('domcontentloaded');
    await delay(500);

    // Extract contacts from tables 0 and 1
    result.contacts = await extractContactsFromTables(page);

    // Extract "Other information" table (table 2)
    const otherInfoSection = await extractOtherInformationTable(page);
    const sections: DescriptionSection[] = otherInfoSection ? [otherInfoSection] : [];

    // Extract free text
    const freeText = await extractFreeText(page);

    // Build description object
    result.description = buildDescription(sections, freeText);

    if (sections.length > 0) {
      log(`  Extracted ${sections.length} table section(s) with ${sections.reduce((sum, s) => sum + Object.keys(s.data).length, 0)} key-value pairs`);
    }

    // Try to extract email from body if not in tables
    if (!result.email) {
      try {
        const bodyText = await page.locator('body').textContent();
        const emailMatch = bodyText?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          result.email = emailMatch[1].toLowerCase();
        }
      } catch {}
    }

    // Try to extract phone from body if not in tables
    if (!result.phone) {
      try {
        const bodyText = await page.locator('body').textContent();
        const phoneMatch = bodyText?.match(/(?:Tel|Telefon|Phone|Mobil)[:\s]*([\d\s\-+()]+)/i);
        if (phoneMatch) {
          result.phone = normalizeString(phoneMatch[1]);
        }
      } catch {}
    }

  } catch (error) {
    log(`  Warning: Error extracting detail page data: ${error}`);
  }

  return result;
}

async function scrapePage(page: Page, pageIndex: number): Promise<AssociationRecord[]> {
  const records: AssociationRecord[] = [];

  await waitForListReady(page);

  const rows = page.locator('table.compact-table tbody tr');
  const rowCount = await rows.count();

  log(`Page ${pageIndex}: Found ${rowCount} associations`);

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);

    try {
      const listData = await extractListRowData(page, row, i);

      if (!listData.name) {
        log(`Page ${pageIndex}, Row ${i}: Skipping row with no name`);
        continue;
      }

      log(`Page ${pageIndex}, Row ${i}: Processing "${listData.name}"`);

      let detailData = {
        description: null,
        email: null,
        phone: null,
        address: null,
        postalCode: null,
        city: null,
        orgNumber: null,
        categories: [],
        contacts: []
      };

      // Visit detail page if link exists
      if (listData.detailLink) {
        try {
          const nameLink = row.locator('a').first();

          await Promise.all([
            page.waitForLoadState('domcontentloaded'),
            nameLink.click()
          ]);

          await randomDelay();

          detailData = await extractDetailPageData(page);

          await page.goBack();
          await waitForListReady(page);
          await randomDelay(300, 500);

        } catch (error) {
          log(`Page ${pageIndex}, Row ${i}: Error visiting detail page: ${error}`);
        }
      }

      // Build core data
      const coreData = {
        name: listData.name,
        org_number: detailData.orgNumber,
        types: normalizeArray([listData.type]),
        activities: normalizeArray([listData.activity]),
        categories: detailData.categories,
        homepage_url: listData.homepage,
        detail_url: listData.detailLink || `${BASE_URL}?page=${pageIndex}#row-${i}`,
        street_address: detailData.address,
        postal_code: detailData.postalCode,
        city: detailData.city,
        email: detailData.email,
        phone: detailData.phone,
        description: detailData.description
      };

      const extras: Record<string, any> = {};

      // Merge data from description sections into core fields and extras
      if (detailData.description && typeof detailData.description === 'object' && detailData.description.sections) {
        mergeDataFromSections(detailData.description.sections, coreData, extras);
      }

      const record: AssociationRecord = {
        source_system: SOURCE_SYSTEM,
        municipality: MUNICIPALITY,
        scrape_run_id: SCRAPE_RUN_ID,
        scraped_at: SCRAPED_AT,
        association: coreData,
        contacts: detailData.contacts,
        source_navigation: {
          list_page_index: pageIndex,
          position_on_page: i,
          pagination_model: 'numeric_plus_next_last',
          filter_state: null
        },
        extras
      };

      // Update stats
      totalAssociations++;
      if (!record.association.org_number) missingOrgNumber++;
      if (record.contacts.length === 0) missingContacts++;

      const domain = extractDomain(record.association.homepage_url);
      if (domain) homepageDomains.add(domain);

      await writeJsonl(record);
      records.push(record);

    } catch (error) {
      log(`Page ${pageIndex}, Row ${i}: Error processing row: ${error}`);
    }
  }

  return records;
}

async function scrapeAllPages(page: Page): Promise<AssociationRecord[]> {
  const allRecords: AssociationRecord[] = [];
  let pageIndex = 1;

  log('Starting scrape of all pages...');

  const firstPageRecords = await scrapePage(page, pageIndex);
  allRecords.push(...firstPageRecords);

  const pageInfo = await getPageInfo(page);
  log(`Total pages detected: ${pageInfo.total}`);

  while (await hasNextPage(page)) {
    pageIndex++;
    log(`Navigating to page ${pageIndex}...`);

    const success = await goToNextPage(page, pageIndex - 1);
    if (!success) {
      log(`Failed to navigate to page ${pageIndex}, stopping pagination`);
      break;
    }

    const pageRecords = await scrapePage(page, pageIndex);
    allRecords.push(...pageRecords);

    const currentPageInfo = await getPageInfo(page);
    if (currentPageInfo.current >= currentPageInfo.total && currentPageInfo.total < 999) {
      log(`Reached final page (${currentPageInfo.current}/${currentPageInfo.total}), stopping`);
      break;
    }

    if (pageIndex >= 100) {
      log(`Reached safety limit of 100 pages, stopping`);
      break;
    }
  }

  log(`Completed scraping ${pageIndex} pages`);
  return allRecords;
}

async function main(): Promise<void> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(LOG_PATH, `Scrape started at ${SCRAPED_AT}\n`);
  fs.writeFileSync(LOG_PATH, `Run ID: ${SCRAPE_RUN_ID}\n`, { flag: 'a' });
  fs.writeFileSync(LOG_PATH, `Municipality: ${MUNICIPALITY}\n`, { flag: 'a' });
  fs.writeFileSync(LOG_PATH, `Source System: ${SOURCE_SYSTEM}\n\n`, { flag: 'a' });

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

    const allRecords = await scrapeAllPages(page);

    log('Writing pretty JSON file...');
    await writePrettyJson(allRecords);

    log('\n=== SCRAPE SUMMARY ===');
    log(`Total associations scraped: ${totalAssociations}`);
    log(`Distinct homepage domains: ${homepageDomains.size}`);
    log(`Records missing org_number: ${missingOrgNumber}`);
    log(`Records missing contacts: ${missingContacts}`);
    log(`Table sections extracted: ${tablesExtracted}`);
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

main().catch(console.error);
