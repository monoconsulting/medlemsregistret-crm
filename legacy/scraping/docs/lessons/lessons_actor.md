# Actor Smartbook - Lessons Learned

**Post-Scrape Technical Notes & Registry Index**

This document consolidates all lessons learned from scraping Actor Smartbook-based municipal association registries.

## Key Discovery: REST API Available! ⭐

**CRITICAL**: Actor Smartbook platforms expose REST API endpoints that are 10-20x faster than DOM scraping.

**Before starting any new municipality**:
1. Open browser DevTools → Network tab
2. Look for `/Associations/{page}/{itemsPerPage}` (GET) and `/GetAssociation` (POST)
3. If found, use API scraper template from `boras_api_scrape.ts`

**Performance comparison (Boras 313 associations)**:
- API method: ~51 seconds (163ms/association)
- DOM method: ~10-15 minutes (2-3s/association)

**API Endpoints**:
```
GET  /Associations/{page}/{itemsPerPage}  → List with {page, totalNumItems, items[]}
POST /GetAssociation                       → Detail with {id, name, orgnr, email, city, ContactPersons[]}
     Body: {"id": 8}
```

---

## Boras Municipality

### System Summary

| Field                      | Value                                    |
| -------------------------- | ---------------------------------------- |
| System vendor              | Actor Smartbook                          |
| Municipality               | Boras                                    |
| Script filename (API)      | `scraping/scripts/boras_api_scrape.ts`   |
| Script filename (DOM)      | `scraping/scripts/boras_scrape.ts`       |
| Date tested                | 2025-10-26                               |
| Base URL                   | https://boras.actorsmartbook.se/         |
| Total associations scraped | 313 (API method - completed)             |
| Total pages detected       | 32 pages (API pagination)                |
| Scraping method            | **REST API (preferred)**                 |

### Technical Learnings

| Area                       | Key Findings                                                 |
| -------------------------- | ------------------------------------------------------------ |
| **API Discovery** ⭐       | - Actor Smartbook exposes REST API endpoints<br>- List: `GET /Associations/{page}/{itemsPerPage}`<br>- Detail: `POST /GetAssociation` with `{id: number}` payload<br>- Check browser Network tab to discover endpoints<br>- **10-20x faster than DOM scraping** |
| **API Implementation**     | - Use fetch with POST method for detail endpoint<br>- Add `Content-Type: application/json` header<br>- Response includes all fields: orgnr, email, city, ContactPersons<br>- No cookie consent, modal timing, or pagination complexity |
| **Performance (API)**      | - 313 associations in ~51 seconds<br>- ~163ms per association average<br>- 100% success rate<br>- No timing issues or modal failures |
| **Performance (DOM)**      | - Same 313 associations would take 10-15 minutes<br>- ~2-3 seconds per association<br>- Modal timing errors possible<br>- Cookie consent required |
| **Pagination (API)**       | - Simple page counter increment<br>- Check `items.length === 0` to detect end<br>- No button state checking needed<br>- Response includes `totalNumItems` for progress tracking |
| **Pagination (DOM)**       | - Must check if "Nasta" button is `.isDisabled()`, NOT compare page content<br>- After page 31, page size changes from 10 to 3 associations per page<br>- Safety limit at 100 pages prevents infinite loops |
| **Field extraction (API)** | - Direct JSON field access: `detail.orgnr`, `detail.email`, `detail.city`<br>- ContactPersons array with name, email, mobile, role<br>- No parsing or normalization needed |
| **Field extraction (DOM)** | - CRITICAL: Use `extractFieldFromList()` to read from `ul.assn-info li` structure<br>- Fields are in `<li><span>Label:</span><span>Value</span></li>` format<br>- Direct regex/text matching in modal body is unreliable |
| **Org number**             | - API field: `orgnr`<br>- DOM label: "Org.nr:" (with colon)<br>- Format: XXXXXX-XXXX (6 digits, hyphen, 4 digits)<br>- 8 of 313 missing (2.6%) |
| **Contact extraction**     | - API: `ContactPersons[]` array with all fields<br>- DOM: Table with `th:has-text("Namn")` header and `data-ng-repeat` rows<br>- 51 of 313 missing contacts (16.3%) |
| **Modal timing (DOM)**     | - MUST wait 800ms after modal opens before extraction<br>- MUST wait 300ms after closing modal before next action<br>- Without delays, extraction returns null/empty values |
| **Cookie consent (DOM)**   | - Button text: "Acceptera alla"<br>- Only appears on first page load<br>- Must handle before starting scrape |
| **Filename encoding**      | - Municipality name MUST NOT contain Swedish characters (a, a, o)<br>- Use "Boras" not "Boras" for filenames<br>- Swedish characters in data content are OK, just not filenames |
| **Logger compatibility**   | - `createLogger()` must return object with `.info()`, `.error()`, `.warn()` methods<br>- Simple function return breaks code that uses `log.info()` |
| **Import path**            | - Database import must use absolute path resolved from `process.cwd()`<br>- Relative paths fail when script is run from different directories |
| **Validation results**     | - API method: 100% success, 313/313 associations<br>- Org numbers: 97.4% coverage (305/313)<br>- Contacts: 83.7% coverage (262/313) |

