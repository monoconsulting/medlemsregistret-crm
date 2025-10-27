import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Read FRI CSV file
const csvPath = path.resolve(__dirname, '../../temp/Associations - FRI.csv');

async function updateFRIMunicipalities() {
  console.log('Reading FRI municipalities from CSV...');

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  const municipalities: Array<{ name: string; url: string }> = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Simple CSV parsing: split on first comma
    const firstCommaIndex = line.indexOf(',');
    if (firstCommaIndex === -1) continue;

    const name = line.substring(0, firstCommaIndex).trim();
    let url = line.substring(firstCommaIndex + 1).trim();

    // Remove quotes if present
    if (url.startsWith('"') && url.endsWith('"')) {
      url = url.slice(1, -1);
    }

    if (!name || !url) continue;

    municipalities.push({ name, url });
  }

  console.log(`Found ${municipalities.length} FRI municipalities in CSV`);
  console.log('');

  let updatedCount = 0;
  let createdCount = 0;
  let notFoundCount = 0;

  for (const muni of municipalities) {
    try {
      // Try to find existing municipality
      const existing = await prisma.municipality.findFirst({
        where: { name: muni.name }
      });

      if (existing) {
        // Update existing municipality
        await prisma.municipality.update({
          where: { id: existing.id },
          data: {
            platform: 'FRI',
            registerUrl: muni.url,
            registerStatus: 'active'
          }
        });
        console.log(`✓ Updated: ${muni.name} -> FRI`);
        updatedCount++;
      } else {
        // Create new municipality
        await prisma.municipality.create({
          data: {
            name: muni.name,
            platform: 'FRI',
            registerUrl: muni.url,
            registerStatus: 'active'
          }
        });
        console.log(`+ Created: ${muni.name} -> FRI`);
        createdCount++;
      }
    } catch (error) {
      console.error(`✗ Error processing ${muni.name}:`, error);
      notFoundCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('UPDATE COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total municipalities: ${municipalities.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Created: ${createdCount}`);
  console.log(`Errors: ${notFoundCount}`);
  console.log('='.repeat(60));
}

updateFRIMunicipalities()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
