import { chromium, Browser, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FRI Catalog Scraper - Universal template for all FRI municipalities
 *
 * This scraper uses the "Catalog" presentation mode which displays
 * ALL association data on a single page without pagination or modals.
 *
 * Usage:
 * 1. Set MUNICIPALITY and BASE_URL constants
 * 2. Run: npx tsx scraping/scripts/fri_catalog_scraper.ts
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
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const dateStamp = new Date().toISOString().slice(0, 10);
const timeStamp = new Date().toISOString().slice(11, 16).replace(':', '-');

// Output paths following new naming convention
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

  // Match Swedish postal code pattern: NNN NN
  const postalMatch = text.match(/\b(\d{3})\s?(\d{2})\b/);

  if (postalMatch) {
    const postal = `${postalMatch[1]} ${postalMatch[2]}`;
    const parts = text.split(/,|\n/).map(p => p.trim()).filter(p => p);

    let street: string | null = null;
    let city: string | null = null;

    for (const part of parts) {
      if (part.includes(postal.replace(' ', ''))) {
        // This part contains the postal code, extract city after it
        const cityMatch = part.replace(/\d{3}\s?\d{2}/, '').trim();
        city = cityMatch || null;
      } else if (!street) {
        street = part;
      }
    }

    return { street, postal, city };
  }

  // No postal code found, treat as street address
  return { street: text, postal: null, city: null };
}

function decodeEmail(email: string): string {
  // Decode URL-encoded emails (e.g., %61%6b%73 -> aks)
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
  log('Starting FRI catalog scraper');
  log(`Municipality: ${MUNICIPALITY}`);
  log(`Base URL: ${BASE_URL}`);
  log(`Scrape run ID: ${SCRAPE_RUN_ID}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const records: AssociationRecord[] = [];

  try {
    // Navigate to the main page
    log(`Navigating to: ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Select "Selection" (Urval) in search method dropdown
    log('Selecting "Urval" in search method');
    await page.locator('#searchMethod').selectOption('selection');
    await page.waitForTimeout(1000);

    // Select "Catalog" (Föreningskatalog) in presentation type dropdown
    log('Selecting "Föreningskatalog" in presentation type');
    await page.locator('#ForeningVal').selectOption('0');
    await page.waitForTimeout(2000);

    // Check if there's a submit button and click it
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Sök")').first();
    const hasSubmit = await submitButton.count();

    if (hasSubmit > 0) {
      log('Clicking search/submit button');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }

    const finalUrl = page.url();
    log(`Final URL: ${finalUrl}`);

    // Now we're on the catalog page with all associations
    log('Extracting associations from catalog page');

    // Get the full HTML content
    const html = await page.content();

    // Split HTML by <hr> tags to separate associations
    // Each association block is separated by <hr>
    const hrSeparator = /<div class="row">\s*<div class="small-12 columns">\s*<hr>\s*<\/div>\s*<\/div>/g;
    const blocks = html.split(hrSeparator);

    log(`Found ${blocks.length} potential association blocks`);

    let position = 0;

    // Process each block
    for (const block of blocks) {
      // Skip if block doesn't contain association name link
      if (!block.includes('visaForening') && !block.includes('href="javascript:WebForm_DoPostBackWithOptions')) {
        continue;
      }

      position++;

      try {
        const record = await extractAssociationFromBlock(block, finalUrl, position);
        if (record) {
          records.push(record);
          log(`Extracted: ${record.association.name} (${position}/${blocks.length})`);
        }
      } catch (error) {
        log(`Error extracting association at position ${position}: ${error}`, 'ERROR');
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

async function extractAssociationFromBlock(
  htmlBlock: string,
  baseUrl: string,
  position: number
): Promise<AssociationRecord | null> {
  // Extract association type
  const typeMatch = htmlBlock.match(/<h5><span>([^<]+)<\/span><\/h5>/);
  const type = typeMatch ? normalizeString(typeMatch[1]) : null;

  // Extract association name and ID
  const nameMatch = htmlBlock.match(/<h5><a[^>]*onclick="return visaForening\('([^']+)'\);"[^>]*>([^<]+)<\/a><\/h5>/);
  if (!nameMatch) {
    return null; // No valid association found
  }

  const associationId = nameMatch[1];
  const associationName = normalizeString(nameMatch[2]);

  if (!associationName) {
    return null;
  }

  // Construct detail URL
  const detailUrl = `${baseUrl.replace(/\/$/, '')}/visapublik.aspx?id=${associationId}`;

  // Extract address (first div after name)
  const addressMatch = htmlBlock.match(/<div class="small-12 large-6 columns">\s*([^<]+)<br>([^<]+)/);
  let street: string | null = null;
  let postal: string | null = null;
  let city: string | null = null;

  if (addressMatch) {
    const addressLine1 = normalizeString(addressMatch[1]);
    const addressLine2 = normalizeString(addressMatch[2]);
    const fullAddress = `${addressLine1 || ''}\n${addressLine2 || ''}`.trim();
    const parsed = parseAddress(fullAddress);
    street = parsed.street;
    postal = parsed.postal;
    city = parsed.city;
  }

  // Extract homepage
  const homepageMatch = htmlBlock.match(/<span>Homepage:<br><\/span><a[^>]*href="([^"]+)"/i);
  const homepage = homepageMatch ? normalizeString(homepageMatch[1]) : null;

  // Extract association email
  const emailMatch = htmlBlock.match(/<span>Email:<br><\/span><a[^>]*href="mailto:([^"]+)">([^<]+)<\/a>/i);
  const email = emailMatch ? decodeEmail(normalizeString(emailMatch[1]) || '') : null;

  // Extract contact person name
  const contactNameMatch = htmlBlock.match(/<strong><span>Contact<br><\/span><\/strong>([^<]+)/i);
  const contactName = contactNameMatch ? normalizeString(contactNameMatch[1]) : null;

  // Extract contact mobile phone
  const contactMobileMatch = htmlBlock.match(/<span>Mobile phone:<br><\/span><span>([^<]+)<\/span>/i);
  const contactMobile = contactMobileMatch ? normalizeString(contactMobileMatch[1]) : null;

  // Extract contact email (there might be multiple email tags, need the contact one)
  const allEmailMatches = Array.from(htmlBlock.matchAll(/<a[^>]*href="mailto:([^"]+)">([^<]+)<\/a>/gi));
  let contactEmail: string | null = null;
  if (allEmailMatches.length > 1) {
    // Second email is likely the contact email
    contactEmail = decodeEmail(normalizeString(allEmailMatches[1][1]) || '');
  }

  // Extract summary/description
  const summaryMatch = htmlBlock.match(/<span style="font-style:italic;">Summary<br><\/span><\/strong>([^<]+)/i);
  const summary = summaryMatch ? normalizeString(summaryMatch[1]) : null;

  // Extract activity
  const activityMatch = htmlBlock.match(/<span style="font-style:italic;">Activity<br><\/span><\/strong>([^<]+)/i);
  const activity = activityMatch ? normalizeString(activityMatch[1]) : null;

  // Build contacts array
  const contacts: Contact[] = [];
  if (contactName) {
    contacts.push({
      contact_person_name: contactName,
      contact_person_role: null,
      contact_person_email: contactEmail,
      contact_person_phone: contactMobile,
    });
  }

  // Build association record
  const association: Association = {
    detail_url: detailUrl,
    name: associationName,
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
  log(`FRI Catalog Scraper - ${MUNICIPALITY}`);
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
