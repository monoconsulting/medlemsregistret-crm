# Phase 5 Hardening & Documentation Plan

This plan translates the Phase 5 requirements from
`docs/MCRM_SIMPLIFIED_FRONTEND_IMPLEMENTATION_PLAN_2.md` into actionable items.
Each task lists the intended owner (Frontend, PHP API, or Ops) and required
artifacts.

## 5.1 Hardening & Hygiene

| Task | Owner | Notes / Deliverables | Status |
| --- | --- | --- | --- |
| Implement lightweight rate limiting for `/api/login.php`, `/api/associations.php` (write ops), and `/api/tags.php`. | PHP API | Use session/IP buckets stored in `$_SESSION` or MySQL table; document thresholds in Security section of `runtime_env.md`. | ✅ Implemented in `api/bootstrap.php`, applied in login/association/tag/note endpoints (Nov 2025). |
| Review and enforce input allowlists on all write endpoints (enum validation for `type`, `status`; sanitize free-text fields). | PHP API | Update `associations.php`, `tags.php`, and `association_notes.php`; add section to `api_contract.md`. | ✅ Added normalization helpers + env overrides (`CRM_ALLOWED_*`) and updated docs. |
| Add `public_html/robots.txt` with conservative directives per Supplement S-5. | Frontend | Commit template under `crm-app/public/robots.txt` before export. | ✅ `crm-app/public/robots.txt` now included in static export. |
| Define caching headers for static assets and API responses. | Ops / PHP API | Add `Cache-Control` headers in `.htaccess` (static) and `bootstrap.php` (API). | ☐ API now sends `Cache-Control: no-store`; static-site headers pending (`/api/.htaccess` + root `.htaccess`). |

## 5.2 Backups & Rollback

| Task | Owner | Notes / Deliverables | Status |
| --- | --- | --- | --- |
| Document repeatable DB backup process for Loopia. | Ops | Update `docs/backup.md` (new) with CLI steps or panel instructions. | ✅ `docs/backup.md` added (Nov 2025). |
| Produce web files snapshot procedure (zip/tar of `public_html/`). | Ops | Incorporate into `docs/runtime_env.md` or new `docs/rollback.md`. | ✅ Covered in `docs/backup.md` (Section 2). |
| Draft `docs/rollback.md` describing restore from previous static export + DB dump. | Ops | Include checksum guidance and validation steps. | ✅ `docs/rollback.md` added (Nov 2025). |

## 5.3 Documentation Set

| Task | Owner | Notes / Deliverables | Status |
| --- | --- | --- | --- |
| Ensure `docs/api_contract.md`, `docs/runtime_env.md`, and `docs/static_export_notes.md` reflect Phase 3–5 changes. | Frontend & PHP API | Update sections once implementation complete. | ☐ (status/rate-limit updates added; final review pending). |
| Populate `docs/har/` with HAR captures (happy path local + Loopia). | Frontend | Attach filenames `local_static_e2e.har`, `loopia_e2e.har` per `docs/verification/phase4_runbook.md`. | ☐ |
| Extend `legacy/README.md` with instructions on how to restore old Node stack if ever needed. | Frontend | Include caveats about unsupported status. | ☐ |
| Append to `docs/worklog/` per worklog template after each milestone. | Frontend | Note build hashes, verification summary. | ☐ |

## 5.4 Repo Hygiene / Follow-up

- Track removal of unused dependencies (`@trpc/*`, Prisma) once confirmed obsolete.
- Ensure `crm-app/scripts/` legacy utilities remain excluded from TypeScript checks (`tsconfig.json` already updated).
- Validate `.env` samples only contain variables required for PHP + static frontend; archive Node/tRPC-specific keys under `legacy/`.
- Before final handover, run `npm run lint` and the mandated tests in `docs/TEST_RULES.md`, logging results in worklog.
