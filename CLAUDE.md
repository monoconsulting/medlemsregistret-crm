# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CRM system for managing Swedish municipal association registries with two main components:
1. **Web scraping framework** (`/scraping`) - Playwright-based and REST API scrapers for collecting association data from 50+ Swedish municipalities across four platform types
2. **CRM application** (`/crm-app`) - Next.js 15 web application with PHP backend API for managing scraped data

**Current architecture state (Nov 2025):**
- Frontend: Next.js 15 (App Router) at port 3000, migrating from legacy tRPC to PHP REST API
- Backend: PHP REST APIs in `/api` directory (session-based auth, MySQL database)
- Database: MySQL (never SQLite - not permitted)
- Auth: PHP session-based via `/api/login.php`, `/api/logout.php`, `/api/auth/me.php`
- API client: `crm-app/lib/api.ts` wraps PHP endpoints; uses `backend-base.ts` for origin resolution
- Testing: Playwright tests in `/web/tests` (see `docs/TEST_RULES.md` for mandatory testing protocol)

## Critical Rules

**NEVER CHANGE PORTS** - Port changes are strictly forbidden without explicit permission
**NEVER USE TASKKILL** - Do not kill processes on ports; check docker-compose/env files instead
**NO MOCK DATA** - All data must come from actual scraping or user input
**NO SQLITE** - Only MySQL is permitted
**SOFT DELETE ONLY** - Never hard delete records from database
**ALWAYS READ INSTRUCTED FILES** - Follow documentation references exactly

**Files requiring permission to edit:**
- `docker-compose*.yml`
- `.env*` files
- `playwright.config.ts`

## Development Commands

### CRM Application (from crm-app/)
```bash
# Development (port 3000 via scripts/start-dev.ts)
npm run dev

# Build & deployment
npm run build                    # Production build
npm run start                    # Production server
npm run export:static            # Static export

# Code quality
npm run lint

# Database (MySQL via Prisma - paths in legacy/crm-app/prisma/)
npm run db:generate              # Generate Prisma client
npm run db:push                  # Push schema to database
npm run db:studio                # Open Prisma Studio GUI
npm run db:seed                  # Seed database
npm run db:import-municipalities # Import municipality data

# Testing (see docs/TEST_RULES.md for mandatory protocol)
npm run test                     # Run all Playwright tests
npm run test:ui                  # Interactive UI mode
npm run test:debug               # Debug mode
npm run test:municipalities      # Municipality table tests
npm run test:headed              # Run with browser visible
npm run check:smoke              # Lint + municipality tests
```

### Web Scraping (from project root)

**Platform types:**
1. **FRI Webb-Förening** - 9 municipalities (Playwright scraping)
2. **RBOK** - 1 municipality (Playwright scraping)
3. **IBGO (Interbook Go)** - 31 municipalities (REST API, no pagination, no org numbers, handles email concatenation)
4. **ActorSmartbook** - 22 municipalities (REST API, paginated, handles email concatenation)

**Individual scrapers:**
```bash
npx tsx scraping/<municipality>_scrape.ts

# Examples:
npx tsx scraping/sollentuna_scrape.ts
npx tsx scraping/arjang_scrape.ts
```

**Bulk automation (Windows batch files):**
```bash
# IBGO bulk operations (31 municipalities, ~5 min, 99.98% success)
scraping/scripts/ibgo_scrape_and_import.bat    # Full process
scraping/scripts/ibgo_scrape.bat                # Scraping only
scraping/scripts/ibgo_import.bat                # Import only

# Actor Smartbook (22 municipalities, ~23 min, 99.6% success)
scraping/scripts/actor_scrape_and_import.bat    # Full process
scraping/scripts/actor_scrape.bat                # Scraping only
scraping/scripts/actor_import.bat                # Import only
scraping/scripts/actor_test_scrape.bat          # Quick test (Gnosjö, ~30s)
```

**Output locations:**
- JSON: `scraping/json/{municipality}_{SOURCE_SYSTEM}_{YYYY-MM-DD}_{HH-MM}.json`
- Logs: `scraping/logs/{municipality}.log`
- Summaries: `scraping/json/bulk_{system}_scrape_summary_YYYY-MM-DD.json`

