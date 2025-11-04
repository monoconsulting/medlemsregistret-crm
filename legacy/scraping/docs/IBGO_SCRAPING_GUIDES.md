# IBGO (Interbook Go) Scraping Guide

## System Overview

**Vendor**: Interbook Go (IBGO)
**Type**: REST API-based association registry
**Municipalities**: 31 verified (October 2025)
**Total Associations**: ~10,000+ associations

### Verified Municipalities

Ale, Älvsbyn, Åmål, Ånge, Arvika, Åtvidaberg, Avesta, Bengtsfors, Borlänge, Botkyrka, Burlöv, Degerfors, Eda, Finspång, Gnesta, Gotland, Hammarö, Katrineholm, Kinda, Kristinehamn, Linköping, Ljusdal, Motala, Nybro, Örebro, Örnsköldsvik, Säffle, Skellefteå, Torsby, Trosa, Varberg

## API Structure

### Endpoint Pattern

```
https://{municipality}.ibgo.se/APIAssociationRegister/GetAssociationsList/
```

**Example**:
```
https://ale.ibgo.se/APIAssociationRegister/GetAssociationsList/
```

### API Response Structure

```json
{
  "TotalNumberOfElements": 187,
  "Customers": [
    {
      "Id": 563,
      "Name": "Association Name",
      "WebSite": "http://example.com",
      "DistrictNames": ["District 1", "District 2"],
      "AssociationCategoryName": "Studieförbund",
      "Address": "Street Address",
      "ZipCode": "12345",
      "City": "City Name",
      "Phone": "0123-45678",
      "Mobile": "070-1234567",
      "Email": "email@example.com",
      "PublicInformation": "Description text",
      "LeisureActivityCard": false,
      "CustomerOccupations": [
        {
          "Id": 33,
          "Name": "Fotboll"
        }
      ],
      "CustomerContactPeople": [
        {
          "Id": 3131,
          "OccupationId": 1,
          "Occupation": "Sekreterare",
          "Name": "First",
          "Surname": "Last",
          "Email": "contact@example.com",
          "Mobile": "070-9876543"
        }
      ]
    }
  ]
}
```

## Field Mapping

### Core Association Fields

| IBGO Field | JSON Standard Field | Notes |
|------------|---------------------|-------|
| `Id` | `extras.ibgo_id` | Numeric ID |
| `Name` | `association.name` | Association name |
| `WebSite` | `association.homepage_url` | May be null |
| `Address` | `association.street_address` | May be null |
| `ZipCode` | `association.postal_code` | May be null |
| `City` | `association.city` | May be null |
| `Phone` | `association.phone` | Primary phone |
| `Mobile` | `association.phone` | Fallback if Phone empty |
| `Email` | `association.email` OR `contacts[].contact_person_email` | **See Email Handling below** |

### Classification Fields

| IBGO Field | JSON Standard Field | Notes |
|------------|---------------------|-------|
| `AssociationCategoryName` | `association.types[]` | e.g., "Studieförbund", "Idrott" |
| `DistrictNames[]` | `association.categories[]` | Geographic districts |
| `CustomerOccupations[].Name` | `association.activities[]` | e.g., "Fotboll", "Dans" |

### Description Fields

| IBGO Field | JSON Standard Field | Notes |
|------------|---------------------|-------|
| `PublicInformation` | `association.description.free_text` | Free-text description |
| `CustomerOccupations[]` | `association.description.sections[]` | Structured activities |
| `LeisureActivityCard` | `extras.leisure_activity_card` | Boolean flag |

### Contact Person Fields

| IBGO Field | JSON Standard Field | Notes |
|------------|---------------------|-------|
| `CustomerContactPeople[].Name + Surname` | `contacts[].contact_person_name` | Combined full name |
| `CustomerContactPeople[].Occupation` | `contacts[].contact_person_role` | e.g., "Ordförande" |
| `CustomerContactPeople[].Email` | `contacts[].contact_person_email` | Individual email |
| `CustomerContactPeople[].Mobile` | `contacts[].contact_person_phone` | Contact phone |

