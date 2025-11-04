import { chromium, Browser, Page, Locator } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FRI Catalog Scraper V2 - Proper DOM Navigation
 *
 * This version uses Playwright DOM navigation instead of regex HTML parsing
 * to reliably extract all association data from the catalog view.
 *
 * Usage:
 * 1. Set MUNICIPALITY and BASE_URL constants
 * 2. Run: npx tsx scraping/scripts/fri_catalog_scraper_v2.ts
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE FOR EACH MUNICIPALITY
// ============================================================================
const SOURCE_SYSTEM = 'FRI';
const MUNICIPALITY = 'Fagersta';  // Change this for each municipality
const BASE_URL = 'https://fri.fagersta.se/forening/';  // Change this for each municipality

// ============================================================================
// SETUP
// ============================================================================
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();
const dateStamp = new Date().toISOString().slice(0, 10);
const timeStamp = new Date().toISOString().slice(11, 16).replace(':', '-');

// Output paths
const OUTPUT_DIR = path.join(process.cwd(), 'scraping', 'json');
const LOG_DIR = path.join(process.cwd(), 'scraping', 'logs');
const JSON_PATH = path.join(OUTPUT_DIR, `${MUNICIPALITY}_${SOURCE_SYSTEM}_${dateStamp}_${timeStamp}.json`);
const LOG_PATH = path.join(LOG_DIR, `${MUNICIPALITY}.log`);

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================================================
// TYPES (following JSON_STANDARD.md)
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

