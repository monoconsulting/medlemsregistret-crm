Yes — I’ve re-analyzed the **actual codebase** you attached (`/mnt/data/codebasebackup_2025-11-06_09-37.zip`) and rebuilt the instructions strictly around what’s already there and how your current **Loopia** deployment pipeline works.

Below is a precise, copy-pasteable installation brief for your dev-agent. It references only files and scripts that exist in your repository.

------

# CRM Portal – Figma Make UI Install & Loopia Static Deployment (Agent Brief)

**Goal**
 Integrate the Figma Make–provided UI into the existing frontend without changing business logic or routes, then build and deploy a **static** artifact to **Loopia** alongside the existing **PHP API** that serves data from MariaDB/MySQL on the same host.

**Repo layout (relevant)**

- `crm-app/` — Next.js app (App Router), Tailwind, shadcn-style components, static export tooling.
- `figma/` — Figma Make bundle (components, primitives, guidelines).
- `api/` — PHP endpoints for Loopia (sessions, CSRF, associations, contacts, municipalities, tags, logs, auth).
- `deploy/loopia/*.ps1` — PowerShell utilities for **export** and **FTP sync** to Loopia.
- `crm-app/public/.htaccess` — Cache policy for exported static site.
- `web/test-reports/*` — Playwright style visual reports (optional verification artifacts).

------

## 0) Guardrails (do-not-break list)

1. **No server logic changes.** Do not modify DB schema, API contracts, or PHP behavior.
2. **No route changes.** All existing Next.js routes under `crm-app/app/*` must keep their URL and semantics.
3. **Static export only.** Use the repo’s built-in static exporter (`scripts/create-static-out.mjs`). Do not introduce SSR, middleware, or server actions.
4. **Secrets** must not appear in Git. If `api/config.php` contains real credentials, **remove them** locally and rely on environment variables or a non-tracked `config.php` copied at deploy time (see §5).

------

## 1) Prepare a feature branch & backups

```bash
git checkout -b feat/figma-make-install
mkdir -p crm-app/.backup/figma-preinstall-$(date +%Y%m%d)
cp -R crm-app/components/ui crm-app/.backup/figma-preinstall-*/ui
cp -R crm-app/components/layout crm-app/.backup/figma-preinstall-*/layout
cp crm-app/app/globals.css crm-app/.backup/figma-preinstall-*/globals.css
```

------

## 2) Read once: design notes you must follow

- `figma/README.md`
- `figma/src/Attributions.md`
- `figma/src/components/ui/*` (primitives & states)
- `figma/src/components/*` (page-level markup patterns: `crm-sidebar.tsx`, `associations-list.tsx`, `association-detail-modal.tsx`, `customer-list.tsx`, `customer-detail-sheet.tsx`, `analytics-dashboard.tsx`, `ai-settings.tsx`, …)

**Rule:** Lift **visual markup/states** only. All data flows stay as in `crm-app`.

------

## 3) Tokens & primitives (merge, don’t duplicate)

**Source of truth:** `crm-app` Tailwind + existing `components/ui/*`.

1. Compare `figma/src/components/ui/*` to `crm-app/components/ui/*`.

2. For each primitive (e.g., `button`, `card`, `dialog`, `form`, `input`, `select`, `table`, `tabs`, etc.):

   - Keep your current component.

   - Add **only** missing variants/states required by Figma.

   - Mark each change with a porting comment, e.g.:

     ```ts
     // PORT(Figma Make 2025-11-06): added "subtle" + "ghost" variants per figma/src/components/ui/button.tsx
     ```

3. If new design tokens are required, extend **once**:

   - `crm-app/app/globals.css` (CSS variables block)
   - `tailwind.config.js` (theme extension if needed)

4. Document every token you add in a new file:

   - `docs/FIGMA_MAKE_TOKENS_MERGE.md` → name, purpose, where used.

> Do **not** import a second design system. We are enriching the existing one.

------

## 4) Layout shell & navigation

