/**
 * Bulk IBGO Scraper
 *
 * Automatically scrapes all municipalities with verified IBGO API endpoints.
 * Fetches municipality list from database, scrapes each one sequentially, and saves to JSON files.
 *
 * Follows MUNICIPAL_ASSOCIATION_JSON_STANDARD.md for output format.
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
const SOURCE_SYSTEM = 'IBGO';
const DELAY_BETWEEN_MUNICIPALITIES = 2000; // 2 seconds between municipalities
const DELAY_BETWEEN_REQUESTS = 500; // 500ms between requests

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

// IBGO API Response Types
interface IBGOCustomer {
  Id: number;
  Name: string;
  WebSite: string | null;
  DistrictNames: string[];
  AssociationCategoryName: string;
  Address: string | null;
  ZipCode: string | null;
  City: string | null;
  Phone: string;
  Mobile: string;
  Email: string;
  PublicInformation: string;
  LeisureActivityCard: boolean;
  CustomerOccupations: Array<{
    Id: number;
    Name: string;
  }>;
  CustomerContactPeople: Array<{
    Id: number;
    OccupationId: number;
    Occupation: string;
    Name: string;
    Surname: string;
    Email: string | null;
    Mobile: string | null;
  }>;
}

interface IBGOApiResponse {
  TotalNumberOfElements: number;
  Customers: IBGOCustomer[];
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
        label: string;
        items: Array<{
          key: string;
          value: string;
        }>;
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
  missingEmail: number;
  missingPhone: number;
  withContacts: number;
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
 * Fetch all associations from IBGO API
 */
async function fetchIBGOAssociations(endpoint: string): Promise<IBGOApiResponse> {
  const response = await fetch(endpoint, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`IBGO API returned ${response.status} for ${endpoint}`);
  }

  return await response.json();
}

/**
 * Transform IBGO customer to standardized record format
 * Follows MUNICIPAL_ASSOCIATION_JSON_STANDARD.md
 */
function transformToRecord(
  customer: IBGOCustomer,
  municipality: string,
  scrapeRunId: string,
  scrapedAt: string,
  positionOnPage: number,
  municipalityRegisterUrl: string
): AssociationRecord {
  // Combine name and surname for contact persons from CustomerContactPeople
  const contacts = customer.CustomerContactPeople?.map(cp => ({
    contact_person_name: `${cp.Name} ${cp.Surname}`.trim(),
    contact_person_role: cp.Occupation || null,
    contact_person_email: cp.Email || null,
    contact_person_phone: cp.Mobile || null,
  })) || [];

  // If the main association Email field contains multiple comma-separated emails,
  // split them and add as additional contacts
  if (customer.Email && customer.Email.includes(',')) {
    const emails = customer.Email.split(',')
      .map(e => e.trim())
      .filter(e => e && e.length > 0 && e.includes('@')); // Filter out empty strings and invalid emails

    emails.forEach(email => {
      contacts.push({
        contact_person_name: "",
        contact_person_role: "",
        contact_person_email: email,
        contact_person_phone: "",
      });
    });
  }

  // Build description from PublicInformation and other fields
  let description: AssociationRecord['association']['description'] = null;

  if (customer.PublicInformation || customer.CustomerOccupations?.length > 0) {
    const sections: Array<{ label: string; items: Array<{ key: string; value: string }> }> = [];

    // Add occupation/activities as a section if exists
    if (customer.CustomerOccupations && customer.CustomerOccupations.length > 0) {
      sections.push({
        label: 'Verksamhet',
        items: customer.CustomerOccupations.map(occ => ({
          key: 'Aktivitet',
          value: occ.Name
        }))
      });
    }

    // Add district names if exists
    if (customer.DistrictNames && customer.DistrictNames.length > 0) {
      sections.push({
        label: 'Områden',
        items: customer.DistrictNames.map(dist => ({
          key: 'Område',
          value: dist
        }))
      });
    }

    description = {
      free_text: customer.PublicInformation || null,
      sections: sections.length > 0 ? sections : []
    };
  }

  // Generate detail_url from municipalityRegisterUrl + customer ID
  // For IBGO, we construct a pseudo-URL since they don't expose individual detail pages
  const detailUrl = `${municipalityRegisterUrl}#/association/${customer.Id}`;

  return {
    source_system: SOURCE_SYSTEM,
    municipality,
    scrape_run_id: scrapeRunId,
    scraped_at: scrapedAt,
    association: {
      detail_url: detailUrl,
      name: customer.Name || '',
      org_number: null, // IBGO doesn't provide org numbers
      types: customer.AssociationCategoryName ? [customer.AssociationCategoryName] : [],
      activities: customer.CustomerOccupations?.map(o => o.Name) || [],
      categories: customer.DistrictNames || [],
      homepage_url: customer.WebSite || null,
      street_address: customer.Address || null,
      postal_code: customer.ZipCode || null,
      city: customer.City || null,
      email: (customer.Email && !customer.Email.includes(',')) ? customer.Email : null, // Only use email if it's a single address
      phone: customer.Phone || customer.Mobile || null,
      description,
    },
    contacts,
    source_navigation: {
      list_page_index: null, // IBGO returns all in one call
      position_on_page: positionOnPage,
      pagination_model: 'single_api_call',
      filter_state: null,
    },
    extras: {
      ibgo_id: customer.Id,
      leisure_activity_card: customer.LeisureActivityCard,
      has_public_info: !!customer.PublicInformation,
    },
  };
}

