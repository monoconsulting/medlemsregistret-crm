# Phase 4 Verification Checklist

This checklist translates the requirements in `docs/MCRM_SIMPLIFIED_FRONTEND_IMPLEMENTATION_PLAN_2.md`
into concrete actions that must be performed once the Phase 3 build is frozen.
Mark each item when evidence (screenshots, HAR, logs, or notes) has been captured.

## 4.1 Functional E2E
- [ ] Login with valid credentials, land on `/associations`, and confirm table renders.
- [ ] Apply filters for municipality, type, status, and tags (ensure query params reflected in network requests).
- [ ] Open an association, edit basic fields, and save; confirm UI refreshes and PHP API returns `200`.
- [ ] Add a note via the sidebar dialog and verify it appears in the notes list.
- [ ] Attach and detach a tag; ensure both list and detail view stay in sync.
- [ ] Soft delete an association and confirm it disappears from the list while `deleted_at` populated in DB.
- [ ] Trigger pagination (next/previous) and confirm totals update.
- [ ] Attempt POST without CSRF header (expect `403`).
- [ ] Attempt GET `/api/associations.php` while logged out (expect `401`) and confirm UI redirects to `/login`.
- [ ] Logout and verify browser storage/session cleared.
- [ ] Hit the login rate limit (≥5 attempts in <60s) and confirm HTTP `429` with friendly UI messaging.

## 4.2 Security Sanity
- [ ] Confirm PHP session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` on HTTPS.
- [ ] Verify CSRF cookie is readable by JS (`HttpOnly` false) and rotates on login.
- [ ] Check `.htaccess` headers for `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.
- [ ] Review PHP endpoints for parameterized queries and enforce `pageSize ≤ 100`.
- [ ] Validate allowed `sort` keys are restricted to the whitelist in `order_by()`.
- [ ] Trigger association write rate limit (30 mutations in <60s) and ensure the API returns HTTP `429`.

## 4.3 Performance Gates
- [ ] Execute `db/extra_indexes.sql` on both local and Loopia databases; capture output (should be zero errors).
- [ ] Use DevTools to sample association list and filtered queries; record server timing (< 300 ms target).
- [ ] Run cURL script (`scripts/verification/curl-smoke.sh`) to log response times for `/api/csrf.php`,
      `/api/login.php`, `/api/associations.php`, and `/api/logout.php`.
- [ ] Optionally capture MySQL `EXPLAIN` output for the heaviest search query.

## 4.4 Logging & Error Hygiene
- [ ] Confirm PHP error logging is directed to file (not browser) in production.
- [ ] Inspect browser console for warnings/errors across the full E2E flow.
- [ ] Ensure unhandled promise rejections are captured via `window.addEventListener('unhandledrejection', ...)` or equivalent monitoring.

## 4.5 Environment Parity
- [ ] Repeat the functional script against the static export served locally (`crm-app/out/` + `api/`).
- [ ] Repeat against the Loopia deployment; compare HAR traces to ensure identical request patterns.
- [ ] Archive HAR files under `docs/har/` (e.g., `loopia_e2e.har`, `local_static_e2e.har`).

## Artifacts to produce
- HAR files (`docs/har/`).
- Shell transcript of cURL smoke test (`scripts/verification/curl-smoke.sh`, requires `CRM_VERIFICATION_EMAIL`/`CRM_VERIFICATION_PASSWORD` env vars).
- Notes/logs for manual verification (stored alongside worklogs or in `docs/verification/`).
- Any follow-up issues filed for defects discovered during Phase 4.
