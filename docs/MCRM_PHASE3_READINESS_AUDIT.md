# Phase 3 Readiness Audit – November 2025

This note captures the current repository state before executing Phases 3–5 of
the simplified frontend rollout (see `docs/MCRM_SIMPLIFIED_FRONTEND_IMPLEMENTATION_PLAN_2.md`).
It inventories the elements that already align with the target architecture and
flags outstanding deviations that must be handled in the upcoming tasks.

## ✅ In place
- `api/` PHP endpoints (`associations.php`, `tags.php`, `association_notes.php`,
  etc.) remain intact and depend solely on `bootstrap.php` helpers.
- `crm-app/app/associations/page.tsx` still renders the dashboard table, filters,
  dialogs, and calls into the PHP API via `@/lib/api`.
- `crm-app/lib/api.ts` provides a same-origin fetch wrapper covering CRUD for
  associations, tags, and notes.
- Next.js config supports static export through the `NEXT_OUTPUT=export`/`NEXT_ENABLE_STATIC_EXPORT` toggle.
- Legacy Node/tRPC backend continues to live under `legacy/backend/`, and no
  active imports inside `crm-app/` reference `@/server/*` or tRPC utilities.

## ⚠️ Gaps to close
- API client now uses `crm-app/lib/backend-base.ts`, but we still need to verify
  SSR/middleware callers once they are reinstated in later phases.
- Authentication provider simulates session refresh by calling
  `api.getAssociations()`. A dedicated `/api/login.php` success payload is not
  cached client-side, so Phase 4 verification should confirm this pattern is acceptable
  or replace it with a lightweight session check.
- Static export dependencies (images, dynamic routes) have not been revalidated
  since Phase 2; `out/` currently exists but may be stale.
- No fresh log of manual verification or performance timings (required in Phase 4).
- Rate limiting, robots.txt, caching headers, and other Phase 5 hardening items
  remain unimplemented.

## Next actions
1. ✅ Implement origin resolution helper (`backend-base.ts`) and update the API client to use it.
2. Confirm all pages/components fetch data exclusively via `@/lib/api` and add TODOs for any stragglers.
3. Re-run static export, capture artifacts, and document discrepancies.
4. Prepare verification scripts (manual + cURL) and performance benchmarks for Phase 4.
5. Plan hardening/documentation deliverables per Phase 5 checklist.
