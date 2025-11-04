import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface MunicipalityCSVRow {
  Kommun: string;
  Stadskod: string;
  'Länk till föreningsregister': string;
  Status: string;
  Plattform: string;
  Region: string;
  Befolkning: string;
  Lon: string;
  Lat: string;
  Län: string;
  Länskod: string;
  Landskap: string;
}

function parsePopulation(pop: string): number | null {
  if (!pop || pop.trim() === '') return null;

  // Remove spaces and parse
  const cleaned = pop.replace(/\s+/g, '');
  const parsed = parseInt(cleaned, 10);

  return isNaN(parsed) ? null : parsed;
}

function parseCoordinate(coord: string): number | null {
  if (!coord || coord.trim() === '') return null;

  const parsed = parseFloat(coord.replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
}

function formatMunicipalityCode(code: string): string | null {
  if (!code || code.trim() === '') return null;

  // Remove any spaces and ensure it's 4 digits with leading zeros
  const cleaned = code.trim().replace(/\s+/g, '');
  const padded = cleaned.padStart(4, '0');

  return padded.length === 4 ? padded : null;
}

function formatCountyCode(code: string): string | null {
  if (!code || code.trim() === '') return null;

  // Remove any spaces and ensure it's 2 digits with leading zeros
  const cleaned = code.trim().replace(/\s+/g, '');
  const padded = cleaned.padStart(2, '0');

  return padded.length === 2 ? padded : null;
}

async function main() {
  console.log('🌱 Starting municipality import from CSV...');

  // Read CSV file with correct encoding
  const csvPath = path.resolve(__dirname, '../../temp/Föreningar2.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  // Read with UTF-8 encoding
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  console.log('📄 Parsing CSV...');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle BOM if present
  }) as MunicipalityCSVRow[];

  console.log(`📍 Found ${rows.length} municipalities in CSV`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const name = row.Kommun.trim();

    if (!name || name === 'Kommun') {
      skippedCount++;
      continue;
    }

    try {
      const municipalityData = {
        name,
        code: formatMunicipalityCode(row.Stadskod),
        county: row.Län && row.Län.trim() !== '' ? row.Län.trim() : null,
        countyCode: formatCountyCode(row.Länskod),
        province: row.Landskap && row.Landskap.trim() !== '' ? row.Landskap.trim() : null,
        latitude: parseCoordinate(row.Lat),
        longitude: parseCoordinate(row.Lon),
        population: parsePopulation(row.Befolkning),
        registerUrl: row['Länk till föreningsregister'] && row['Länk till föreningsregister'].trim() !== ''
          ? row['Länk till föreningsregister'].trim()
          : null,
        registerStatus: row.Status && row.Status.trim() !== '' ? row.Status.trim() : null,
        platform: row.Plattform && row.Plattform.trim() !== '' ? row.Plattform.trim() : null,
      };

      const existing = await prisma.municipality.findUnique({
        where: { name },
      });

      if (existing) {
        await prisma.municipality.update({
          where: { name },
          data: municipalityData,
        });
        updatedCount++;
        console.log(`  ✓ Updated: ${name}`);
      } else {
        await prisma.municipality.create({
          data: municipalityData,
        });
        createdCount++;
        console.log(`  ✓ Created: ${name}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error with ${name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n✅ Import completed!`);
  console.log(`   Created: ${createdCount} municipalities`);
  console.log(`   Updated: ${updatedCount} municipalities`);
  console.log(`   Skipped: ${skippedCount} municipalities`);
  console.log(`   Errors: ${errorCount} municipalities`);

  // Show some statistics
  const total = await prisma.municipality.count();
  const withRegister = await prisma.municipality.count({
    where: { registerUrl: { not: null } },
  });
  const platforms = await prisma.municipality.groupBy({
    by: ['platform'],
    _count: true,
    where: { platform: { not: null } },
  });

  console.log(`\n📊 Database statistics:`);
  console.log(`   Total municipalities: ${total}`);
  console.log(`   With register URL: ${withRegister}`);
  console.log(`\n   By platform:`);
  platforms.forEach(p => {
    console.log(`     - ${p.platform}: ${p._count}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
