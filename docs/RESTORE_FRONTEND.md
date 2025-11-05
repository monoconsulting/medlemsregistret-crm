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
9. **Import (/import)** – port file upload workflow (check existing data, import modes). Align with `/api/import` endpoints handling FormData uploads.
10. **Web Scraping (/web-scraping)** – replicate grid UI and scrape triggers; coordinate backend hooks for scraping jobs.
11. Audit any additional routes (e.g., unauthorized page, settings) and replicate if still relevant.

## Phase 5 – Modals & Supporting Features
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
