# Actor Smartbook Municipalities

This document lists all municipalities using Actor Smartbook platform and their API endpoint status.

## API Endpoint Format

All Actor Smartbook municipalities follow the same API pattern:

**List Endpoint:**
```
GET https://{municipality}.actorsmartbook.se/Associations/{page}/{itemsPerPage}
```

**Detail Endpoint:**
```
POST https://{municipality}.actorsmartbook.se/GetAssociation
Content-Type: application/json
Body: {"id": <association_id>}
```

## Municipalities with Confirmed API Access

| Municipality | Base URL | Total Associations | API Status | Scraper File |
|--------------|----------|-------------------|------------|--------------|
| **Boras** | https://boras.actorsmartbook.se | 313 |  Tested & Working | `boras_api_scrape.ts` |
| **Solleftea** | https://solleftea.actorsmartbook.se | 282 |  Tested & Working | *(create from template)* |

## Municipalities to Test

These municipalities likely use Actor Smartbook (based on `.actorsmartbook.se` domain pattern):

| Municipality | URL to Check | Status |
|--------------|-------------|--------|
| Alvdalen | *(URL needed)* | S Not yet tested |
| Karlstad | *(URL needed)* | S Not yet tested |
| Gavle | *(URL needed)* | S Not yet tested |

## Testing Instructions

To check if a municipality has API access:

1. **Test List Endpoint:**
   ```bash
   curl -s "https://{municipality}.actorsmartbook.se/Associations/1/10"
   ```

2. **Test Detail Endpoint:**
   ```bash
   curl -s -X POST "https://{municipality}.actorsmartbook.se/GetAssociation" \
     -H "Content-Type: application/json" \
     -d '{"id": <first_id_from_list>}'
   ```

3. **If both return JSON:** API is available! Create scraper from `boras_api_scrape.ts` template

4. **If 404 or error:** Use DOM scraping fallback method

## Creating a New API Scraper

1. Copy `boras_api_scrape.ts` to `{municipality}_api_scrape.ts`
2. Update constants:
   ```typescript
   const MUNICIPALITY = 'MunicipalityName';  // No Swedish characters!
   const BASE_URL = 'https://{municipality}.actorsmartbook.se';
   ```
3. Run and verify output
4. Update this document with results

## Performance Comparison

| Method | Time for 300 associations | Time per association |
|--------|--------------------------|---------------------|
| **API** | ~50 seconds | ~165ms |
| **DOM** | ~10-15 minutes | ~2-3 seconds |

**Recommendation:** Always check for API availability first!
