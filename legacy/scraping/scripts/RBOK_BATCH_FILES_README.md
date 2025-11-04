# RBOK Batch Files README

Quick reference for RBOK scraping batch files.

## Available Batch Files

### 1. `rbok_test_scrape.bat`
**Test scraping on a single municipality**

- **Purpose:** Test RBOK scraping functionality on Söderhamn municipality
- **Output:** `scraping/json/` and `scraping/logs/`
- **Duration:** ~5-15 minutes (depends on number of associations)
- **Safe:** Does not modify database

**Use when:**
- Testing scraping logic for the first time
- Verifying scraper works correctly after changes
- Quick validation before running full scrape

### 2. `rbok_scrape.bat`
**Scrape all RBOK municipalities to JSON**

- **Purpose:** Generate JSON files from all 53 RBOK municipalities
- **Output:** `scraping/json/` and `scraping/logs/`
- **Duration:** Several hours (estimated 3-8 hours depending on data volume)
- **Safe:** Does not modify database

**Use when:**
- You want to collect fresh data
- You want to review data before importing
- You're testing scraping logic
- Running scheduled data collection

**Important notes:**
- RBOK scraping uses Playwright with modal interactions for each association
- Significantly slower than API-based scraping (IBGO, Actor)
- Browser runs in non-headless mode to handle modals correctly
- Respects delays between requests to be considerate to municipality servers

### 3. `rbok_import.bat`
**Import JSON files to database**

- **Purpose:** Import all RBOK JSON files to MySQL database
- **Input:** Reads from `scraping/json/`
- **Duration:** ~5-10 minutes (depends on number of associations)
- **⚠️ Modifies database**

**Use when:**
- You have scraped JSON files ready
- You want to update database with latest data
- You're running imports separately from scraping

### 4. `rbok_scrape_and_import.bat`
**Combined: Scrape then Import**

- **Purpose:** Full pipeline - scrape all municipalities and import immediately
- **Duration:** Several hours total (scraping + import time)
- **⚠️ Modifies database**

**Use when:**
- You want a complete data refresh
- You're running scheduled updates
- You want one-command execution

## Quick Start

### First Time Setup

1. **Verify database connection**:
   ```bash
   # Check MySQL is running on port 3316
   docker ps | grep mysql
   ```

2. **Verify municipalities in database**:
   ```bash
   cd crm-app
   DATABASE_URL="mysql://crm_user:crm_password_change_me@localhost:3316/crm_db" npx tsx -e "
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   prisma.municipality.count({ where: { platform: 'RBOK' } })
     .then(count => console.log('RBOK municipalities:', count))
     .finally(() => prisma.\$disconnect());
   "
   ```
   Should show 53 municipalities.

3. **Test with one municipality**:
   ```bash
   cd E:\projects\CRM
   scraping\scripts\rbok_test_scrape.bat
   ```

### Run Full Scraping

Double-click: `scraping\scripts\rbok_scrape_and_import.bat`

Or manually:
```bash
cd E:\projects\CRM
scraping\scripts\rbok_scrape_and_import.bat
```

## File Locations

```
E:\projects\CRM\
├── crm-app\
│   └── scripts\
│       ├── bulk_rbok_scrape.ts                # TypeScript bulk scraper
│       ├── bulk_rbok_import.ts                # TypeScript importer
│       └── bulk_rbok_scrape_and_import.ts     # Combined
├── scraping\
│   ├── json\                                  # OUTPUT: JSON files
│   │   ├── Söderhamn_RBOK_*.json
│   │   ├── Umeå_RBOK_*.json
│   │   └── bulk_rbok_scrape_summary_*.json
│   ├── logs\                                  # OUTPUT: Log files
│   │   ├── Söderhamn.log
│   │   └── ...
│   ├── scripts\
│   │   ├── rbok_test_scrape.bat              # ← Batch file 1 (test)
│   │   ├── rbok_scrape.bat                   # ← Batch file 2 (scrape)
│   │   ├── rbok_import.bat                   # ← Batch file 3 (import)
│   │   └── rbok_scrape_and_import.bat        # ← Batch file 4 (combined)
│   └── docs\
│       ├── RBOK_SCRAPING_GUIDES.md           # Scraping guide
│       └── JSON_STANDARD.md                  # Data format standard
```

