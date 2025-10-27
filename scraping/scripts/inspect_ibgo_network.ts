/**
 * Inspect IBGO network traffic to find correct API endpoint pattern
 */

import { chromium } from 'playwright';

async function inspectIBGONetwork() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests: any[] = [];

  // Capture all network requests
  page.on('request', request => {
    if (request.url().includes('Association') || request.url().includes('Customer')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('Association') || url.includes('Customer') || url.includes('GetAssociations')) {
      try {
        const contentType = response.headers()['content-type'];
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log('\n✓ FOUND API RESPONSE:');
          console.log('URL:', url);
          console.log('Method:', response.request().method());
          console.log('Status:', response.status());
          console.log('Response keys:', Object.keys(data));
          if (data.TotalNumberOfElements) {
            console.log('Total:', data.TotalNumberOfElements);
          }

          // Log request details
          const request = response.request();
          console.log('\nRequest Details:');
          console.log('POST Data:', request.postData());
          console.log('Headers:', JSON.stringify(request.headers(), null, 2));
        }
      } catch (e) {
        // Not JSON
      }
    }
  });

  console.log('Navigating to Ale IBGO...');
  await page.goto('https://ale.ibgo.se/#/AssociationRegister');

  console.log('Waiting for page to load...');
  await page.waitForTimeout(5000);

  console.log('\n=== Captured Requests ===');
  requests.forEach((req, i) => {
    console.log(`\n[${i + 1}] ${req.method} ${req.url}`);
    if (req.postData) {
      console.log('POST Data:', req.postData);
    }
  });

  console.log('\nPress Ctrl+C to exit...');
  await page.waitForTimeout(30000);

  await browser.close();
}

inspectIBGONetwork();
