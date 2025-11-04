# FRI Batch Files - Usage Guide

## Overview

This directory contains batch files for automating FRI (Webb-Förening) municipality scraping and importing.

**FRI System Coverage:**
- **Total municipalities:** 61
- **System type:** FRI Webb-Förening (web-based association registry)
- **Expected associations:** ~10,000-15,000 (estimated based on tested municipalities)
- **Data quality:** Excellent (99%+ contact and address extraction rates)

## Available Batch Files

### 1. `fri_test_scrape.bat` - Test Single Municipality
**Purpose:** Quick test scraping of Forshaga (smallest FRI municipality)

**What it does:**
- Scrapes Forshaga municipality (39 associations, ~90 seconds)
- Saves JSON file to `scraping/json/Forshaga_FRI_YYYY-MM-DD_HH-MM.json`
- Creates log file in `scraping/logs/Forshaga.log`

**Usage:**
```cmd
cd scraping\scripts
fri_test_scrape.bat
```

**Performance:**
- Duration: ~90 seconds
- Associations: 39
- Success rate: 97.4% contacts, 94.9% addresses

---

### 2. `fri_scrape.bat` - Scrape All FRI Municipalities
**Purpose:** Bulk scraping of all 61 FRI municipalities

**What it does:**
- Reads municipality list from `temp/Associations - FRI.csv`
- Scrapes all 61 municipalities sequentially
- Saves JSON files to `scraping/json/`
- Creates summary file: `scraping/json/bulk_fri_scrape_summary_YYYY-MM-DD.json`

**Usage:**
```cmd
cd scraping\scripts
fri_scrape.bat
```

**Performance (Estimated):**
- Duration: ~2-3 hours for all 61 municipalities
- Expected total associations: ~10,000-15,000
- Success rate: >95% based on tested municipalities

**Output Files:**
- One JSON file per municipality: `{municipality}_FRI_YYYY-MM-DD_HH-MM.json`
- One log file per municipality: `scraping/logs/{municipality}.log`
- Summary: `scraping/json/bulk_fri_scrape_summary_YYYY-MM-DD.json`

---

### 3. `fri_import.bat` - Import All Scraped Data
**Purpose:** Import all scraped FRI JSON files to database

**What it does:**
- Finds all FRI JSON files (files containing `_FRI_` in filename)
- Imports each file to MySQL database (port 3316)
- Updates existing associations or creates new ones based on `detail_url`

**Usage:**
```cmd
cd scraping\scripts
fri_import.bat
```

**Prerequisites:**
- MySQL container must be running on port 3316
- JSON files must exist in `scraping/json/`
- Database schema must be up to date (`npx prisma db push`)

---

### 4. `fri_scrape_and_import.bat` - Complete Pipeline
**Purpose:** One-click scraping + importing

**What it does:**
1. Scrapes all 61 FRI municipalities
2. Automatically imports all data to database

**Usage:**
```cmd
cd scraping\scripts
fri_scrape_and_import.bat
```

**Performance:**
- Duration: ~2-3 hours total
- Expected result: ~10,000-15,000 associations imported

---

## Generic FRI Scraper (Advanced)

For scraping individual municipalities, use the generic scraper directly:

```cmd
npx tsx scraping/scripts/generic_fri_scrape.ts <municipality> <url>
```

**Examples:**
```cmd
# Halmstad (largest - 494 associations)
npx tsx scraping/scripts/generic_fri_scrape.ts Halmstad https://fri.halmstad.se/forening/

# Sollentuna (186 associations)
npx tsx scraping/scripts/generic_fri_scrape.ts Sollentuna https://boka.sollentuna.se/forening/

# Järfälla (131 associations)
npx tsx scraping/scripts/generic_fri_scrape.ts Järfälla https://jarfalla.fri-go.se/forening/
```

---

## Tested Municipalities

The following municipalities have been successfully scraped and validated:

| Municipality | Associations | Pages | Contact Rate | Address Rate | Notes |
|-------------|--------------|-------|--------------|--------------|-------|
| **Halmstad** | **494** 🏆 | **33** | 99.2% | **99.4%** 🏆 | Largest registry |
| Sollentuna | 186 | 13 | 98.9% | 98.4% | English UI |
| Laholm | 155 | 11 | **100%** 🏆 | 94.8% | Perfect contacts |
| Arboga | 140 | 10 | 85.7% | **100%** 🏆 | Perfect addresses |
| Bromölla | 139 | 10 | 99.3% | 99.3% | High activity diversity (166 types) |
| Järfälla | 131 | 9 | 90.1% | 96.9% | English UI |
| Årjäng | 111 | 8 | **100%** 🏆 | 99.1% | Perfect contacts |
| Askersund | 45 | 3 | - | - | Small registry |
| Forshaga | 39 | 3 | 97.4% | 94.9% | Smallest tested |

**Data Quality Summary:**
- Average contact extraction: 96.5%
- Average address extraction: 97.5%
- Organization numbers: Not available (FRI platform limitation)

---

## File Naming Standard

All output files follow the naming standard from AGENTS.md:

**Format:** `<municipality>_<SOURCE_SYSTEM>_YYYY-MM-DD_HH-MM.json`

**Examples:**
- `Halmstad_FRI_2025-10-26_14-30.json`
- `Sollentuna_FRI_2025-10-26_15-45.json`

**Log files:**
- `scraping/logs/{municipality}.log` (appends to same file across runs)

---

## Troubleshooting

### Database Connection Issues
If you see "Can't reach database server":
1. Check Docker: `docker ps | grep mysql`
2. Verify port 3316 is running
3. Check `.env` file: `DATABASE_URL` should use port 3316

### Import Failures
If imports fail:
1. Ensure database schema is up to date: `cd crm-app && npx prisma db push`
2. Check JSON file format matches standard
3. Review log files for validation errors

### Scraping Timeouts
Some municipalities may timeout on slow networks:
- Default timeout: 60 seconds per detail page
- Check `scraping/logs/{municipality}.log` for error details
- Re-run specific municipality with generic scraper

---

## FRI Platform Characteristics

**Common features across all FRI municipalities:**
- **Pagination:** "Sida X/Y" (Swedish) or "Page X/Y" (English)
- **Table structure:** 3 tables per detail page
  - Table 0 (Left): Association info
  - Table 1 (Right): Contact person
  - Table 2: "Övrig information"
- **Contact extraction:** From labeled rows (Hem/Home, Arbete/Work, Mobil/Mobile)
- **Address parsing:** Comma-separated format "Street, Postal Code, City"
- **Phone priority:** Mobile > Work > Home

**Platform limitations:**
- ❌ Organization numbers rarely available
- ✅ Excellent contact data quality
- ✅ Excellent address data quality
- ✅ Well-structured metadata

---

## Next Steps

After successful scraping and import:

1. **Verify data in database:**
   ```cmd
   cd crm-app
   npx prisma studio
   ```

2. **Check import summary:**
   ```cmd
   cat scraping/json/bulk_fri_scrape_summary_YYYY-MM-DD.json
   ```

3. **Review logs for any issues:**
   ```cmd
   ls scraping/logs/
   ```

---

## Support

For issues or questions:
- Check documentation: `scraping/docs/FRI_SCRAPING_GUIDES.md`
- Review lessons learned: `scraping/docs/lessons/lessons_fri.md`
- See AGENTS.md for system rules and standards
