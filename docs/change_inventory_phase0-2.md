# Phase 0–2 Change Inventory

## New files
- `api/.htaccess`
- `api/bootstrap.php`
- `api/config.sample.php`
- `api/csrf.php`
- `api/login.php`
- `api/logout.php`
- `api/municipalities.php`
- `api/tags.php`
- `api/association_notes.php`
- `api/associations.php`
- `api/session.php`
- `crm-app/lib/api.ts`
- `docs/api_contract.md`
- `docs/inventory_trpc_ssr.md`
- `docs/runtime_env.md`
- `docs/static_export_notes.md`
- `docs/change_inventory_phase0-2.md`
- `db/extra_indexes.sql`
- `backups/db-live-20250214/README.md`
- `backups/web-live-20250214/README.md`

## Modified files
- `crm-app/app/layout.tsx` (remove TRPC provider)
- `crm-app/app/(dashboard)/associations/page.tsx` (rewrite to PHP API)
- `crm-app/app/(dashboard)/dashboard/page.tsx`
- `crm-app/app/(dashboard)/groups/page.tsx`
- `crm-app/app/(dashboard)/contacts/page.tsx`
- `crm-app/app/(dashboard)/municipalities/page.tsx`
- `crm-app/app/(dashboard)/import/page.tsx`
- `crm-app/app/(dashboard)/users/page.tsx`
- `crm-app/components/auth/role-guard.tsx`
- `crm-app/lib/auth-client.ts`
- `crm-app/lib/auth-flow/client.ts`
- `crm-app/lib/providers/auth-provider.tsx`
- `crm-app/middleware.ts`
- `crm-app/package.json`
- `crm-app/package-lock.json`
- `docs/MCRM_SIMPLIFIED_FRONTEND_IMPLEMENTATION_PLAN_1.md` (referenced for implementation; no edits)

## Relocated to `/legacy/`
- Entire `backend/` directory.
- Entire `crm-app/app/api/` directory.
- `crm-app/lib/trpc/` and `crm-app/lib/providers/trpc-provider.tsx`.
- `crm-app/lib/ai/`.
- `crm-app/lib/auth.ts`, `crm-app/lib/auth-prisma-adapter.ts`, `crm-app/lib/db.ts`, `crm-app/lib/importer.ts`.
- `crm-app/components/modals/`.
- `crm-app/prisma/` and `crm-app/migration.sql`.
- `crm-app/scraping/` and root `scraping/`.
- `crm-app/tests/` and root `tests/`.
- `crm-app/docker-compose*.yml` and root `compose.yml`.
- `crm-app/pnpm-lock.yaml`.
- `crm-app/types/next-auth.d.ts`.
- `crm-app/scripts/`.
- All dashboard auxiliary widgets under `crm-app/app/(dashboard)/dashboard/_components/`.
- Root `backend` npm project artifacts (`package*.json`, `tsconfig.json`, etc.).

Refer to `git status` for the authoritative list of moved files; all runtime assets from the Node/tRPC stack now live under `/legacy/`.
