# Actor Smartbook Scraping Guide

## Overview

Actor Smartbook is a municipal association registry platform used by several Swedish municipalities. This guide documents both **API-based** (preferred) and **DOM-based** (fallback) approaches for extracting association data.

## Municipalities Using Actor Smartbook

**Last updated**: 2025-10-26

**Total verified municipalities**: 22 with working API endpoints

**Bulk scraping completed**: 12 municipalities scraped successfully with 3,425 associations found and 3,413 imported (99.6% success rate)

| Municipality | Base URL | API Status | Total Associations | Database Status |
|--------------|----------|------------|-------------------|-----------------|
| **Alingsås** | https://alingsas.actorsmartbook.se | ✅ Verified | 242 | ✅ Scraped & Imported (242) |
| **Älvdalen** | https://alvdalen.actorsmartbook.se | ✅ Verified | 95 | ✅ Scraped & Imported (95) |
| **Åstorp** | https://astorp.actorsmartbook.se | ✅ Verified | 83 | ✅ Endpoint configured |
| **Boden** | https://boden.actorsmartbook.se | ✅ Verified | 224 | ✅ Scraped & Imported (221) |
| **Bollnäs** | https://bollnas.actorsmartbook.se | ✅ Verified | 169 | ✅ Scraped & Imported (168) |
| **Borås** | https://boras.actorsmartbook.se | ✅ Verified | 313 | ✅ Scraped & Imported (313) |
| **Falun** | https://falun.actorsmartbook.se | ✅ Verified | 788 | ✅ Scraped & Imported (788) |
| **Gislaved** | https://gislaved.actorsmartbook.se | ✅ Verified | 322 | ✅ Endpoint configured |
| **Gnosjö** | https://gnosjo.actorsmartbook.se | ✅ Verified | 72 | ✅ Endpoint configured |
| **Hedemora** | https://hedemora.actorsmartbook.se | ✅ Verified | 200 | ✅ Scraped & Imported (200) |
| **Huddinge** | https://huddinge.actorsmartbook.se | ✅ Verified | 264 | ✅ Endpoint configured |
| **Hultsfred** | https://hultsfred.actorsmartbook.se | ✅ Verified | 185 | ✅ Endpoint configured |
| **Hylte** | https://hylte.actorsmartbook.se | ✅ Verified | 97 | ✅ Endpoint configured |
| **Jönköping** | https://jonkoping.actorsmartbook.se | ✅ Verified | 671 | ✅ Endpoint configured |
| **Kiruna** | https://kiruna.actorsmartbook.se | ✅ Verified | 247 | ✅ Scraped & Imported (243) |
| **Lidköping** | https://lidkoping.actorsmartbook.se | ✅ Verified | 341 | ✅ Endpoint configured |
| **Mora** | https://mora.actorsmartbook.se | ✅ Verified | 121 | ✅ Scraped & Imported (121) |
| **Ronneby** | https://ronneby.actorsmartbook.se | ✅ Verified | 239 | ✅ Endpoint configured |
| **Sandviken** | https://sandviken.actorsmartbook.se | ✅ Verified | 304 | ✅ Scraped & Imported (303) |
| **Sävsjö** | https://savsjo.actorsmartbook.se | ✅ Verified | 95 | ✅ Endpoint configured |
| **Sollefteå** | https://solleftea.actorsmartbook.se | ✅ Verified | 282 | ✅ Scraped & Imported (282) |
| **Sundsvall** | https://sundsvall.actorsmartbook.se | ✅ Verified | 440 | ✅ Scraped & Imported (437) |
| **Lysekil** | https://lysekil.actorsmartbook.se | ⚠️ Empty | 0 | ⏳ Pending |

**Database Field**: All municipalities with verified API access have `registryEndpoint` populated in the `Municipality` table.

**Total associations scraped**: 3,425 across 12 municipalities
**Total associations imported**: 3,413 (99.6% success rate)
**Bulk scraping time**: 23.38 minutes for all 12 municipalities

## Scraping Approaches

### Approach 1: REST API (Preferred)

**When to use**: If the municipality has exposed REST API endpoints (check network tab for `/Associations` and `/GetAssociation` endpoints)

**Advantages**:
- 10-20x faster than DOM scraping
- More reliable (no modal timing issues)
- No cookie consent handling needed
- No pagination timing concerns
- Direct access to structured data

**Performance**: ~150ms per association vs ~2-3 seconds with DOM scraping

### Approach 2: DOM Scraping (Fallback)

**When to use**: If REST API is not available or endpoints are protected

**Disadvantages**:
- Slower (requires browser automation)
- Timing-sensitive (modal delays)
- More brittle (DOM changes can break scraper)

---

