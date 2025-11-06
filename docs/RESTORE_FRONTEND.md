# Legacy Frontend Restoration Plan

Goal: migrate the fully featured legacy Next.js interface located in `legacy/crm-app` into the new `crm-app` workspace while retaining the latest PHP backend integration. The target system must match legacy design, UX, and functionality page by page.

---

## Phase 1 – Baseline & Dependencies
1. **Dependency audit**
   - Review `legacy` packages (React Query, TRPC, zod, react-hook-form, lucide-react, react-leaflet, superjson, etc.).
   - Update `crm-app/package.json` so all required libraries are present, replacing TRPC client usage with REST helpers where feasible.
2. **Global assets**
   - Align `globals.css`, Tailwind tokens, fonts, and utility styles with legacy to ensure typography/spacing parity.
   - Confirm module path aliases (`@/components`, `@/lib`, etc.) match legacy expectations.

## Phase 2 – Core Infrastructure
1. **Providers**
   - Port legacy `AuthProvider` behaviour (session refresh, role handling, logging) and adapt logic to PHP endpoints (`/api/csrf.php`, `/api/login.php`, `/api/logout.php`, `/api/associations.php`).
   - Replace TRPC hooks with a compatibility layer that wraps the PHP REST API, or refactor each usage to new `api.*` functions while preserving query invalidation semantics.
   - Reuse toast/logging utilities, keeping legacy analytics hooks (`logAuthClientEvent`, etc.) functional or stubbing them until a new sink exists.
2. **Layout shell**
   - Bring over `components/layout/sidebar.tsx` and `header.tsx`, integrating search, notification badges, and user menu.
   - Update `crm-app/components/layout/app-layout.tsx` to match legacy `DashboardLayout` (sidebar + header + scrollable main area).
   - Reinstate `RoleGuard` to gate routes using roles stored in PHP sessions.

## Phase 3 – Shared UI & Utilities
1. Copy filter components (`components/filters/*`), modals (`components/modals/*`), map widget (`components/MunicipalityMap.tsx`), and form utilities.
2. Import validators (`legacy/lib/validators/*`), search helpers, and supporting hooks (`hooks/use-toast`, etc.).
3. Ensure UI primitives (card, table, dialog, dropdown, etc.) match legacy styling—reuse existing shadcn exports or synchronize versions.

## Phase 4 – Page Migration (Feature Parity)
1. **Login (/login)** – replace simplified page with legacy `login/page.tsx`, including Suspense fallback, error handling, analytics logs, and redirect to `/dashboard`.
2. **Root (/)** – restore immediate redirect to `/dashboard`.
3. **Dashboard (/dashboard)** – port `_components` widgets (stats, municipalities, activity feed, tasks, growth chart, AI assistant, saved groups). Map data requirements to PHP endpoints; create backend tickets for missing routes (activities, AI suggestions, etc.).
4. **Associations (/associations)** – migrate advanced list view, filters, bulk actions, tag management, notes, exports. Replace TRPC calls with PHP REST helpers (`associations.php`, `association_notes.php`, `tags.php`) and maintain optimistic updates.
5. **Contacts (/contacts)** – copy table UI, search, “primary only” filter, pagination. Plan REST endpoint (`/api/contacts.php`) if absent.
6. **Municipalities (/municipalities)** – replicate list with municipality map overlay and stats. Ensure PHP endpoints supply municipality counts/details.
7. **Groups (/groups)** – bring list, create modal, saved filter integration. Map TRPC (`groups.list/create/getById`) to PHP routes; invalidate caches after mutations.
8. **Users (/users)** – migrate CRUD table and modals; ensure PHP backend exposes user management endpoints.
9. **Import (/import)** - port file upload workflow (check existing data, import modes). Align with `/api/import` endpoints handling FormData uploads.
10. **Web Scraping (/web-scraping)** - replicate grid UI and scrape triggers; coordinate backend hooks for scraping jobs.
11. Audit any additional routes (e.g., unauthorized page, settings) and replicate if still relevant.

### Phase 4A - "Föreningar" (Associations) Restoration Plan