### Data Quality Observations

1. **Duplicate associations**: "Armagedon" appears twice (ID 15 and 2514) with same name but different data
2. **Missing org numbers**: 8 of 313 (2.6%) have no org_number (likely not legally registered)
3. **Missing contacts**: 51 of 313 (16.3%) have no contact persons listed
4. **Incomplete contact info**: Some contacts have name/role but no email/phone
5. **Encoding**: Swedish characters in association names display correctly in data

### Code Implementations

#### API-Based (Recommended)
```typescript
// File: scraping/scripts/boras_api_scrape.ts
const DETAIL_ENDPOINT = `${BASE_URL}/GetAssociation`;

async function fetchAssociationDetail(id: number) {
  const response = await fetch(DETAIL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return await response.json();
}
```

#### DOM-Based (Fallback)
```typescript
// File: scraping/scripts/boras_scrape.ts
async function extractFieldFromList(page: Page, labelText: string) {
  const listItems = page.locator('ul.assn-info li');
  const count = await listItems.count();
  for (let i = 0; i < count; i++) {
    const item = listItems.nth(i);
    const text = await item.textContent();
    if (text && text.includes(labelText)) {
      const spans = item.locator('span');
      if (await spans.count() >= 2) {
        return await spans.nth(1).textContent();
      }
    }
  }
  return null;
}
```

### Next Steps

- [x] ~~Verify full scrape completes successfully~~ ✓ 313/313 associations scraped
- [x] ~~Discover and implement API endpoints~~ ✓ API scraper created and tested
- [x] ~~Test database import with actual data~~ ✓ 313 associations imported to production
- [x] ~~Add registryEndpoint column to database~~ ✓ Column added to Municipality table
- [x] ~~Update database with API endpoints~~ ✓ 22 municipalities with verified endpoints
- [x] ~~Apply API method to other Actor Smartbook municipalities~~ ✓ Bulk scraper implemented
- [x] ~~Create bulk scraping automation~~ ✓ Batch files and TypeScript scripts created
- [x] ~~Import all Actor Smartbook data~~ ✓ 3,413 of 3,425 associations imported (99.6%)
- [ ] Scrape remaining 10 municipalities (Åstorp, Gislaved, Huddinge, Hultsfred, Hylte, Jönköping, Lidköping, Ronneby, Sävsjö, Gnosjö)
- [ ] Consider deduplication strategy for duplicate associations during import

---

## Bulk Scraping Implementation

### System Summary

| Field                      | Value                                    |
| -------------------------- | ---------------------------------------- |
| Implementation date        | 2025-10-26                               |
| Municipalities scraped     | 12 (Alingsås, Älvdalen, Boden, Bollnäs, Borås, Falun, Hedemora, Kiruna, Mora, Sandviken, Sollefteå, Sundsvall) |
| Total associations found   | 3,425                                    |
| Total time                 | 23.38 minutes (1,402.8 seconds)          |
| Average per association    | ~410ms                                   |
| Import success rate        | 99.6% (3,413 imported, 12 failed)        |
| Automation files           | 4 batch files + 3 TypeScript scripts     |

### Technical Learnings

