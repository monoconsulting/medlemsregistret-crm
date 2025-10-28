# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
## Rules
**NEVER CHANGE PORTS!**
NEVER TASKKILL!
ALWAYS READ INSTRUCTED FILES!
* Mock data in the system are **not allowed.** This can not be used without a specific order to implement it
* **SQLLite can never be used.** You have no permissions to use this. 
* Test **must** be performed exactly as stated in @docs/TEST_RULES.md
* You are **never allowed to change port** or assign a new port to something that is not working.  You MUST ask permission
* You have **NO PERMISSIONS to use taskkill** to kill a port that someone else is using. This can cause serious damage
* You **ARE NOT ALLOWED TO EDIT THE FOLLOWING FILES WITHOUT PERMISSION**
  * **docker-compose - files**
  * **.env-files**
  * **playwright.config.ts-files**
* You are **NOT ALLOWED to change ports.** If the port are busy or not working you must:
  * Check the docker-compose-files and .env - is the right port used?
  * Check docker ps - what is running on the port. **BUT DONT KILL THE SERVICE**
* Only soft delete in database!
This is a CRM system for managing Swedish municipal association registries. The project has two main components:
1. **Web scraping framework** (`/scraping`) - Playwright-based scrapers for collecting association data from multiple Swedish municipalities
2. **CRM application** (`/crm-app`) - Next.js 15 web application for managing and analyzing scraped association data

## Development Commands

### CRM Application (crm-app/)
```bash
# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database
```

### Web Scraping (scraping/)

#### Individual Municipality Scrapers
```bash
# Run a specific municipality scraper
npx tsx scraping/<municipality>_scrape.ts

# Examples:
npx tsx scraping/sollentuna_scrape.ts
npx tsx scraping/arjang_scrape.ts
npx tsx scraping/karlstad_scrape.ts
```

#### Actor Smartbook Bulk Automation (Windows Batch Files)
```bash
# Test scraping (Gnosjö - 72 associations, ~30 seconds)
scraping/scripts/actor_test_scrape.bat

# Full process (scrape all 22 municipalities + import to database)
scraping/scripts/actor_scrape_and_import.bat

# Scraping only (saves JSON files to scraping/json/)
scraping/scripts/actor_scrape.bat

# Import only (imports all JSON files from scraping/json/)
scraping/scripts/actor_import.bat
```

**Performance**: Bulk scraping of 12 municipalities took 23.38 minutes with 99.6% import success rate (3,413 of 3,425 associations).

#### IBGO (Interbook Go) Bulk Automation (Windows Batch Files)
```bash
# Full process (scrape all 31 municipalities + import to database)
scraping/scripts/ibgo_scrape_and_import.bat

# Scraping only (saves JSON files to scraping/json/)
scraping/scripts/ibgo_scrape.bat

# Import only (imports all JSON files from scraping/json/)
scraping/scripts/ibgo_import.bat
```

**Performance**: Bulk scraping of 31 municipalities completed in ~5 minutes with 99.98% import success rate (10,000+ associations).

**Output locations**:
- JSON files: `scraping/json/`
- Log files: `scraping/logs/`
- Summary: `scraping/json/bulk_ibgo_scrape_summary_YYYY-MM-DD.json`

## Architecture

### CRM Application (crm-app/)

**Tech Stack:**
- **Framework:** Next.js 15 (App Router) with TypeScript
- **Database:** MySQL with Prisma ORM
- **UI:** Shadcn/ui components + Tailwind CSS
- **State Management:** TanStack Query (React Query v5) for server state, Zustand for UI state
- **Forms:** React Hook Form + Zod validation
- **API:** tRPC for type-safe APIs (planned)

**Directory Structure:**
- `app/` - Next.js 15 App Router pages and layouts
  - `(dashboard)/` - Dashboard layout with sidebar navigation
  - `layout.tsx` - Root layout
