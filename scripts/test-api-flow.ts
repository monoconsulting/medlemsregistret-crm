/**
 * API Flow Test Script
 * Tests the complete authentication and basic data retrieval flow:
 * 1. GET /api/csrf.php - Fetch CSRF token
 * 2. POST /api/login.php - Authenticate with credentials
 * 3. GET /api/associations.php - Retrieve paginated data
 * 4. POST /api/logout.php - Clean session termination
 */

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  message: string;
  data?: any;
  cookies?: string[];
}

async function testApiFlow() {
  const results: TestResult[] = [];

  // Configuration - adjust baseUrl if testing different environment
  const baseUrl = 'http://127.0.0.1:8070'; // Local PHP server serving temp/local_webroot
  const credentials = {
    email: 'test-flow@example.com',
    password: 'test123'
  };

  let csrfToken = '';
  let cookies: string[] = [];

  console.log('🧪 Starting API Flow Test...\n');
  console.log(`Base URL: ${baseUrl}\n`);

  try {
    // Step 1: Fetch CSRF Token
    console.log('1️⃣  Testing CSRF token endpoint...');
    const csrfResponse = await fetch(`${baseUrl}/api/csrf.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const csrfStatus = csrfResponse.status;
    const csrfData = await csrfResponse.json();

    if (csrfResponse.ok && csrfData.token) {
      csrfToken = csrfData.token;

      // Collect all Set-Cookie headers
      const setCookieHeaders = csrfResponse.headers.getSetCookie?.() || [];
      if (setCookieHeaders.length > 0) {
        cookies.push(...setCookieHeaders.map(h => h.split(';')[0]));
      }

      results.push({
        endpoint: '/api/csrf.php',
        method: 'GET',
        status: csrfStatus,
        success: true,
        message: '✅ CSRF token retrieved successfully',
        data: { token: csrfToken.substring(0, 20) + '...' },
        cookies: setCookieHeaders
      });
      console.log(`   ✅ Success (${csrfStatus})`);
      console.log(`   Token: ${csrfToken.substring(0, 20)}...\n`);
    } else {
      throw new Error(`Failed to get CSRF token: ${JSON.stringify(csrfData)}`);
    }

    // Step 2: Login with credentials
    console.log('2️⃣  Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookies.join('; ')
      },
      body: JSON.stringify(credentials)
    });

    const loginStatus = loginResponse.status;
    const loginData = await loginResponse.json();

    if (loginResponse.ok && loginData.ok) {
      // Collect new cookies from login
      const loginSetCookieHeaders = loginResponse.headers.getSetCookie?.() || [];
      if (loginSetCookieHeaders.length > 0) {
        cookies.push(...loginSetCookieHeaders.map(h => h.split(';')[0]));
      }

      results.push({
        endpoint: '/api/login.php',
        method: 'POST',
        status: loginStatus,
        success: true,
        message: '✅ Login successful',
        data: { ok: loginData.ok },
        cookies: loginSetCookieHeaders
      });
      console.log(`   ✅ Success (${loginStatus})`);
      console.log(`   Logged in successfully\n`);
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    // Step 3: Fetch associations list
    console.log('3️⃣  Testing associations list endpoint...');
    console.log(`   Sending cookies: ${cookies.join('; ')}\n`);
    const associationsResponse = await fetch(`${baseUrl}/api/associations.php?page=1&pageSize=5`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });

    const associationsStatus = associationsResponse.status;
    const associationsData = await associationsResponse.json();

    if (associationsResponse.ok && associationsData.items) {
      results.push({
        endpoint: '/api/associations.php',
        method: 'GET',
        status: associationsStatus,
        success: true,
        message: '✅ Associations retrieved successfully',
        data: {
          total: associationsData.total || 0,
          retrieved: associationsData.items?.length || 0,
          page: associationsData.page || 1
        }
      });
      console.log(`   ✅ Success (${associationsStatus})`);
      console.log(`   Total: ${associationsData.total || 0}`);
      console.log(`   Retrieved: ${associationsData.items?.length || 0} associations\n`);
    } else {
      throw new Error(`Failed to fetch associations: ${JSON.stringify(associationsData).substring(0, 200)}`);
    }

    // Step 4: Logout
    console.log('4️⃣  Testing logout endpoint...');
    const logoutResponse = await fetch(`${baseUrl}/api/logout.php`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Cookie': cookies.join('; ')
      }
    });

    const logoutStatus = logoutResponse.status;
    const logoutData = await logoutResponse.json();

    if (logoutResponse.ok && logoutData.ok) {
      results.push({
        endpoint: '/api/logout.php',
        method: 'POST',
        status: logoutStatus,
        success: true,
        message: '✅ Logout successful'
      });
      console.log(`   ✅ Success (${logoutStatus})\n`);
    } else {
      throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ All ${results.length}/4 endpoints passed\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.method} ${result.endpoint}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   ${result.message}`);
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2).split('\n').join('\n   ')}`);
      }
      console.log();
    });

    console.log('🎉 All tests passed! The API flow is working correctly.\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('═'.repeat(60));
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}\n`);

    if (results.length > 0) {
      console.log('✅ Passed tests:');
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.method} ${result.endpoint} (${result.status})`);
      });
      console.log();
    }

    return false;
  }
}

// Run the test
testApiFlow().then(success => {
  process.exit(success ? 0 : 1);
});
