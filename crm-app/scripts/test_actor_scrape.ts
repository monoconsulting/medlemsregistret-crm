/**
 * Test Actor Smartbook Scraper
 *
 * Tests the scraping functionality on a single small municipality before running bulk.
 * Using Gnosjö (72 associations) as test case.
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
    }
  }
});

// Configuration - Test with Gnosjö (small municipality)
const TEST_MUNICIPALITY = 'Gnosjö';
const SOURCE_SYSTEM = 'ActorSmartbook';
const ITEMS_PER_PAGE = 10;
const DELAY_BETWEEN_REQUESTS = 300;

// Output directory - go up one level from crm-app to project root
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

/**
 * Normalize municipality name for file naming
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
  console.log(`  Fetching: ${url}`);
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
      email: detail?.email || listItem.email || null,
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
 * Main test function
 */
async function main() {
  console.log('=== TEST ACTOR SMARTBOOK SCRAPER ===\n');

  // Get municipality from database
  const municipality = await prisma.municipality.findFirst({
    where: {
      name: TEST_MUNICIPALITY,
      registryEndpoint: { not: null },
    },
  });

  if (!municipality || !municipality.registryEndpoint) {
    console.error(`Municipality ${TEST_MUNICIPALITY} not found or has no endpoint`);
    return;
  }

  const baseUrl = municipality.registryEndpoint;
  console.log(`Testing with: ${TEST_MUNICIPALITY}`);
  console.log(`Base URL: ${baseUrl}\n`);

  const startTime = Date.now();
  const scrapeRunId = randomUUID();
  const scrapedAt = new Date().toISOString();
  const normalizedName = normalizeFilename(TEST_MUNICIPALITY);

  const records: AssociationRecord[] = [];
  let totalAssociations = 0;
  let scraped = 0;
  let missingOrgNumber = 0;
  let missingContacts = 0;
  let errors = 0;

  try {
    // Fetch first page
    console.log('Step 1: Fetching first page...');
    const firstPage = await fetchAssociationList(baseUrl, 1);
    totalAssociations = firstPage.totalNumItems;
    const totalPages = Math.ceil(totalAssociations / ITEMS_PER_PAGE);

    console.log(`  Total associations: ${totalAssociations}`);
    console.log(`  Total pages: ${totalPages}\n`);

    // Process all pages
    for (let page = 1; page <= totalPages; page++) {
      console.log(`Step ${page + 1}: Processing page ${page}/${totalPages}...`);

      let listData: ApiListResponse;
      if (page === 1) {
        listData = firstPage;
      } else {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        listData = await fetchAssociationList(baseUrl, page);
      }

      console.log(`  Found ${listData.items.length} items on this page`);

      // Process each association
      for (let i = 0; i < listData.items.length; i++) {
        const listItem = listData.items[i];

        try {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
          const detail = await fetchAssociationDetail(baseUrl, listItem.id);

          const record = transformToRecord(
            listItem,
            detail,
            TEST_MUNICIPALITY,
            scrapeRunId,
            scrapedAt,
            page,
            i
          );

          records.push(record);
          scraped++;

          if (!detail.orgnr) missingOrgNumber++;
          if (!detail.ContactPersons || detail.ContactPersons.length === 0) missingContacts++;

          console.log(`    ${scraped}/${totalAssociations}: ${listItem.name}`);
        } catch (error) {
          errors++;
          console.error(`    Error fetching ID ${listItem.id}:`, error);
        }
      }
    }

    // Save files
    console.log('\nSaving files...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const jsonlPath = path.join(OUTPUT_DIR, `${normalizedName}_associations_${scrapeRunId}_${timestamp}.jsonl`);
    const jsonPath = path.join(OUTPUT_DIR, `${normalizedName}_associations_${scrapeRunId}_${timestamp}.json`);

    // JSONL
    const jsonlContent = records.map(r => JSON.stringify(r)).join('\n');
    fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');
    console.log(`  ✅ JSONL: ${jsonlPath}`);

    // Pretty JSON
    fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
    console.log(`  ✅ JSON: ${jsonPath}`);

    const duration = Date.now() - startTime;

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Municipality: ${TEST_MUNICIPALITY}`);
    console.log(`Total associations: ${totalAssociations}`);
    console.log(`Successfully scraped: ${scraped}`);
    console.log(`Missing org number: ${missingOrgNumber}`);
    console.log(`Missing contacts: ${missingContacts}`);
    console.log(`Errors: ${errors}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Average: ${(duration / scraped).toFixed(0)}ms per association`);

    console.log('\n✅ Test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated JSON files');
    console.log('2. Test import with: npx tsx scraping/scripts/bulk_actor_import.ts');
    console.log('3. If successful, run full scraping with: npx tsx scraping/scripts/bulk_actor_scrape.ts');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