| Area                       | Key Findings                                                 |
| -------------------------- | ------------------------------------------------------------ |
| **Bulk automation** ⭐     | - Created `bulk_actor_scrape.ts` to scrape all municipalities in one run<br>- Created `bulk_actor_import.ts` to import all JSON files in one run<br>- Batch files (`actor_scrape_and_import.bat`, etc.) provide user-friendly execution<br>- Normalized filenames (removed åäö) prevent file system errors |
| **Path management**        | - CRITICAL: Use `PROJECT_ROOT = path.join(process.cwd(), '..')` to go up from `crm-app/` to project root<br>- Store JSON in `scraping/json/` not `crm-app/scraping/json/`<br>- Use `.env` variables `SCRAPING_JSON_DIR` and `SCRAPING_LOGS_DIR` for configurability<br>- Resolve absolute paths with `path.join()` to avoid relative path issues |
| **Filename normalization** | - Function `normalizeFilename()` replaces å→a, ä→a, ö→o<br>- Prevents Windows file system errors<br>- Example: "Älvdalen" → "alvdalen_associations_..." |
| **Database import fixes**  | - CRITICAL: Empty string detailUrl causes unique constraint errors<br>- Fix: Convert empty strings to null: `detailUrl: assocData.detail_url && assocData.detail_url.trim() !== '' ? assocData.detail_url : null`<br>- ScrapeRun records must be created before importing associations<br>- Field name is `scrapedAt` not `lastScrapedAt` |
| **Parallel processing**    | - Bulk scraper processes municipalities sequentially to avoid rate limiting<br>- Each municipality scraped independently with error handling<br>- Summary generated at end with success/failure counts |
| **Error handling**         | - 12 of 3,425 failed (0.4%) due to duplicate detailUrl conflicts<br>- Municipality errors logged but don't stop bulk process<br>- Import uses try-catch per association to continue on errors |
| **Performance scaling**    | - 12 municipalities in 23.38 minutes = ~1.95 minutes per municipality<br>- Largest (Falun with 788) and smallest (Älvdalen with 95) both succeeded<br>- No memory issues or timeouts during bulk run |
| **Batch file automation**  | - `actor_scrape_and_import.bat` - full process (scrape + import)<br>- `actor_scrape.bat` - scraping only<br>- `actor_import.bat` - import only<br>- `actor_test_scrape.bat` - test on Gnosjö (72 assoc, 30 sec) |
| **User experience**        | - Batch files provide clear progress messages<br>- Error checking between steps (scraping failure stops before import)<br>- Output locations displayed at end<br>- Pause at end allows user to review results |

### Code Implementations

#### Bulk Scraping Script
```typescript
// File: crm-app/scripts/bulk_actor_scrape.ts
const PROJECT_ROOT = path.join(process.cwd(), '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, process.env.SCRAPING_JSON_DIR || 'scraping/json');

function normalizeFilename(name: string): string {
  return name.toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Process each municipality sequentially
for (const municipality of municipalities) {
  try {
    await scrapeMunicipality(municipality);
  } catch (error) {
    console.error(`Failed to scrape ${municipality.name}: ${error}`);
    // Continue with next municipality
  }
}
```

#### Bulk Import Script
```typescript
// File: crm-app/scripts/bulk_actor_import.ts
// Fix for empty detailUrl causing unique constraint errors
detailUrl: assocData.detail_url && assocData.detail_url.trim() !== ''
  ? assocData.detail_url
  : null,

// Create ScrapeRun before importing associations
const scrapeRun = await prisma.scrapeRun.create({
  data: {
    municipalityId: municipalityId,
    status: 'completed',
    startedAt: scrapedAt,
    completedAt: scrapedAt,
    totalFound: records.length,
    totalProcessed: 0
  }
});
```

#### Batch File Template
```batch
@echo off
REM actor_scrape_and_import.bat
cd /d "%~dp0..\..\crm-app"
call npx tsx scripts/bulk_actor_scrape.ts
if errorlevel 1 (
    echo ERROR: Scraping failed!
    pause
    exit /b 1
)
call npx tsx scripts/bulk_actor_import.ts
```

### Data Quality Observations

