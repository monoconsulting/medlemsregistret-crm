# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

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
```bash
# Run a specific municipality scraper
npx tsx scraping/<municipality>_scrape.ts

# Examples:
npx tsx scraping/sollentuna_scrape.ts
npx tsx scraping/arjang_scrape.ts
npx tsx scraping/karlstad_scrape.ts
```

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
3. **ActorSmartbook** - Municipalities: Gävle, Karlstad, Borås, Älvdalen

**Common Pattern:**
Each scraper follows this structure:
1. Initialize browser with Playwright
2. Navigate to association list page
3. Paginate through all list pages
4. For each association:
   - Extract list-level data
   - Navigate to detail page
   - Extract detailed information (contact, address, description)
   - Normalize and structure data
5. Output to JSONL (line-delimited JSON) and pretty JSON
6. Generate log files with statistics

**Data Schema:**
Each association record follows a standardized schema (see `docs/CRM_SCRAPING_INSTRUCTIONS_V.1.1.md`):
- `source_system` - Platform type (FRI, RBOK, ActorSmartbook)
- `municipality` - Municipality name
- `association` - Core fields (name, org_number, types, activities, contact info)
- `contacts` - Array of contact persons
- `description` - Structured sections + free text
- `source_navigation` - Pagination metadata
- `extras` - Platform-specific fields

**Output Files:**
Scrapers generate files in `scraping/out/`:
- `{municipality}_associations_{run_id}_{timestamp}.jsonl` - One JSON record per line
- `{municipality}_associations_{run_id}_{timestamp}.json` - Pretty-printed JSON array
- `{municipality}.log` - Execution log with statistics

## Important Scraping Guidelines

### Critical Rules (from user's CLAUDE.md):
1. **ABSOLUTELY NO MOCK DATA** - Never create fake or placeholder data
2. **NO HARDCODING** - All data must come from actual scraping
3. **Swedish Values** - Preserve original Swedish text; do not translate
4. **Scope Properly** - Only extract data from main content areas, exclude headers/footers/navigation

### Platform-Specific Guides:
- **FRI scrapers:** See `docs/FRI_SCRAPING_GUIDES.md` for detailed extraction rules
- **RBOK scrapers:** See `docs/RBOK_SCRAPING_GUIDES.md` (placeholder exists)
- **ActorSmartbook:** See `docs/ACTORS_SMARTBOOK_SCRAPING_GUIDES.md`

### Field Extraction Priority:
1. Parse structured data from tables (FRI platforms use two-column tables)
2. Map known labels to standard fields (see label normalization in docs)
3. Preserve all original data in `description.sections[*].data`
4. Extract free text only from main content areas
5. Handle missing values as `null` (never guess or fill with defaults)

## Key Documentation Files

- `docs/CRM_SCRAPING_INSTRUCTIONS_V.1.1.md` - Master scraping specification
- `docs/FRI_SCRAPING_GUIDES.md` - FRI platform extraction rules (address parsing, contact extraction)
- `docs/*_SCRAPING_GUIDES.md` - Platform-specific guides
- `docs/lessons/*.md` - Lessons learned from scraping implementations
- `CRM_IMPLEMENTATION_*.md` - CRM feature specifications and design docs

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
