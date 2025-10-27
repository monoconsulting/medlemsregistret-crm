/**
 * Test different API endpoint patterns for IBGO
 */

const municipalityUrls = [
  'https://gnesta.interbookfri.se',
  'https://ale.ibgo.se',
  'https://botkyrka.ibgo.se'
];

const endpointPatterns = [
  '/api/Customer/GetAllCustomers',
  '/api/customer/getallcustomers',
  '/api/Customer',
  '/api/Customers',
  '/api/Association/GetAll',
  '/api/Association',
  '/Api/Customer/GetAllCustomers',
  '/API/Customer/GetAllCustomers',
  '/customer/getall',
  '/Customer/GetAll',
  '/AssociationRegister/GetAll',
  '/Home/GetAssociations'
];

async function testEndpoint(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.log(`✓ ${url}`);
        console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
        if (data.Customers || data.customers) {
          console.log(`  *** FOUND CUSTOMER DATA! ***`);
        }
        if (data.TotalNumberOfElements) {
          console.log(`  Total: ${data.TotalNumberOfElements}`);
        }
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Testing IBGO API Endpoint Patterns\n');
  console.log('='.repeat(60));

  for (const baseUrl of municipalityUrls) {
    console.log(`\nTesting: ${baseUrl}`);
    console.log('-'.repeat(60));

    for (const pattern of endpointPatterns) {
      const fullUrl = baseUrl + pattern;
      await testEndpoint(fullUrl);
    }

    // Small delay between municipalities
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();
