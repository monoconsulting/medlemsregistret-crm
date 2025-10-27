# CRM Deployment Plan (Loopia Static Frontend + External Node Backend)

## 1. Hosting Constraints and Goals
- **Loopia** provides FTP and MariaDB (port 3306) but **no Node.js runtime or SSH shell**, so anything under `/crm-app/app/api/**`, middleware, or tRPC handlers cannot execute there.
- The CRM must therefore be split into:
  - a **static frontend build** (HTML/CSS/JS) deployed to Loopia, and
  - an **external Node.js backend** (VPS, container, or managed host) that exposes the APIs, authentication, background jobs, and database access.
- Both environments must read/write the shared MariaDB instance on Loopia unless we later move the production database elsewhere.
- Deployments must remain reproducible and simple enough to run from a Windows workstation via PowerShell scripts.

## 2. Current Application Inventory (based on 2025-10-27 code)

### 2.1 Next.js Configuration
| File | Key Observations | Static Export Impact |
| ---- | ---------------- | -------------------- |
| `crm-app/next.config.ts` | `output: 'standalone'`, `experimental.serverActions` enabled. | `next export` requires `output: 'export'` and server actions disabled. |
| `crm-app/package.json` | Uses Next.js 15 App Router with tRPC and NextAuth. | Keep dependencies, but frontend build will run `next build && next export`. |

### 2.2 Server-Only Features that Cannot Run on Loopia
| Area | Files | Notes |
| ---- | ----- | ----- |
| **API routes** | `app/api/**/route.ts` (`trpc`, `auth`, `import`, `import/check`, `associations/[id]/notes`) | Every route uses Prisma (`db`), file uploads, or NextAuth. Export must eliminate these routes from the static bundle and host them on the backend. |
| **tRPC server** | `server/trpc.ts`, `server/routers/*.ts` | All routers depend on Prisma, `child_process` (`scraping.ts`), `bcryptjs`, and environment secrets. These must run on the Node backend. |
| **NextAuth** | `lib/auth.ts`, `lib/auth-prisma-adapter.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts` | Authentication, session handling, and middleware require a running Node server with edge runtime disabled (`runtime: "nodejs"`). |
| **Middleware** | `crm-app/middleware.ts` | Protects routes using NextAuth session; relies on Node runtime. Needs to move to backend or be replaced by client-side guards + backend session validation. |
| **Scraping integration** | `server/routers/scraping.ts` | Invokes `child_process.exec` to run Playwright scripts and writes to `scraping/json/**`. Not feasible on Loopia; keep on backend. |
| **AI/Search providers** | `lib/ai/provider.ts`, `lib/search.ts` | Requires outbound HTTP fetch with secrets (OpenAI, Anthropic, Typesense, Meilisearch). Must run server-side. |

### 2.3 Client-Side Pages and Hooks
Most dashboard screens are already client components using `trpc` hooks (e.g. `app/(dashboard)/associations/page.tsx`, `app/(dashboard)/dashboard/_components/**/*.tsx`). They expect `/api/trpc` to exist. After moving tRPC to the backend, the client must call the backend URL via `NEXT_PUBLIC_API_BASE_URL`.

### 2.4 Authentication Flow
- `App` layout wraps children with `AuthProvider` (`SessionProvider` from NextAuth) and `TRPCProvider`. Without a local `/api/auth`, the frontend must retrieve session data via HTTP-only cookies or switch to JWT-based login handled entirely by the backend.
- `middleware.ts` enforces route guards server-side. On a static host we must rely on:
  - backend-issued auth cookies validated when calling APIs, and
  - client-side guards (`RoleGuard` already exists) using a `/me` endpoint on the backend.

### 2.5 Database Usage
- `crm-app/prisma/schema.prisma` uses MariaDB via `DATABASE_URL`.
- All mutations, imports, and export logic run through Prisma in tRPC routers or API routes—another reason they must reside on the backend.

## 3. Target Architecture

1. **Static Frontend on Loopia**
   - Build via `next build && next export` into `crm-app/out`.
   - Deploy the `out/` directory through FTPS (`ftpcluster.loopia.se`).
   - Frontend environment variables (public only) set during build or injected at runtime via `<script>` that reads `/config.json` fetched from backend.
2. **Node Backend (External Host)**
   - Packages existing tRPC routers, API routes, auth, and scraping utilities into a standalone server (Express/Fastify or Next.js server running in standalone mode). A dedicated workspace now lives in `backend/`.
   - Connects to Loopia MariaDB (`mysql513.loopia.se`) using Prisma.
   - Exposes HTTPS endpoints: `/api/trpc`, `/api/auth/*`, `/api/import`, `/api/export`, `/api/scraping`, `/api/health`.
   - Handles session cookies (NextAuth or custom JWT) and CORS for the Loopia domain.