## Critical Data Handling Issues

### ⚠️ Email Field Concatenation

**Problem**: IBGO sometimes returns **multiple comma-separated emails** in a single `Email` field.

**Example**:
```json
{
  "Email": "email1@test.com, email2@test.com, email3@test.com, email4@test.com"
}
```

**Solution**: Split concatenated emails and create separate contact records:

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

  // Don't set association.email when multiple emails exist
  associationEmail = null;
} else {
  // Single email - use for association
  associationEmail = customer.Email;
}
```

### Missing Organization Numbers

**IBGO does NOT provide organization numbers** (`org_number`). Always set to `null`.

```typescript
org_number: null  // IBGO doesn't provide this field
```

## Scraping Implementation

### Technology Stack

- **Method**: REST API (no browser automation needed)
- **Language**: TypeScript + Node.js
- **HTTP Client**: `fetch` API
- **Database**: Prisma ORM + MySQL

### Bulk Scraper

**File**: `crm-app/scripts/bulk_ibgo_scrape.ts`

**Features**:
- Fetches municipalities from database where `platform='IBGO'`
- Single API call per municipality (no pagination needed)
- Handles concatenated emails automatically
- Saves to: `{municipality}_IBGO_{YYYY-MM-DD}_{HH-MM}.json`

**Usage**:
```bash
# Via Windows batch file
scraping/scripts/ibgo_scrape.bat

# Direct execution
cd crm-app
set DATABASE_URL=mysql://user:pass@localhost:3316/crm_db
npx tsx scripts/bulk_ibgo_scrape.ts
```

### Bulk Importer

**File**: `crm-app/scripts/bulk_ibgo_import.ts`

**Features**:
- Imports all JSON files matching pattern `*_IBGO_*.json`
- Uses `detail_url` as unique key for upsert
- Synchronizes contacts (deletes old, creates new)
- Tracks import statistics per municipality

**Usage**:
```bash
# Via Windows batch file
scraping/scripts/ibgo_import.bat

