import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
    }
  }
});

// Municipalities from CSV that use actorsmartbook.se domain
const MUNICIPALITIES_TO_CHECK = [
  { name: 'Alingsås', baseUrl: 'https://alingsas.actorsmartbook.se' },
  { name: 'Älvdalen', baseUrl: 'https://alvdalen.actorsmartbook.se' },
  { name: 'Åstorp', baseUrl: 'https://astorp.actorsmartbook.se' },
  { name: 'Boden', baseUrl: 'https://boden.actorsmartbook.se' },
  { name: 'Bollnäs', baseUrl: 'https://bollnas.actorsmartbook.se' },
  { name: 'Borås', baseUrl: 'https://boras.actorsmartbook.se' }, // Already verified
  { name: 'Falun', baseUrl: 'https://falun.actorsmartbook.se' },
  { name: 'Gislaved', baseUrl: 'https://gislaved.actorsmartbook.se' },
  { name: 'Gnosjö', baseUrl: 'https://gnosjo.actorsmartbook.se' },
  { name: 'Hedemora', baseUrl: 'https://hedemora.actorsmartbook.se' },
  { name: 'Huddinge', baseUrl: 'https://huddinge.actorsmartbook.se' },
  { name: 'Hultsfred', baseUrl: 'https://hultsfred.actorsmartbook.se' },
  { name: 'Hylte', baseUrl: 'https://hylte.actorsmartbook.se' },
  { name: 'Jönköping', baseUrl: 'https://jonkoping.actorsmartbook.se' },
  { name: 'Kiruna', baseUrl: 'https://kiruna.actorsmartbook.se' },
  { name: 'Lidköping', baseUrl: 'https://lidkoping.actorsmartbook.se' },
  { name: 'Lysekil', baseUrl: 'https://lysekil.actorsmartbook.se' },
  { name: 'Mora', baseUrl: 'https://mora.actorsmartbook.se' },
  { name: 'Ronneby', baseUrl: 'https://ronneby.actorsmartbook.se' },
  { name: 'Sandviken', baseUrl: 'https://sandviken.actorsmartbook.se' },
  { name: 'Sävsjö', baseUrl: 'https://savsjo.actorsmartbook.se' },
  { name: 'Sollefteå', baseUrl: 'https://solleftea.actorsmartbook.se' }, // Already verified
  { name: 'Sundsvall', baseUrl: 'https://sundsvall.actorsmartbook.se' },
];

interface VerificationResult {
  municipality: string;
  baseUrl: string;
  listEndpointWorks: boolean;
  detailEndpointWorks: boolean;
  totalAssociations?: number;
  firstAssociationId?: number;
  error?: string;
}

async function verifyEndpoint(municipality: string, baseUrl: string): Promise<VerificationResult> {
  const result: VerificationResult = {
    municipality,
    baseUrl,
    listEndpointWorks: false,
    detailEndpointWorks: false,
  };

  try {
    // Test list endpoint
    const listUrl = `${baseUrl}/Associations/1/10`;
    console.log(`Testing ${municipality}: ${listUrl}`);

    const listResponse = await fetch(listUrl);

    if (!listResponse.ok) {
      result.error = `List endpoint returned ${listResponse.status}`;
      return result;
    }

    const listData = await listResponse.json();

    // Check if response has expected structure
    if (!listData || typeof listData.totalNumItems !== 'number' || !Array.isArray(listData.items)) {
      result.error = 'List endpoint returned unexpected structure';
      return result;
    }

    result.listEndpointWorks = true;
    result.totalAssociations = listData.totalNumItems;

    // If we have items, test detail endpoint
    if (listData.items.length > 0) {
      const firstId = listData.items[0].id;
      result.firstAssociationId = firstId;

      const detailUrl = `${baseUrl}/GetAssociation`;
      const detailResponse = await fetch(detailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: firstId }),
      });

      if (detailResponse.ok) {
        const detailData = await detailResponse.json();

        // Check if detail response has expected structure
        if (detailData && detailData.id === firstId) {
          result.detailEndpointWorks = true;
        }
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

async function main() {
  console.log('Starting Actor Smartbook API endpoint verification...\n');

  const results: VerificationResult[] = [];

  for (const { name, baseUrl } of MUNICIPALITIES_TO_CHECK) {
    const result = await verifyEndpoint(name, baseUrl);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n=== VERIFICATION RESULTS ===\n');

  const working = results.filter(r => r.listEndpointWorks && r.detailEndpointWorks);
  const partial = results.filter(r => r.listEndpointWorks && !r.detailEndpointWorks);
  const failed = results.filter(r => !r.listEndpointWorks);

  console.log(`✅ WORKING (${working.length}): Both endpoints functional`);
  working.forEach(r => {
    console.log(`  - ${r.municipality}: ${r.totalAssociations} associations`);
  });

  if (partial.length > 0) {
    console.log(`\n⚠️  PARTIAL (${partial.length}): List works, detail needs verification`);
    partial.forEach(r => {
      console.log(`  - ${r.municipality}: ${r.totalAssociations} associations`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ FAILED (${failed.length}): Endpoints not working`);
    failed.forEach(r => {
      console.log(`  - ${r.municipality}: ${r.error}`);
    });
  }

  // Generate update SQL for working endpoints
  console.log('\n=== SQL UPDATES FOR WORKING ENDPOINTS ===\n');
  working.forEach(r => {
    console.log(`UPDATE Municipality SET registryEndpoint = '${r.baseUrl}' WHERE name = '${r.municipality}';`);
  });

  // Save results to file
  const fs = await import('fs/promises');
  await fs.writeFile(
    'e:\\projects\\CRM\\scraping\\json\\actor_endpoint_verification.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\n✅ Results saved to scraping/json/actor_endpoint_verification.json');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
