# Phase 4 Verification Runbook

Use this checklist to execute the functional, security, and performance tests on
both the local static export and the Loopia deployment. Complete the steps in
order and store the produced artifacts under `docs/har/` and `docs/worklog/`.

## 1. Preparation

All paths below assume you are in the repository root (`/mnt/e/projects/CRM`).

### 1.1 Local static build (dev parity)

1. Generate the export inside the frontend project:
   ```bash
   cd crm-app
   npm install            # skip if already installed
   npm run export
   cd ..
   ```
2. Stage a local webroot that mirrors the Loopia layout:
   ```bash
   Remove-Item -Recurse -Force temp/local_webroot -ErrorAction SilentlyContinue
   New-Item -ItemType Directory -Path temp/local_webroot | Out-Null
   Copy-Item -Recurse crm-app/out/* temp/local_webroot/
   Copy-Item -Recurse api temp/local_webroot/api
   ```
3. Serve static files **and** PHP API from the same origin:
   ```bash
php -S 127.0.0.1:8080 -t temp/local_webroot
```
If port `8080` is unavailable, choose any free port (for example `8060`) and use that consistently in the commands and browser URLs.
Leave this terminal running. The site is now reachable at `http://127.0.0.1:8080` (or the alternate port you selected).

### 1.2 Remote production (Loopia)

Use the public domain where the static export + PHP API is deployed (e.g.
`https://example.com`). Ensure the release you want to verify is already uploaded.

### 1.3 Shared prep

1. Set terminal environment variables for automated scripts (do **not** commit):
   - Bash:
     ```bash
     export CRM_VERIFICATION_EMAIL="user@example.com"
     export CRM_VERIFICATION_PASSWORD="secret"
     ```
   - PowerShell:
     ```powershell
     $env:CRM_VERIFICATION_EMAIL = "user@example.com"
     $env:CRM_VERIFICATION_PASSWORD = "secret"
     ```
2. Launch Chrome, Edge, or Firefox on your local machine (DevTools is required for HAR export).
3. In DevTools, enable **Preserve log** in the Network tab before starting the flow.

## 2. Manual flow (mirrors `MCRM_PHASE4_VERIFICATION_CHECKLIST.md`)

Run the following sequence twice:
1. Against the **local** environment (`http://127.0.0.1:8080` served from `temp/local_webroot`; substitute the alternate port if you picked one).
2. Against the **Loopia production** domain (e.g. `https://crm.example.com`).

1. Visit `/login`, authenticate, and land on `/associations`.
2. Exercise filters (municipality, type, status, tags) and capture the requests.
3. Open an association, perform an edit, add/remove tags, add a note, and soft-delete.
4. Exercise pagination (next/previous) and sorting options.
5. Attempt an authenticated POST with the network tab’s “Replay” feature after removing the `X-CSRF-Token` header; expect `403`.
6. Logout, clear cookies, and request `/api/associations.php` directly to confirm `401`.
7. Repeat the login POST multiple times (≥5 in 60 seconds) to trigger the rate limit (expect `429`); ensure the UI surfaces the message gracefully.
8. Repeat 30 quick update/delete operations via the UI or repeated fetches to confirm association writes return `429`.

## 3. HAR capture

1. Start recording in devtools before step 2.
2. After completing the happy path, export the HAR:
   - Chrome: Network tab → “Export HAR”
   - Firefox: Network tab → context menu → “Save all as HAR”
3. Save two files:
   - `docs/har/local_static_e2e.har`
   - `docs/har/loopia_e2e.har`

## 4. Smoke script

Run the automated smoke test for both environments, from the repository root:

```bash
BASE_URL=http://127.0.0.1:8080 CRM_VERIFICATION_EMAIL=... CRM_VERIFICATION_PASSWORD=... \
  ./scripts/verification/curl-smoke.sh

BASE_URL=https://your-loopia-domain CRM_VERIFICATION_EMAIL=... CRM_VERIFICATION_PASSWORD=... \
  ./scripts/verification/curl-smoke.sh
```

Copy the terminal output into `docs/worklog/<date>_Worklog.md`.

## 5. Performance sampling

1. In devtools, inspect network entries for `associations.php` under different filters.
2. Record `server-timing` and `duration` values; target < 300 ms on Loopia.
3. Optionally run `EXPLAIN` for the heaviest query via phpMyAdmin and store screenshots or SQL output in `docs/verification/`.

## 6. Reporting

1. Update the checklist (`docs/MCRM_PHASE4_VERIFICATION_CHECKLIST.md`) marking completed items.
2. Append a verification summary to the current worklog entry:
   - Date and environment
   - Artifacts added
   - Outstanding issues (link to GitHub/issue tracker)
3. Archive the HAR files and any supplementary logs.
