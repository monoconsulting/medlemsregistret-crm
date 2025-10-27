/**
 * Test the 3 missing IBGO municipalities
 */

const municipalities = [
  { name: 'Kinda', url: 'https://kinda.interbookfri.se/#/AssociationRegister' },
  { name: 'Kristinehamn', url: 'https://kristinehamn.ibgo.se/#/AssociationRegister' },
  { name: 'Linköping', url: 'https://ibgo.linkoping.se/#/AssociationRegister' }
];

async function testEndpoint(baseUrl: string) {
  const endpoint = `${baseUrl}/APIAssociationRegister/GetAssociationsList/`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.TotalNumberOfElements && data.Customers) {
        return {
          success: true,
          count: data.TotalNumberOfElements,
          endpoint
        };
      }
    }

    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function main() {
  console.log('Testing missing IBGO municipalities\n');

  for (const mun of municipalities) {
    console.log(`Testing ${mun.name}...`);

    const url = new URL(mun.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const result = await testEndpoint(baseUrl);

    if (result.success) {
      console.log(`  ✓ Found ${result.count} associations`);
      console.log(`  Endpoint: ${result.endpoint}\n`);
    } else {
      console.log(`  ✗ Failed: ${result.error}\n`);
    }
  }
}

main();
