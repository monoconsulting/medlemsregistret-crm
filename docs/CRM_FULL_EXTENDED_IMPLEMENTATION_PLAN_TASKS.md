# CRM Full Extended Implementation Task Checklist

_Last updated: 2025-10-24 16:40 UTC_

## Sprint 1 – Data Quality & Discovery

### Phase 1.1 – Schema & Data Normalisation
- [ ] Reconcile Prisma schema with blueprint (relations, enums, cascade rules) and regenerate migrations.
  - [ ] Remove merge markers and duplicate model definitions.
  - [ ] Verify referential integrity (onDelete/onUpdate) matches specification.
- [ ] Implement automated migration check in CI (prisma migrate diff + lint).
- [ ] Build data validation script to flag missing critical fields (email, phone) and duplicate associations.

### Phase 1.2 – Search Platform Integration
- [ ] Provision Meilisearch or Typesense instance (Docker service + env config).
- [ ] Create indexing job to push associations with facets (municipality, types, tags, CRM status, pipeline).
- [ ] Update `getSearchClient` provider configuration and add health checks.
- [ ] Wire association list query to optionally use search index (toggle + fallback).

### Phase 1.3 – Advanced Filtering UX
- [ ] Complete advanced filter panel interactions (multi-select, activity window, date range, tag filter).
- [ ] Implement table/card/map view toggle with real data sources.
- [ ] Optimise pagination & infinite scroll when using search provider.

## Sprint 2 – Association Workspace Experience

### Phase 2.1 – Detail View Parity
- [ ] Build full association overview tab with editable profile fields and extras viewer.
- [ ] Implement contacts tab with inline add/edit/delete and primary contact badge.
- [ ] Render notes tab as chronological guestbook with author avatars and timestamps.
- [ ] Expand activity timeline with event icons, metadata, and filters.

### Phase 2.2 – Collaboration Features
- [ ] Finalise contact CRUD UX (modal or inline) syncing with `contactRouter`.
- [ ] Enable note editing/deletion with permission checks (owner or admin).
- [ ] Implement task management UI (list, kanban, detail modal) integrated with `tasks` router.
- [ ] Add group membership management UI (add/remove association from saved groups).

### Phase 2.3 – Dashboard Enhancements
- [ ] Implement live activity feed widget with polling or websockets.
- [ ] Add membership trend chart using Recharts with historical data.
- [ ] Surface saved grouping widget and municipality leaderboard cards.
- [ ] Ensure dashboard stats align with backend aggregations.

## Sprint 3 – Automation, AI & Outreach

### Phase 3.1 – AI Provider Layer
- [ ] Implement provider abstraction supporting Ollama, OpenAI, Anthropic (env-based selection).
- [ ] Add prompt builders for analysis, email drafting, suggestion flows per spec.
- [ ] Create rate limiting and cost tracking for external AI providers.

### Phase 3.2 – AI-enabled Workflows
- [ ] Integrate AI analysis modal on association list/detail pages with streaming responses.
- [ ] Embed AI-generated email drafts into Send Email modal with manual override before send.
- [ ] Provide AI suggestions for next steps and enrichment, storing outputs in activity log.

### Phase 3.3 – Communication & Export
- [ ] Finalise export router for CSV/XLSX/JSON with filter + selection options.
- [ ] Connect Send Email modal to transactional email service or queue.
- [ ] Add bulk operations (assign owner, change status/pipeline, tag, export) with toast confirmations.

## Sprint 4 – Operations, Scaling & Reliability

### Phase 4.1 – Background Processing & Integrations
- [ ] Deploy Redis + BullMQ worker for long-running jobs (import, AI batching, email send).
- [ ] Implement job dashboard (status, retries, dead-letter queue).
- [ ] Add webhook integrations (Slack/email) for job completion and task reminders.

### Phase 4.2 – Observability & Security
- [ ] Integrate structured logging and error tracking (e.g., Pino + Sentry).
- [ ] Implement auth hardening (password reset, 2FA optional, rate limiting).
- [ ] Extend RBAC enforcement in tRPC procedures and frontend route guards.
- [ ] Add audit logs for critical mutations (status changes, exports, AI usage).

### Phase 4.3 – Delivery Pipeline & QA Automation
- [ ] Configure CI/CD pipeline (build, lint, test, Playwright smoke, prisma migrate deploy).
- [ ] Create infrastructure-as-code manifests (Docker Compose prod, Kubernetes optional) with secrets management.
- [ ] Document operational runbooks (import troubleshooting, queue monitoring, AI provider rotation).
- [ ] Establish release checklist and changelog process.
