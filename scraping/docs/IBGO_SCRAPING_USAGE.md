# IBGO Scraping Usage Guide

Complete guide for scraping and importing IBGO municipality association data.

## Overview

The IBGO scraping system automatically collects association data from all 31 verified IBGO municipalities using their REST API endpoints. The system follows the **MUNICIPAL_ASSOCIATION_JSON_STANDARD.md** for data format.

## Prerequisites

1. **Database running** on `localhost:3316` (or update `.env` file)
2. **Node.js and npm** installed
3. **Verified IBGO endpoints** in Municipality table (already done - 31 municipalities)

## Available Scripts

### 1. Scrape Only (Generate JSON Files)

**Windows:**
```bash
scraping\scripts\ibgo_scrape.bat
```

**Manual:**
```bash
cd crm-app
npx tsx scripts/bulk_ibgo_scrape.ts
```

**What it does:**
- Fetches all associations from 31 IBGO municipalities
- Saves to `scraping/json/` as JSON files (both `.json` and `.jsonl`)
- Creates log files in `scraping/logs/`
- Generates summary file

**Output files:**
- `scraping/json/{municipality}_associations_{uuid}_{date}.json` - Pretty JSON for review
- `scraping/json/{municipality}_associations_{uuid}_{date}.jsonl` - JSONL for batch processing
- `scraping/json/bulk_ibgo_scrape_summary_{date}.json` - Overall summary
- `scraping/logs/{municipality}.log` - Detailed log per municipality

### 2. Import Only (JSON to Database)

**Windows:**
```bash
scraping\scripts\ibgo_import.bat
```

**Manual:**
```bash
cd crm-app
npx tsx scripts/bulk_ibgo_import.ts
```

**What it does:**
- Reads all IBGO JSON files from `scraping/json/`
- Imports to MySQL database via Prisma
- Creates/updates Association and Contact records
- Uses `detail_url` as unique key for upsert

**Behavior:**
- **New associations:** Created with all data
- **Existing associations:** Updated with new data (based on `detail_url`)
- **Contacts:** Always synced (old deleted, new created)

### 3. Scrape + Import (Combined)

**Windows:**
```bash
scraping\scripts\ibgo_scrape_and_import.bat
```

**Manual:**
```bash
cd crm-app
npx tsx scripts/bulk_ibgo_scrape_and_import.ts
```

**What it does:**
- Runs scraping first
- Waits 2 seconds
- Runs import
- Reports combined statistics

**Best for:** One-command full refresh of all IBGO data

## Expected Results

Based on endpoint verification:

| Metric | Value |
|--------|-------|
| **Total municipalities** | 31 |
| **Total associations** | ~6,981 |
| **Estimated scrape time** | 2-5 minutes |
| **Estimated import time** | 1-3 minutes |

## Data Format

All output follows **MUNICIPAL_ASSOCIATION_JSON_STANDARD.md**:

```json
{
  "source_system": "IBGO",
  "municipality": "Ale",
  "scrape_run_id": "uuid",
  "scraped_at": "2025-10-26T...",
  "association": {
    "detail_url": "https://ale.ibgo.se/#/association/123",
    "name": "Association Name",
    "org_number": null,
    "types": ["Idrottsförening"],
    "activities": ["Fotboll"],
    "categories": ["Ale"],
    "homepage_url": "https://example.com",
    "street_address": "Storgatan 1",
    "postal_code": "44951",
    "city": "Ale",
    "email": "info@example.com",
    "phone": "0303-12345",
    "description": {
      "free_text": "Information about the association",
      "sections": [...]
    }
  },
  "contacts": [
    {
      "contact_person_name": "First Last",
      "contact_person_role": "Ordförande",
      "contact_person_email": "person@example.com",
      "contact_person_phone": "070-1234567"
    }
  ],
  "source_navigation": {
    "list_page_index": null,
    "position_on_page": 0,
    "pagination_model": "single_api_call",
    "filter_state": null
  },
  "extras": {
    "ibgo_id": 123,
    "leisure_activity_card": false
  }
}
```

## IBGO-Specific Notes

### API Structure
- **Single call:** IBGO returns ALL associations in one API call
- **No pagination:** Unlike other systems, no page-by-page iteration
- **No org numbers:** IBGO doesn't provide organization numbers
- **Contact persons:** Structured with first/last name, role, email, mobile

### Data Mapping

| IBGO Field | JSON Standard Field |
|------------|---------------------|
| `Name` | `association.name` |
| `AssociationCategoryName` | `association.types[]` |
| `CustomerOccupations[].Name` | `association.activities[]` |
| `DistrictNames[]` | `association.categories[]` |
| `WebSite` | `association.homepage_url` |
| `Address` | `association.street_address` |
| `ZipCode` | `association.postal_code` |
| `City` | `association.city` |
| `Email` | `association.email` |
| `Phone` / `Mobile` | `association.phone` |
| `PublicInformation` | `association.description.free_text` |
| `CustomerContactPeople[]` | `contacts[]` |

### Detail URLs
Since IBGO doesn't expose individual detail pages, we construct pseudo-URLs:
```
https://{municipality}.ibgo.se/#/association/{id}
```

These are unique per association and used for upsert logic.

## Troubleshooting

### "No municipalities found"
**Problem:** Database has no IBGO municipalities with endpoints.
**Solution:** Run endpoint verification first:
```bash
cd crm-app
DATABASE_URL="..." npx tsx ../scraping/scripts/update_ibgo_endpoints_to_db.ts
```

### "Cannot reach database"
**Problem:** MySQL not running or wrong credentials.
**Solution:**
1. Check Docker: `docker ps | grep mysql`
2. Verify credentials in `.env` file
3. Update `DATABASE_URL` if needed

### "Module not found"
**Problem:** Missing dependencies.
**Solution:**
```bash
cd crm-app
npm install
```

### Import errors (P2002)
**Problem:** Unique constraint violation on `detail_url`.
**Solution:** This shouldn't happen with IBGO since URLs are unique. If it does, check for duplicate IDs in the data.

## Performance Tips

1. **Run during off-hours:** Be respectful to municipality servers
2. **Monitor logs:** Check `scraping/logs/` for issues
3. **Incremental imports:** Run import multiple times safely (upsert logic)
4. **Review JSON first:** Check `.json` files before importing

## Next Steps After Import

1. **Verify data:** Check database for imported associations
   ```sql
   SELECT municipality, COUNT(*) FROM Association
   WHERE sourceSystem = 'IBGO'
   GROUP BY municipality;
   ```

2. **Review contacts:** Check contact person data quality
   ```sql
   SELECT COUNT(*) FROM Contact
   WHERE associationId IN (
     SELECT id FROM Association WHERE sourceSystem = 'IBGO'
   );
   ```

3. **Update CRM fields:** Enrich associations with CRM-specific data
   - Set `crmStatus` for relevant associations
   - Assign to users
   - Add tags

## Support

For issues or questions:
1. Check log files in `scraping/logs/`
2. Review summary JSON in `scraping/json/`
3. Consult `JSON_STANDARD.md` for format details
4. Check `IBGO_ENDPOINT_VERIFICATION_SUMMARY.md` for endpoint info
