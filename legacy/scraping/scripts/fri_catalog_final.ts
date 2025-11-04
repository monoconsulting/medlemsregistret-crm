import { chromium, Browser, Page, Locator } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FRI Catalog Scraper - Final Implementation
 *
 * Extracts ALL association data from FRI's catalog view (katalog.aspx)
 * NO pagination required - all data on ONE page!
 *
 * Strategy:
 * 1. Navigate to catalog view
 * 2. Parse association blocks using DOM navigation
 * 3. Extract all fields following JSON_STANDARD.md
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const SOURCE_SYSTEM = 'FRI';
const MUNICIPALITY = 'Fagersta';
const BASE_URL = 'https://fri.fagersta.se/forening/';

const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();
const dateStamp = new Date().toISOString().slice(0, 10);
const timeStamp = new Date().toISOString().slice(11, 16).replace(':', '-');

// Output paths
const OUTPUT_DIR = path.join(process.cwd(), 'scraping', 'json');
const LOG_DIR = path.join(process.cwd(), 'scraping', 'logs');
const JSON_PATH = path.join(OUTPUT_DIR, `${MUNICIPALITY}_${SOURCE_SYSTEM}_${dateStamp}_${timeStamp}.json`);
const LOG_PATH = path.join(LOG_DIR, `${MUNICIPALITY}.log`);

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ============================================================================
// TYPES
// ============================================================================
interface Contact {
  contact_person_name: string;
  contact_person_role: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
}

interface Association {
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
    sections: any[];
  } | null;
}

interface AssociationRecord {
  source_system: string;
  municipality: string;
  scrape_run_id: string;
  scraped_at: string;
  association: Association;
  contacts: Contact[];
  source_navigation: {
    list_page_index: number | null;
    position_on_page: number | null;
    pagination_model: string | null;
    filter_state: any | null;
  };
  extras: Record<string, any>;
}

// ============================================================================
// LOGGING
// ============================================================================
function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_PATH, logMessage);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed === '' ? null : trimmed;
}

function parseAddress(fullAddress: string): {
  street: string | null;
  postal: string | null;
  city: string | null;
} {
  const text = normalizeString(fullAddress);
  if (!text) return { street: null, postal: null, city: null };

  // Extract postal code: NNN NN
  const postalMatch = text.match(/\b(\d{3})\s?(\d{2})\b/);

  if (!postalMatch) {
    return { street: text, postal: null, city: null };
  }

  const postal = `${postalMatch[1]} ${postalMatch[2]}`;

  // Split by newlines or commas
  const parts = text.split(/[\n,]/).map(p => p.trim()).filter(p => p);

  let street: string | null = null;
  let city: string | null = null;

  for (const part of parts) {
    if (part.includes(postal.replace(' ', ''))) {
      // This part has the postal code
      const beforePostal = part.split(/\d{3}\s?\d{2}/)[0].trim();
      const afterPostal = part.split(/\d{3}\s?\d{2}/)[1]?.trim();

      if (beforePostal && !street) street = beforePostal;
      if (afterPostal && !city) city = afterPostal;
    } else if (!street) {
      street = part;
    } else if (!city) {
      city = part;
    }
  }

  return { street, postal, city };
}

function decodeEmail(email: string): string {
  try {
    return decodeURIComponent(email);
  } catch {
    return email;
  }
}

// ============================================================================
// SCRAPING LOGIC
// ============================================================================
async function scrapeAssociations(): Promise<AssociationRecord[]> {
  log('Starting FRI catalog scraper (final implementation)');
  log(`Municipality: ${MUNICIPALITY}`);
  log(`Scrape run ID: ${SCRAPE_RUN_ID}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const records: AssociationRecord[] = [];

  try {
    // Navigate and setup catalog view
    log(`Navigating to: ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    log('Selecting catalog view');
    await page.locator('#searchMethod').selectOption('selection');
    await page.waitForTimeout(500);
    await page.locator('#ForeningVal').selectOption('0'); // Föreningskatalog
    await page.waitForTimeout(2000);

    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }

    log(`Final URL: ${page.url()}`);

    // Find all association name links
    const associationLinks = await page.locator('h5 > a[onclick*="visaForening"]').all();
    log(`Found ${associationLinks.length} associations in catalog`);

    for (let i = 0; i < associationLinks.length; i++) {
      try {
        const record = await extractAssociationData(page, associationLinks[i], i + 1);
        if (record) {
          records.push(record);
          log(`[${i + 1}/${associationLinks.length}] ${record.association.name}`);
        }
      } catch (error) {
        log(`Error extracting association ${i + 1}: ${error}`, 'ERROR');
      }
    }

    log(`Successfully extracted ${records.length} associations`);

  } catch (error) {
    log(`Fatal error: ${error}`, 'ERROR');
    throw error;
  } finally {
    await browser.close();
  }

  return records;
}