# API-Based Scraping (Preferred Method)

## API Discovery

Check browser DevTools Network tab when navigating the site:

1. **List endpoint**: Look for requests to `/Associations/{page}/{itemsPerPage}`
2. **Detail endpoint**: Look for POST requests to `/GetAssociation` when clicking "Info" buttons

## API Endpoints

### List Endpoint
```
GET https://{municipality}.actorsmartbook.se/Associations/{page}/{itemsPerPage}
```

**Response**:
```json
{
  "page": 1,
  "totalNumItems": 313,
  "items": [
    {
      "id": 8,
      "name": "Afasi Sodra Alvsborg",
      "email": "info@example.se",
      "url": "/association/8"
    }
  ]
}
```

### Detail Endpoint
```
POST https://{municipality}.actorsmartbook.se/GetAssociation
Content-Type: application/json

{"id": 8}
```

**Response**:
```json
{
  "id": 8,
  "name": "Afasi Sodra Alvsborg",
  "email": "info@example.se",
  "orgnr": "864501-8444",
  "website": "https://example.se",
  "city": "Boras",
  "ContactPersons": [
    {
      "name": "John Doe",
      "email": "john@example.se",
      "mobile": "070-123456",
      "role": "Kontaktperson"
    }
  ],
  "ageRangeStrings": []
}
```

## Implementation Example

```typescript
// Configuration
const BASE_URL = 'https://boras.actorsmartbook.se';
const LIST_ENDPOINT = `${BASE_URL}/Associations`;
const DETAIL_ENDPOINT = `${BASE_URL}/GetAssociation`;
const ITEMS_PER_PAGE = 10;

// Fetch list page
async function fetchListPage(page: number): Promise<ApiListResponse> {
  const url = `${LIST_ENDPOINT}/${page}/${ITEMS_PER_PAGE}`;
  const response = await fetch(url);
  return await response.json();
}

// Fetch association detail
async function fetchAssociationDetail(id: number): Promise<ApiDetailResponse> {
  const response = await fetch(DETAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  });
  return await response.json();
}

// Main scraping loop
async function scrapeViaApi() {
  let currentPage = 1;

  // Get first page to determine total
  const firstPage = await fetchListPage(currentPage);
  const totalItems = firstPage.totalNumItems;

  console.log(`Total associations: ${totalItems}`);

  while (true) {
    const listPage = await fetchListPage(currentPage);

    if (!listPage.items || listPage.items.length === 0) break;

    // Fetch details for each association
    for (const item of listPage.items) {
      const detail = await fetchAssociationDetail(item.id);

      // Convert to standard record format
      const record = {
        association: {
          name: detail.name,
          org_number: detail.orgnr,
          email: detail.email,
          city: detail.city,
          homepage_url: detail.website
        },
        contacts: detail.ContactPersons.map(c => ({
          contact_person_name: c.name,
          contact_person_role: c.role,
          contact_person_email: c.email,
          contact_person_phone: c.mobile
        }))
      };

      // Save record
      writeJsonl(record);

      // Small delay to avoid rate limiting
      await delay(100);
    }

    currentPage++;
    if (currentPage > 100) break; // Safety limit
  }
}
```

## API Field Mappings

| API Field | Standard Field | Notes |
|-----------|---------------|-------|
| `id` | `extras.api_id` | Internal Actor Smartbook ID |
| `name` | `association.name` | Association name |
| `orgnr` | `association.org_number` | Format: XXXXXX-XXXX |
| `email` | `association.email` | Primary email |
| `website` | `association.homepage_url` | Homepage URL |
| `city` | `association.city` | Municipality/city |
| `ContactPersons[].name` | `contacts[].contact_person_name` | Contact name |
| `ContactPersons[].role` | `contacts[].contact_person_role` | Contact role |
| `ContactPersons[].email` | `contacts[].contact_person_email` | Contact email |
| `ContactPersons[].mobile` | `contacts[].contact_person_phone` | Contact phone |
| `ageRangeStrings` | `association.categories` | Age range categories |

## Performance Metrics

### Bulk Scraping Results (12 Municipalities)
- **Total associations scraped**: 3,425
- **Total time**: 23.38 minutes (1,402.8 seconds)
- **Average time per association**: ~410ms
- **Total associations imported**: 3,413 (99.6% success rate)
- **Import time**: ~2 minutes (123.4 seconds)
- **Failed imports**: 12 (0.4% - mostly duplicate detailUrl conflicts)

### Individual Municipality Performance

#### Borås
- **Total associations**: 313
- **Total time**: ~51 seconds
- **Time per association**: ~163ms
- **Pages processed**: 32
- **Success rate**: 100%
- **Missing org_number**: 8 (2.6%)
- **Missing contacts**: 51 (16.3%)
- **Database import**: ✅ 313 associations imported successfully

