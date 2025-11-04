# Change Inventory – Standalone Frontend (Phases 0–2)

This document captures the high-level changes introduced in this commit:

## New/Updated Directories
- `/api/` – PHP API bootstrap and endpoints (`bootstrap.php`, `login.php`, `logout.php`, `csrf.php`, `associations.php`, `association_notes.php`, `tags.php`, `municipalities.php`, `.htaccess`).
- `/crm-app/` – Rebuilt Next.js frontend with fetch-based data layer (`lib/api.ts`, `app/associations/page.tsx`, client-side auth+UI utilities).
- `/legacy/` – Archived Node/tRPC runtime, original Next.js app, Playwright suites, Prisma migrations, and scraping scripts.
- `/db/` – `extra_indexes.sql` describing supporting indexes.
- `/backups/` – Placeholder with backup checklist (`README.md`).

## Documentation
- `docs/api_contract.md` – Same-origin API specification.
- `docs/runtime_env.md` – Required PHP environment variables.
- `docs/static_export_notes.md` – Guidance for `next export` deployment.
- `docs/inventory_trpc_ssr.md` – Inventory of removed tRPC dependencies (now located in `legacy/`).
- `docs/change_inventory_phase0-2.md` – This summary.

## Frontend Utilities
- Shared toast system (`components/ui/use-toast.tsx`, `components/ui/toaster.tsx`).
- Reusable modal + forms for associations, notes, and tags.

Refer to `legacy/README.md` for instructions on restoring the archived runtime if necessary.