function normalizeArray(values: (string | null | undefined)[]): string[] {
  const normalized = values
    .map(normalizeString)
    .filter((v): v is string => v !== null);

  const seen = new Set<string>();
  return normalized.filter(item => {
    const lower = item.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

function parseAddress(addressText: string): { street: string | null; postal: string | null; city: string | null } {
  const text = normalizeString(addressText);
  if (!text) return { street: null, postal: null, city: null };

  // Match Swedish postal code pattern: NNN NN or NNNNN
  const postalMatch = text.match(/\b(\d{3})\s?(\d{2})\b/);

  if (postalMatch) {
    const postal = `${postalMatch[1]} ${postalMatch[2]}`;

    // Split by common delimiters
    const parts = text.split(/[,\n]/).map(p => p.trim()).filter(p => p);

    let street: string | null = null;
    let city: string | null = null;

    for (const part of parts) {
      if (part.match(/\d{3}\s?\d{2}/)) {
        // This part contains postal code
        // Extract city (text after postal code)
        const withoutPostal = part.replace(/\d{3}\s?\d{2}/, '').trim();
        if (withoutPostal && !city) {
          city = withoutPostal;
        }
        // Extract street (text before postal code)
        const beforePostal = part.split(/\d{3}\s?\d{2}/)[0].trim();
        if (beforePostal && !street) {
          street = beforePostal;
        }
      } else if (!street) {
        street = part;
      } else if (!city) {
        city = part;
      }
    }

    return { street, postal, city };
  }

  // No postal code found
  return { street: text, postal: null, city: null };
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
  log('Starting FRI catalog scraper V2');
  log(`Municipality: ${MUNICIPALITY}`);
  log(`Base URL: ${BASE_URL}`);
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

    log('Selecting "Urval" in search method');
    await page.locator('#searchMethod').selectOption('selection');
    await page.waitForTimeout(1000);

    log('Selecting "Föreningskatalog" in presentation type');
    await page.locator('#ForeningVal').selectOption('0');
    await page.waitForTimeout(2000);

    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Sök")').first();
    const hasSubmit = await submitButton.count();

    if (hasSubmit > 0) {
      log('Clicking search/submit button');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }

    const finalUrl = page.url();
    log(`Final URL: ${finalUrl}`);

    // Find all association blocks
    // Each association block starts with <h5><span>TYPE</span></h5> followed by <h5><a>NAME</a></h5>
    log('Extracting associations from catalog page');

    // Get all h5 elements that contain association names (with <a> tags)
    const associationLinks = await page.locator('h5 > a[onclick*="visaForening"]').all();
    log(`Found ${associationLinks.length} associations`);

    for (let i = 0; i < associationLinks.length; i++) {
      const linkElement = associationLinks[i];

      try {
        const record = await extractAssociationFromDOM(page, linkElement, finalUrl, i + 1);
        if (record) {
          records.push(record);
          log(`Extracted: ${record.association.name} (${i + 1}/${associationLinks.length})`);
        }
      } catch (error) {
        log(`Error extracting association at position ${i + 1}: ${error}`, 'ERROR');
      }
    }

    log(`Successfully extracted ${records.length} associations`);

  } catch (error) {
    log(`Fatal error during scraping: ${error}`, 'ERROR');
    throw error;
  } finally {
    await browser.close();
  }

  return records;
}

async function extractAssociationFromDOM(
  page: Page,
  linkElement: Locator,
  baseUrl: string,
  position: number
): Promise<AssociationRecord | null> {
  // Extract name and ID from the link
  const name = normalizeString(await linkElement.textContent());
  if (!name) return null;

  const onclickAttr = await linkElement.getAttribute('onclick');
  const idMatch = onclickAttr?.match(/visaForening\('([^']+)'\)/);
  if (!idMatch) return null;

  const associationId = idMatch[1];
  const detailUrl = `${baseUrl.replace(/katalog\.aspx.*$/, '')}visapublik.aspx?id=${associationId}`;

  // Find the parent container (we'll navigate from the link upwards to find all data)
  // The structure is complex, so we'll use the link as an anchor and search nearby elements

  // Get type (the <h5><span> before the name link)
  const typeElement = page.locator(`h5:has(a[onclick*="visaForening('${associationId}')"])`)
    .locator('xpath=preceding-sibling::div[1]//h5/span')
    .first();
  const type = normalizeString(await typeElement.textContent().catch(() => ''));

  // Find all text between this association and the next one
  // We'll use the link element's parent rows as a starting point
  const parentRow = linkElement.locator('xpath=ancestor::div[@class="row"][1]');

  // Get all sibling rows until we hit the next association or end
  // This is complex, so let's use a different approach:
  // Get the index of this link in the page, then extract data in the rows following it

  const allRows = await page.locator('div.row').all();

  // Find which row contains our link
  let startRowIndex = -1;
  for (let i = 0; i < allRows.length; i++) {
    const rowText = await allRows[i].textContent();
    if (rowText?.includes(name)) {
      startRowIndex = i;
      break;
    }
  }

  if (startRowIndex === -1) {
    return null;
  }

  // Extract data from subsequent rows until we hit next association or <hr> separator
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

  // Scan next 20 rows (should be enough for one association)
  for (let i = startRowIndex + 1; i < Math.min(startRowIndex + 20, allRows.length); i++) {
    const row = allRows[i];
    const rowHTML = await row.innerHTML();
    const rowText = await row.textContent();

    // Stop if we hit another association name link
    if (rowHTML.includes('visaForening') && !rowHTML.includes(associationId)) {
      break;
    }

    // Extract address
    if (!street && rowHTML.match(/<div class="small-12 large-6 columns">\s*([^<]+)<br>([^<]+)/)) {
      const match = rowHTML.match(/<div class="small-12 large-6 columns">\s*([^<]+)<br>([^<]+)/);
      if (match) {
        const addressLine1 = normalizeString(match[1]);
        const addressLine2 = normalizeString(match[2]);
        if (addressLine1 && addressLine2) {
          const fullAddress = `${addressLine1}\n${addressLine2}`;
          const parsed = parseAddress(fullAddress);
          street = parsed.street;
          postal = parsed.postal;
          city = parsed.city;
        }
      }
    }

    // Extract homepage
    if (rowText?.includes('Homepage:') || rowText?.includes('Hemsida:')) {
      const homepageLink = await row.locator('a[href^="http"]').first();
      homepage = normalizeString(await homepageLink.getAttribute('href').catch(() => ''));
    }

    // Extract email
    if (rowText?.includes('Email:') || rowText?.includes('E-post:')) {
      const emailLink = await row.locator('a[href^="mailto:"]').first();
      const emailHref = await emailLink.getAttribute('href').catch(() => '');
      if (emailHref) {
        email = decodeEmail(normalizeString(emailHref.replace('mailto:', '')) || '');
      }
    }

    // Extract contact person name
    if (rowText?.includes('Contact') || rowText?.includes('Kontaktperson')) {
      const contactMatch = rowHTML.match(/<strong><span>Contact<br><\/span><\/strong>([^<]+)/i);
      if (contactMatch) {
        contactName = normalizeString(contactMatch[1]);
      }
    }

    // Extract contact mobile
    if (rowText?.includes('Mobile phone:') || rowText?.includes('Mobil:')) {
      const mobileMatch = rowHTML.match(/<span>Mobile phone:<br><\/span><span>([^<]+)<\/span>/i);
      if (mobileMatch) {
        contactMobile = normalizeString(mobileMatch[1]);
      }
    }

    // Extract summary/description
    if (rowText?.includes('Summary') || rowText?.includes('Sammanfattning')) {
      const summaryMatch = rowHTML.match(/<span style="font-style:italic;">Summary<br><\/span><\/strong>([^<]+)/i);
      if (summaryMatch) {
        summary = normalizeString(summaryMatch[1]);
      }
    }

    // Extract activity
    if (rowText?.includes('Activity') || rowText?.includes('Aktivitet')) {
      const activityMatch = rowHTML.match(/<span style="font-style:italic;">Activity<br><\/span><\/strong>([^<]+)/i);
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
      contact_person_email: contactEmail || email,  // Use association email if contact email not found
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
// MAIN EXECUTION
// ============================================================================
async function main() {
  const startTime = Date.now();

  log('='.repeat(80));
  log(`FRI Catalog Scraper V2 - ${MUNICIPALITY}`);
  log('='.repeat(80));

  try {
    const records = await scrapeAssociations();

    // Write pretty JSON
    log(`Writing ${records.length} records to: ${JSON_PATH}`);
    fs.writeFileSync(JSON_PATH, JSON.stringify(records, null, 2));

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('='.repeat(80));
    log(`Scraping completed successfully!`);
    log(`Total associations: ${records.length}`);
    log(`Duration: ${duration}s`);
    log(`Output: ${JSON_PATH}`);
    log('='.repeat(80));

  } catch (error) {
    log(`Scraping failed: ${error}`, 'ERROR');
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error}`, 'ERROR');
  process.exit(1);
});