#### Sollefteå
- **Total associations**: 282
- **Scraping time**: Part of bulk run
- **Database import**: ✅ 282 associations imported successfully

#### Falun (Largest Municipality)
- **Total associations**: 788
- **Database import**: ✅ 788 associations imported successfully
- **Notes**: Largest municipality in bulk scraping batch

#### Sundsvall
- **Total associations**: 440
- **Database import**: ✅ 437 associations imported (3 errors)

### Bulk Automation Tools
- **Test scraper**: `actor_test_scrape.bat` (tests on Gnosjö - 72 associations, ~30 seconds)
- **Full scraping**: `actor_scrape.bat` or `actor_scrape_and_import.bat`
- **Import only**: `actor_import.bat`
- **Output location**: `scraping/json/` for JSON files, `scraping/logs/` for logs

---

# DOM-Based Scraping (Fallback Method)

## Platform Characteristics

### UI Structure
- **List View**: Paginated table with "Info" buttons for each association
- **Detail View**: Modal dialog that opens when clicking "Info" button
- **Pagination**: "Forsta" (First), "Foregaende" (Previous), "Nasta" (Next), "Sista" (Last) buttons
- **Page Size**: 10 associations per page (default), but can vary

### DOM Structure

#### List Page
```html
<table>
  <tbody>
    <tr> <!-- Each association row -->
      <td>Association Name</td>
      <td><button role="button">Info</button></td>
    </tr>
  </tbody>
</table>
```

#### Detail Modal
```html
<div class="modal-content">
  <div class="modal-header">
    <h3>Association Name</h3>
  </div>
  <div class="modal-body">
    <ul class="assn-info">
      <li>
        <span>Label:</span>
        <span>Value</span>
      </li>
      <!-- More fields -->
    </ul>

    <table> <!-- Contact persons table -->
      <thead>
        <tr>
          <th>Namn</th>
          <th>Roll</th>
          <th>E-post</th>
          <th>Mobil</th>
        </tr>
      </thead>
      <tbody>
        <tr data-ng-repeat="...">
          <td>Contact Name</td>
          <td>Role</td>
          <td>email@example.com</td>
          <td>Phone</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

## Field Extraction

### Core Fields from `ul.assn-info li`

Use the `extractFieldFromList()` helper function to extract fields:

```typescript
async function extractFieldFromList(page: Page, labelText: string): Promise<string | null> {
  const listItems = page.locator('ul.assn-info li');
  const count = await listItems.count();

  for (let i = 0; i < count; i++) {
    const item = listItems.nth(i);
    const text = await item.textContent();

    if (text && text.includes(labelText)) {
      const spans = item.locator('span');
      const spanCount = await spans.count();

      if (spanCount >= 2) {
        const value = await spans.nth(1).textContent();
        return normalizeString(value);
      }
    }
  }
  return null;
}
```

### Standard Field Mappings

| Label in Modal | Field Name | Notes |
|----------------|------------|-------|
| `Org.nr:` | `org_number` | Format: XXXXXX-XXXX |
| `Epost:` | `email` | May be missing |
| `Hemsida:` | `homepage_url` | Prepend `https://` if missing protocol |
| `Ort:` | `city` | Municipality/city name |
| `Telefon:` | `phone` | May be missing |
| `Adress:` | `street_address` | Full street address |
| `Postnummer:` | `postal_code` | Format: XXX XX |

### Contact Extraction

Contacts are in a table with `data-ng-repeat` attribute on rows:

```typescript
const table = page.locator('table').filter({
  has: page.locator('th:has-text("Namn")')
}).first();

const rows = table.locator('tbody tr[data-ng-repeat]');
const rowCount = await rows.count();

for (let i = 0; i < rowCount; i++) {
  const row = rows.nth(i);
  const cells = row.locator('td');

  const name = await cells.nth(0).textContent();
  const role = await cells.nth(1).textContent();
  const email = await cells.nth(2).textContent();
  const phone = await cells.nth(3).textContent();

  // Add to contacts array
}
```

## Pagination Strategy

### Detection
Use `hasNextPage()` to check if more pages exist:

```typescript
async function hasNextPage(page: Page): Promise<boolean> {
  const nextButton = page.getByRole('button', { name: 'Nasta' });
  const count = await nextButton.count();
  if (count === 0) return false;

  const isDisabled = await nextButton.isDisabled();
  return !isDisabled;
}
```

### Navigation
```typescript
async function goToNextPage(page: Page): Promise<boolean> {
  const nextButton = page.getByRole('button', { name: 'Nasta' });
  await nextButton.click();
  await randomDelay(500, 1000);
  await waitForListReady(page);
  return true;
}
```