## Expected Results

### Scraping Output
```
Municipality                 | Total | Scraped | Missing Org | Missing Email | Missing Phone | With Contacts | Errors | Duration
------------------------------|-------|---------|-------------|---------------|---------------|---------------|--------|----------
Älmhult                      |    45 |      45 |          30 |            10 |            15 |            20 |      0 |   650.2s
Alvesta                      |    67 |      67 |          45 |            15 |            20 |            30 |      0 |   980.5s
...
TOTAL                         |  2500 |    2500 |               |               |               |               |      0 | 18000.0s
```

### Import Output
```
Municipality                 | Records | Imported | Updated | Errors
------------------------------|---------|----------|---------|--------
Älmhult                      |      45 |       45 |       0 |      0
Alvesta                      |      67 |       67 |       0 |      0
...
TOTAL                         |    2500 |     2500 |       0 |      0
```

## Data Format

All JSON files follow [JSON_STANDARD.md](../docs/JSON_STANDARD.md):

- ✅ `source_system`: "RBOK"
- ✅ `municipality`: Municipality name
- ✅ `association`: Core data (name, address, contact, etc.)
- ✅ `contacts`: Contact persons array
- ✅ `source_navigation`: Pagination metadata
- ✅ `extras`: RBOK-specific fields (target_groups, etc.)

## Municipalities Covered

**53 municipalities** with RBOK platform:

Älmhult, Alvesta, Älvkarleby, Ängelholm, Arvidsjaur, Enköping, Eslöv, Gagnef, Götene, Habo, Haparanda, Härryda, Heby, Helsingborg, Herrljunga, Hjo, Högsby, Kalmar, Karlskoga, Karlstad, Kil, Klippan, Kristianstad, Landskrona, Lerum, Lindesberg, Lomma, Luleå, Lund, Malmö, Mörbylånga, Mullsjö, Nacka, Nora, Norrtälje, Nyköping, Nykvarn, Salem, Söderhamn, Staffanstorp, Stenungsund, Tibro, Tidaholm, Tierp, Tjörn, Trelleborg, Tyresö, Uddevalla, Umeå, Vaggeryd, Vallentuna, Värmdo, Västervik, Växjö, Vellinge

**Estimated total associations**: 2,000-3,000 (varies by municipality)

## Performance Notes

### RBOK vs Other Platforms

RBOK scraping is significantly slower than API-based platforms:

| Platform | Method | Speed | Typical Duration |
|----------|--------|-------|------------------|
| IBGO | REST API | Fast | ~5 minutes (31 municipalities) |
| Actor | REST API | Fast | ~20 minutes (22 municipalities) |
| **RBOK** | **Playwright + Modals** | **Slow** | **3-8 hours (53 municipalities)** |
| FRI | Playwright | Medium | ~30-60 minutes (9 municipalities) |

### Why is RBOK slower?

1. **Modal interactions**: Each association requires:
   - Click "Show more information" link
   - Wait for modal to open
   - Extract data from modal
   - Close modal
   - Wait for modal to close

2. **Sequential processing**: Cannot parallelize due to modal interactions

3. **Pagination**: Must navigate through multiple pages with delays

4. **Politeness delays**: Respects server load with delays between requests

### Performance Optimization

The scraper includes:
- Reused browser context across municipalities (faster than relaunching)
- Optimized delays (200-600ms, not excessive)
- Batch processing within pages
- Efficient DOM queries

## Troubleshooting

### Batch file doesn't run
- Right-click → "Run as Administrator"
- Check file path (no spaces causing issues)
- Verify Node.js is installed: `node --version`