- `components/` - React components
  - `layout/` - Layout components (Sidebar, Header)
  - `ui/` - Shadcn/ui components
- `prisma/` - Database schema and migrations
- `lib/` - Utility functions

**Database Schema:**
The Prisma schema in `crm-app/prisma/schema.prisma` defines the data model:
- `Association` - Core entity storing scraped association data with CRM fields (status, pipeline, assigned user)
- `Contact` - Contact persons for associations
- `Note` - CRM notes on associations
- `Tag` - Tags for categorization
- `Group` - Custom groupings of associations
- `Activity` - Activity log for tracking interactions
- `ScrapeRun` - Metadata about scraping runs

### Web Scraping Framework (scraping/)

**Architecture:**
The scrapers follow a common pattern but are adapted for different platforms:

**Platform Types:**
1. **FRI Webb-Förening** - Municipalities: Sollentuna, Årjäng, Järfälla, Laholm, Halmstad, Forshaga, Båstad, Bromölla, Askersund
2. **RBOK** - Municipalities: Söderhamn
3. **IBGO (Interbook Go)** - 31 verified municipalities with REST API endpoints. **NO PAGINATION** - single API call returns all data. Bulk automation implemented. 10,000+ associations scraped with 99.98% import success rate. ⚠️ **Email concatenation handled** - splits comma-separated emails into contacts. ❌ **NO organization numbers** available from API.
4. **ActorSmartbook** - 22 verified municipalities with REST API endpoints (paginated). Bulk automation implemented. 12 municipalities scraped (Alingsås, Älvdalen, Boden, Bollnäs, Borås, Falun, Hedemora, Kiruna, Mora, Sandviken, Sollefteå, Sundsvall) with 3,425 associations found and 3,413 imported (99.6% success rate). ⚠️ **Email concatenation handled**.

**Common Pattern:**
Each scraper follows this structure:
1. Initialize browser with Playwright (or use REST API if available)
2. Navigate to association list page
3. Paginate through all list pages
4. For each association:
   - Extract list-level data
   - Navigate to detail page (or fetch via API)
   - Extract detailed information (contact, address, description)
   - Normalize and structure data
5. Output to Pretty JSON array only (saved to `scraping/json/`)
6. Generate log files with statistics (saved to `scraping/logs/`)

**Data Schema:**
Each association record follows a standardized schema (see `docs/JSON_STANDARD.md`):
- `source_system` - Platform type (FRI, RBOK, IBGO, ActorSmartbook)
- `municipality` - Municipality name
- `association` - Core fields (name, org_number, types, activities, contact info)
  - `description` - Object with `free_text` and `sections[]` array
    - `sections[].title` - Section heading (not `label`)
    - `sections[].data` - Object with normalized snake_case keys (not `items[]` array)
- `contacts` - Array of contact persons
- `source_navigation` - Pagination metadata
- `extras` - Platform-specific fields

**Output Files (Current Format - October 2025):**
Scrapers generate files in `scraping/json/`:
- `{municipality}_{SOURCE_SYSTEM}_{YYYY-MM-DD}_{HH-MM}.json` - Pretty-printed JSON array only (JSONL not used anymore)
- `{municipality}.log` - Execution log (appends to same file in `scraping/logs/`)

**Examples:**
- `scraping/json/ale_IBGO_2025-10-26_14-30.json`
- `scraping/json/Årjäng_FRI_2025-10-27_06-20.json`
- `scraping/json/falun_ActorSmartbook_2025-10-26_12-04.json`
- `scraping/logs/ale.log`

**Important**:
- Filename includes source system to prevent cross-contamination during imports
- Files overwrite previous versions (not versioned)
- Importers read only the latest file based on filename
- Only Pretty JSON format is generated (not JSONL)

## Important Scraping Guidelines

### Critical Rules (from user's CLAUDE.md):
1. **ABSOLUTELY NO MOCK DATA** - Never create fake or placeholder data
2. **NO HARDCODING** - All data must come from actual scraping
3. **Swedish Values** - Preserve original Swedish text; do not translate
4. **Scope Properly** - Only extract data from main content areas, exclude headers/footers/navigation

