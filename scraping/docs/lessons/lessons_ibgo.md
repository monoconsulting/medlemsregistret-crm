# IBGO (Interbook Go) - Lessons Learned

## System Summary

| Field | Value |
|-------|-------|
| System vendor | Interbook Go (IBGO) |
| Municipalities | 31 verified (October 2025) |
| Script filename | `crm-app/scripts/bulk_ibgo_scrape.ts` |
| Date tested | 2025-10-26 |
| Total associations scraped | 10,000+ |
| API calls required | 1 per municipality (no pagination) |

## Technical Learnings

### API Structure

**Finding**: IBGO uses a simple REST API endpoint pattern with NO pagination
- Endpoint: `https://{municipality}.ibgo.se/APIAssociationRegister/GetAssociationsList/`
- Returns ALL associations in a single API call
- Response includes `TotalNumberOfElements` count
- No need for browser automation or Playwright

**Impact**: Extremely fast scraping - entire municipality can be scraped in 2-5 seconds

### Email Field Concatenation (Critical Issue)

**Problem Discovered**: The `Email` field sometimes contains **multiple comma-separated email addresses**

**Example**:
```json
{
  "Email": "peppe.frid@gmail.com, tove.hogbom@hagnor.se, stefan.persson@falun.se, alsiok@me.com, mats_boda@hotmail.com, jennie_133@hotmail.com,, bostrumpa@gmail.com, sandra_pahlsson@hotmail.com, danielgustafsson.86@hotmail.com"
}
```

**Error Encountered**: `P2000: The provided value for the column is too long for the column's type. Column: email`

**Root Cause**:
1. Concatenated emails exceeded VARCHAR(255) database limit
2. Should have been split into separate contact records

**Resolution Implemented**:
1. Updated database schema: `Association.email` changed from `VARCHAR(255)` to `TEXT`
2. Modified scraper to detect concatenated emails:
   ```typescript
   if (customer.Email && customer.Email.includes(',')) {
     const emails = customer.Email.split(',')
       .map(e => e.trim())
       .filter(e => e && e.length > 0 && e.includes('@'));

     emails.forEach(email => {
       contacts.push({
         contact_person_name: null,
         contact_person_role: null,
         contact_person_email: email,
         contact_person_phone: null,
       });
     });
     associationEmail = null; // Don't use concatenated string
   }
   ```

**Occurrence Rate**: Approximately 0.01% of records (4 errors in 26,540 records)

### Missing Organization Numbers

**Finding**: IBGO API **does NOT provide organization numbers**
- Field `orgnr` or `OrgNumber` does not exist in API response
- This is a system limitation, not a scraping issue
- Always set `org_number: null` for IBGO associations

**Validation**: Confirmed by inspecting API responses from multiple municipalities - no organization number field present

### Contact Person Handling

**Finding**: Most IBGO associations have **empty `CustomerContactPeople` arrays**
- Contact information is typically in the main association `Email` field
- When `CustomerContactPeople` exists, it has full structure:
  ```json
  {
    "Id": 3131,
    "OccupationId": 1,
    "Occupation": "Sekreterare",
    "Name": "Jenny",
    "Surname": "Hjelström",
    "Email": "sekreterare@alebk.se",
    "Mobile": "0707995951"
  }
  ```

**Data Quality**: Very few associations (<5%) have structured contact person data

### Field Mapping Quirks

| IBGO Field | Standard Field | Notes |
|------------|----------------|-------|
| `Phone` | `association.phone` | May be empty string ("") |
| `Mobile` | `association.phone` | Use as fallback if Phone empty |
| `Address` | `association.street_address` | May be `null` |
| `ZipCode` | `association.postal_code` | May be `null` |
| `City` | `association.city` | May be `null` |
| `DistrictNames` | `association.categories` | Array of geographic districts |
| `AssociationCategoryName` | `association.types` | Single category as array |
| `CustomerOccupations` | `association.activities` | Array of activity objects |

### Empty String vs Null Handling

**Finding**: IBGO returns empty strings `""` instead of `null` for missing phone numbers

**Solution**: Treat empty strings as null:
```typescript
phone: customer.Phone || customer.Mobile || null
```

### Detail URL Construction

**Finding**: IBGO does not expose individual association detail pages via web interface
- No traditional "detail page" URL exists
- Constructed pseudo-URL for database uniqueness: `{registerUrl}#/association/{Id}`
- Example: `https://ale.ibgo.se/#/association/563`

**Purpose**: Provides unique identifier for upsert operations in database

### Timing and Stability

**Finding**: API is extremely stable and fast
- No rate limiting encountered
- No need for delays between requests
- Can scrape all 31 municipalities in under 5 minutes
- Zero timeouts or connection errors

**Recommendation**: Use 2-second delay between municipalities for courtesy, not necessity