## Architecture Details

### Frontend (crm-app/)

**Tech stack:**
- Next.js 15 (App Router), TypeScript, React 19
- Styling: Tailwind CSS + shadcn/ui components
- State: TanStack Query v5 (server state), Zustand (UI state)
- Forms: React Hook Form + Zod validation
- Auth: Session-based via PHP backend

**Key patterns:**
- Backend origin resolution: Always use `lib/backend-base.ts` helpers (`getBackendBaseUrl`, `resolveBackendUrl`)
- API calls: Use `lib/api.ts` client wrapper (replaces legacy tRPC)
- Query invalidation: Follow pattern in `app/associations/page.tsx` for cache updates
- CSV exports: ANSI/Windows-1252 encoding with semicolons (handled server-side via `iconv-lite`)

**Directory structure:**
- `app/` - Next.js pages (dashboard, associations, municipalities, contacts, groups, users, import)
- `components/` - React components (layout, ui, modals, filters)
- `lib/` - Utilities, API client, auth provider
- `scripts/` - Dev startup scripts
- `tests/` - Playwright test specs

### Backend (api/)

**PHP REST APIs** with MySQL database:
- `associations.php` - List, create, update, delete associations (GET/POST/PUT/DELETE)
- `association_detail.php` - Detailed association view
- `association_notes.php` - Notes management
- `contacts.php` - Contact person CRUD
- `municipalities.php` - Municipality data
- `tags.php` - Tag management
- `login.php`, `logout.php`, `auth/me.php` - Session authentication
- `csrf.php` - CSRF token generation
- `bootstrap.php` - Common initialization

**Auth flow:**
1. GET `/api/csrf.php` - Obtain CSRF token
2. POST `/api/login.php` - Login with credentials + CSRF token
3. Session stored server-side, validated on subsequent requests
4. GET `/api/auth/me.php` - Check current session

### Database Schema (legacy/crm-app/prisma/schema.prisma)

**Core entities:**
- `Association` - Scraped association data + CRM fields (status, pipeline, assigned user)
- `Contact` - Contact persons linked to associations
- `Municipality` - Swedish municipalities with source system tracking
- `Note` - CRM notes with author tracking
- `Tag` - Categorization tags
- `Group` - Custom groupings with member associations
- `Activity` - Activity log for tracking interactions
- `User` - System users with roles (ADMIN/MANAGER/USER)
- `ScrapeRun` - Scraping job metadata

**Connection:**
```
DATABASE_URL="mysql://user:password@localhost:3306/crm_database"
```

### Web Scraping (scraping/)

**Data standard:** All scrapers output to JSON following schema in `docs/JSON_STANDARD.md`

**Common scraper structure:**
1. Initialize browser (Playwright) or HTTP client (REST APIs)
2. Fetch association list (with pagination if needed)
3. For each association:
   - Extract list-level data
   - Fetch detail page/endpoint
   - Parse contact info, address, description sections
   - Normalize to standard schema
4. Output pretty-printed JSON array to `scraping/json/`
5. Generate log file with statistics to `scraping/logs/`

**Standard schema fields:**
- `source_system` - FRI, RBOK, IBGO, ActorSmartbook
- `municipality` - Municipality name
- `association` - Core fields (name, org_number, types, activities, contact info)
  - `description.free_text` - Main text content
  - `description.sections[]` - Structured data sections
    - `sections[].title` - Section heading
    - `sections[].data` - Object with normalized snake_case keys
- `contacts[]` - Contact persons array
- `source_navigation` - Pagination metadata
- `extras` - Platform-specific fields

**Important extraction rules:**
1. **NO MOCK DATA** - Never create fake data
2. **NO HARDCODING** - All data from actual sources
3. **Preserve Swedish** - Do not translate original text
4. **Scope properly** - Extract only main content, exclude headers/footers/navigation
5. **Handle concatenated emails** - Split comma-separated emails into separate contacts (IBGO, Actor Smartbook)
6. **Missing values as null** - Never guess or fill defaults

