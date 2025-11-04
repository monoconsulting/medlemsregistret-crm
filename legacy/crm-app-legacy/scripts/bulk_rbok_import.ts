/**
 * Bulk RBOK Database Import
 *
 * Imports all scraped RBOK association data into the database.
 * Reads JSON files from scraping/json/ and imports to MySQL via Prisma.
 *
 * Follows MUNICIPAL_ASSOCIATION_JSON_STANDARD.md for input format.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
    }
  }
});

// Configuration - go up one level from crm-app to project root
const PROJECT_ROOT = path.join(process.cwd(), '..');
const JSON_DIR = path.join(PROJECT_ROOT, process.env.SCRAPING_JSON_DIR || 'scraping/json');

// JSON Standard Types
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
        title: string;
        data: Record<string, any>;
      }>;
    } | string | null;
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

interface ImportStats {
  municipality: string;
  file: string;
  totalRecords: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Find municipality record by name
 */
async function findMunicipality(name: string) {
  const municipality = await prisma.municipality.findFirst({
    where: { name },
    select: { id: true },
  });
  return municipality;
}

/**
 * Import a single association record
 * Follows JSON Standard upsert semantics based on detail_url
 */
async function importAssociation(
  record: AssociationRecord,
  municipalityId: string,
  scrapeRunDbId: string
): Promise<'imported' | 'updated' | 'skipped'> {
  try {
    const assocData = record.association;

    // Check if association already exists by detail_url
    const existingAssociation = await prisma.association.findFirst({
      where: {
        detailUrl: assocData.detail_url,
      },
    });

    // Normalize description to JSON format
    let descriptionJson: any = null;
    if (assocData.description) {
      if (typeof assocData.description === 'string') {
        descriptionJson = { free_text: assocData.description };
      } else {
        descriptionJson = assocData.description;
      }
    }

    const associationPayload = {
      name: assocData.name,
      orgNumber: assocData.org_number,
      municipalityId: municipalityId,
      municipality: record.municipality,
      scrapeRunId: scrapeRunDbId,
      scrapedAt: new Date(record.scraped_at),
      detailUrl: assocData.detail_url,
      types: assocData.types || [],
      activities: assocData.activities || [],
      categories: assocData.categories || [],
      email: assocData.email,
      phone: assocData.phone,
      homepageUrl: assocData.homepage_url,
      streetAddress: assocData.street_address,
      postalCode: assocData.postal_code,
      city: assocData.city,
      description: descriptionJson,
      descriptionFreeText: typeof assocData.description === 'string'
        ? assocData.description
        : assocData.description?.free_text || null,
      sourceSystem: record.source_system,
      listPageIndex: record.source_navigation.list_page_index,
      positionOnPage: record.source_navigation.position_on_page,
      paginationModel: record.source_navigation.pagination_model,
      filterState: record.source_navigation.filter_state,
      extras: record.extras || {},
    };

    if (existingAssociation) {
      // Update existing association (P2002 on detailUrl -> update strategy)
      await prisma.association.update({
        where: { id: existingAssociation.id },
        data: associationPayload,
      });

      // Sync contacts: delete old, create new (scrape is truth)
      await prisma.contact.deleteMany({
        where: { associationId: existingAssociation.id },
      });

      if (record.contacts && record.contacts.length > 0) {
        await prisma.contact.createMany({
          data: record.contacts.map(c => ({
            associationId: existingAssociation.id,
            name: c.contact_person_name,
            role: c.contact_person_role,
            email: c.contact_person_email,
            phone: c.contact_person_phone,
          })),
        });
      }

      return 'updated';
    } else {
      // Create new association
      const newAssociation = await prisma.association.create({
        data: associationPayload,
      });

      // Create contacts
      if (record.contacts && record.contacts.length > 0) {
        await prisma.contact.createMany({
          data: record.contacts.map(c => ({
            associationId: newAssociation.id,
            name: c.contact_person_name,
            role: c.contact_person_role,
            email: c.contact_person_email,
            phone: c.contact_person_phone,
          })),
        });
      }

      return 'imported';
    }
  } catch (error) {
    console.error(`Error importing association ${record.association.name}:`, error);
    throw error;
  }
}

/**
 * Import associations from a JSON file
 */
async function importFile(filePath: string): Promise<ImportStats> {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);

  const stats: ImportStats = {
    municipality: '',
    file: fileName,
    totalRecords: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Read JSON file (handle both .json and .jsonl)
    const content = fs.readFileSync(filePath, 'utf-8');

    let records: AssociationRecord[];

    if (filePath.endsWith('.jsonl')) {
      // JSONL: one JSON object per line
      records = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } else {
      // Regular JSON array
      records = JSON.parse(content);
    }

    stats.totalRecords = records.length;

    if (records.length === 0) {
      console.log('  ⚠️  File contains no records, skipping');
      return stats;
    }

    // Get municipality name and scrape run info from first record
    stats.municipality = records[0].municipality;
    const scrapedAt = new Date(records[0].scraped_at);

    // Find municipality
    const municipality = await findMunicipality(stats.municipality);

    if (!municipality) {
      console.log(`  ❌ Municipality "${stats.municipality}" not found in database`);
      stats.errors = stats.totalRecords;
      return stats;
    }

    // Create ScrapeRun record for this import
    const scrapeRun = await prisma.scrapeRun.create({
      data: {
        municipalityId: municipality.id,
        status: 'completed',
        startedAt: scrapedAt,
        completedAt: scrapedAt,
        totalFound: records.length,
        totalProcessed: 0, // Will be updated as we go
      },
    });
    console.log(`  Created ScrapeRun: ${scrapeRun.id}`);

    console.log(`  Municipality: ${stats.municipality} (ID: ${municipality.id})`);
    console.log(`  Total records: ${stats.totalRecords}`);

    // Import each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        const result = await importAssociation(record, municipality.id, scrapeRun.id);

        if (result === 'imported') {
          stats.imported++;
        } else if (result === 'updated') {
          stats.updated++;
        } else {
          stats.skipped++;
        }

        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`  Progress: ${i + 1}/${stats.totalRecords} (${stats.imported} new, ${stats.updated} updated)`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`  Error on record ${i + 1}:`, error);
      }
    }

    // Update scrapeRun with final counts
    await prisma.scrapeRun.update({
      where: { id: scrapeRun.id },
      data: {
        totalProcessed: stats.imported + stats.updated,
      },
    });

    console.log(`  ✅ Completed: ${stats.imported} imported, ${stats.updated} updated, ${stats.errors} errors`);

  } catch (error) {
    console.error(`  ❌ Failed to process file:`, error);
    stats.errors = stats.totalRecords || 1;
  }

  return stats;
}

