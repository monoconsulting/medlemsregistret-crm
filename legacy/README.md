# Legacy Runtime Parking

This directory archives the previous Node/Express/tRPC backend runtime, Prisma schema, Docker setups, and auxiliary automation (scraping, Playwright, AI helpers). The standalone PHP API + static frontend replaces these services in production, but the legacy code is preserved so engineers can reference or resurrect features if needed.

Contents moved here during Phase 0:
- `backend/` → `legacy/backend/`
- `crm-app/server/` → `legacy/crm-app/server/`
- `crm-app/lib/trpc/` → `legacy/crm-app/lib/trpc/`
- `crm-app/app/` (Next.js App Router) → `legacy/crm-app/app-legacy/`
- `crm-app/app/api/` (Next.js API routes) → `legacy/crm-app/app-api/`
- `crm-app/components/` → `legacy/crm-app/components/`
- `crm-app/prisma/`, `migrations/`, and related Prisma migration scripts
- `scraping/`, `crm-app/scraping/`, and automation utilities
- `tests/`, `crm-app/tests/`, and Playwright harnesses
- Docker Compose / scripts that launched the Node runtime

These files are **not** deployed with the new Loopia build but remain versioned for historical context. Refer to `docs/MCRM_SIMPLIFIED_FRONTEND_IMPLEMENTATION_PLAN_1.md` for the migration rationale and recovery steps.