**Current status**
- The new page at `crm-app/app/associations/page.tsx` is partially ported but still crashes in runtime because it depends on API shapes that are not yet available (e.g. `/api/associations.php` currently returns 405 for POST/PUT/DELETE and omits several fields the UI expects).
- Legacy UX includes table, card and (future) map views, advanced filters, bulk actions, contact & group modals, notes, activity insights, and exports. None of these are fully wired to the PHP backend yet.
- We must reproduce the failing navigation first (load `/associations` in dev, capture the first network error + stack trace) to confirm whether the crash stems from missing data, auth refresh, or parsing issues.

**Workstream 1 – Backend / API enablement**
- Extend `api/associations.php`:
  1. Broaden filtering to accept the legacy query contract (`crmStatuses[]`, `pipelines[]`, `types[]`, `activities[]`, `tags[]`, `hasEmail`, `hasPhone`, `isMember`, `assignedToId`, `dateRange`, `lastActivityDays`, search index fallback).
  2. Return the full dataset (see checklist below) including pipeline, membership flags, contact/notes counts, primary contact snippet, assigned user, last activity timestamp, JSON fields (`types`, `activities`, `extras`) and municipal metadata.
  3. Support `POST` (create), `PUT`/`PATCH` (updates with audit logging + optional note append), and `DELETE` (soft delete) with CSRF + session auth.
  4. Add optional `view=detail` (or create `/api/association.php`) that joins contacts, notes (with author), tags, group memberships, activity log, description sections, and extras for the details modal.
- Introduce missing PHP endpoints required by the page:
  - `/api/contacts.php` for create/update/delete/list (primary flag, social URLs).
  - `/api/groups.php` (list, add/remove members, soft delete) to drive bulk actions.
  - `/api/association_activity.php` (recent timeline) and `/api/association_export.php` (CSV/Excel aligned with Windows-1252 encoding).
  - Verify `association_notes.php` already handles author attribution; extend payload if we need `authorName` + avatar.
- Ensure all endpoints honour existing logging (`log_event`) and rate limiting helpers and keep responses UTF-8 normalised.

**Workstream 2 – Frontend parity**
- Replace the current local-state table with the legacy React Query powered implementation:
  1. Copy `legacy/crm-app/app/app/(dashboard)/associations/page.tsx` and supporting components (`components/filters/*`, `components/modals/*`, cards/table row renderers, export helpers) into `crm-app`.
  2. Refactor TRPC calls to use the new REST helpers in `crm-app/lib/api.ts`, adding missing methods (`getAssociationById`, `updateAssociation`, `listContacts`, etc.) as the PHP endpoints land.
  3. Re-enable advanced filter panel (status, pipeline, activities, tags, last activity, assigned user) and persist query-string sync for deep links.
  4. Reinstate bulk toolbars: add to group, export, mailer modal (wire to PHP endpoints or feature-flag if backend work remains).
  5. Restore modals: association details dialog, contacts create/edit, send email, add-to-group, tag manager, and ensure optimistic updates stay in sync with backend responses.
  6. Add skeletons/empty states that match the legacy visual language and respect current Tailwind tokens.

**Data contract parity checklist**

| Legacy field / UI usage | Current `/api/associations.php` output | Action |
| --- | --- | --- |
| `crmStatus` (status pills, filters) | Returned as `status` but limited to single value filter | Keep uppercase enum, expose array filter support + ensure casing matches `CRM_STATUSES`. |
| `pipeline` (kanban state, bulk edits) | **Missing** | Select `a.pipeline`, return as `pipeline`, allow sorting/filtering. |
| `isMember`, `memberSince` (badges, timeline) | **Missing** | Select columns, expose filters (`isMember=true/false`). |
| `orgNumber`, `municipality`, `city`, `postalCode`, `streetAddress` | Only `municipality_name` + combined `address` | Return individual columns (`org_number`, `street_address`, `postal_code`, `city`) to unblock detail panel + exports. |
| `types`, `activities`, `categories` | `types` flattened to string; others omitted | Return JSON arrays (decode in PHP) and keep raw arrays in API to power filters and badges. |
| `descriptionFreeText`, `extras.otherInformation` | **Missing** | Expose as `description_free_text`, `extras` (object) for details modal. |
| Primary contact snapshot (`contacts[0]`, `_count.contacts`) | **Missing** | Join primary contact (name, email, phone) + counts to avoid extra roundtrips. |
| `_count.notes` | **Missing** | Include notes count for list badges. |
| `assignedTo` (user id/name) | **Missing** | Left join `User` table, return `{ id, name, email }`. |
| `activityLog[0]` (recent event timestamp) | **Missing** | Join subquery for latest `Activity` to drive "recent activity" sorting & badges. |
| `groupMemberships` summary | **Missing** | Either append to detail view or expose via separate endpoint for modal. |