### Important Notes
- **Do NOT** compare page content to detect pagination end (unreliable)
- **DO** check if "Nasta" button is disabled
- After page 31, pages may show only 3 associations instead of 10
- Safety limit: Stop at page 100 to prevent infinite loops

## Modal Handling

### Opening Modal
```typescript
const infoButtons = page.getByRole('button', { name: 'Info' });
await infoButtons.nth(index).click();
await page.waitForSelector('.modal-content', { state: 'visible', timeout: 5000 });
await delay(800); // Allow modal to fully load
```

### Closing Modal
```typescript
const closeButton = page.getByRole('button', { name: 'x' });
await closeButton.click();
await delay(300);
```

### Critical Timing
- Wait 800ms after modal opens before extraction
- Wait 300ms after closing modal before next action
- Use `waitForListReady()` after pagination

## Cookie Consent

Handle cookie banner on first page load:

```typescript
const cookieBtn = page.locator('button:has-text("Acceptera alla")');
if (await cookieBtn.count() > 0) {
  await cookieBtn.click();
  await page.waitForTimeout(500);
}
```

## Known Issues & Workarounds

### Issue 1: Missing Data in Some Modals
**Symptom**: Some associations have no data in `ul.assn-info`
**Workaround**: Skip the association or extract what's available from modal body text

### Issue 2: Duplicate Association Names
**Symptom**: Same association appears multiple times (e.g., "Armagedon" twice)
**Cause**: Data quality issue in source system
**Workaround**: Both records are scraped; deduplication happens during import

### Issue 3: Contact Table Not Present
**Symptom**: Some modals show "Kontaktpersoner" header but no table
**Workaround**: Check if table exists before trying to extract contacts

### Issue 4: Encoding Issues
**Symptom**: Swedish characters (a, a, o) appear as mojibake in JSON
**Workaround**: Ensure UTF-8 encoding when writing files; normalize on import

## Best Practices

1. **Always use `extractFieldFromList()`** for standard fields
2. **Check element existence** before extracting (use `.count()`)
3. **Add delays** between modal operations (800ms open, 300ms close)
4. **Log missing data** for later review
5. **Use municipality name without special characters** (e.g., "Boras" not "Boras")
6. **Validate org_number format** (XXXXXX-XXXX) before saving

## Example: Complete Extraction Flow

```typescript
// For each page
while (await hasNextPage(page)) {
  const infoButtons = page.getByRole('button', { name: 'Info' });
  const count = await infoButtons.count();

  for (let i = 0; i < count; i++) {
    // Open modal
    await infoButtons.nth(i).click();
    await page.waitForSelector('.modal-content', { state: 'visible' });
    await delay(800);

    // Extract data
    const name = await page.locator('.modal-header h3').textContent();
    const orgNumber = await extractFieldFromList(page, 'Org.nr:');
    const email = await extractFieldFromList(page, 'Epost:');
    const city = await extractFieldFromList(page, 'Ort:');

    // Extract contacts
    const contacts = await extractContacts(page);

    // Close modal
    const closeBtn = page.getByRole('button', { name: 'x' });
    await closeBtn.click();
    await delay(300);

    // Save record
    await writeJsonl(record);
  }

  // Go to next page
  await goToNextPage(page);
}
```

## Testing Checklist

### API-Based Scraper
- [ ] API endpoints discovered via Network tab
- [ ] POST method confirmed for detail endpoint
- [ ] All pages scraped (check log for total count)
- [ ] Org numbers extracted (check `missingOrgNumber` count)
- [ ] Contacts extracted (check `missingContacts` count)
- [ ] Email addresses captured
- [ ] City/location data present
- [ ] JSONL and JSON files created
- [ ] No Swedish characters in filenames
- [ ] Import to database successful
- [ ] Performance benchmark recorded

### DOM-Based Scraper
- [ ] Cookie consent handled on first page
- [ ] All pages scraped (check log for "Completed scraping X pages")
- [ ] Org numbers extracted (check `missingOrgNumber` count)
- [ ] Contacts extracted (check `missingContacts` count)
- [ ] Email addresses captured
- [ ] City/location data present
- [ ] JSONL and JSON files created
- [ ] No Swedish characters in filenames
- [ ] Import to database successful

## Related Files

- **API Implementation**: `scraping/scripts/boras_api_scrape.ts`
- **DOM Implementation**: `scraping/scripts/boras_scrape.ts`, `scraping/scripts/alvdalen_scrape.ts`
- **Lessons**: `scraping/docs/lessons/lessons_actor.md`
- **Base utilities**: `scraping/utils/scraper-base.ts`