/**
 * Find all RBOK JSON files
 */
interface FileSelectionResult {
  selected: string[]
  skipped: string[]
}

function findRBOKJsonFiles(): FileSelectionResult {
  if (!fs.existsSync(JSON_DIR)) {
    return { selected: [], skipped: [] }
  }

  const files = fs.readdirSync(JSON_DIR)
  const latestByMunicipality = new Map<string, { file: string; score: number }>()
  const skipped: string[] = []

  for (const file of files) {
    if (
      !file.toLowerCase().endsWith('.json') ||
      !file.includes('_RBOK_') ||
      file.includes('summary') ||
      file.includes('bulk_')
    ) {
      continue
    }

    const municipality = extractMunicipalityFromFilename(file, '_RBOK_')
    if (!municipality) {
      continue
    }

    const key = municipality.toLowerCase()
    const score = extractTimestampScore(file)
    const existing = latestByMunicipality.get(key)

    if (!existing || score > existing.score) {
      if (existing) {
        skipped.push(path.join(JSON_DIR, existing.file))
      }
      latestByMunicipality.set(key, { file, score })
    } else {
      skipped.push(path.join(JSON_DIR, file))
    }
  }

  const selected = Array.from(latestByMunicipality.values()).map((entry) =>
    path.join(JSON_DIR, entry.file)
  )

  return { selected, skipped }
}

function extractMunicipalityFromFilename(file: string, marker: string): string | null {
  const index = file.indexOf(marker)
  if (index === -1) {
    return null
  }
  return file.slice(0, index)
}

function extractTimestampScore(file: string): number {
  const match = file.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute] = match
    const iso = `${year}-${month}-${day}T${hour}:${minute}:00Z`
    const parsed = Date.parse(iso)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  try {
    const stats = fs.statSync(path.join(JSON_DIR, file))
    return stats.mtimeMs
  } catch {
    return -Infinity
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== BULK RBOK DATABASE IMPORT ===\n');

  // Find JSON files
  const { selected: jsonFiles, skipped } = findRBOKJsonFiles();

  if (jsonFiles.length === 0) {
    console.log('No RBOK JSON files found in scraping/json/');
    console.log('Run bulk_rbok_scrape.ts first to generate data files.');
    return;
  }

  console.log(`Found ${jsonFiles.length} JSON files to import (latest per municipality)\n`);
  if (skipped.length) {
    console.log('Skipping older files:');
    skipped.forEach((filePath) => console.log(`  - ${path.basename(filePath)}`));
    console.log('');
  }

  const allStats: ImportStats[] = [];
  const startTime = Date.now();

  // Process each file
  for (const filePath of jsonFiles) {
    const stats = await importFile(filePath);
    allStats.push(stats);
  }

  const duration = Date.now() - startTime;

  // Print summary
  console.log('\n=== IMPORT SUMMARY ===\n');
  console.log('Municipality                 | Records | Imported | Updated | Errors');
  console.log('------------------------------|---------|----------|---------|--------');

  let totalRecords = 0;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  allStats.forEach(stat => {
    const name = stat.municipality.padEnd(28);
    const records = stat.totalRecords.toString().padStart(7);
    const imported = stat.imported.toString().padStart(8);
    const updated = stat.updated.toString().padStart(7);
    const errors = stat.errors.toString().padStart(6);

    console.log(`${name} | ${records} | ${imported} | ${updated} | ${errors}`);

    totalRecords += stat.totalRecords;
    totalImported += stat.imported;
    totalUpdated += stat.updated;
    totalErrors += stat.errors;
  });

  console.log('------------------------------|---------|----------|---------|--------');
  console.log(`TOTAL                         | ${totalRecords.toString().padStart(7)} | ${totalImported.toString().padStart(8)} | ${totalUpdated.toString().padStart(7)} | ${totalErrors.toString().padStart(6)}`);

  const successRate = totalRecords > 0
    ? (((totalImported + totalUpdated) / totalRecords) * 100).toFixed(1)
    : '0.0';

  console.log(`\n✅ Bulk import completed in ${(duration / 1000).toFixed(2)} seconds`);
  console.log(`📊 Summary:`);
  console.log(`   - Files processed: ${jsonFiles.length}`);
  console.log(`   - Total records: ${totalRecords}`);
  console.log(`   - New associations: ${totalImported}`);
  console.log(`   - Updated associations: ${totalUpdated}`);
  console.log(`   - Errors: ${totalErrors}`);
  console.log(`   - Success rate: ${successRate}%`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