Revisit `crm-app/lib/api.ts` after the backend changes so the TypeScript types match the enriched payload (e.g. split `address` into structured fields, promote JSON arrays, add optional nested objects).

**Workstream 3 – QA & observability**
- Unit-test PHP endpoints with cURL-focused scripts (success + failure cases, CSRF enforcement, UTF-8 output).
- Add Playwright scenario covering: load list, apply filters, edit status/pipeline, add tag, add note, add contact, bulk add-to-group (skip if endpoint pending), export trigger.
- Capture HAR + API logs for a complete journey (list -> detail -> edit -> note) and archive under `docs/har/associations`.
- Update `docs/worklogs` with exact commands and test artefacts, per `WORKLOG_AI_INSTRUCTION.md`.

**Dependencies / open questions**
- Confirm whether email sending (legacy `SendEmailModal`) should remain functional in this phase or be temporarily disabled until PHP mailer exists.
- Clarify ownership for CSV export implementation (frontend trigger vs backend generator).
- Validate whether Meilisearch/Typesense search is required immediately or if phase 1 can rely on MySQL `LIKE` queries while portable search service is restored.

## Phase 5 - Modals & Supporting Features
1. Confirm each modal (association details, contact edit, send email, add to group, user CRUD) has REST support; implement missing PHP endpoints or schedule backend work.
2. Carry over exports (CSV/PDF) and email workflows, ensuring PHP backend handles encoding and queueing.

## Phase 6 – Data & Backend Alignment
1. Map each legacy TRPC router (`activities`, `ai`, `association`, `contacts`, `groups`, `municipality`, `notes`, `scraping`, `tags`, `tasks`, `users`, `export`) to current or new PHP endpoints.
2. For gaps, raise explicit backend tasks detailing SQL joins, payload shape, and authentication expectations.
3. Ensure role-based access (ADMIN/MANAGER/USER) is enforced server-side to match legacy behaviour.

## Phase 7 – Testing Strategy
1. Restore or re-create Playwright specs that mirror legacy flows (login, dashboard widgets, associations CRUD, filters). Follow `docs/TEST_RULES.md`:
   - Place specs under `web/tests/`.
   - Produce reports in `web/test-reports/<timestamp>/`.
   - Capture 1900×1200 video/snapshots.
2. Add API smoke scripts targeting new REST endpoints (curl/PowerShell) to validate csrf/session handling.
3. Run `npm run build` and `npm run export` after major milestones to ensure static deployment continuity.

## Phase 8 – Deployment & Verification
1. Confirm `scripts/deploy_loopia_frontend.bat` and PowerShell helpers handle updated directories.
2. After each feature tranche, deploy to Loopia staging, capture HAR files (`docs/har/`) to document login → dashboard → associations journeys.
3. Validate remote PHP logs (`api/logs/remote-login.log`) for session/auth success, ensuring CSRF tokens and redirects behave like legacy.
4. Prepare rollback notes summarizing which modules migrated, associated backend changes, and outstanding gaps.

---

**Key Risks & Follow-Ups**
- Missing legacy files (e.g., original `AuthProvider` implementation) may need recovery from Git history—identify early.
- Several TRPC endpoints have no PHP equivalent; backlog backend work to avoid blocking UI migration.
- AI assistant and scraping features rely on external services—coordinate environment support or provide fallbacks.
- Ensure data encoding issues (UTF-8) remain resolved when porting PHP queries to cover new datasets.

Following this plan delivers a page-by-page restoration of the legacy CRM frontend inside the new stack while aligning data access and deployment flows with the PHP backend. Continuous testing and HAR verification will confirm fidelity throughout the migration.