## Import Performance

### Database Operations

**Upsert Strategy**: Use `detail_url` as unique key
- Check for existing association by `detail_url`
- Update if exists, create if new
- Contact sync: Delete all existing contacts, create new ones

**Performance Metrics** (26,540 records):
- Import time: 401.78 seconds
- Speed: ~66 associations/second
- Success rate: 99.98%
- Errors: 4 (all email-related, now resolved)

### Mixed Source System Import Issue

**Problem**: IBGO import script was importing Actor Smartbook files
- Both systems save to same `scraping/json/` directory
- Old filter: `!f.includes('actor')` didn't match filenames like `falun_associations_*.json`
- Result: Falun (Actor) data was imported by IBGO importer

**Resolution**: Updated filename format to include source system
- **New IBGO format**: `{municipality}_IBGO_{YYYY-MM-DD}_{HH-MM}.json`
- **New Actor format**: `{municipality}_ActorSmartbook_{YYYY-MM-DD}_{HH-MM}.json`
- **New filter**: `f.includes('_IBGO_')` - precise source system matching

**Impact**: Eliminates cross-contamination between scrapers

## Filename Format Evolution

### Old Format (Problematic)
```
{municipality}_associations_{uuid}_{date}.json
{municipality}_associations_{uuid}_{date}.jsonl
```

**Issues**:
- Long UUIDs make filenames hard to read
- Duplicate files (.json and .jsonl)
- No source system identification
- Files accumulate over time

### New Format (Current)
```
{municipality}_IBGO_{YYYY-MM-DD}_{HH-MM}.json
```

**Benefits**:
- Clear source system identification
- Human-readable date/time
- Overwrites previous scrapes (no accumulation)
- Import scripts can filter by `_IBGO_` string
- Only .json (no .jsonl duplicate)

## Validation Results

### Data Completeness

After scraping 31 IBGO municipalities:

| Metric | Result |
|--------|--------|
| Total associations | 10,000+ |
| With email | ~70% |
| With phone | ~85% |
| With address | ~60% |
| With contact persons | <5% |
| With org_number | 0% (not available) |
| With activities | ~80% |

### Known Data Quality Issues

1. **Missing organization numbers**: System limitation, not fixable
2. **Concatenated emails**: Now handled by splitting into contacts
3. **Empty contact lists**: Normal for IBGO system
4. **Null addresses**: Common, preserve as-is

## Endpoint Verification Process

### Deriving IBGO Endpoints

**Pattern Discovery**:
1. Start with municipality register URL (from database or manual lookup)
2. Extract base domain
3. Append API path: `/APIAssociationRegister/GetAssociationsList/`

**Example**:
```typescript
const registerUrl = "https://ale.ibgo.se/#/AssociationRegister";
const url = new URL(registerUrl);
const baseUrl = `${url.protocol}//${url.host}`;
const endpoint = `${baseUrl}/APIAssociationRegister/GetAssociationsList/`;
// Result: https://ale.ibgo.se/APIAssociationRegister/GetAssociationsList/
```

### Verification Results

**Initial CSV**: 29 municipalities listed as IBGO
**Verification outcome**:
- 28 verified as IBGO
- 1 incorrect (Haninge - actually uses RBOK)
- 3 additional found (Kinda, Kristinehamn, Linköping)

**Final count**: 31 verified IBGO municipalities

## Next Steps and Recommendations

1. **Monitor for new IBGO municipalities**
   - Periodically check for new adoptions
   - Verify endpoints before adding to database

2. **Handle email concatenation in Actor Smartbook**
   - Same issue exists in Actor system
   - Applied same fix: split concatenated emails

3. **Improve contact data quality**
   - Most associations lack structured contact info
   - Consider manual enrichment for key associations

4. **Database schema validation**
   - Ensure `Association.email` is TEXT type (not VARCHAR)
   - Critical for handling concatenated emails

5. **Re-scrape strategy**
   - New filename format overwrites old data
   - Schedule monthly re-scrapes to catch updates
   - Monitor for association count changes

## Related Documentation

- **Implementation Guide**: `IBGO_SCRAPING_GUIDES.md`
- **Endpoint Summary**: `IBGO_ENDPOINT_VERIFICATION_SUMMARY.md`
- **JSON Standard**: `JSON_STANDARD.md`
- **Batch Files**: `scraping/scripts/IBGO_BATCH_FILES_README.md`

## Key Takeaways

✅ **IBGO is the fastest system to scrape** - simple REST API with no pagination
✅ **Email concatenation must be handled** - split into separate contacts
✅ **No organization numbers available** - system limitation
✅ **Filename format critical** - prevents cross-system import contamination
✅ **Very stable API** - no rate limiting or errors encountered

**Last Updated**: 2025-10-26
**Agent**: Claude Code
