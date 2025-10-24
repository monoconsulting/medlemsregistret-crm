# CRM MVP Task Checklist

_Last updated: 2025-10-24 16:40 UTC_

## Phase 0 – Stabilise Baseline
- [x] Resolve merge conflicts in `prisma/schema.prisma` and regenerate Prisma client.
- [x] Add lint/test smoke scripts to package.json (lint + targeted Playwright) and ensure they pass.
- [x] Audit API routes to reuse the shared Prisma client instead of instantiating new clients.

## Phase 1 – Import Pipeline from Existing Test Files
- [x] Inventory JSON/JSONL fixtures under `scraping/out/` (and unzip `scraping.zip` if needed) with municipality metadata.
- [x] Extract importer logic into a reusable module (e.g. `lib/importer.ts`) shared by API and CLI.
- [x] Refactor `/api/import` to use the shared importer and singleton Prisma client.
- [x] Implement CLI script `npm run db:import-fixtures` to iterate fixtures, invoke importer, and log stats.
  - [x] Support `new`, `update`, and `replace` modes with transaction safety.
  - [x] Validate municipality existence (auto-create or error) and enforce unique `detailUrl` per association.
- [x] Document the seeding workflow in README/runbook.

## Phase 2 – Editable CRM Fields & Contacts
- [x] Extend Prisma schema & migrations to ensure all required fields (Status, Pipeline, Verksamhet, City, Address, Email, Phone, "Övrig information", Contacts) are writable.
- [x] Update Zod schemas and `association.update` mutation to accept expanded fields plus optional note text.
- [x] Persist note text via `noteRouter` (create) when provided in edit form, with activity log entry.
- [x] Expose contact CRUD in UI (either inline or modal) backed by existing `contactRouter`.
- [x] Update edit modal / right column to surface editable fields with validation and loading states.
- [x] Ensure TanStack Query caches invalidate appropriately after updates.

## Phase 3 – Verification & Sign-off
- [x] Seed local DB using new CLI script and verify import stats match expectations.
- [x] Re-run Playwright municipality tests and add coverage for editing workflow.
- [x] Capture manual QA checklist (status/pipeline change, contact update, note persistence) with screenshots if applicable.
- [x] Update documentation summarising MVP deliverables and known limitations.
