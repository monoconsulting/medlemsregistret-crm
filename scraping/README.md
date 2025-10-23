# Association Registry Scraper

This directory contains Playwright scripts for scraping Swedish municipal association registries.

## Sollentuna Scraper

Scrapes the Sollentuna municipality association registry (FRI Webb-Förening platform).

### Usage

```bash
# Run the scraper
npx tsx scraping/sollentuna_scrape.ts

# Or with ts-node
npx ts-node scraping/sollentuna_scrape.ts
```

### Output

The scraper produces three files in `scraping/out/`:

1. **JSONL file**: `Sollentuna_associations_{run_id}.jsonl` - One JSON record per line
2. **Pretty JSON**: `Sollentuna_associations_{run_id}.json` - Formatted JSON array
3. **Log file**: `Sollentuna.log` - Detailed execution log with summary statistics

### Features

- Full pagination support (navigates through all pages using "Next" button)
- Visits each association's detail page to extract additional information
- Robust error handling with retries
- Rate limiting with random delays (200-600ms between requests)
- Comprehensive logging
- Normalized data output following the standard schema

### Data Schema

Each record contains:

- `source_system`: "FRI"
- `municipality`: "Sollentuna"
- `scrape_run_id`: UUID for this scrape run
- `scraped_at`: ISO 8601 timestamp
- `association`: Name, types, activities, homepage, contact info, etc.
- `contacts`: Array of contact persons
- `source_navigation`: Pagination metadata
- `extras`: Platform-specific fields

See `docs/CRM_SCRAPING_INSTRUCTIONS.md` for the complete schema specification.

### Platform Details

**FRI Webb-Förening** (Sollentuna):
- List columns: Name, Type of association, Activity, Homepage
- Pagination: "Page X/Y" display with "Next/Last" controls
- Detail pages: Accessed by clicking association name

### Requirements

- Node.js
- Playwright
- TypeScript/tsx or ts-node
