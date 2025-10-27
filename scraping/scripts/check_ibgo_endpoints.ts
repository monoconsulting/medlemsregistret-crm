/**
 * IBGO API Endpoint Discovery and Verification Script
 *
 * Purpose: For each municipality in the IBGO CSV file:
 * 1. Derive potential API endpoint URLs from the registry URL
 * 2. Test the endpoint to verify it returns valid data
 * 3. Update the Municipality table with the verified endpoint
 *
 * Date: 2025-10-26
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../crm-app/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

interface MunicipalityCSVRow {
  Kommun: string;
  'Länk till föreningsregister': string;
}

interface EndpointTestResult {
  municipality: string;
  registerUrl: string;
  derivedEndpoint: string | null;
  isValid: boolean;
  associationCount: number | null;
  error: string | null;
  responseTime: number | null;
}

/**
 * Derive API endpoint from registry URL
 *
 * IBGO URLs typically follow patterns like:
 * - https://ale.ibgo.se/AssociationRegister -> https://ale.ibgo.se/APIAssociationRegister/GetAssociationsList/
 * - https://gnesta.interbookfri.se/ -> https://gnesta.interbookfri.se/APIAssociationRegister/GetAssociationsList/
 */
function deriveApiEndpoint(registerUrl: string): string | null {
  try {
    const url = new URL(registerUrl);

    // Remove hash and path, keep only protocol + host
    const baseUrl = `${url.protocol}//${url.host}`;

    // IBGO API endpoint pattern - note the trailing slash is important
    return `${baseUrl}/APIAssociationRegister/GetAssociationsList/`;
  } catch (error) {
    console.error(`Failed to parse URL: ${registerUrl}`, error);
    return null;
  }
}

/**
 * Test if an API endpoint returns valid IBGO association data
 */
async function testEndpoint(endpoint: string): Promise<{
  isValid: boolean;
  associationCount: number | null;
  error: string | null;
  responseTime: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      // 30 second timeout
      signal: AbortSignal.timeout(30000)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        isValid: false,
        associationCount: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime
      };
    }

    const data = await response.json();

    // Validate response structure (IBGO format)
    if (typeof data === 'object' &&
        'TotalNumberOfElements' in data &&
        'Customers' in data &&
        Array.isArray(data.Customers)) {

      return {
        isValid: true,
        associationCount: data.TotalNumberOfElements,
        error: null,
        responseTime
      };
    } else {
      return {
        isValid: false,
        associationCount: null,
        error: 'Invalid response structure (not IBGO format)',
        responseTime
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      return {
        isValid: false,
        associationCount: null,
        error: error.message,
        responseTime
      };
    }

    return {
      isValid: false,
      associationCount: null,
      error: 'Unknown error',
      responseTime
    };
  }
}

/**
 * Update Municipality table with verified endpoint
 */
async function updateMunicipalityEndpoint(
  municipalityName: string,
  registerUrl: string,
  endpoint: string
): Promise<boolean> {
  try {
    // Find or create municipality
    let municipality = await prisma.municipality.findFirst({
      where: { name: municipalityName }
    });

    if (!municipality) {
      // Create new municipality record
      municipality = await prisma.municipality.create({
        data: {
          name: municipalityName,
          platform: 'IBGO',
          registerUrl: registerUrl,
          registryEndpoint: endpoint,
          registerStatus: 'verified'
        }
      });
      console.log(`  ✓ Created municipality: ${municipalityName}`);
    } else {
      // Update existing municipality
      await prisma.municipality.update({
        where: { id: municipality.id },
        data: {
          platform: 'IBGO',
          registerUrl: registerUrl,
          registryEndpoint: endpoint,
          registerStatus: 'verified'
        }
      });
      console.log(`  ✓ Updated municipality: ${municipalityName}`);
    }

    return true;
  } catch (error) {
    console.error(`  ✗ Failed to update municipality ${municipalityName}:`, error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('IBGO API Endpoint Discovery and Verification');
  console.log('='.repeat(60));
  console.log();

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'temp', 'Associations - IBGO.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as MunicipalityCSVRow[];

  console.log(`Found ${records.length} municipalities in CSV\n`);

  const results: EndpointTestResult[] = [];
  let successCount = 0;
  let failCount = 0;

  // Process each municipality
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const municipalityName = record.Kommun;
    const registerUrl = record['Länk till föreningsregister'];

    console.log(`[${i + 1}/${records.length}] Testing ${municipalityName}...`);
    console.log(`  Registry URL: ${registerUrl}`);

    // Derive API endpoint
    const endpoint = deriveApiEndpoint(registerUrl);

    if (!endpoint) {
      console.log(`  ✗ Failed to derive API endpoint\n`);
      results.push({
        municipality: municipalityName,
        registerUrl,
        derivedEndpoint: null,
        isValid: false,
        associationCount: null,
        error: 'Could not derive endpoint from URL',
        responseTime: null
      });
      failCount++;
      continue;
    }

    console.log(`  Derived endpoint: ${endpoint}`);

    // Test endpoint
    const testResult = await testEndpoint(endpoint);

    if (testResult.isValid) {
      console.log(`  ✓ Valid endpoint! Found ${testResult.associationCount} associations (${testResult.responseTime}ms)`);

      // Update database
      const updated = await updateMunicipalityEndpoint(municipalityName, registerUrl, endpoint);

      if (updated) {
        successCount++;
      } else {
        failCount++;
      }

      results.push({
        municipality: municipalityName,
        registerUrl,
        derivedEndpoint: endpoint,
        isValid: true,
        associationCount: testResult.associationCount,
        error: null,
        responseTime: testResult.responseTime
      });
    } else {
      console.log(`  ✗ Invalid endpoint: ${testResult.error} (${testResult.responseTime}ms)`);

      results.push({
        municipality: municipalityName,
        registerUrl,
        derivedEndpoint: endpoint,
        isValid: false,
        associationCount: null,
        error: testResult.error,
        responseTime: testResult.responseTime
      });

      failCount++;
    }

    console.log();

    // Small delay to avoid hammering servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total municipalities: ${records.length}`);
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log();

  // Calculate total associations
  const totalAssociations = results
    .filter(r => r.associationCount !== null)
    .reduce((sum, r) => sum + (r.associationCount || 0), 0);

  console.log(`Total associations found: ${totalAssociations.toLocaleString()}`);
  console.log();

  // Write detailed results to JSON
  const resultsPath = path.join(process.cwd(), 'scraping', 'json', 'ibgo_endpoint_verification.json');
  fs.writeFileSync(
    resultsPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: records.length,
        successful: successCount,
        failed: failCount,
        totalAssociations
      },
      results
    }, null, 2)
  );

  console.log(`Detailed results saved to: ${resultsPath}`);

  // List failed municipalities
  const failed = results.filter(r => !r.isValid);
  if (failed.length > 0) {
    console.log();
    console.log('Failed municipalities:');
    failed.forEach(f => {
      console.log(`  - ${f.municipality}: ${f.error}`);
    });
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