/**
 * Scrape a single municipality
 */
async function scrapeMunicipality(
  municipalityName: string,
  endpoint: string,
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
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(`[${municipalityName}] ${message}`);
  };

  log(`Starting IBGO scrape for ${municipalityName}`);
  log(`Endpoint: ${endpoint}`);
  log(`Scrape Run ID: ${scrapeRunId}`);

  const stats: MunicipalityStats = {
    municipality: municipalityName,
    totalAssociations: 0,
    scraped: 0,
    missingEmail: 0,
    missingPhone: 0,
    withContacts: 0,
    errors: 0,
    duration: 0,
  };

  const records: AssociationRecord[] = [];

  try {
    // Fetch all associations from IBGO API
    log('Fetching associations from IBGO API...');
    const apiResponse = await fetchIBGOAssociations(endpoint);

    stats.totalAssociations = apiResponse.TotalNumberOfElements;
    log(`Total associations: ${stats.totalAssociations}`);

    // Process each customer
    for (let i = 0; i < apiResponse.Customers.length; i++) {
      const customer = apiResponse.Customers[i];

      try {
        const record = transformToRecord(
          customer,
          municipalityName,
          scrapeRunId,
          scrapedAt,
          i,
          registerUrl
        );

        records.push(record);
        stats.scraped++;

        // Track statistics
        if (!customer.Email) {
          stats.missingEmail++;
        }
        if (!customer.Phone && !customer.Mobile) {
          stats.missingPhone++;
        }
        if (customer.CustomerContactPeople && customer.CustomerContactPeople.length > 0) {
          stats.withContacts++;
        }

        if (stats.scraped % 50 === 0) {
          log(`Progress: ${stats.scraped}/${stats.totalAssociations} associations`);
        }
      } catch (error) {
        stats.errors++;
        log(`Error processing association ID ${customer.Id}: ${error}`);
      }
    }

    // Save to JSON file with new format: {municipality}_IBGO_{YYYY-MM-DD}_{HH-MM}.json
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-'); // HH-MM
    const jsonPath = path.join(OUTPUT_DIR, `${normalizedName}_IBGO_${dateStr}_${timeStr}.json`);

    // Write pretty JSON (overwrite if exists)
    fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
    log(`Saved JSON to: ${jsonPath}`);

    stats.duration = Date.now() - startTime;

    // Log final stats
    log('=== SCRAPING COMPLETED ===');
    log(`Total associations: ${stats.totalAssociations}`);
    log(`Successfully scraped: ${stats.scraped}`);
    log(`Missing email: ${stats.missingEmail}`);
    log(`Missing phone: ${stats.missingPhone}`);
    log(`With contact persons: ${stats.withContacts}`);
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
  console.log('=== BULK IBGO SCRAPER ===\n');

  // Fetch municipalities with verified IBGO endpoints
  const municipalities = await prisma.municipality.findMany({
    where: {
      registryEndpoint: { not: null },
      platform: 'Interbook Go',
    },
    select: {
      name: true,
      registryEndpoint: true,
      registerUrl: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Found ${municipalities.length} municipalities with IBGO endpoints\n`);

  if (municipalities.length === 0) {
    console.log('No municipalities found. Run endpoint verification first.');
    return;
  }

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
      const stats = await scrapeMunicipality(
        muni.name,
        muni.registryEndpoint,
        muni.registerUrl || muni.registryEndpoint
      );
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
        missingEmail: 0,
        missingPhone: 0,
        withContacts: 0,
        errors: 1,
        duration: 0,
      });
    }
  }

  const overallDuration = Date.now() - overallStartTime;

  // Print summary
  console.log('\n=== BULK SCRAPING SUMMARY ===\n');
  console.log('Municipality                 | Total | Scraped | Missing Email | Missing Phone | With Contacts | Errors | Duration');
  console.log('------------------------------|-------|---------|---------------|---------------|---------------|--------|----------');

  let totalAssociations = 0;
  let totalScraped = 0;
  let totalErrors = 0;

  allStats.forEach(stat => {
    const name = stat.municipality.padEnd(28);
    const total = stat.totalAssociations.toString().padStart(5);
    const scraped = stat.scraped.toString().padStart(7);
    const missingEmail = stat.missingEmail.toString().padStart(13);
    const missingPhone = stat.missingPhone.toString().padStart(13);
    const withContacts = stat.withContacts.toString().padStart(13);
    const errors = stat.errors.toString().padStart(6);
    const duration = `${(stat.duration / 1000).toFixed(1)}s`.padStart(8);

    console.log(`${name} | ${total} | ${scraped} | ${missingEmail} | ${missingPhone} | ${withContacts} | ${errors} | ${duration}`);

    totalAssociations += stat.totalAssociations;
    totalScraped += stat.scraped;
    totalErrors += stat.errors;
  });

  console.log('------------------------------|-------|---------|---------------|---------------|---------------|--------|----------');
  console.log(`TOTAL                         | ${totalAssociations.toString().padStart(5)} | ${totalScraped.toString().padStart(7)} |               |               |               | ${totalErrors.toString().padStart(6)} | ${(overallDuration / 1000).toFixed(1)}s`);

  console.log(`\n✅ Bulk scraping completed in ${(overallDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`📁 Output files saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Log files saved to: ${LOGS_DIR}`);

  // Save summary to file
  const summaryPath = path.join(OUTPUT_DIR, `bulk_ibgo_scrape_summary_${new Date().toISOString().split('T')[0]}.json`);
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
