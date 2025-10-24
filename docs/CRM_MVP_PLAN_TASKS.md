# CRM MVP Task Checklist

_Last updated: 2025-10-24 16:40 UTC_

## Phase 0 – Stabilise Baseline
- [ ] Resolve merge conflicts in `prisma/schema.prisma` and regenerate Prisma client.
- [ ] Add lint/test smoke scripts to package.json (lint + targeted Playwright) and ensure they pass.
- [ ] Audit API routes to reuse the shared Prisma client instead of instantiating new clients.

## Phase 1 – Import Pipeline from Existing Test Files
- [ ] Inventory JSON/JSONL fixtures under `scraping/out/` (and unzip `scraping.zip` if needed) with municipality metadata.
- [ ] Extract importer logic into a reusable module (e.g. `lib/importer.ts`) shared by API and CLI.
- [ ] Refactor `/api/import` to use the shared importer and singleton Prisma client.
- [ ] Implement CLI script `npm run db:import-fixtures` to iterate fixtures, invoke importer, and log stats.
  - [ ] Support `new`, `update`, and `replace` modes with transaction safety.
  - [ ] Validate municipality existence (auto-create or error) and enforce unique `detailUrl` per association.
- [ ] Document the seeding workflow in README/runbook.

## Phase 2 – Editable CRM Fields & Contacts
- [ ] Extend Prisma schema & migrations to ensure all required fields (Status, Pipeline, Verksamhet, City, Address, Email, Phone, "Övrig information", Contacts) are writable.
- [ ] Update Zod schemas and `association.update` mutation to accept expanded fields plus optional note text.
- [ ] Persist note text via `noteRouter` (create) when provided in edit form, with activity log entry.
- [ ] Expose contact CRUD in UI (either inline or modal) backed by existing `contactRouter`.
- [ ] Update edit modal / right column to surface editable fields with validation and loading states.
- [ ] Ensure TanStack Query caches invalidate appropriately after updates.

## Phase 3 – Verification & Sign-off
- [ ] Seed local DB using new CLI script and verify import stats match expectations.
- [ ] Re-run Playwright municipality tests and add coverage for editing workflow.
- [ ] Capture manual QA checklist (status/pipeline change, contact update, note persistence) with screenshots if applicable.
- [ ] Update documentation summarising MVP deliverables and known limitations.