1. **Import success rate**: 99.6% (3,413 of 3,425) - excellent quality
2. **Failed imports**: Only 12 failures, mostly due to duplicate empty detailUrl values
3. **Completeness**: All 12 municipalities scraped successfully, no municipality failures
4. **Performance**: Consistent speed across municipalities regardless of size
5. **Duplicate handling**: Database upsert logic handles re-imports gracefully

### Automation Benefits

1. **Time savings**: Manual scraping would take hours; automated batch runs in 25 minutes total
2. **Consistency**: Same extraction logic applied to all municipalities
3. **Error recovery**: Individual municipality failures don't stop entire batch
4. **User-friendly**: Non-technical users can run batch files without understanding code
5. **Reproducibility**: Can re-run at any time to refresh data

---

## Sollefteå Municipality

### System Summary

| Field                      | Value                                      |
| -------------------------- | ------------------------------------------ |
| System vendor              | Actor Smartbook                            |
| Municipality               | Sollefteå                                  |
| Script filename (API)      | `scraping/scripts/solleftea_api_scrape.ts` (pending) |
| Date tested                | 2025-10-26                                 |
| Base URL                   | https://solleftea.actorsmartbook.se/       |
| Total associations         | 282 (verified via API)                     |
| API endpoint verified      | ✅ GET /Associations & POST /GetAssociation |
| Scraping method            | **REST API (same as Borås)**               |
| Database status            | `registryEndpoint` populated, ready for import |

### API Verification

```bash
# List endpoint test
curl "https://solleftea.actorsmartbook.se/Associations/1/10"
# Response: {"page":1,"totalNumItems":282,"items":[...]}

# Detail endpoint test
curl -X POST "https://solleftea.actorsmartbook.se/GetAssociation" \
  -H "Content-Type: application/json" \
  -d '{"id":264}'
# Response: {"id":264,"name":"Afasiföreningen",...}
```

### Expected Performance

- **Total time**: ~46 seconds (based on Borås benchmark)
- **Time per association**: ~163ms
- **Success rate**: 100% (API method)

---

## Älvdalen Municipality

### System Summary

| Field                      | Value                                    |
| -------------------------- | ---------------------------------------- |
| System vendor              | Actor Smartbook                          |
| Municipality               | Älvdalen                                 |
| Script filename (DOM)      | `scraping/scripts/alvdalen_scrape.ts`    |
| Date tested                | (TBD)                                    |
| Base URL                   | (TBD - needs verification)               |
| Total associations scraped | (TBD)                                    |
| API status                 | ❓ Not yet tested                        |

### Technical Learnings

| Area                       | Key Findings                                                 |
| -------------------------- | ------------------------------------------------------------ |
| **API availability**       | Check Network tab for `/Associations` and `/GetAssociation` endpoints |
| **Pagination handling**    | (To be documented after successful run)                     |
| **Field extraction**       | Uses same `extractFieldFromList()` pattern as Borås (if DOM scraping needed) |

---

## Database Integration

### registryEndpoint Field

All Actor Smartbook municipalities with verified API access have the `registryEndpoint` field populated in the `Municipality` table:

```sql
-- Check municipalities with API endpoints
SELECT name, registryEndpoint, platform
FROM Municipality
WHERE registryEndpoint IS NOT NULL;

-- Results:
-- Borås     | https://boras.actorsmartbook.se     | Actors Smartbook
-- Sollefteå | https://solleftea.actorsmartbook.se | Actors Smartbook
```

### Import Status

| Municipality | Records in DB | Source Method | Import Date | Notes |
|--------------|--------------|---------------|-------------|-------|
| Borås | 527 total (313 from API) | API scraper | 2025-10-26 | Includes historical DOM-scraped data |
| Sollefteå | 0 | API ready | Pending | Endpoint verified, scraper pending |

### Using registryEndpoint for Automation

The `registryEndpoint` field enables automatic scraper selection:

```typescript
// Fetch municipality from database
const municipality = await prisma.municipality.findUnique({
  where: { name: 'Borås' }
});

if (municipality.registryEndpoint) {
  // Use API scraper (fast)
  await scrapeViaApi(municipality.registryEndpoint);
} else {
  // Fall back to DOM scraper (slow)
  await scrapeViaDom(municipality.registerUrl);
}
```

