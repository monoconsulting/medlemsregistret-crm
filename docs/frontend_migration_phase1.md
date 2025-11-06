# Frontend Migration - Phase 1 Progress

_Date: 2025-11-05_

## 1. Dependency Audit

We compared third-party imports in `legacy/crm-app` against the current dependency set in `crm-app/package.json`. The following modules are referenced by legacy code and are already satisfied by the modern workspace:

| Module | Present In `crm-app/package.json` | Notes |
|---|---|---|
| `@hookform/resolvers/zod` | Yes (`@hookform/resolvers`) | Subpath export provided by existing package |
| `@tanstack/react-query` | Yes | Matches latest React Query requirements |
| `@tanstack/react-table` | Yes | Legacy lists rely on shared table utilities |
| `@trpc/client`, `@trpc/react-query`, `@trpc/server` | Yes | Available for compatibility during migration |
| `bcryptjs` | Yes | Required for auth utilities |
| `csv-parse/sync` | Yes (`csv-parse`) | Package exposes the sync entrypoint |
| `date-fns`, `date-fns/locale` | Yes | |
| `iconv-lite` | Yes | |
| `leaflet`, `react-leaflet`, `@types/leaflet` | Yes | Supports municipality map |
| `lucide-react` | Yes | Icon set |
| `next`, `next-auth` | Yes | |
| `react-hook-form`, `zod` | Yes | Forms/validation |
| `recharts` | Yes | Dashboard charts |
| `superjson` | Yes | Used by TRPC client |
| `zustand` | Yes | Legacy state store (still available) |

Conclusion: **No additional NPM dependencies are required** to begin porting components. Existing versions align with legacy usage.

## 2. Global Asset Verification

- `legacy/crm-app/app/app/globals.css` matches `crm-app/app/globals.css`. Color tokens, border radii, and Tailwind layers are already in sync-no changes needed.
- `tailwind.config.ts` content paths (`./components/**/*`, `./app/**/*`, etc.) already cover the directories where legacy components will live once copied.
- Alias configuration (`@/*` -> root) in `crm-app/tsconfig.json` is compatible with legacy import structure.

## 3. Next Steps

With dependencies and global styling confirmed, we can proceed to Phase 2:

1. Introduce shared providers (`AuthProvider`, TRPC compatibility layer) that mirror legacy expectations.
2. Align layout shell (header, sidebar) to support the restored navigation experience.

No build or test commands were required for this verification step.

## 4. Remote Experience Smoke Check

- Recorded a stabilized Playwright smoke test derived from `web/codegen/login.test.remote.spec.ts`. The curated spec now lives at `web/tests/codegen/login.test.codegen.spec.ts` and exercises the hosted environment end-to-end (landing -> login -> dashboard -> associations table).
- The spec forces the required artefacts (video 1900x120, viewport/snapshot 1900x1200) and stores a dashboard capture at `web/test-results/media/snapshots/remote-dashboard.png`.
- Run locally with `npm run test:e2e:report -- web/tests/codegen/login.test.codegen.spec.ts` once the remote credentials are configured via `PLAYWRIGHT_REMOTE_LOGIN_EMAIL` / `PLAYWRIGHT_REMOTE_LOGIN_PASSWORD` (defaults remain for convenience).
