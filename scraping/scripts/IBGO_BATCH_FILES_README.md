# IBGO Batch Files README

Quick reference for IBGO scraping batch files.

## Available Batch Files

### 1. `ibgo_scrape.bat`
**Scrape all IBGO municipalities to JSON**

- **Purpose:** Generate JSON files from all 31 IBGO municipalities
- **Output:** `scraping/json/` and `scraping/logs/`
- **Duration:** ~2-5 minutes
- **Safe:** Does not modify database

**Use when:**
- You want to collect fresh data
- You want to review data before importing
- You're testing scraping logic

### 2. `ibgo_import.bat`
**Import JSON files to database**

- **Purpose:** Import all IBGO JSON files to MySQL database
- **Input:** Reads from `scraping/json/`
- **Duration:** ~1-3 minutes
- **⚠️ Modifies database**

**Use when:**
- You have scraped JSON files ready
- You want to update database with latest data
- You're running imports separately from scraping

### 3. `ibgo_scrape_and_import.bat`
**Combined: Scrape then Import**

- **Purpose:** Full pipeline - scrape all municipalities and import immediately
- **Duration:** ~3-8 minutes total
- **⚠️ Modifies database**

**Use when:**
- You want a complete data refresh
- You're running scheduled updates
- You want one-command execution

## Quick Start

### First Time Setup

1. **Verify endpoints are configured** (already done):
   ```bash
   # Check database has IBGO endpoints
   cd crm-app
   DATABASE_URL="..." npx tsx ../scraping/scripts/list_ibgo_municipalities.ts
   ```
   Should show 31 municipalities.

2. **Test with one municipality** (optional):
   ```bash
   # Test Ale municipality
   curl https://ale.ibgo.se/APIAssociationRegister/GetAssociationsList/
   ```

### Run Full Scraping

Double-click: `scraping\scripts\ibgo_scrape_and_import.bat`

Or manually:
```bash
cd E:\projects\CRM
scraping\scripts\ibgo_scrape_and_import.bat
```

## File Locations

```
E:\projects\CRM\
├── crm-app\
│   └── scripts\
│       ├── bulk_ibgo_scrape.ts          # TypeScript scraper
│       ├── bulk_ibgo_import.ts          # TypeScript importer
│       └── bulk_ibgo_scrape_and_import.ts   # Combined
├── scraping\
│   ├── json\                            # OUTPUT: JSON files
│   │   ├── ale_associations_*.json
│   │   ├── ale_associations_*.jsonl
│   │   └── bulk_ibgo_scrape_summary_*.json
│   ├── logs\                            # OUTPUT: Log files
│   │   ├── ale.log
│   │   └── ...
│   ├── scripts\
│   │   ├── ibgo_scrape.bat             # ← Batch file 1
│   │   ├── ibgo_import.bat             # ← Batch file 2
│   │   └── ibgo_scrape_and_import.bat  # ← Batch file 3
│   └── docs\
│       ├── IBGO_SCRAPING_USAGE.md      # Detailed usage guide
│       └── JSON_STANDARD.md            # Data format standard
```

## Expected Results

### Scraping Output
```
Municipality                 | Total | Scraped | Missing Email | Missing Phone | With Contacts | Errors | Duration
------------------------------|-------|---------|---------------|---------------|---------------|--------|----------
Ale                          |   187 |     187 |            15 |            45 |            65 |      0 |     2.3s
Älvsbyn                      |    95 |      95 |             8 |            20 |            30 |      0 |     1.5s
...
TOTAL                         |  6981 |    6981 |               |               |               |      0 |   245.7s
```

### Import Output
```
Municipality                 | Records | Imported | Updated | Errors
------------------------------|---------|----------|---------|--------
Ale                          |     187 |      187 |       0 |      0
Älvsbyn                      |      95 |       95 |       0 |      0
...
TOTAL                         |    6981 |     6981 |       0 |      0
```

## Data Format

All JSON files follow [MUNICIPAL_ASSOCIATION_JSON_STANDARD.md](../docs/JSON_STANDARD.md):

- ✅ `source_system`: "IBGO"
- ✅ `municipality`: Municipality name
- ✅ `association`: Core data (name, address, contact, etc.)
- ✅ `contacts`: Contact persons array
- ✅ `source_navigation`: Pagination metadata
- ✅ `extras`: IBGO-specific fields (ibgo_id, etc.)

## Municipalities Covered

**31 municipalities** with verified API endpoints:

Ale, Älvsbyn, Åmål, Ånge, Arvika, Åtvidaberg, Avesta, Bengtsfors, Borlänge, Botkyrka, Burlöv, Degerfors, Eda, Finspång, Gnesta, Gotland, Hammarö, Katrineholm, Kinda, Kristinehamn, Linköping, Ljusdal, Motala, Nybro, Örebro, Örnsköldsvik, Säffle, Skellefteå, Torsby, Trosa, Varberg

**~6,981 total associations** available

## Troubleshooting

### Batch file doesn't run
- Right-click → "Run as Administrator"
- Check file path (no spaces in directory names)
- Verify Node.js is installed: `node --version`

### "Cannot find module"
```bash
cd E:\projects\CRM\crm-app
npm install
```

### "Cannot reach database"
1. Start MySQL Docker container
2. Verify port 3316 in `.env` file
3. Check credentials

### "No JSON files found"
- Run `ibgo_scrape.bat` first before `ibgo_import.bat`
- Check `scraping/json/` directory exists
- Verify scraping completed successfully

## Performance Notes

- **Scraping:** ~300-500ms per municipality
- **Import:** ~50-100 associations per second
- **Total time:** 3-8 minutes for all 31 municipalities
- **Database load:** Moderate (uses transactions)

## Best Practices

1. **Run during off-hours** - Be respectful to municipality servers
2. **Review logs** - Check `scraping/logs/` for warnings
3. **Backup database** - Before first import
4. **Test incrementally** - Run one municipality first if unsure
5. **Monitor disk space** - JSON files can be large

## Support Files

- **Usage Guide:** [IBGO_SCRAPING_USAGE.md](../docs/IBGO_SCRAPING_USAGE.md)
- **Endpoint Verification:** [IBGO_ENDPOINT_VERIFICATION_SUMMARY.md](../docs/IBGO_ENDPOINT_VERIFICATION_SUMMARY.md)
- **JSON Standard:** [JSON_STANDARD.md](../docs/JSON_STANDARD.md)

## Example: Full Workflow

```bash
# 1. Verify setup
cd E:\projects\CRM\crm-app
npm install

# 2. Check database connection
docker ps | grep mysql

# 3. Run full scrape and import
cd ..
scraping\scripts\ibgo_scrape_and_import.bat

# 4. Verify results
# Check scraping/json/ for output files
# Check scraping/logs/ for detailed logs
# Check database for imported records
```

## Notes

- All scripts use environment variables from `crm-app/.env`
- DATABASE_URL is read from environment (defaults to localhost:3316)
- Scripts are idempotent - safe to run multiple times
- Upsert logic prevents duplicates (based on `detail_url`)
