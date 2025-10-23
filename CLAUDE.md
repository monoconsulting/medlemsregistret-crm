# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CRM system (MEDLEMSREGISTRET - CRM) built on NocoBase, a no-code/low-code platform. The system runs in Docker containers with PostgreSQL databases and includes Playwright for end-to-end testing.

## Architecture

### Docker Stack
The project uses Docker Compose with the following services:
- **app**: NocoBase application (port 13060)
- **postgres**: Main PostgreSQL 16 database (port 15432)
- **pgvector**: Separate PostgreSQL 16 with pgvector extension for vector queries (port 25432)
- **pgadmin**: Web UI for database administration (port 13001)

All data is persisted in `./storage/*` directories on the host.

### Database Configuration
- Main database: `nocobase` user/password/database
- Vector database: `vector` user, `vector_pwd` password, `vectordb` database
- Timezone: Europe/Stockholm
- WAL level: logical (for replication support)

### NocoBase Setup
- Image: `nocobase/nocobase:latest-full` (includes PostgreSQL client, MySQL client, Oracle client, and LibreOffice for PDF printing)
- App Key: `WobbaWobbaBuffBuffBuff000` (change in production)
- Storage: `./storage/app` mounted to `/app/nocobase/storage`
- Initial login: `admin@nocobase.com` / `admin123`

## Common Commands

### Docker Operations
```bash
# Start all services
mcrm_compose_up.bat      # Windows
docker compose up -d     # Cross-platform

# Stop all services
mcrm_compose_down.bat    # Windows
docker compose down      # Cross-platform

# View logs
docker compose logs app
docker compose logs postgres
docker compose logs pgvector

# Restart a service
docker compose restart app
```

### Testing
```bash
# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui

# Generate tests interactively
playwright_codegen.bat [URL]
# Default URL: http://localhost:13060
# Example: playwright_codegen.bat http://localhost:13060

# Show test report
npx playwright show-report web/test-results/html
```

### Web Scraping (Association Registries)
```bash
# Run Sollentuna scraper (FRI platform)
npx tsx scraping/sollentuna_scrape.ts
# Or use the batch file:
scraping/run_sollentuna.bat

# Output location: scraping/out/
# - {municipality}_associations_{run_id}_YYYY-MM-DD_HH-MM.jsonl (newline-delimited JSON)
# - {municipality}_associations_{run_id}_YYYY-MM-DD_HH-MM.json (pretty formatted)
# - {municipality}.log (execution log with stats)
```

### Playwright Configuration
- Test directory: `./web/tests`
- Base URL: `http://localhost:13060`
- Viewport: 3440x1440 (ultrawide, headless: false)
- Artifacts location:
  - Test artifacts: `web/test-results/_artifacts`
  - HTML report: `web/test-results/html`
  - Snapshots: `web/test-results/media/snapshots`
  - Videos: `web/test-results/media/video`
- Video recording: Always on
- Trace: Always on
- Screenshots: Always on

## Development Notes

### Security Considerations
- All default passwords (APP_KEY, database passwords, pgAdmin credentials) must be changed in production
- pgAdmin credentials: `admin@example.com` / `supersecret`
- Database credentials are stored in `docker-compose.yml` environment variables

### Accessing Services
- NocoBase UI: http://localhost:13060
- pgAdmin: http://localhost:13001
- Main PostgreSQL: localhost:15432
- pgvector PostgreSQL: localhost:25432

### File Structure
- `docker-compose.yml`: Service definitions and configuration
- `instructions.md`: NocoBase installation and upgrade documentation
- `playwright.config.ts`: Playwright test configuration
- `playwright_codegen.bat`: Helper script to generate tests interactively
- `storage/`: All persistent data (databases, app files, pgAdmin config)
- `scraping/`: Web scraping scripts for Swedish municipal association registries
  - `sollentuna_scrape.ts`: FRI platform scraper (Sollentuna)
  - `out/`: Scraped data output (JSONL, JSON, logs)
  - `docs/CRM_SCRAPING_INSTRUCTIONS.md`: Detailed scraping schema and requirements

### NocoBase Version Management
- Current: `latest-full`
- Available tags: `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, or specific versions like `1.7.14-full`
- Images can only be upgraded, not downgraded
- After upgrading NocoBase, independent plugins may also need upgrading

## Web Scraping Architecture

### Supported Platforms
The scraping system targets three Swedish municipal association registry platforms:

1. **FRI Webb-Förening** (e.g., Sollentuna, Halmstad)
   - Pagination: "Page X/Y" with "Next/Last" controls
   - List columns: Name, Type of association, Activity, Homepage
   - Detail pages accessed via name link

2. **Actor Smartbook** (e.g., Alingsås, Älvdalen) - Not yet implemented
   - Pagination: "Första/Förra/Nästa/Sista" controls
   - Detail overlays with Org.nr, Email, Website, City
   - Contact persons table with Name, Email, Mobile, Role

3. **Rbok** (e.g., Karlstad) - Not yet implemented
   - Pagination: "Go to the next page" controls
   - List columns: Name, Type, Homepage

### Data Schema
All scrapers output standardized JSON records with:
- `source_system`: Platform identifier (FRI, ActorSmartbook, Rbok)
- `municipality`: Swedish municipality name
- `scrape_run_id`: UUID for the scrape run
- `scraped_at`: ISO 8601 timestamp (UTC)
- `association`: Name, org_number, types, activities, categories, contact info, URLs
- `contacts`: Array of contact persons (name, role, email, phone)
- `source_navigation`: Pagination metadata (page index, position, pagination model)
- `extras`: Platform-specific additional fields

See `docs/CRM_SCRAPING_INSTRUCTIONS.md` for complete schema specification.

### Scraper Design Principles
- Full pagination coverage (visit all pages until "Next" is disabled)
- Visit every association's detail page to extract complete information
- Robust error handling with retries (max 2 attempts)
- Rate limiting with randomized delays (200-600ms)
- Normalize data (trim whitespace, deduplicate case-insensitively, null for missing)
- Never guess or invent data - missing fields are explicitly `null`
- Use stable selectors (prefer role-based or text-based over CSS classes)
- Comprehensive logging with stats (total records, missing fields, domains seen)

## Important Constraints

- NEVER use mock data or hardcoded data (forbidden per user instructions)
- Current time context: October 2025
- Timezone: Europe/Stockholm (UTC+2)
