/**
 * Update Municipality table with verified IBGO endpoints
 *
 * Reads the ibgo_endpoint_verification.json file and updates
 * the Municipality.registryEndpoint field for each verified municipality
 *
 * Date: 2025-10-26
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../crm-app/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

interface VerificationResult {
  municipality: string;
  registerUrl: string;
  derivedEndpoint: string | null;
  isValid: boolean;
  associationCount: number | null;
  error: string | null;
  responseTime: number | null;
}

interface VerificationData {
  timestamp: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalAssociations: number;
  };
  results: VerificationResult[];
}

async function updateMunicipalityEndpoints() {
  console.log('IBGO Endpoint Database Update');
  console.log('='.repeat(60));
  console.log();

  // Read verification results
  const verificationPath = path.join(
    process.cwd(),
    'scraping',
    'json',
    'ibgo_endpoint_verification.json'
  );

  if (!fs.existsSync(verificationPath)) {
    console.error(`Error: Verification file not found at ${verificationPath}`);
    process.exit(1);
  }

  const verificationData: VerificationData = JSON.parse(
    fs.readFileSync(verificationPath, 'utf-8')
  );

  console.log(`Loaded verification results from ${verificationData.timestamp}`);
  console.log(`Total municipalities: ${verificationData.summary.total}`);
  console.log(`Total associations: ${verificationData.summary.totalAssociations}`);
  console.log();

  // Filter valid results
  const validResults = verificationData.results.filter(r => r.isValid && r.derivedEndpoint);

  console.log(`Found ${validResults.length} valid endpoints to update\n`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  // Update each municipality
  for (const result of validResults) {
    try {
      console.log(`[${created + updated + failed + 1}/${validResults.length}] ${result.municipality}...`);

      // Find existing municipality
      let municipality = await prisma.municipality.findFirst({
        where: { name: result.municipality }
      });

      if (!municipality) {
        // Create new municipality record
        municipality = await prisma.municipality.create({
          data: {
            name: result.municipality,
            platform: 'IBGO',
            registerUrl: result.registerUrl,
            registryEndpoint: result.derivedEndpoint!,
            registerStatus: 'verified'
          }
        });
        console.log(`  ✓ Created municipality with ${result.associationCount} associations`);
        created++;
      } else {
        // Update existing municipality
        await prisma.municipality.update({
          where: { id: municipality.id },
          data: {
            platform: 'IBGO',
            registerUrl: result.registerUrl,
            registryEndpoint: result.derivedEndpoint!,
            registerStatus: 'verified'
          }
        });
        console.log(`  ✓ Updated endpoint (${result.associationCount} associations available)`);
        updated++;
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Created: ${created}`);
  console.log(`✓ Updated: ${updated}`);
  console.log(`✗ Failed: ${failed}`);
  console.log();
  console.log(`Database update completed successfully!`);

  await prisma.$disconnect();
}

updateMunicipalityEndpoints()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
