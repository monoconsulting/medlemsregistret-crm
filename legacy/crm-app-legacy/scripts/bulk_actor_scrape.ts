/**
 * Bulk Actor Smartbook Scraper
 *
 * Automatically scrapes all municipalities with verified Actor Smartbook API endpoints.
 * Fetches municipality list from database, scrapes each one sequentially, and saves to JSON files.
 */

import { PrismaClient } from '@prisma/client';
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
const SOURCE_SYSTEM = 'ActorSmartbook';
const ITEMS_PER_PAGE = 10;
const DELAY_BETWEEN_MUNICIPALITIES = 2000; // 2 seconds between municipalities
const DELAY_BETWEEN_REQUESTS = 300; // 300ms between requests

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

interface MunicipalityStats {
  municipality: string;
  totalAssociations: number;
  scraped: number;
  missingOrgNumber: number;
  missingContacts: number;
  errors: number;
  duration: number;
}

/**
 * Normalize municipality name for file naming (no Swedish characters)
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
 * Fetch list of associations from API
 */
async function fetchAssociationList(baseUrl: string, page: number): Promise<ApiListResponse> {
  const url = `${baseUrl}/Associations/${page}/${ITEMS_PER_PAGE}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`List API returned ${response.status} for ${url}`);
  }

  return await response.json();
}

/**
 * Fetch association details from API
 */
async function fetchAssociationDetail(baseUrl: string, id: number): Promise<ApiDetailResponse> {
  const url = `${baseUrl}/GetAssociation`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error(`Detail API returned ${response.status} for ID ${id}`);
  }

  return await response.json();
}

/**
 * Transform API response to standardized record format
 */
function transformToRecord(
  listItem: ApiListResponse['items'][0],
  detail: ApiDetailResponse | null,
  municipality: string,
  scrapeRunId: string,
  scrapedAt: string,
  pageIndex: number,
  positionOnPage: number
): AssociationRecord {
  const contacts = detail?.ContactPersons?.map(cp => ({
    contact_person_name: cp.name || '',
    contact_person_role: cp.role || null,
    contact_person_email: cp.email || null,
    contact_person_phone: cp.mobile || null,
  })) || [];

  // Handle concatenated emails from Actor API
  const rawEmail = detail?.email || listItem.email || null;
  let associationEmail: string | null = null;

  if (rawEmail && rawEmail.includes(',')) {
    // Split comma-separated emails and add as contacts
    const emails = rawEmail.split(',')
      .map(e => e.trim())
      .filter(e => e && e.length > 0 && e.includes('@'));

    emails.forEach(email => {
      contacts.push({
        contact_person_name: "",
        contact_person_role: "",
        contact_person_email: email,
        contact_person_phone: "",
      });
    });
    // Don't set association email when multiple emails exist
    associationEmail = null;
  } else {
    // Single email - use it for association
    associationEmail = rawEmail;
  }

  return {
    source_system: SOURCE_SYSTEM,
    municipality,
    scrape_run_id: scrapeRunId,
    scraped_at: scrapedAt,
    association: {
      name: listItem.name || detail?.name || '',
      org_number: detail?.orgnr || null,
      types: [],
      activities: detail?.ageRangeStrings || [],
      categories: [],
      homepage_url: detail?.website || listItem.url || null,
      detail_url: listItem.url || '',
      street_address: null,
      postal_code: null,
      city: detail?.city || null,
      email: associationEmail,
      phone: null,
      description: null,
    },
    contacts,
    source_navigation: {
      list_page_index: pageIndex,
      position_on_page: positionOnPage,
      pagination_model: 'api_pagination',
      filter_state: null,
    },
    extras: {
      api_id: listItem.id,
      age_ranges: detail?.ageRangeStrings || [],
    },
  };
}

/**
 * Scrape a single municipality
 */
async function scrapeMunicipality(
  municipalityName: string,
  baseUrl: string
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
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(`[${municipalityName}] ${message}`);
  };

  log(`Starting scrape for ${municipalityName}`);
  log(`Base URL: ${baseUrl}`);
  log(`Scrape Run ID: ${scrapeRunId}`);

  const stats: MunicipalityStats = {
    municipality: municipalityName,
    totalAssociations: 0,
    scraped: 0,
    missingOrgNumber: 0,
    missingContacts: 0,
    errors: 0,
    duration: 0,
  };

  const records: AssociationRecord[] = [];

  try {
    // Fetch first page to get total count
    log('Fetching first page to determine total associations...');
    const firstPage = await fetchAssociationList(baseUrl, 1);
    stats.totalAssociations = firstPage.totalNumItems;
    const totalPages = Math.ceil(stats.totalAssociations / ITEMS_PER_PAGE);

    log(`Total associations: ${stats.totalAssociations}`);
    log(`Total pages: ${totalPages}`);

    // Process all pages
    for (let page = 1; page <= totalPages; page++) {
      log(`Processing page ${page}/${totalPages}...`);

      let listData: ApiListResponse;
      if (page === 1) {
        listData = firstPage;
      } else {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        listData = await fetchAssociationList(baseUrl, page);
      }

      // Process each association on the page
      for (let i = 0; i < listData.items.length; i++) {
        const listItem = listData.items[i];

        try {
          // Fetch detailed information
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
          const detail = await fetchAssociationDetail(baseUrl, listItem.id);

          const record = transformToRecord(
            listItem,
            detail,
            municipalityName,
            scrapeRunId,
            scrapedAt,
            page,
            i
          );

          records.push(record);
          stats.scraped++;

          // Track missing data
          if (!detail.orgnr) {
            stats.missingOrgNumber++;
          }
          if (!detail.ContactPersons || detail.ContactPersons.length === 0) {
            stats.missingContacts++;
          }

          if (stats.scraped % 10 === 0) {
            log(`Progress: ${stats.scraped}/${stats.totalAssociations} associations`);
          }
        } catch (error) {
          stats.errors++;
          log(`Error fetching details for association ID ${listItem.id}: ${error}`);
        }
      }
    }

    // Save to JSON file with new format: {municipality}_ActorSmartbook_{YYYY-MM-DD}_{HH-MM}.json
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-'); // HH-MM
    const jsonPath = path.join(OUTPUT_DIR, `${normalizedName}_ActorSmartbook_${dateStr}_${timeStr}.json`);

    // Write pretty JSON (overwrite if exists)
    fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
    log(`Saved JSON to: ${jsonPath}`);

    stats.duration = Date.now() - startTime;

    // Log final stats
    log('=== SCRAPING COMPLETED ===');
    log(`Total associations: ${stats.totalAssociations}`);
    log(`Successfully scraped: ${stats.scraped}`);
    log(`Missing org number: ${stats.missingOrgNumber}`);
    log(`Missing contacts: ${stats.missingContacts}`);
    log(`Errors: ${stats.errors}`);
    log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);

  } catch (error) {
    log(`FATAL ERROR: ${error}`);
    throw error;
  } finally {
    logStream.end();
  }

  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('=== BULK ACTOR SMARTBOOK SCRAPER ===\n');

  // Fetch municipalities with verified endpoints
  const municipalities = await prisma.municipality.findMany({
    where: {
      registryEndpoint: { not: null },
      platform: 'Actors Smartbook',
    },
    select: {
      name: true,
      registryEndpoint: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Found ${municipalities.length} municipalities with Actor Smartbook endpoints\n`);

  const allStats: MunicipalityStats[] = [];
  const overallStartTime = Date.now();

  for (let i = 0; i < municipalities.length; i++) {
    const muni = municipalities[i];

    if (!muni.registryEndpoint) {
      console.log(`Skipping ${muni.name}: No registry endpoint`);
      continue;
    }

    console.log(`\n[${i + 1}/${municipalities.length}] Starting ${muni.name}...`);

    try {
      const stats = await scrapeMunicipality(muni.name, muni.registryEndpoint);
      allStats.push(stats);

      // Delay between municipalities to be respectful
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
        missingContacts: 0,
        errors: 1,
        duration: 0,
      });
    }
  }

  const overallDuration = Date.now() - overallStartTime;

  // Print summary
  console.log('\n=== BULK SCRAPING SUMMARY ===\n');
  console.log('Municipality                 | Total | Scraped | Missing Org# | Missing Contacts | Errors | Duration');
  console.log('------------------------------|-------|---------|--------------|------------------|--------|----------');

  let totalAssociations = 0;
  let totalScraped = 0;
  let totalErrors = 0;

  allStats.forEach(stat => {
    const name = stat.municipality.padEnd(28);
    const total = stat.totalAssociations.toString().padStart(5);
    const scraped = stat.scraped.toString().padStart(7);
    const missingOrg = stat.missingOrgNumber.toString().padStart(12);
    const missingContacts = stat.missingContacts.toString().padStart(16);
    const errors = stat.errors.toString().padStart(6);
    const duration = `${(stat.duration / 1000).toFixed(1)}s`.padStart(8);

    console.log(`${name} | ${total} | ${scraped} | ${missingOrg} | ${missingContacts} | ${errors} | ${duration}`);

    totalAssociations += stat.totalAssociations;
    totalScraped += stat.scraped;
    totalErrors += stat.errors;
  });

  console.log('------------------------------|-------|---------|--------------|------------------|--------|----------');
  console.log(`TOTAL                         | ${totalAssociations.toString().padStart(5)} | ${totalScraped.toString().padStart(7)} |              |                  | ${totalErrors.toString().padStart(6)} | ${(overallDuration / 1000).toFixed(1)}s`);

  console.log(`\n✅ Bulk scraping completed in ${(overallDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`📁 Output files saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Log files saved to: ${LOGS_DIR}`);

  // Save summary to file
  const summaryPath = path.join(OUTPUT_DIR, `bulk_scrape_summary_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(allStats, null, 2), 'utf-8');
  console.log(`📊 Summary saved to: ${summaryPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
