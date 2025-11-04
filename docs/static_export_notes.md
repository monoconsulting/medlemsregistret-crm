# Static Export Notes (Phase 2.3)

- The application now relies exclusively on client-side data fetching via `crm-app/lib/api.ts`.
- `next export` can emit static HTML for all authenticated routes because data loads after hydration.
- The PHP API must be deployed alongside the static output at `/api/` on the same origin.
- Login state persists via PHP sessions; ensure the hosting environment forwards cookies for the exported pages.