- Update **visuals only** using figma references:
  - `crm-app/components/layout/app-layout.tsx`
  - `crm-app/components/layout/sidebar.tsx`
  - `crm-app/components/layout/topbar.tsx`
- Keep all `Link` targets and active state logic.
- If Figma uses icons not present, prefer `lucide-react` substitutes already used in the app.

------

## 5) PHP API & configuration on Loopia (keep as-is, secure the secrets)

- Your PHP endpoints exist under `api/`:
  - Examples: `api/associations.php`, `api/association_detail.php`, `api/contacts.php`, `api/municipalities.php`, `api/tags.php`, `api/login.php`, `api/auth/me.php`, `api/csrf.php`
  - Bootstrap, session, CSRF, and DB helpers: `api/bootstrap.php`
  - API hardening: `api/.htaccess`
- **DB credentials**:
  - Preferred: **environment variables** (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`) read in `api/bootstrap.php`.
  - Fallback: a **non-tracked** `api/config.php` (pattern in `api/config.sample.php`).
- **Action for agent**:
  - If a committed `api/config.php` currently holds real secrets, remove the secrets from Git (rewrite or replace with sample) and use env or a private deploy-time copy. Do **not** echo or log credentials anywhere.

------

## 6) Frontend → API wiring (already supported, do not reinvent)

- All frontend data calls should go through:
  - `crm-app/lib/api.ts` (JSON wrapper)
  - `crm-app/lib/backend-base.ts` (resolves base URL; same-origin by default)
- When you transplant Figma components, replace any mock data with calls from `api.ts`.
- Do **not** hardcode `/api` paths in pages; use the helpers that are already there.

------

## 7) Page-by-page UI transplant (exact targets)

Apply in this order to keep diffs small and rollbacks easy:

1. **Dashboard**
   - Reference: `figma/src/components/analytics-dashboard.tsx`
   - Targets:
     - `crm-app/app/dashboard/page.tsx`
     - `crm-app/app/dashboard/_components/*` (update presentation only)
2. **Associations**
   - References: `associations-list.tsx`, `association-detail-modal.tsx`
   - Targets:
     - `crm-app/app/associations/page.tsx`
     - `crm-app/components/modals/association-details-dialog.tsx`
   - Keep existing filters/search state; swap the markup and classNames to match Figma.
3. **Contacts**
   - References: `customer-list.tsx`, `customer-detail-sheet.tsx`
   - Targets:
     - `crm-app/app/contacts/page.tsx`
     - Any existing contact modals/components under `components/*` (UI only)
4. **Groups**
   - Reference: Figma card/list pattern
   - Target: `crm-app/app/groups/page.tsx` (visuals only)
5. **Import**
   - Target: `crm-app/app/import/page.tsx` (buttons, dropzones, progress UI → Figma styles)
6. **Settings (AI)**
   - Reference: `figma/src/components/ai-settings.tsx`
   - Target: create `crm-app/app/settings/ai/page.tsx` (UI only, no new backend)

**Rule:** Never remove existing handlers/state/data calls. Replace **JSX + classes** only.

------

## 8) Static export (what you already have — use it)

The repo contains a **custom static exporter**:

- `crm-app/package.json`
  - `"export:static": "next build && node ./scripts/create-static-out.mjs"`
- `crm-app/scripts/create-static-out.mjs`
   Copies the necessary `.next` outputs into `crm-app/out/` (including `_next` assets).

**Agent steps:**

```bash
cd crm-app
# Ensure no SSR/middleware/server-actions are introduced while porting UI.
npm run export:static
# Result: crm-app/out/   (static site ready to upload)
```

> Do not add Next middleware, edge functions, or anything that would block static export.

------

## 9) Loopia deploy (use the scripts that exist)

Scripts are already provided:

- `deploy/loopia/export.ps1`
   Runs the static export with proper env cleanup for a Loopia-safe bundle.
- `deploy/loopia/sync.ps1`
   Syncs `crm-app/out/` to Loopia over FTP/WinSCP (reads creds from `crm-app/.env`).
- `deploy/loopia/test-ftp.ps1`
   Validates connection against the remote path.

**Required environment variables (in `crm-app/.env`, non-committed):**

```
FTPHOST=ftp.example.com
FTPPORT=21
FTPUSER=your_ftp_user
FTPPASSWORD=your_ftp_password
FTP_REMOTE_PATH=/public_html
# Optional API base overrides, but same-origin is default & recommended:
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_API_BASE_URL_DEV=
NEXT_PUBLIC_API_BASE_URL_PROD=
BACKEND_API_BASE_URL=
BACKEND_INTERNAL_URL=
```

**Agent commands (Windows/PowerShell):**

```powershell
# 1) Build static bundle
pwsh -File deploy/loopia/export.ps1

# 2) (Optional) Test FTP connectivity and target path
pwsh -File deploy/loopia/test-ftp.ps1 -RemotePath '/public_html' -WinScpPath 'C:\Path\To\WinSCP.com'

# 3) Sync the static site to Loopia
pwsh -File deploy/loopia/sync.ps1 -OutPath 'crm-app\out' -WinScpPath 'C:\Path\To\WinSCP.com'
```

**Result on Loopia:**

- Static site uploaded under `/public_html/` (or the path you set).
- PHP API should reside at `/public_html/api/` with `api/.htaccess` active.

------

## 10) Caching & SPA behavior

- `crm-app/public/.htaccess` already configures **long cache** for hashed assets and **no-cache** for HTML. Keep it.
- Because we export static HTML per route, a generic SPA fallback isn’t required. If later you add purely client-side routes not materialized as HTML, add a history-fallback rule at the root `.htaccess` (not needed now with the current exporter).

------

## 11) Post-deploy verification (same host, same origin)

1. **Auth:**
   - Visit `/login` → check CSRF, session cookie, and `api/login.php` flow (POST).
   - Then `GET /api/auth/me.php` must return the authenticated user.
2. **Data views:**
   - `/dashboard` → cards render (data via `lib/api.ts` calls).
   - `/associations` → list + filters + details dialog (UI from Figma, data unchanged).
   - `/contacts`, `/groups`, `/import` → present and functional.
3. **Headers:**
   - Check `api/.htaccess` headers: `Content-Type`, `nosniff`, `SAMEORIGIN`, `Cache-Control: no-store`.
   - Check static assets: long cache per `public/.htaccess`.
4. **No console errors:**
   - Ensure no 404s to `_next/*` or missing CSS/JS.
5. **Artifacts (optional):**
   - Store screenshots under `web/test-reports/<date>-figma-port/` for traceability.

------

## 12) Rollback

- Re-upload the previous artifact kept in `deploy/artifacts/` (zips exist like `deploy/artifacts/crm-frontend-YYYYMMDD_HHMMSS.zip`).
- Or restore UI from `crm-app/.backup/figma-preinstall-<date>/` and re-export.

------

## 13) Deliverables (must-have at PR time)

- Updated **UI primitives** in `crm-app/components/ui/*` with `// PORT(Figma Make …)` comments.
- Updated **layout** in `crm-app/components/layout/*`.
- Page refactors (`dashboard`, `associations`, `contacts`, `groups`, `import`) with **no logic changes**.
- New `crm-app/app/settings/ai/page.tsx` (UI only).
- `docs/FIGMA_MAKE_TOKENS_MERGE.md` describing every new token and where used.
- Successful `npm run export:static` and successful `deploy/loopia/sync.ps1`.
- No leaked secrets in Git; `api` reads DB settings from env or a private `config.php`.

------

### Quick sanity checklist for the agent

-  No SSR/middleware/server actions added.
-  All API calls flow through `lib/api.ts` / `lib/backend-base.ts`.
-  Figma UI markup/styles transplanted; state/handlers/data intact.
-  Static export builds to `crm-app/out/` without errors.
-  FTP sync completes; site renders correctly on Loopia.
-  PHP API responds with valid JSON and correct headers.
-  Secrets are **not** in the repo; `.env` is used for FTP; DB creds supplied via env or private `api/config.php`.

------