### Platform-Specific Guides:
- **FRI scrapers:** See `docs/FRI_SCRAPING_GUIDES.md` for detailed extraction rules
- **RBOK scrapers:** See `docs/RBOK_SCRAPING_GUIDES.md` (placeholder exists)
- **IBGO scrapers:** See `docs/IBGO_SCRAPING_GUIDES.md` - REST API, email concatenation handling
- **ActorSmartbook:** See `docs/ACTORS_SMARTBOOK_SCRAPING_GUIDES.md` - REST API, email concatenation handling

### Field Extraction Priority:
1. Parse structured data from tables (FRI platforms use two-column tables)
2. Map known labels to standard fields (see label normalization in docs)
3. Preserve all original data in `description.sections[*].data`
4. Extract free text only from main content areas
5. Handle missing values as `null` (never guess or fill with defaults)
6. **⚠️ Handle concatenated emails** - For IBGO and Actor Smartbook, split comma-separated emails into separate contact records

## Key Documentation Files

### Scraping Documentation
- `docs/JSON_STANDARD.md` - JSON output standard for all scrapers
- `docs/FRI_SCRAPING_GUIDES.md` - FRI platform extraction rules (address parsing, contact extraction)
- `docs/IBGO_SCRAPING_GUIDES.md` - IBGO REST API scraping guide (email concatenation, no org numbers)
- `docs/ACTORS_SMARTBOOK_SCRAPING_GUIDES.md` - Actor Smartbook REST API guide
- `docs/RBOK_SCRAPING_GUIDES.md` - RBOK platform guide (WIP)
- `docs/lessons/*.md` - System-specific lessons learned (lessons_ibgo.md, lessons_actor.md, etc.)

### CRM Documentation
- `CRM_IMPLEMENTATION_*.md` - CRM feature specifications and design docs

### Agent Instructions
- `AGENTS.md` - Instructions and rules for all agents
- `CLAUDE.md` - This file - Claude Code specific instructions

## Database Setup

The CRM application uses MySQL. Configure the connection in `crm-app/.env`:
```
DATABASE_URL="mysql://user:password@localhost:3306/crm_database"
```

After configuring:
```bash
cd crm-app
npm run db:push      # Create/update database schema
npm run db:studio    # Inspect database visually
```

## NocoBase Alternative Stack

The `instructions.md` file contains Docker Compose configuration for an alternative NocoBase-based stack with PostgreSQL + pgvector. This is reference documentation for a different deployment approach.

## Testing Approach

Currently no automated test suite exists. When developing scrapers:
1. Run against live municipality sites
2. Verify output JSON structure matches schema
3. Check log files for missing data warnings
4. Validate data completeness (org numbers, contacts, addresses)

## Common Development Tasks

### Adding a New Municipality Scraper:
1. Identify the platform type (FRI/RBOK/ActorSmartbook)
2. Create `scraping/{municipality}_scrape.ts` based on existing scraper for that platform
3. Update constants: BASE_URL, MUNICIPALITY, SOURCE_SYSTEM
4. Adapt selectors if needed (different municipalities may have slight variations)
5. Test thoroughly and check logs for data quality

### Importing Scraped Data to Database:
Use the import script template in `scraping/out/import_to_db.ts` as a starting point.

### Adding New CRM Features:
1. Update Prisma schema in `crm-app/prisma/schema.prisma`
2. Run `npm run db:push` to update database
3. Implement UI in `crm-app/app/(dashboard)/`
4. Follow existing patterns for components and state management

## Current State (October 2025)

- Multiple municipality scrapers implemented and working
- CRM application scaffolded with basic layout and components
- Database schema defined but application features not yet fully implemented
- Scraped data exists in `scraping/out/` directory
- Next steps involve connecting scraped data to the CRM interface