3. **CI/CD Flow**
   - Local Windows scripts to build and sync frontend assets.
   - Separate deployment pipeline (manual PowerShell or GitHub Actions) to build Docker/PM2 bundle for backend host.
4. **Database Sync Strategy**
   - Use `mysqldump`/`mysql` CLI with credentials from `.env.production` for push/pull.
   - Maintain versioned backups in `backups/` (excluded from git).

## 4. Frontend Workstream (Static Export Readiness)

### 4.1 Configuration and Build Changes
1. Update `crm-app/next.config.ts`:
   - Static export is now opt-in via `NEXT_ENABLE_STATIC_EXPORT=true` (or `NEXT_OUTPUT=export`) when running `next build`. In dev/local builds the project keeps API routes enabled for NextAuth.
   - When enabled, the config sets `output: 'export'` and disables image optimization implicitly (`images.unoptimized = true`).
2. Add `export const runtime = 'edge'` or `export const dynamic = 'force-static'` where needed for compatibility; ensure no server-only APIs remain in components.
3. Replace `app/page.tsx` server redirect with a client-side redirect:
   - Convert to `'use client'` and call `useRouter().replace('/dashboard')` in `useEffect`.
4. Remove all `app/api/**` folders from the frontend build (they will live in backend project).
5. Ensure `middleware.ts` is excluded from frontend export. Move route protection to backend + client guard.

### 4.2 API Client Reconfiguration
1. Update `lib/trpc/client.ts`:
   - Make `getBaseUrl()` return `process.env.NEXT_PUBLIC_API_BASE_URL` on the client.
   - During static build, inject the backend URL via `.env.production` (e.g., `NEXT_PUBLIC_API_BASE_URL=https://api.crm-domain.se`).
2. Review direct fetches (e.g., `lib/search.ts`) and ensure they call the backend or run conditionally only on the backend.
3. Validate that every client component handles `401`/`403` responses gracefully since middleware will no longer enforce redirects.
4. The shared `AuthProvider` automatically detects `NEXT_PUBLIC_API_BASE_URL`; when unset it uses the legacy NextAuth endpoints (for local/dev), otherwise it talks to the external backend (`/api/auth/login|logout|me`).

### 4.3 Authentication UX
1. Introduce a `/api/auth/me` endpoint on backend returning session summary.
2. Update `RoleGuard` to fetch `/api/auth/me` (via TRPC or REST) and store result in React Query, replacing reliance on NextAuth session object.
3. Modify login form (`app/login/page.tsx`) to POST credentials to backend `/api/auth/login` endpoint that issues cookies accessible to Subdomain/Loopia origin.

### 4.4 Static Asset Deployment Scripts
Implemented PowerShell helpers under `deploy/loopia/`:
- `export.ps1` – runs `npm ci` (optional), `prisma generate`, and `npm run export:static` to produce `crm-app/out/`.
- `sync.ps1` – uses `WinSCP.com` to mirror `crm-app/out/` to the configured FTP directory (defaults to `/public_html`). Reads credentials from `FTPHOST`, `FTPUSER`, `FTPPASSWORD`, and `FTPPORT`.
Add a `.ftpignore` later if further exclusions are required.

## 5. Backend Workstream (External Node Service)

### 5.1 Project Extraction
1. Backend workspace created in `backend/` with its own `package.json`, `tsconfig.json`, `.env.example`, and Express entry point (`src/server.ts`).
2. Existing tRPC routers and importer logic are consumed directly from `crm-app/server` and `crm-app/lib`, minimising duplication.
3. The backend implements custom JWT-based auth endpoints (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) and mounts tRPC via `createExpressMiddleware`.

### 5.2 Operational Features
| Feature | Action |
| ------- | ------ |
| **Import endpoints** (`app/api/import/**`) | Port to Express routes that call `importAssociations()` exactly as today. |
| **Notes endpoint** | Provide `POST /api/associations/:id/notes`. |
| **Scraping router** | Keep `server/routers/scraping.ts` but guard with `.env.ALLOW_SHELL_SCRIPTS`. Consider moving scraping tasks to dedicated orchestrator (optional). |
| **AI provider** | Keep optional; ensure secrets injected as environment variables in backend deployment. |
| **Search** | Backend should proxy to Typesense/Meilisearch. Provide config via `.env`. |

