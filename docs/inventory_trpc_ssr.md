# tRPC & SSR Usage Inventory

## tRPC client/React usage (parked under `/legacy`)
- `legacy/crm-app/lib/trpc/client.ts` – central TRPC client factory using `@trpc/client` & React provider helpers.
- `legacy/crm-app/lib/providers/trpc-provider.tsx` – wraps app with TRPC provider + React Query client.
- `legacy/crm-app/app-legacy/layout.tsx` – imports `TRPCProvider` for app router layout.
- `legacy/crm-app/app-api/trpc/[trpc]/route.ts` – TRPC fetch handler endpoint.
- `legacy/crm-app/server/trpc.ts` – initializes TRPC router/context.
- `legacy/crm-app/server/routers/_app.ts` – root router composition.
- `legacy/crm-app/server/routers/*.ts` – per-domain TRPC routers (activities, ai, association, contacts, export, groups, municipality, notes, scraping, tags, tasks, users).
- `legacy/crm-app/components/modals/*.tsx` – multiple modals call TRPC hooks (association-details, association-contacts, add-associations-to-group, send-email, JsonViewer, etc.).
- `legacy/crm-app/app-legacy/(dashboard)/**` – dashboard, associations, contacts, groups, import, municipalities, users, web-scraping pages rely on `trpc` or `api` from `@/lib/trpc/client` for queries/mutations.
- `legacy/crm-app/components/filters/**` – bulk actions and filter panels use TRPC utilities via props passed from pages.
- `legacy/crm-app/hooks` (if any) – check for TRPC usage when updating components.

## SSR / Server data fetching
- No `getServerSideProps` located via search; data loading handled via client components with TRPC hooks.
- App Router API routes under `legacy/crm-app/app-api/**` expose the previous TRPC handlers; the new frontend calls the PHP API instead.

## Other backend runtime references
- `crm-app/server/session.ts` – server-side session fetch bridging to backend.
- `crm-app/lib/auth-client.ts`, `crm-app/lib/api-base.ts`, `crm-app/lib/backend-base.ts` – compute backend base URL for TRPC calls.

This inventory guides Phase 2 replacements when swapping the data layer to the PHP fetch client.
