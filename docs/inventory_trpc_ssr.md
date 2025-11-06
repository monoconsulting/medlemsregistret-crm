# tRPC and SSR Usage Inventory

The following files in `crm-app/` currently depend on the existing tRPC runtime or server-only data fetching. They must be refactored during Phases 1–2 to use the new PHP fetch client and client-side data loading.

## tRPC client imports

- `crm-app/app/(dashboard)/associations/page.tsx`
- `crm-app/app/(dashboard)/contacts/page.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/activity-feed.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/ai-assistant-widget.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/dashboard-stats.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/member-growth-chart.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/saved-groups-widget.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/top-municipalities.tsx`
- `crm-app/app/(dashboard)/dashboard/_components/upcoming-tasks.tsx`
- `crm-app/app/(dashboard)/groups/page.tsx`
- `crm-app/app/(dashboard)/municipalities/page.tsx`
- `crm-app/app/(dashboard)/users/page.tsx`
- `crm-app/app/(dashboard)/web-scraping/page.tsx`
- `crm-app/app/api/trpc/[trpc]/route.ts`
- `crm-app/app/layout.tsx`
- `crm-app/components/modals/JsonViewerModal.tsx`
- `crm-app/components/modals/add-associations-to-group-modal.tsx`
- `crm-app/components/modals/association-contacts-modal.tsx`
- `crm-app/components/modals/association-details-dialog.tsx`
- `crm-app/components/modals/send-email-modal.tsx`
- `crm-app/hooks/use-dashboard-stats.ts`
- `crm-app/lib/providers/trpc-provider.tsx`
- `crm-app/lib/trpc/client.ts`

## Server-side routers and utilities (tRPC runtime)

- `crm-app/server/session.ts`
- `crm-app/server/trpc.ts`
- `crm-app/server/routers/_app.ts`
- `crm-app/server/routers/activities.ts`
- `crm-app/server/routers/ai.ts`
- `crm-app/server/routers/association.ts`
- `crm-app/server/routers/contacts.ts`
- `crm-app/server/routers/export.ts`
- `crm-app/server/routers/groups.ts`
- `crm-app/server/routers/municipality.ts`
- `crm-app/server/routers/notes.ts`
- `crm-app/server/routers/scraping.ts`
- `crm-app/server/routers/tasks.ts`
- `crm-app/server/routers/tags.ts`
- `crm-app/server/routers/users.ts`

## Other server-centric utilities

- `crm-app/lib/backend-base.ts` (resolves tRPC backend origin)
- `crm-app/middleware.ts` (session handling)

No traditional `getServerSideProps` functions were found, but the above server and router files execute on the Node/tRPC runtime and need to be retired or relocated to `/legacy/` as part of the migration.
