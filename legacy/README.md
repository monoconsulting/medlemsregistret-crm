# Legacy Runtime Parking

This directory archives the previous Node/Express/tRPC runtime, ancillary tooling, and feature experiments that are no longer part of the standalone PHP-backed deployment. The contents are preserved verbatim so we can reference, restore, or cherry-pick functionality in future phases if needed.

## Contents
- `backend/` – Express server, Prisma schema, and supporting TypeScript services.
- `compose.yml` and Docker assets – Local development containers for the Node backend.
- `migrations/` – Prisma-generated database migrations.
- `crm-app-legacy/` – The original Next.js application that depended on tRPC, AI widgets, and scraping utilities.
- `playwright/` – Playwright test harnesses, config files, and helper scripts.
- `scraping/` – Experimental scraping utilities.
- `tests/` – Legacy automated tests targeting the Node/tRPC runtime.
- Additional feature folders (AI assistant, dashboard experiments, etc.) that required the retired backend.

All runtime-critical files for the new architecture now live at the repository root (`crm-app/` for the frontend and `/api/` for the PHP API). When porting functionality back, move modules out of `legacy/` instead of copying to avoid divergence.
