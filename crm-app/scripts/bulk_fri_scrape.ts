import { execSync } from 'child_process';
import { promisify } from 'util';
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

// Read FRI CSV file
const csvPath = path.resolve(__dirname, '../../temp/Associations - FRI.csv');
const summaryOutputPath = path.resolve(__dirname, '../../scraping/json/bulk_fri_scrape_summary_' + new Date().toISOString().split('T')[0] + '.json');

interface MunicipalityEntry {
  name: string;
  url: string;
}

interface ScrapeResult {
  municipality: string;
  url: string;
  status: 'success' | 'failed';
  associationsScraped?: number;
  errorMessage?: string;
  durationMs?: number;
}

async function readFRIMunicipalities(): Promise<MunicipalityEntry[]> {
  console.log('Reading FRI municipalities from database...');

  const municipalities = await prisma.municipality.findMany({
    where: {
      registerUrl: { not: null },
      platform: 'FRI',
    },
    select: {
      name: true,
      registerUrl: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Use registerUrl for FRI municipalities (they don't have API endpoints)
  return municipalities.map(muni => ({
    name: muni.name,
    url: muni.registerUrl!,
  }));
}

async function scrapeMunicipality(municipality: string, url: string): Promise<ScrapeResult> {
  const startTime = Date.now();

  console.log('');
  console.log('='.repeat(80));
  console.log(`SCRAPING: ${municipality}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(80));

  try {
    // Run the generic FRI scraper
    const scriptPath = path.resolve(__dirname, '../../scraping/scripts/generic_fri_scrape.ts');
    execSync(`npx tsx "${scriptPath}" "${municipality}" "${url}"`, {
      stdio: 'inherit',
      timeout: 600000 // 10 minutes timeout
    });

    const durationMs = Date.now() - startTime;

    // Try to read the JSON file to get association count
    const jsonDir = path.resolve(__dirname, '../../scraping/json');
    const files = fs.readdirSync(jsonDir).filter(f =>
      f.startsWith(`${municipality}_FRI_`) && f.endsWith('.json')
    );

    let associationsScraped = 0;

    if (files.length > 0) {
      // Sort by newest first
      files.sort().reverse();
      const latestFile = files[0];
      const jsonPath = path.join(jsonDir, latestFile);
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      if (Array.isArray(jsonContent)) {
        associationsScraped = jsonContent.length;
      }
    }

    console.log(`✓ SUCCESS: ${municipality} - ${associationsScraped} associations scraped in ${(durationMs / 1000).toFixed(1)}s`);

    return {
      municipality,
      url,
      status: 'success',
      associationsScraped,
      durationMs
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`✗ FAILED: ${municipality} - ${errorMessage}`);

    return {
      municipality,
      url,
      status: 'failed',
      errorMessage,
      durationMs
    };
  }
}

async function main() {
  console.log('');
  console.log('='.repeat(80));
  console.log('BULK FRI SCRAPER');
  console.log('='.repeat(80));
  console.log('');

  const municipalities = await readFRIMunicipalities();
  console.log(`Found ${municipalities.length} FRI municipalities to scrape`);
  console.log('');

  const results: ScrapeResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < municipalities.length; i++) {
    const muni = municipalities[i];
    console.log(`[${i + 1}/${municipalities.length}] Processing ${muni.name}...`);

    const result = await scrapeMunicipality(muni.name, muni.url);
    results.push(result);

    // Small delay between municipalities
    if (i < municipalities.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalDurationMs = Date.now() - startTime;

  // Calculate summary
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const totalAssociations = results
    .filter(r => r.status === 'success')
    .reduce((sum, r) => sum + (r.associationsScraped || 0), 0);

  const summary = {
    totalMunicipalities: municipalities.length,
    successful: successCount,
    failed: failedCount,
    totalAssociationsScraped: totalAssociations,
    totalDurationMs,
    totalDurationMinutes: (totalDurationMs / 60000).toFixed(2),
    results
  };

  // Write summary to file
  fs.writeFileSync(summaryOutputPath, JSON.stringify(summary, null, 2));

  console.log('');
  console.log('='.repeat(80));
  console.log('BULK SCRAPING COMPLETE');
  console.log('='.repeat(80));
  console.log(`Total municipalities: ${municipalities.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total associations scraped: ${totalAssociations}`);
  console.log(`Total duration: ${(totalDurationMs / 60000).toFixed(2)} minutes`);
  console.log('');
  console.log(`Summary saved to: ${summaryOutputPath}`);
  console.log('='.repeat(80));

  if (failedCount > 0) {
    console.log('');
    console.log('FAILED MUNICIPALITIES:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  - ${r.municipality}: ${r.errorMessage}`);
      });
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