# Direct execution
cd crm-app
set DATABASE_URL=mysql://user:pass@localhost:3316/crm_db
npx tsx scripts/bulk_ibgo_import.ts
```

### Combined Script

**File**: `crm-app/scripts/bulk_ibgo_scrape_and_import.ts`

Runs scraping then import in sequence.

**Usage**:
```bash
scraping/scripts/ibgo_scrape_and_import.bat
```

## Output Format

**⚠️ Viktigt**: Scrapers genererar endast **Pretty JSON** (indenterad array). JSONL-format används inte längre.

### Filename Pattern

```
{municipality}_IBGO_{YYYY-MM-DD}_{HH-MM}.json
```

**Output-platser**:
- JSON-filer: `scraping/json/`
- Loggar: `scraping/logs/{municipality}.log` (appendar)

**Examples**:
- `scraping/json/ale_IBGO_2025-10-26_14-30.json`
- `scraping/json/gnesta_IBGO_2025-10-26_14-32.json`

**Filhantering**:
- Filer skrivs över vid nya körningar (ej versionerade)
- Importeraren läser endast den senaste filen baserat på filnamnet
- SOURCE_SYSTEM inkluderas i filnamnet för att undvika cross-contamination

### JSON Structure

Följer `JSON_STANDARD.md` med dessa specifika detaljer:

```json
{
  "source_system": "IBGO",
  "municipality": "Ale",
  "scrape_run_id": "uuid-here",
  "scraped_at": "2025-10-26T14:30:00.000Z",
  "association": {
    "detail_url": "https://ale.ibgo.se/#/association/563",
    "name": "Association Name",
    "org_number": null,
    "types": ["Studieförbund"],
    "activities": ["Fotboll", "Dans"],
    "categories": ["District Name"],
    "homepage_url": "http://example.com",
    "street_address": "Street Address",
    "postal_code": "12345",
    "city": "City Name",
    "email": null,
    "phone": "0123-45678",
    "description": {
      "free_text": "Public information text",
      "sections": [
        {
          "title": "Verksamhet",
          "data": {
            "activities_count": 2,
            "has_public_info": true
          }
        }
      ]
    }
  },
  "contacts": [
    {
      "contact_person_name": "First Last",
      "contact_person_role": "Ordförande",
      "contact_person_email": "contact@example.com",
      "contact_person_phone": "070-1234567"
    },
    {
      "contact_person_name": null,
      "contact_person_role": null,
      "contact_person_email": "email1@test.com",
      "contact_person_phone": null
    }
  ],
  "source_navigation": {
    "list_page_index": null,
    "position_on_page": 0,
    "pagination_model": "single_api_call",
    "filter_state": null
  },
  "extras": {
    "ibgo_id": 563,
    "leisure_activity_card": false,
    "has_public_info": true
  }
}
```

## Performance Metrics

### Bulk Scraping Results (October 2025)

- **Municipalities scraped**: 31
- **Total associations found**: 10,000+
- **Average time per municipality**: ~2-5 seconds
- **Total scraping time**: ~3-5 minutes
- **Success rate**: 100%

### Import Performance

- **Import speed**: ~60 associations/second
- **Database operations**: Upsert with contact sync
- **Success rate**: 99.98% (minor email field issues resolved)

## Known Issues & Resolutions

### Issue 1: Email Field Too Long

**Problem**: Concatenated emails exceeded VARCHAR(255) database limit
**Error**: `P2000: The provided value for the column is too long for the column's type. Column: email`
**Resolution**:
1. Changed database schema: `Association.email` from `VARCHAR(255)` to `TEXT`
2. Split concatenated emails into separate contact records

### Issue 2: Mixed Source System Imports

**Problem**: IBGO import script was importing Actor Smartbook files
**Cause**: Filename filter used `!f.includes('actor')` which didn't match filenames
**Resolution**: Updated filter to check for `_IBGO_` in filename

## Database Schema Requirements

```prisma
model Association {
  // ... other fields ...
  email  String? @db.Text  // MUST be TEXT type, not VARCHAR
  // ... other fields ...
}
```

## Validation Checklist

After scraping a new IBGO municipality:

- [ ] Verify total association count matches API response
- [ ] Check for null organization numbers (expected)
- [ ] Validate concatenated emails are split into contacts
- [ ] Confirm all CustomerContactPeople are imported
- [ ] Check that DistrictNames map to categories
- [ ] Verify CustomerOccupations map to activities
- [ ] Test import succeeds without errors
- [ ] Confirm detail_url format is correct

## Common Patterns

### Empty Contact Lists

Most IBGO associations have **empty CustomerContactPeople arrays**. This is normal - contact info is in the main association email field (which may be concatenated).

### Null Address Fields

Many associations have `null` values for Address, ZipCode, or City. This is expected and should be preserved.

### Phone vs Mobile Priority

Use `Phone` as primary, fall back to `Mobile` if Phone is empty:

```typescript
phone: customer.Phone || customer.Mobile || null
```

## Next Steps

1. Monitor for new IBGO municipalities
2. Add endpoint verification for new municipalities
3. Update Municipality table with new endpoints
4. Run bulk scraper for new data

## Related Files

- Implementation: `crm-app/scripts/bulk_ibgo_scrape.ts`
- Import: `crm-app/scripts/bulk_ibgo_import.ts`
- Batch files: `scraping/scripts/ibgo_*.bat`
- Endpoint verification: `IBGO_ENDPOINT_VERIFICATION_SUMMARY.md`
- Lessons learned: `lessons/lessons_ibgo.md`
