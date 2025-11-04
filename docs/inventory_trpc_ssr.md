# tRPC and SSR Usage Inventory

This inventory captures all files in `crm-app/` that referenced the previous tRPC data layer or relied on server-only modules. The list was produced via code search (`rg "trpc" crm-app`) and manual inspection.

## tRPC client imports (to be migrated)
- crm-app/app/api/trpc/[trpc]/route.ts
- crm-app/app/(dashboard)/associations/page.tsx
- crm-app/app/(dashboard)/web-scraping/page.tsx
- crm-app/app/(dashboard)/users/page.tsx
- crm-app/app/(dashboard)/dashboard/_components/top-municipalities.tsx
- crm-app/app/(dashboard)/dashboard/_components/dashboard-stats.tsx
- crm-app/app/(dashboard)/dashboard/_components/ai-assistant-widget.tsx
- crm-app/app/(dashboard)/dashboard/_components/member-growth-chart.tsx
- crm-app/app/(dashboard)/dashboard/_components/upcoming-tasks.tsx
- crm-app/app/(dashboard)/dashboard/_components/activity-feed.tsx
- crm-app/app/(dashboard)/dashboard/_components/saved-groups-widget.tsx
- crm-app/app/(dashboard)/contacts/page.tsx
- crm-app/app/(dashboard)/groups/page.tsx
- crm-app/app/(dashboard)/municipalities/page.tsx
- crm-app/app/layout.tsx (via TRPCProvider)
- crm-app/components/modals/association-details-dialog.tsx
- crm-app/components/modals/send-email-modal.tsx
- crm-app/components/modals/JsonViewerModal.tsx
- crm-app/components/modals/add-associations-to-group-modal.tsx
- crm-app/components/modals/association-contacts-modal.tsx
- crm-app/lib/trpc/client.ts
- crm-app/lib/providers/trpc-provider.tsx

## Server-side routers and utilities
- crm-app/server/session.ts
- crm-app/server/routers/_app.ts
- crm-app/server/routers/activities.ts
- crm-app/server/routers/association.ts
- crm-app/server/routers/contacts.ts
- crm-app/server/routers/export.ts
- crm-app/server/routers/groups.ts
- crm-app/server/routers/municipality.ts
- crm-app/server/routers/notes.ts
- crm-app/server/routers/scraping.ts
- crm-app/server/routers/tags.ts
- crm-app/server/routers/tasks.ts
- crm-app/server/routers/users.ts
- crm-app/server/trpc.ts

## SSR data fetching
The project currently uses the Next.js App Router. No `getServerSideProps` usage was detected; data fetching occurs via client components that rely on the tRPC hooks listed above.

Legacy implementations now reside under `legacy/crm-app-legacy/`. The active frontend no longer imports these modules and instead uses `lib/api.ts` for all network interactions.
