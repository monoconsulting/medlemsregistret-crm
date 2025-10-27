/**
 * Boras Municipal Association Registry Scraper - API Version
 * Platform: Actor Smartbook (API-based)
 * URL: https://boras.actorsmartbook.se/
 *
 * This script uses the Actor Smartbook REST API instead of DOM scraping
 * for much faster and more reliable data extraction.
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { getScrapingPaths, createLogger } from '../utils/scraper-base';
import { sanitizeForValidation } from '../utils/sanitize';

// Configuration
const SOURCE_SYSTEM = 'ActorSmartbook';
const MUNICIPALITY = 'Boras';
const BASE_URL = 'https://boras.actorsmartbook.se';
const LIST_ENDPOINT = `${BASE_URL}/Associations`; // Returns list with page/totalNumItems/items
const DETAIL_ENDPOINT = `${BASE_URL}/GetAssociation`; // POST endpoint with {id: number} payload
const ITEMS_PER_PAGE = 10;
const SCRAPE_RUN_ID = uuidv4();
const SCRAPED_AT = new Date().toISOString();

// Get paths
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

// API Response Types
interface ApiListResponse {
  page: number;
  totalNumItems: number;
  items: Array<{
    id: number;
    name: string;
    email: string;
    url: string;
  }>;
}

interface ApiDetailResponse {
  id: number;
  name: string;
  email: string;
  orgnr: string;
  website: string;
  city: string;
  ContactPersons: Array<{
    name: string;
    email: string;
    mobile: string;
    role: string;
  }>;
  ageRangeStrings: string[];
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

function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

async function fetchListPage(page: number): Promise<ApiListResponse> {
  const url = `${LIST_ENDPOINT}/${page}/${ITEMS_PER_PAGE}`;
  log.info(`Fetching page ${page}: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function fetchAssociationDetail(id: number): Promise<ApiDetailResponse> {
  const response = await fetch(DETAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

function convertToRecord(
  detail: ApiDetailResponse,
  pageIndex: number,
  positionOnPage: number
): AssociationRecord {
  const record: AssociationRecord = {
    source_system: SOURCE_SYSTEM,
    municipality: MUNICIPALITY,
    scrape_run_id: SCRAPE_RUN_ID,
    scraped_at: SCRAPED_AT,
    association: {
      name: detail.name,
      org_number: normalizeString(detail.orgnr),
      types: [],
      activities: [],
      categories: detail.ageRangeStrings || [],
      homepage_url: normalizeString(detail.website),
      detail_url: `${BASE_URL}/association/${detail.id}`,
      street_address: null,
      postal_code: null,
      city: normalizeString(detail.city),
      email: normalizeString(detail.email),
      phone: null,
      description: null
    },
    contacts: (detail.ContactPersons || []).map(contact => ({
      contact_person_name: contact.name,
      contact_person_role: normalizeString(contact.role),
      contact_person_email: normalizeString(contact.email),
      contact_person_phone: normalizeString(contact.mobile)
    })),
    source_navigation: {
      list_page_index: pageIndex,
      position_on_page: positionOnPage,
      pagination_model: 'api_pagination',
      filter_state: null
    },
    extras: {
      api_id: detail.id
    }
  };

  return record;
}

function writeJsonl(record: AssociationRecord): void {
  const line = JSON.stringify(record) + '\n';
  fs.appendFileSync(JSONL_PATH, line);
}

function writePrettyJson(records: AssociationRecord[]): void {
  const json = JSON.stringify(records, null, 2);
  fs.writeFileSync(JSON_PATH, json);
}

async function main(): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  log.info('='.repeat(80));
  log.info(`Starting API scrape: ${MUNICIPALITY} (${SOURCE_SYSTEM})`);
  log.info(`Run ID: ${SCRAPE_RUN_ID}`);
  log.info(`List Endpoint: ${LIST_ENDPOINT}/{page}/${ITEMS_PER_PAGE}`);
  log.info(`Detail Endpoint: POST ${DETAIL_ENDPOINT} with {id}`);
  log.info('='.repeat(80));

  const allRecords: AssociationRecord[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let totalItems = 0;

  try {
    // Fetch first page to get total count
    log.info('Fetching first page to determine total items...');
    const firstPage = await fetchListPage(currentPage);
    totalItems = firstPage.totalNumItems;
    totalPages = Math.ceil(totalItems / firstPage.items.length);

    log.info(`Total associations: ${totalItems}`);
    log.info(`Estimated pages: ${totalPages}`);

    // Process all pages
    while (true) {
      const listPage = currentPage === 1 ? firstPage : await fetchListPage(currentPage);

      if (!listPage.items || listPage.items.length === 0) {
        log.info('No more items found, stopping pagination');
        break;
      }

      log.info(`Page ${currentPage}: Processing ${listPage.items.length} associations`);

      // Fetch details for each association
      for (let i = 0; i < listPage.items.length; i++) {
        const item = listPage.items[i];

        try {
          log.info(`  [${currentPage}:${i}] Fetching details for "${item.name}" (ID: ${item.id})`);
          const detail = await fetchAssociationDetail(item.id);

          const record = convertToRecord(detail, currentPage, i);

          // Update stats
          totalAssociations++;
          if (!record.association.org_number) missingOrgNumber++;
          if (record.contacts.length === 0) missingContacts++;

          // Write to JSONL
          writeJsonl(record);
          allRecords.push(record);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          log.info(`  [${currentPage}:${i}] ERROR fetching details for ${item.name}: ${error}`);
        }
      }

      currentPage++;

      // Check if we've reached the end
      if (allRecords.length >= totalItems) {
        log.info('Reached total item count, stopping');
        break;
      }

      // Safety limit
      if (currentPage > 100) {
        log.info('Reached safety limit of 100 pages, stopping');
        break;
      }
    }

    log.info(`Completed scraping ${currentPage - 1} pages`);

    // Sanitize and write pretty JSON
    const sanitizedRecords = sanitizeForValidation(allRecords);
    log.info('Writing pretty JSON file...');
    writePrettyJson(sanitizedRecords);

    // Log summary
    log.info('='.repeat(80));
    log.info('SCRAPING COMPLETE');
    log.info('='.repeat(80));
    log.info(`Total associations scraped: ${totalAssociations}`);
    log.info(`Records missing org_number: ${missingOrgNumber}`);
    log.info(`Records missing contacts: ${missingContacts}`);
    log.info('');
    log.info('Output files:');
    log.info(`  JSONL: ${JSONL_PATH}`);
    log.info(`  JSON:  ${JSON_PATH}`);
    log.info(`  Log:   ${LOG_PATH}`);
    log.info('='.repeat(80));

  } catch (error) {
    log.info(`FATAL ERROR: ${error}`);
    throw error;
  }
}

// Run the scraper
main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