---

## General Actor Smartbook Patterns

### Shared API Structure (When Available)

All Actor Smartbook platforms that expose REST APIs share:

1. **List endpoint**: `GET /{municipality}.actorsmartbook.se/Associations/{page}/{itemsPerPage}`
2. **Detail endpoint**: `POST /{municipality}.actorsmartbook.se/GetAssociation` with body `{id: number}`
3. **Same response schema**: `{id, name, email, orgnr, website, city, ContactPersons[], ageRangeStrings[]}`

### Shared DOM Structure

All Actor Smartbook systems share:

1. **Modal-based detail view** with `class="modal-content"`
2. **Field list** in `ul.assn-info li` with label/value spans
3. **Contact table** with `data-ng-repeat` rows
4. **Pagination buttons**: Forsta, Foregaende, Nasta, Sista
5. **Info buttons** to open modals (role="button", name="Info")

### Shared Extraction Functions

These helper functions work across all Actor Smartbook systems:

- `extractFieldFromList(page, labelText)` - Extract from ul.assn-info
- `hasNextPage(page)` - Check if "Nasta" button is enabled
- `goToNextPage(page)` - Click next and wait for load
- `extractContacts(page)` - Parse contact table

### Platform-Specific Variations

While DOM structure is consistent, watch for:

- Different field labels (e.g., "Mail" vs "Epost")
- Different page sizes (10 vs 3 vs other)
- Different contact table column orders
- Presence/absence of certain fields

---

## Quick Reference: Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Slow scraping** | Taking 10+ minutes for 300+ associations | Check for API endpoints in Network tab, use API scraper |
| **404 on detail fetch** | `HTTP 404` when fetching association details | Use POST to `/GetAssociation` with JSON body `{id: number}`, not GET |
| **All fields null (DOM)** | `org_number`, `email`, `city` all null | Use `extractFieldFromList()`, not direct selectors |
| **Pagination stops early (DOM)** | Only scrapes 1 page | Check button state with `.isDisabled()`, not content |
| **Logger error** | `log.info is not a function` | Update `createLogger()` to return object |
| **Import path error** | `Cannot find module` | Use `process.cwd()` + relative path |
| **Filename error** | Cannot create file | Remove Swedish characters from municipality name |
| **Modal data missing (DOM)** | Empty extraction results | Add 800ms delay after modal opens |

---

## Testing Protocol

For each new Actor Smartbook municipality:

### Step 1: API Discovery (Check This First!)
1. **Open browser DevTools** (F12) and go to Network tab
2. **Navigate the municipality site** (browse association list, click Info buttons)
3. **Look for API calls**:
   - List endpoint: `/Associations/{page}/{itemsPerPage}` (GET)
   - Detail endpoint: `/GetAssociation` (POST with `{id: number}`)
4. **If API found**: Use `boras_api_scrape.ts` as template (10-20x faster!)
5. **If no API found**: Use DOM scraping method below

### Step 2: DOM Scraping Setup (Fallback)
1. **Identify base URL** and confirm it's Actor Smartbook (check for modal + ul.assn-info)
2. **Test cookie consent** handling on first page
3. **Test single modal** extraction (open, extract, close)
4. **Test pagination** (navigate through 3-5 pages)

### Step 3: Run and Validate
1. **Run full scrape** with logging enabled
2. **Validate output**: Check JSONL line count matches expected associations
3. **Spot-check data**: Verify org_numbers, emails, contacts in random samples
4. **Check performance**: API should be ~150ms/assoc, DOM ~2-3s/assoc

### Step 4: Import and Document
1. **Test import**: Run database import and check for errors
2. **Document lessons**: Update this file with municipality-specific findings
3. **Note API availability**: Document if REST API is available or DOM-only

---

## Related Documentation

- **Scraping Guide**: `scraping/docs/ACTORS_SMARTBOOK_SCRAPING_GUIDES.md`
- **JSON Standard**: `scraping/docs/JSON_STANDARD.md`
- **Import Pipeline**: `scraping/docs/IMPORT_PIPELINE_SETUP.md`
- **Base Utilities**: `scraping/utils/scraper-base.ts`