### "Cannot find module"
```bash
cd E:\projects\CRM\crm-app
npm install
```

### "Cannot reach database"
1. Start MySQL Docker container
2. Verify port 3316 in `.env` file
3. Check credentials: `crm_user:crm_password_change_me`

### "No JSON files found" (import)
- Run `rbok_scrape.bat` first before `rbok_import.bat`
- Check `scraping/json/` directory exists
- Verify scraping completed successfully

### Browser crashes or hangs
- RBOK scraping runs in non-headless mode
- If browser hangs, close it manually and restart script
- Check logs in `scraping/logs/` for error details

### Scraping is too slow
- This is expected for RBOK platform
- Consider running overnight or during off-hours
- Cannot be significantly optimized due to modal interactions

## Best Practices

1. **Run during off-hours** - Be respectful to municipality servers
2. **Review logs** - Check `scraping/logs/` for warnings
3. **Backup database** - Before first import
4. **Test incrementally** - Run `rbok_test_scrape.bat` first
5. **Monitor disk space** - JSON files can be large
6. **Plan for time** - RBOK scraping takes several hours
7. **Don't interrupt** - Let scraping complete fully for best results

## Common Issues

### Modal doesn't close properly
- The scraper tries multiple methods: Stäng button, Close button, Escape key
- If modals accumulate, the scraper will attempt to close them
- Check logs for "Error closing modal" warnings

### Missing data in JSON
- RBOK modals have varying structures
- Some municipalities may not provide all fields
- Check individual municipality logs for extraction warnings

### Import fails for specific municipality
- Municipality name must exactly match database record
- Check municipality name spelling in JSON file
- Verify municipality exists in database with: `SELECT * FROM Municipality WHERE platform = 'RBOK';`

## Support Files

- **Scraping Guide:** [RBOK_SCRAPING_GUIDES.md](../docs/RBOK_SCRAPING_GUIDES.md)
- **JSON Standard:** [JSON_STANDARD.md](../docs/JSON_STANDARD.md)
- **Individual scraper example:** `scraping/scripts/soderhamn_scrape.ts`

## Example: Full Workflow

```bash
# 1. Verify setup
cd E:\projects\CRM\crm-app
npm install

# 2. Check database connection
docker ps | grep mysql

# 3. Test with one municipality
cd ..
scraping\scripts\rbok_test_scrape.bat

# 4. Review test results
# Check scraping/json/ for Söderhamn output
# Check scraping/logs/Söderhamn.log for details

# 5. If test successful, run full scrape and import
scraping\scripts\rbok_scrape_and_import.bat

# 6. Verify results
# Check scraping/json/ for all output files
# Check scraping/logs/ for detailed logs
# Check database for imported records
```

## Notes

- All scripts use environment variables from `crm-app/.env`
- DATABASE_URL is read from environment (defaults to localhost:3316)
- Scripts are idempotent - safe to run multiple times
- Upsert logic prevents duplicates (based on `detail_url`)
- Browser runs in non-headless mode for RBOK (required for modal interactions)
- Scraping respects delays to avoid overwhelming municipality servers

## Comparison with Other Platforms

| Feature | RBOK | IBGO | Actor | FRI |
|---------|------|------|-------|-----|
| Platform Type | Web UI | REST API | REST API | Web UI |
| Scraping Method | Playwright + Modals | HTTP Fetch | HTTP Fetch | Playwright |
| Speed | Slow | Fast | Fast | Medium |
| Data Quality | Good | Excellent | Excellent | Good |
| Org Numbers | Sometimes | No | No | Yes |
| Email | Sometimes | Yes | Yes | Yes |
| Contacts | Sometimes | Yes | Yes | Yes |
| Municipalities | 53 | 31 | 22 | 9 |
| Total Associations | ~2,500 | ~7,000 | ~3,400 | ~1,200 |