async function extractAssociationData(
  page: Page,
  linkElement: Locator,
  position: number
): Promise<AssociationRecord | null> {
  // Extract name and ID
  const name = normalizeString(await linkElement.textContent());
  if (!name) return null;

  const onclickAttr = await linkElement.getAttribute('onclick');
  const idMatch = onclickAttr?.match(/visaForening\('([^']+)'\)/);
  if (!idMatch) return null;

  const associationId = idMatch[1];
  const detailUrl = `${BASE_URL.replace(/\/$/, '')}/visapublik.aspx?id=${associationId}`;

  // Find the parent row containing this link
  const linkRow = linkElement.locator('xpath=ancestor::div[@class="row"][1]');

  // Get all subsequent sibling rows until we hit the next association or HR separator
  const allRows = await page.locator('div.row').all();

  // Find the index of our link row
  let startIdx = -1;
  for (let i = 0; i < allRows.length; i++) {
    const rowText = await allRows[i].textContent();
    if (rowText?.includes(name)) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) return null;

  // Collect data from subsequent rows
  let type: string | null = null;
  let street: string | null = null;
  let postal: string | null = null;
  let city: string | null = null;
  let homepage: string | null = null;
  let email: string | null = null;
  let contactName: string | null = null;
  let contactMobile: string | null = null;
  let contactEmail: string | null = null;
  let summary: string | null = null;
  let activity: string | null = null;

  // Check the row BEFORE the link row for the type (h5 > span)
  if (startIdx > 0) {
    const prevRow = allRows[startIdx - 1];
    const typeSpan = prevRow.locator('h5 > span');
    if (await typeSpan.count() > 0) {
      type = normalizeString(await typeSpan.textContent());
    }
  }

  // Process next 15 rows (association blocks are usually within this range)
  for (let i = startIdx + 1; i < Math.min(startIdx + 15, allRows.length); i++) {
    const row = allRows[i];
    const rowText = await row.textContent() || '';

    // Stop if we hit another association
    const hasAssocLink = await row.locator('h5 > a[onclick*="visaForening"]').count();
    if (hasAssocLink > 0) break;

    // Stop if we hit HR separator
    const hasHr = await row.locator('hr').count();
    if (hasHr > 0) break;

    // Extract address (look for pattern: text<br>postal+city)
    if (!street) {
      const addressDivs = await row.locator('div.small-12.large-6.columns').all();
      for (const div of addressDivs) {
        const html = await div.innerHTML();
        const brMatch = html.match(/>\s*([^<]+)<br>([^<]+)/);
        if (brMatch) {
          const line1 = normalizeString(brMatch[1]);
          const line2 = normalizeString(brMatch[2]);
          if (line1 && line2) {
            const parsed = parseAddress(`${line1}\n${line2}`);
            street = parsed.street;
            postal = parsed.postal;
            city = parsed.city;
            break;
          }
        }
      }
    }

    // Extract homepage
    if (rowText.includes('Homepage:') || rowText.includes('Hemsida:')) {
      const link = await row.locator('a[href^="http"]').first();
      if (await link.count() > 0) {
        homepage = normalizeString(await link.getAttribute('href'));
      }
    }

    // Extract association email
    if (!email && (rowText.includes('Email:') || rowText.includes('E-post:'))) {
      const emailLink = await row.locator('a[href^="mailto:"]').first();
      if (await emailLink.count() > 0) {
        const href = await emailLink.getAttribute('href');
        if (href) {
          email = decodeEmail(normalizeString(href.replace('mailto:', '')) || '');
        }
      }
    }

    // Extract contact person name
    if (rowText.includes('Contact') && !contactName) {
      const strongText = await row.locator('strong').allTextContents();
      for (const text of strongText) {
        if (text.includes('Contact')) {
          // Name is usually right after the strong tag
          const html = await row.innerHTML();
          const nameMatch = html.match(/<\/strong>([^<]+)/);
          if (nameMatch) {
            contactName = normalizeString(nameMatch[1]);
          }
        }
      }
    }

    // Extract contact mobile
    if (rowText.includes('Mobile phone:')) {
      const spanElements = await row.locator('span').all();
      for (let j = 0; j < spanElements.length - 1; j++) {
        const spanText = await spanElements[j].textContent();
        if (spanText?.includes('Mobile phone:')) {
          // Next span should have the number
          contactMobile = normalizeString(await spanElements[j + 1].textContent());
          break;
        }
      }
    }

    // Extract summary
    if (rowText.includes('Summary') && !summary) {
      const html = await row.innerHTML();
      const summaryMatch = html.match(/Summary<br><\/span><\/strong>([^<]+)/i);
      if (summaryMatch) {
        summary = normalizeString(summaryMatch[1]);
      }
    }

    // Extract activity
    if (rowText.includes('Activity') && !activity) {
      const html = await row.innerHTML();
      const activityMatch = html.match(/Activity<br><\/span><\/strong>([^<]+)/i);
      if (activityMatch) {
        activity = normalizeString(activityMatch[1]);
      }
    }
  }

  // Build contacts array
  const contacts: Contact[] = [];
  if (contactName) {
    contacts.push({
      contact_person_name: contactName,
      contact_person_role: null,
      contact_person_email: contactEmail || email,
      contact_person_phone: contactMobile,
    });
  }

  // Build association record
  const association: Association = {
    detail_url: detailUrl,
    name: name,
    org_number: null,
    types: type ? [type] : [],
    activities: activity ? [activity] : [],
    categories: [],
    homepage_url: homepage,
    street_address: street,
    postal_code: postal,
    city: city,
    email: email,
    phone: null,
    description: summary ? {
      free_text: summary,
      sections: []
    } : null,
  };

  const record: AssociationRecord = {
    source_system: SOURCE_SYSTEM,
    municipality: MUNICIPALITY,
    scrape_run_id: SCRAPE_RUN_ID,
    scraped_at: SCRAPED_AT,
    association,
    contacts,
    source_navigation: {
      list_page_index: null,
      position_on_page: position,
      pagination_model: 'catalog_single_page',
      filter_state: null,
    },
    extras: {},
  };

  return record;
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  const startTime = Date.now();

  log('='.repeat(80));
  log('FRI Catalog Scraper - Final Implementation');
  log('='.repeat(80));

  try {
    const records = await scrapeAssociations();

    log(`Writing ${records.length} records to: ${JSON_PATH}`);
    fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2));

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('='.repeat(80));
    log(`SUCCESS!`);
    log(`Total associations: ${records.length}`);
    log(`Duration: ${duration}s`);
    log(`Output: ${JSON_PATH}`);
    log('='.repeat(80));

    // Print quality metrics
    const withEmail = records.filter(r => r.association.email).length;
    const withHomepage = records.filter(r => r.association.homepage_url).length;
    const withContacts = records.filter(r => r.contacts.length > 0).length;
    const withAddress = records.filter(r => r.association.street_address || r.association.postal_code).length;
    const withDescription = records.filter(r => r.association.description?.free_text).length;

    log(`\nQuality Metrics:`);
    log(`  Email: ${withEmail}/${records.length} (${(withEmail/records.length*100).toFixed(1)}%)`);
    log(`  Homepage: ${withHomepage}/${records.length} (${(withHomepage/records.length*100).toFixed(1)}%)`);
    log(`  Contacts: ${withContacts}/${records.length} (${(withContacts/records.length*100).toFixed(1)}%)`);
    log(`  Address: ${withAddress}/${records.length} (${(withAddress/records.length*100).toFixed(1)}%)`);
    log(`  Description: ${withDescription}/${records.length} (${(withDescription/records.length*100).toFixed(1)}%)`);

  } catch (error) {
    log(`FAILED: ${error}`, 'ERROR');
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error}`, 'ERROR');
  process.exit(1);
});
