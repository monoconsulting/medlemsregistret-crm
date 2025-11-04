# CRM MVP Plan v1

|                                                              |
| ------------------------------------------------------------ |
|                                                              |
| *_Last updated: 2025-10-24 16:40 UTC_*                       |
|                                                              |
| **## 1. Current System Status**                              |
|                                                              |
| - ***\*Data import UI & API:\**** There is a fully client-side import workflow that uploads `.json`/`.jsonl` files, checks for existing municipality data, and POSTs to `/api/import` where the payload is parsed and persisted via Prisma with support for `new`, `update`, and `replace` modes.【F:crm-app/app/(dashboard)/import/page.tsx†L1-L200】【F:crm-app/app/api/import/route.ts†L1-L200】 |
| - ***\*Municipality drill-down:\**** A dedicated route lists associations per municipality, backed by REST endpoints under `/api/municipalities`. The handlers bypass tRPC and instantiate new `PrismaClient`s on each request.【F:crm-app/app/(dashboard)/municipalities/[municipalityId]/associations/page.tsx†L1-L220】【F:crm-app/app/api/municipalities/[municipalityId]/associations/route.ts†L1-L48】 |
| - ***\*Association management UI:\**** The list page already renders advanced filters, bulk actions, and opens an edit modal for CRM status, pipeline, membership, assigned owner, and notes, but the modal currently only persists status/pipeline/member/assignee fields and drops the free-text note on submit.【F:crm-app/app/(dashboard)/associations/page.tsx†L200-L259】【F:crm-app/components/modals/edit-association-modal.tsx†L1-L200】 |
| - ***\*Authentication & authorization:\**** NextAuth is configured with a Prisma adapter and a credentials provider; protected routes rely on session presence but user provisioning and password management remain manual. Role-based guards exist in the routers, yet admin-only enforcement is inconsistent in UI flows.【F:crm-app/lib/auth.ts†L1-L115】 |
| - ***\*Prisma schema integrity:\**** `schema.prisma` contains unresolved merge markers that duplicate model definitions and enums, risking generator failure and production schema drift.【F:crm-app/prisma/schema.prisma†L37-L200】 |
| - ***\*Reference data:\**** Comprehensive scraped datasets live under `scraping/out/` (and `scraping.zip`) but are not wired into the import UI; ad-hoc scripts (`scraping/out/import_to_db.ts`) target an unrelated Postgres schema.【F:scraping/out/import*_to_*db.ts†L1-L160】 |
|                                                              |
| **## 2. Comparison with CRM Implementation Blueprints & Functional Spec** |
|                                                              |
| \| Capability \| Expected (CRM*_IMPLEMENTATION_*1…4 & functional spec) \| Current status \| Gap summary \| |
| \|------------\|------------------------------------------------------\|----------------\|-------------\| |
| \| ***\*End-to-end import\**** \| Automated ingestion of scraped JSON into MySQL with batch tracking and idempotent updates. \| UI + API exist but operate manually; no orchestration for bulk loading all municipalities or using bundled test fixtures. \| Need scripted pipeline to hydrate DB from existing JSON test files and ensure import batches map to municipalities automatically. |
| \| ***\*Association right-column controls\**** \| Status & pipeline dropdowns, editable CRM metadata, free-form notes, contacts and activity feed updates in one cohesive interface. \| Status/pipeline/member/assignee updates succeed; note input in modal is not persisted; metadata such as city/address/email must be editable in detail view per spec but remain read-only in UI. \| Extend API & forms to cover note creation, contact editing, and core fields (city, address, email, phone, "Övrig information"). |
| \| ***\*Schema alignment\**** \| Clean Prisma schema matching enumerations and relations from blueprint, enabling migrations/CI. \| Merge conflicts and duplicated model blocks violate spec and jeopardize future migrations. \| Resolve conflicts, reconcile relation names, regenerate client. |
| \| ***\*Search & filters\**** \| Switchable between Prisma & external search (Meilisearch/Typesense). \| Hooks exist to call `getSearchClient`, but no provider configured; UI toggle flag is a placeholder. \| Configure provider or disable feature in MVP to avoid broken expectations. |
| \| ***\*Functional spec coverage\**** \| Baseline CRM flows (dashboard, municipalities, association detail, contacts, notes, tasks, AI hooks). \| Partial implementations; tasks/AI/export routers exist but front-end integration incomplete. \| MVP must focus on import + editable CRM fields while capturing technical debt for extended plan. |
|                                                              |
| > ***\*Note:\**** `CRM*_FUNCTIONAL_*SPEC*_V1.md` is referenced in requirements but not present in the repository. The comparison above extrapolates from `CRM_*TASK*_LIST.md` and `CRM_*IMPLEMENTATION*_1…4.md` where functional expectations are documented.* |
|                                                              |
| *## 3. MVP Scope (Requested)*                                |
|                                                              |
| *### A. Automated Database Seeding from Existing Test Files* |
| *1.* ***\*Fixture discovery & tooling\**** *– Catalogue JSON/JSONL exports under `scraping/out/` and `scraping.zip`, formalise metadata (municipality name ↔ filename mapping).* |
| *2.* ***\*Importer hardening\**** *– Refactor `/api/import` into a reusable service invoked by both the API route and a CLI/seed script. Avoid instantiating multiple Prisma clients per request.* |
| *3.* ***\*Batch automation\**** *– Create a script (`npm run db:import-fixtures`) that iterates fixture directories, posts to the importer, and verifies import stats (total, skipped, errors). Persist batch logs and surface progress in UI.* |
| *4.* ***\*Validation & rollback\**** *– Add integrity checks (duplicate detail URLs, missing municipalities) and make `replace` mode safe via transactions.* |
|                                                              |
| *### B. Editable Right-Column CRM Fields & Contacts*         |
| *1.* ***\*Schema & API adjustments\**** *– Ensure Prisma schema exposes nullable columns for Status, Pipeline, Verksamhet (activities), City, Address, Email, Phone, "Övrig information", Contacts. Add mutation inputs for these fields.* |
| *2.* ***\*tRPC harmonisation\**** *– Expand `association.update` mutation to accept the above attributes plus notes (persisted to `Note` + activity log). Add dedicated endpoints for contact CRUD if missing.* |
| *3.* ***\*UI updates\**** *– Extend the edit modal (or side panel) to surface requested fields with validation and inline save states. Ensure TanStack Query caches invalidate correctly.* |
| *4.* ***\*Activity logging & audit\**** *– Record updates in `Activity` table, showing changes in timeline tab.* |
|                                                              |
| *### C. Supporting Work for MVP Definition of Done*          |
| *- Resolve Prisma schema conflicts and regenerate client to stabilise migrations.* |
| *- Replace ad-hoc REST municipalities endpoints with tRPC or shared Prisma instance to avoid connection churn, or explicitly scope as tech debt if deferred.* |
| *- Document the import workflow (README + runbook) so operators can load datasets before running Playwright tests.* |
|                                                              |
| *## 4. MVP Implementation Sequence*                          |
|                                                              |
| *1.* ***\*Stabilise schema & environment\****                |
| *- Resolve `schema.prisma` conflicts, rerun `prisma generate`, update migrations.* |
| *- Add smoke tests (`npm run lint`, targeted Playwright spec) to CI checklist.* |
| *2.* ***\*Refactor import service\****                       |
| *- Extract importer logic into `lib/importer.ts` (pure functions + Prisma dependencies injected).* |
| *- Update API route to reuse the service and share Prisma client (avoid new `PrismaClient()` per request).* |
| *- Build CLI script that streams fixture files (decompressing `scraping.zip` as needed) through importer with logging and retry semantics.* |
| *3.* ***\*Wire fixtures to DB\****                           |
| *- Define configuration map (municipality name, expected record counts) for automated verification.* |
| *- Run importer, capture stats, seed sample environment.*    |
| *4.* ***\*Enhance association editing\****                   |
| *- Extend Zod schemas & tRPC router to accept all required fields plus optional note text.* |
| *- Modify edit modal to include Verksamhet (activities), City, Address, Email, Phone, "Övrig information" (JSON), Contact editing hooks.* |
| *- Ensure updates trigger toast feedback and activity log entries.* |
| *5.* ***\*QA & sign-off\****                                 |
| *- Re-run Playwright municipality tests plus new scenarios validating inline edits.* |
| *- Update documentation (README + operator guide) outlining MVP flows.* |
|                                                              |
| *## 5. Risks & Mitigations*                                  |
|                                                              |
| *\| Risk \| Impact \| Mitigation \|*                         |
| *\|------\|--------\|------------\|*                         |
| *\|* ***\*Prisma schema conflicts break migrations\**** *\| Blocks deploy & importer \| Resolve conflicts before any feature work; add migration test to CI.* |
| *\|* ***\*Fixture format drift\**** *\| Import script fails silently \| Implement schema validation (Zod) before writing to DB; fail fast with actionable errors.* |
| *\|* ***\*Large JSON imports stress API route\**** *\| Timeouts during seeding \| Use streaming/CLI path for bulk loads; keep API for single-municipality updates.* |
| *\|* ***\*Concurrent Prisma clients in API routes\**** *\| Connection exhaustion \| Reuse singleton Prisma client from `@/lib/db` everywhere.* |
| *\|* ***\*Unpersisted modal notes\**** *\| Data loss for user-supplied annotations \| Add dedicated `noteRouter` call when `notes` field is filled; confirm in activity feed.* |