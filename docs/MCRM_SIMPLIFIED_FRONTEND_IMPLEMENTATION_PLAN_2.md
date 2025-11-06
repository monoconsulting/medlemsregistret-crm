- # Standalone Frontend – Implementation Plan (Phases 3–5)

  > Goal: Complete the rollout of a dramatically simplified, **standalone** frontend that runs identically on **Loopia (remote)** and **local** environments, using a **same-origin PHP API** and the **existing MySQL/MariaDB**. Phases 3–5 cover build/export, local run, Loopia deployment, verification, performance, hardening, docs, and rollback.

  ------

  ## 🔗 Paste-from-PART1 references (reuse these code blocks from `MCRM_SIMPLIFIED_FRONTEND_PART1.md`)

  > When a task says **“Paste from PART1”**, copy the exact block from PART1.

  - **[P1-A]** `crm-app/lib/api.ts` – fetch client (already used in Phases 0–2; keep for reference).
  - **[P1-B]** `/api/.htaccess` – security headers & folder hardening for the API.
  - **[P1-C]** `/api/bootstrap.php` – session, DB, helpers.
  - **[P1-D]** `/api/csrf.php` – CSRF issuance.
  - **[P1-E]** `/api/login.php` – POST login (bcrypt).
  - **[P1-F]** `/api/logout.php` – POST logout.
  - **[P1-G]** `/api/municipalities.php` – GET list.
  - **[P1-H]** `/api/tags.php` – GET + POST (create/attach/detach).
  - **[P1-I]** `/api/association_notes.php` – GET/POST.
  - **[P1-J]** `/api/associations.php` – GET (filters + paging + sort) + write ops with CSRF.

  > If filenames differ slightly, match by content/behavior.

  ------

  ## 🧱 Phase 3 — Build, Local Run, and Loopia Deploy (≈ 1 day)

  > **Outcome:** A reproducible static export (`out/`) plus an `api/` folder that run identically on local and Loopia. No CORS, no SSR.

  ### Sprint 3.1 — Prep static export & assets

  **Task 3.1.1 — Next.js export settings**

  - Ensure the app can be statically exported. If needed, create/update `next.config.js`.
  - **Supplement S-3** below provides a safe `next.config.js` for export (no SSR-only features, images unoptimized, optional trailingSlash).

  **Task 3.1.2 — Remove SSR usage**

  - Confirm (from Phase 2) that no pages depend on `getServerSideProps` or server-only APIs. Client fetch via `lib/api.ts` only.

  **Task 3.1.3 — Build & export**

  - Run: `npm run build && npm run export` → verify `out/` contains all routes used after login.
  - Ensure `404.html` exists (Next export usually creates it). Keep friendly error pages.

  ### Sprint 3.2 — Local run mirrors Loopia

  **Task 3.2.1 — Webroot layout**

  ```
  project-root/
    out/                # static site from Next export
    api/                # PHP API (same-origin)
  ```

  **Task 3.2.2 — Run locally with PHP**

  - Option A: PHP built-in server from a parent folder that exposes BOTH `out/` and `api/` as webroot children:
    - `php -S localhost:8080 -t ./`  (place `index.html` under `out/` and browse `http://localhost:8080/out/` or symlink `out/` → `/`)
  - Option B: XAMPP/Apache. Document exact docroot mapping so that `/api/` is adjacent to static files (same-origin).

  **Task 3.2.3 — Root headers (optional)**

  - If you want additional headers for the **static site**, add a root `.htaccess`. See **Supplement S-4**.

  ### Sprint 3.3 — Loopia deploy

  **Task 3.3.1 — Upload files**

  - Upload `out/` contents into `public_html/` (or a subfolder you serve as root).
  - Upload `/api/` to `public_html/api/`.

  **Task 3.3.2 — PHP version & config**

  - In Loopia panel, ensure PHP version ≥ the minimum your code requires.
  - Provide DB credentials via `api/config.php` or environment (see Phase 0 S-1 pattern). Never commit secrets.

  **Task 3.3.3 — Permissions**

  - `api/` PHP files: `0644`, folders `0755`. No writeable folders unless explicitly needed (and then protect them).

  **Task 3.3.4 — Smoke tests (curl)**

  - From local shell, run **Supplement S-6** cURL script:
    - `GET /api/csrf.php` → token and `csrf` cookie
    - `POST /api/login.php` → 200 session established
    - `GET /api/associations.php` → list JSON
    - `POST /api/logout.php` → session cleared

  ------

  ## 🔍 Phase 4 — Verification, Quality Gates & Performance (½–1 day)

  > **Outcome:** The site behaves identically locally and on Loopia, passes functional and security checks, and meets basic performance targets.

  ### Sprint 4.1 — Functional E2E

  **Task 4.1.1 — Manual test script**

  - Login → list associations → filter by municipality/type/status/tags → open an association → add a note → attach/detach tag → edit association → soft delete → pagination and sort checks → logout.
  - Repeat with invalid CSRF (expect 403) and as unauthenticated (expect 401).

  **Task 4.1.2 — Record a HAR**

  - In browser devtools, record a HAR of happy-path and store at `docs/har/loopia_e2e.har`.

  ### Sprint 4.2 — Security sanity

  **Task 4.2.1 — Cookies & CSRF**

  - Session cookie: `HttpOnly`, `Secure` (on HTTPS), `SameSite=Lax`.
  - CSRF cookie: **readable** by JS (not HttpOnly). POST/PUT/PATCH/DELETE require `X-CSRF-Token`.

  **Task 4.2.2 — Headers**

  - Confirm API `.htaccess` sets security headers (from **[P1-B]**). Optionally add static-site headers (S-4).

  **Task 4.2.3 — Input validation**

  - Confirm parameterized queries everywhere; verify allowed sort keys and pageSize ≤ 100 per **[P1-C]** helpers.

  ### Sprint 4.3 — Performance gates

  **Task 4.3.1 — DB indexes present**

  - Run `db/extra_indexes.sql` on both DBs (local + Loopia). Ensure zero errors.

  **Task 4.3.2 — Query timings**

  - Use browser devtools and the **Supplement S-6** script to sample queries. Aim: typical list/filter < 300ms server time on Loopia.

  **Task 4.3.3 — Explain plans (optional)**

  - Run EXPLAIN on heavy queries and verify index use.

  ### Sprint 4.4 — Logging & error hygiene

  **Task 4.4.1 — PHP error logging**

  - Disable display errors in production; log to file. Ensure no sensitive data is written.

  **Task 4.4.2 — Frontend**

  - No unhandled promise rejections. Errors surfaced as friendly toasts/messages.

  ### Sprint 4.5 — Environment parity

  **Task 4.5.1 — Same code, same behavior**

  - Re-run functional tests locally and on Loopia, compare network traces. There must be no environment-specific logic.

  ------

  ## 🛡️ Phase 5 — Hardening, Docs, Handover & Rollback (½ day)

  > **Outcome:** The system is resilient, documented, and easy to roll back if needed.

  ### Sprint 5.1 — Hardening & hygiene

  **Task 5.1.1 — Rate limiting (lightweight)**

  - Add a simple per-IP throttle for auth and write endpoints (e.g., token bucket in PHP session or short-lived counters). Document limits.

  **Task 5.1.2 — Input allowlists**

  - Reconfirm field-level validation for create/update. Enforce strict enums for `type`, `status`; sanitize free text.

  **Task 5.1.3 — Robots & caching**

  - Add `robots.txt` (see **Supplement S-5**) and conservative caching headers for API responses.

  ### Sprint 5.2 — Backups & rollback

  **Task 5.2.1 — DB backup routine**

  - Document a repeatable backup command for Loopia DB.

  **Task 5.2.2 — Web files snapshot**

  - Keep a zip/tar of `public_html/` (static + api) per release.

  **Task 5.2.3 — Rollback doc**

  - `docs/rollback.md`: exact steps to restore previous web snapshot and DB dump.

  ### Sprint 5.3 — Documentation set

  **Task 5.3.1 — Operational docs**

  - `docs/api_contract.md`, `docs/runtime_env.md`, `docs/static_export_notes.md`, `docs/har/` (HARs), `db/extra_indexes.sql`.

  **Task 5.3.2 — Legacy README**

  - `/legacy/README.md` explains what was parked, why, and how to run it locally if ever needed.

  ### Sprint 5.4 — Handover & repo hygiene

  **Task 5.4.1 — Worklog & change log**

  - Append to `docs/worklog/` per your AI worklog template.

  **Task 5.4.2 — Git cleanliness**

  - Ensure no secrets, no stray files; `.gitignore` updated if needed.

  ------

  ## 🧩 Supplements (added by this plan)

  ### S-3. `next.config.js` (export-safe baseline)

  ```js
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    output: 'export',              // enable static export
    images: { unoptimized: true }, // disable next/image optimization
    trailingSlash: false,          // set true if your hosting requires trailing slash
    reactStrictMode: true,
  };
  module.exports = nextConfig;
  ```

  ### S-4. Root `.htaccess` for static (optional)

  ```apache
  # Place in public_html/.htaccess (root), optional
  FileETag None
  <IfModule mod_headers.c>
    Header unset ETag
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=()"
  </IfModule>
  # Let exported Next pages resolve normally; 404.html will be used by default
  Options -Indexes
  ```

  ### S-5. `public/robots.txt` (minimal)

  ```
  User-agent: *
  Disallow:
  ```

  ### S-6. `scripts/smoke_curl.sh` (remote smoke test)

  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  BASE_URL="${1:-https://YOUR-DOMAIN}"  # e.g., https://crm.medlemsregistret.se
  COOKIE_JAR="/tmp/cookies.$$"
  trap 'rm -f "$COOKIE_JAR"' EXIT
  
  # 1) CSRF
  CSRF_JSON=$(curl -sS -c "$COOKIE_JAR" "$BASE_URL/api/csrf.php")
  CSRF=$(echo "$CSRF_JSON" | grep -o '"token"\s*:\s*"[^"]\+' | cut -d'"' -f4)
  [ -n "$CSRF" ] || { echo "No CSRF token"; exit 1; }
  
  # 2) Login (adjust fields)
  LOGIN_PAYLOAD='{"email":"admin@example.com","password":"REDACTED"}'
  curl -sS -b "$COOKIE_JAR" -c "$COOKIE_JAR" -H "Content-Type: application/json" \
       -H "X-CSRF-Token: $CSRF" -d "$LOGIN_PAYLOAD" \
       -X POST "$BASE_URL/api/login.php" > /dev/null
  
  # 3) Associations list
  curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/associations.php?q=&page=1&pageSize=20" | head -c 200
  
  # 4) Logout
  curl -sS -b "$COOKIE_JAR" -H "X-CSRF-Token: $CSRF" -X POST "$BASE_URL/api/logout.php" > /dev/null
  
  echo -e "\nSmoke OK"
  ```

  ### S-7. `docs/verification_matrix.md` (skeleton)

  ```md
  # Verification Matrix (Functional / Security / Performance)
  
  | Area | Test | Steps | Expected |
  |---|---|---|---|
  | Functional | Login happy path | CSRF → login → fetch list | 200s throughout; JSON list present |
  | Functional | Unauthorized | Clear cookies → fetch list | 401 |
  | Security | CSRF missing | POST without X-CSRF-Token | 403 |
  | Performance | List filter | time association list w/ filters | < 300ms server time |
  | Parity | Local vs Loopia | repeat tests both | identical responses |
  ```

  ------

  ## 📋 Quick Acceptance Checklist (Phases 3–5)

  | #    | Checkpoint                   | Criteria                                                     |
  | ---- | ---------------------------- | ------------------------------------------------------------ |
  | 1    | **Export succeeds**          | `npm run build && npm run export` produces `out/` without SSR errors; all needed routes exist; 404.html present. |
  | 2    | **Local run mirrors Loopia** | Static files and `/api/` are same-origin locally; functional tests pass locally. |
  | 3    | **Loopia deploy complete**   | `public_html/` contains exported site and `/api/`; PHP version OK; permissions sane; config in place. |
  | 4    | **Smoke tests pass**         | `scripts/smoke_curl.sh` completes with “Smoke OK” and expected JSON snippets. |
  | 5    | **Security checks**          | Session cookie Lax+HttpOnly+Secure (HTTPS); CSRF issued and enforced; headers present as per `.htaccess`. |
  | 6    | **Performance gates**        | Indexes applied; typical list/filter requests < 300ms server time. |
  | 7    | **Error hygiene**            | No unhandled front-end errors; PHP display_errors off in prod; error logs clean. |
  | 8    | **Docs complete**            | Verification matrix, runtime env, API contract, static export notes, rollback doc, worklogs updated. |
  | 9    | **Rollback ready**           | DB dump and web snapshot created; `docs/rollback.md` details exact steps. |
  | 10   | **Environment parity**       | Local and Loopia behave identically with the same codebase; no env-specific branches. |