### 5.3 Deployment
- Decide hosting (e.g., DigitalOcean droplet, Hetzner, Render). Document firewall rules allowing outbound 3306 to `mysql513.loopia.se`.
- Use PM2 or Docker; `deploy/backend/build.ps1` now bundles `backend/dist`, `package.json`, and Prisma schema into a zip artifact ready for transfer. A remote redeploy script/webhook is still TODO.
- Store secrets securely (environment variables in `.env.production.backend`).

### 5.4 CORS and Cookies
- Configure backend to accept requests from Loopia origin(s):  
  ```ts
  app.use(cors({ origin: ['https://www.loopiadomain.se'], credentials: true }));
  ```
- Set `trust proxy` if behind reverse proxy. Ensure responses set `Access-Control-Allow-Credentials`.

## 6. Database Migration & Synchronisation Strategy

### 6.1 Initial Migration to Loopia MariaDB
1. From development machine (local MySQL on port 3316):  
   `mysqldump --skip-lock-tables --set-gtid-purged=OFF -h 127.0.0.1 -P 3316 -u <devuser> -p crm_database > backups/initial-prod.sql`
2. Upload to Loopia:  
   `mysql -h mysql513.loopia.se -u "walla3jk@m383902" -pKlang83nsleijooijn3 < backups/initial-prod.sql`
3. Run `npx prisma migrate deploy` on backend host pointing to Loopia DB.

### 6.2 Ongoing Sync Scripts (`deploy/db/`)
| Script | Purpose |
| ------ | ------- |
| `backup-remote.ps1` | Dumps the production database via `mysqldump`, optionally gzips it, and can restore directly to the local environment. |
| `promote-local.ps1` | Creates a local dump and imports it into the remote Loopia instance (toggle import with `-SkipRemoteImport`). |

All scripts should log to `deploy/logs/*.log` with timestamps and command exit codes.

### 6.3 Verification Checklist
After each sync:
1. Query three random associations (SQL) both locally and remotely to confirm parity.
2. Hit backend `/api/health` endpoint.
3. Load Loopia frontend and verify:
   - Dashboard totals,
   - Association list filter,
   - Contact details modal.

Document results in `deploy/logs/verify-YYYYMMDD.txt`.

## 7. Automation & Tooling Roadmap
- **PowerShell menu** for non-technical users with options:
  1. Build & export frontend
  2. Sync frontend to Loopia
  3. Backup remote DB
  4. Promote local DB to remote
  5. Trigger backend redeploy
- **GitHub Actions (future)**:
  - Workflow `frontend-deploy.yml`: on tag → run `npm ci`, `npm run export`, upload artifact, trigger FTP deploy via reusable action.
  - Workflow `backend-deploy.yml`: on branch merge → build Docker image, push to registry, SSH to host and restart container.
- **Monitoring**:
  - Add uptime checks for backend API.
  - Collect logs (PM2 or Docker) into centralized system (Papertrail/Logtail).

## 8. Open Risks & Mitigations
- **Authentication shift**: Switching away from NextAuth’s App Router integration requires careful cookie handling. Mitigation: implement integration tests hitting `/api/auth/login` from Node to ensure tokens set correctly.
- **CORS/CSRF**: Separate domains increase CSRF risk. Mitigation: use SameSite=None cookies plus anti-CSRF tokens returned by backend.
- **FTP Deploy Errors**: FTP is less reliable. Mitigation: scripts should use `mirror --delete --continue` and maintain checksum logs.
- **Database Latency**: Backend host connecting over WAN to Loopia MariaDB may incur latency. Monitor query times; consider migrating DB later if needed.
- **Scraping Jobs**: Running Playwright from backend host may require additional dependencies (Chromium). Document prerequisites (`pnpm exec playwright install chromium`) on backend host.

## 9. Execution Timeline (Suggested)
1. **Week 1** – Finalize architecture, stand up backend skeleton, adjust env handling.
2. **Week 2** – Port API routes/tRPC to backend, update frontend API client, replace auth flow.
3. **Week 3** – Implement deployment scripts, perform trial deploy (frontend + backend), write verification results.
4. **Week 4** – Automate backups, add monitoring, document operational runbooks.

## 10. Next Actions Checklist
- [ ] Confirm backend hosting provider and domain.
- [x] Create `backend/` project and port `server/` routers.
- [x] Update frontend to use `NEXT_PUBLIC_API_BASE_URL`.
- [x] Implement login/logout endpoints on backend and update frontend forms.
- [x] Build PowerShell scripts in `deploy/loopia/`, `deploy/backend/`, and `deploy/db/`.
- [ ] Run end-to-end dry run: export frontend → FTP deploy → backend redeploy → data verification.
