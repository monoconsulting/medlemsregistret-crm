# tRPC & SSR Inventory (Phase 0 Task 0.1.3)

The following files under `crm-app/` currently rely on the legacy tRPC data layer or import from `@/server/*`.

## Client usage (`@/lib/trpc/client` or `trpc` hooks)

- app/layout.tsx
- app/(dashboard)/associations/page.tsx
- app/(dashboard)/groups/page.tsx
- app/(dashboard)/dashboard/_components/activity-feed.tsx
- app/(dashboard)/dashboard/_components/member-growth-chart.tsx
- app/(dashboard)/dashboard/_components/ai-assistant-widget.tsx
- app/(dashboard)/dashboard/_components/saved-groups-widget.tsx
- app/(dashboard)/dashboard/_components/upcoming-tasks.tsx
- app/(dashboard)/dashboard/_components/dashboard-stats.tsx
- app/(dashboard)/dashboard/_components/top-municipalities.tsx
- app/(dashboard)/municipalities/page.tsx
- app/(dashboard)/users/page.tsx
- app/(dashboard)/contacts/page.tsx
- app/(dashboard)/web-scraping/page.tsx
- components/modals/association-contacts-modal.tsx
- components/modals/association-details-dialog.tsx
- components/modals/add-associations-to-group-modal.tsx
- components/modals/send-email-modal.tsx
- components/modals/JsonViewerModal.tsx

## Providers / helpers

- lib/providers/trpc-provider.tsx
- lib/trpc/client.ts

## Server-side routers & handlers

- app/api/trpc/[trpc]/route.ts
- server/trpc.ts
- server/session.ts
- server/routers/*.ts (all files)

## SSR / Server Components

No `getServerSideProps` or server-only data fetching utilities were detected during the inventory sweep.