## Testing Protocol (docs/TEST_RULES.md)

**Mandatory workflow:**
1. Check if test exists in `/web/tests`
2. Prove problem with ONE failing test
3. Fix only the responsible layer
4. Prove fix with SAME passing test
5. Verify database updates
6. Never modify test to make it pass
7. Success = 100% pass rate

**Test commands:**
```bash
npm run test:e2e:report                                    # Full run
npm run test:e2e:report -- web/tests/login.spec.ts       # Single file
npm run test:e2e:report -- -g @formX                      # Tagged tests
npm run test:e2e:open-latest                              # Open latest report
```

**Test requirements:**
- Save reports to `web/test-reports/`
- Include video (1900x1200) and snapshot (1900x1200)
- Chromium headless only
- PR must link to test report HTML

## Key Documentation

**Scraping guides:**
- `docs/JSON_STANDARD.md` - Output schema for all scrapers
- `docs/FRI_SCRAPING_GUIDES.md` - FRI platform extraction rules
- `docs/IBGO_SCRAPING_GUIDES.md` - IBGO REST API guide
- `docs/ACTORS_SMARTBOOK_SCRAPING_GUIDES.md` - Actor Smartbook API guide
- `docs/RBOK_SCRAPING_GUIDES.md` - RBOK platform guide
- `docs/lessons/*.md` - Platform-specific lessons learned

**CRM documentation:**
- `docs/RESTORE_FRONTEND.md` - Frontend migration plan (legacy → new)
- `docs/api_contract.md` - API contract specifications
- `docs/TEST_RULES.md` - Mandatory testing protocol
- `docs/worklogs/*.md` - Daily engineering logs

**Operations:**
- `docs/CHECK_PORTS_API.md` - Port troubleshooting
- `docs/DEPLOYMENT*.md` - Deployment procedures
- `docs/GIT_*.md` - Git workflow rules

## Common Development Patterns

### Adding a new municipality scraper:
1. Identify platform type (FRI/RBOK/IBGO/ActorSmartbook)
2. Copy existing scraper for that platform to `scraping/{municipality}_scrape.ts`
3. Update: BASE_URL, MUNICIPALITY, SOURCE_SYSTEM constants
4. Adapt selectors/API endpoints if needed
5. Test thoroughly and check logs for data quality
6. Verify output matches `docs/JSON_STANDARD.md`

### Adding/modifying CRM features:
1. Update Prisma schema in `legacy/crm-app/prisma/schema.prisma` if needed
2. Run `npm run db:push` to update database
3. Update PHP API endpoint in `/api` directory
4. Update TypeScript types in `crm-app/lib/api.ts`
5. Implement UI in `crm-app/app/` following existing patterns
6. Use `getBackendBaseUrl()` / `resolveBackendUrl()` for API calls
7. Follow React Query invalidation patterns (see `app/associations/page.tsx`)
8. Create Playwright test following `docs/TEST_RULES.md`

### Troubleshooting port issues:
1. Check `docker-compose*.yml` for correct port assignments
2. Check `.env*` files for port configuration
3. Run `docker ps` to see what's using the port
4. **DO NOT use taskkill or change ports** - ask for permission first

## Migration Context

The project is actively migrating from legacy tRPC-based architecture to PHP REST API backend (Nov 2025). Key considerations:

- Legacy code in `/legacy` directory serves as reference
- New frontend uses `lib/api.ts` wrapper instead of tRPC hooks
- Session handling moved from NextAuth to PHP sessions
- Group management includes live membership counts (invalidation pattern in place)
- CSV exports must remain Windows-1252 encoded (stakeholder requirement)
- Association page restoration ongoing (see `docs/RESTORE_FRONTEND.md`)

## Current State

**Working:**
- Web scraping for 50+ municipalities (4 platform types)
- Bulk automation for IBGO and Actor Smartbook
- Basic CRM frontend (dashboard, municipalities, login)
- PHP REST API backend with session auth
- MySQL database with Prisma schema

**In Progress:**
- Full associations page migration from legacy
- Contact management endpoints
- Advanced filtering and bulk operations
- Group management UI completion
