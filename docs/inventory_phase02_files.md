# Phase 0–2 Change Inventory

This document enumerates repository updates made while implementing the standalone frontend backed by the PHP API.

## Documentation
- `docs/inventory_trpc_ssr.md` — catalogued and updated tRPC/SSR usage, noting relocation to `/legacy`.
- `docs/runtime_env.md` — defined PHP environment variables and cookie/session behaviour.
- `docs/api_contract.md` — described the same-origin API endpoints and expected payloads.
- `docs/static_export_notes.md` — documented export considerations for the static Next.js build.
- `docs/inventory_phase02_files.md` — this file.

## Legacy parking
- Created `/legacy/README.md` explaining archived runtime pieces.
- Moved Node/tRPC backend, Prisma schema, tests, scraping utilities, and the previous Next.js runtime into `/legacy/**` (e.g. `legacy/backend`, `legacy/crm-app/app-legacy`, `legacy/crm-app/app-api`, `legacy/crm-app/components`, `legacy/migrations`).
- Relocated backend Docker compose (`legacy/compose.yml`).

## PHP API
- Added `/api/` folder with `.htaccess`, `bootstrap.php`, `csrf.php`, `login.php`, `logout.php`, `municipalities.php`, `tags.php`, `association_notes.php`, `associations.php`, and `config.sample.php`.
- Enhanced `api/tags.php` to support `GET ?associationId=` for per-association tag listings.

## Database utilities
- Added `db/extra_indexes.sql` with required index definitions.

## Frontend
- Introduced new static-friendly Next.js app under `crm-app/app/` (fresh `layout.tsx`, `globals.css`, `page.tsx`, `login/page.tsx`, `associations/page.tsx`).
- Added fetch-based client `crm-app/lib/api.ts` (copied + extended to support `getAssociationTags`).

