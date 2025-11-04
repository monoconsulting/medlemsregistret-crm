# Change Inventory – Phases 0–2

The following repository paths were created or updated while implementing the simplified standalone frontend:

## New

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
- `crm-app/app/layout.tsx`
- `crm-app/app/page.tsx`
- `crm-app/app/login/page.tsx`
- `crm-app/app/associations/page.tsx`
- `crm-app/lib/api.ts`
- `db/extra_indexes.sql`
- `docs/api_contract.md`
- `docs/runtime_env.md`
- `docs/static_export_notes.md`
- `docs/inventory_trpc_ssr.md`
- `docs/change_inventory_phase0-2.md`
- `legacy/README.md`

## Modified

- `crm-app/lib/providers/auth-provider.tsx`
- `crm-app/pnpm-lock.yaml`

## Relocated to `legacy/`

- Entire previous Node/tRPC backend (`backend/`)
- Prisma schema and tooling (`crm-app/prisma/`, `migrations/`)
- Next.js app router implementation under `crm-app/app/`
- tRPC clients/providers and related utilities under `crm-app/lib/`
- UI layers dependent on the Node runtime (`crm-app/components/` except `components/ui`)
- Scraping and Playwright tooling (`scraping/`, `tests/`, `crm-app/tests/`)
- Docker Compose definition (`compose.yml`)

Refer to version control history for the complete list of moved paths.
