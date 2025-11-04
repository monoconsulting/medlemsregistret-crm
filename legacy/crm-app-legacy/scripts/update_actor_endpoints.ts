import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
    }
  }
});

interface VerificationResult {
  municipality: string;
  baseUrl: string;
  listEndpointWorks: boolean;
  detailEndpointWorks: boolean;
  totalAssociations?: number;
  firstAssociationId?: number;
  error?: string;
}

async function main() {
  console.log('Loading verification results...');

  const resultsFile = 'e:\\projects\\CRM\\scraping\\json\\actor_endpoint_verification.json';
  const resultsData = await fs.readFile(resultsFile, 'utf-8');
  const results: VerificationResult[] = JSON.parse(resultsData);

  // Filter to only working endpoints
  const workingEndpoints = results.filter(r => r.listEndpointWorks && r.detailEndpointWorks);

  console.log(`Found ${workingEndpoints.length} working endpoints to update\n`);

  let updated = 0;
  let notFound = 0;
  let alreadySet = 0;

  for (const result of workingEndpoints) {
    try {
      // Check if municipality exists in database
      const municipality = await prisma.municipality.findFirst({
        where: { name: result.municipality }
      });

      if (!municipality) {
        console.log(`⚠️  Municipality not found in database: ${result.municipality}`);
        notFound++;
        continue;
      }

      // Check if registryEndpoint is already set
      if (municipality.registryEndpoint === result.baseUrl) {
        console.log(`✓ ${result.municipality}: Already set to ${result.baseUrl}`);
        alreadySet++;
        continue;
      }

      // Update the registryEndpoint
      await prisma.municipality.update({
        where: { id: municipality.id },
        data: { registryEndpoint: result.baseUrl }
      });

      console.log(`✅ ${result.municipality}: Updated to ${result.baseUrl} (${result.totalAssociations} associations)`);
      updated++;

    } catch (error) {
      console.error(`❌ Error updating ${result.municipality}:`, error);
    }
  }

  console.log('\n=== UPDATE SUMMARY ===');
  console.log(`✅ Updated: ${updated}`);
  console.log(`✓ Already set: ${alreadySet}`);
  if (notFound > 0) {
    console.log(`⚠️  Not found in database: ${notFound}`);
  }
  console.log(`Total processed: ${workingEndpoints.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
