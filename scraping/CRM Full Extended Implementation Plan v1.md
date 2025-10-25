# CRM Full Extended Implementation Plan v1


| **## Overview**                                              |
| The MVP establishes reliable data imports and editable CRM metadata. The extended roadmap delivers the remaining scope from `CRM_IMPLEMENTATION_1…4` and the aggregated task list, covering advanced analytics, collaboration tooling, AI workflows, and operational hardening. Work is organised into four sprints (~2 weeks each) with clearly defined phases. |
|                                                              |
| **## Sprint 1 – Data Quality & Discovery**                   |
|                                                              |
| **### Phase 1.1 – Schema & Data Normalisation**              |
| - Finalise Prisma schema (relations, enums, cascade rules) in line with blueprint. |
| - Implement automated database migrations with seed validation per municipality. |
| - Introduce data quality checks (missing contact info, deduped associations). |
|                                                              |
| **### Phase 1.2 – Search Platform Integration**              |
| - Stand up Meilisearch or Typesense according to `lib/search.ts` abstraction. |
| - Index associations with faceted fields (municipality, types, tags, CRM status). |
| - Wire UI toggle to switch between Prisma and search index; add health monitoring. |
|                                                              |
| **### Phase 1.3 – Advanced Filtering UX**                    |
| - Complete advanced filter panel (multi-selects, activity windows, date ranges) using real data. |
| - Implement view switching (table/card/map) per spec, backed by search provider. |
|                                                              |
| **## Sprint 2 – Association Workspace Experience**           |
|                                                              |
| **### Phase 2.1 – Detail View Parity**                       |
| - Flesh out association detail tabs: overview, contacts management, notes (guestbook style), activity timeline, scraped data viewer. |
| - Enable inline edits for key profile fields (verksamhet, address, email, phone, extras) with optimistic updates. |
|                                                              |
| **### Phase 2.2 – Collaboration Features**                   |
| - Deliver full contact CRUD (primary contact management, social links) on detail page. |
| - Implement notes editing/deletion with author permissions and tagging. |
| - Introduce tasks router UI (assignments, due dates, status transitions) per spec. |
|                                                              |
| **### Phase 2.3 – Dashboard Enhancements**                   |
| - Add activity feed with real-time updates (using WebSockets or polling fallback). |
| - Render membership trend charts (Recharts) and saved grouping widgets. |
| - Surface municipality leaderboard and pipeline KPIs consistent with spec. |
|                                                              |
| **## Sprint 3 – Automation, AI & Outreach**                  |
|                                                              |
| **### Phase 3.1 – AI Provider Layer**                        |
| - Configure provider abstraction (Ollama, OpenAI, Anthropic) with prompt templates from `CRM_IMPLEMENTATION_4`. |
| - Secure API keys via environment variables and secrets management. |
|                                                              |
| **### Phase 3.2 – AI-enabled Workflows**                     |
| - Integrate AI analysis modal, email draft generator, next-step suggestions in association list/detail views. |
| - Log AI interactions for auditing and allow manual edits before sending emails. |
|                                                              |
| **### Phase 3.3 – Communication & Export**                   |
| - Implement export router (CSV/XLSX/JSON) with filters and bulk selection support. |
| - Build Send Email modal workflow (template selection, preview, send via SMTP provider or queue). |
| - Add bulk actions (assign owner, change status/pipeline, tag operations) with undo notifications. |
|                                                              |
| **## Sprint 4 – Operations, Scaling & Reliability**          |
|                                                              |
| **### Phase 4.1 – Background Processing & Integrations**     |
| - Introduce BullMQ workers and Redis caching layer for long-running imports/scrapes. |
| - Expose scrape run management UI with status tracking and retry controls. |
| - Add webhook/notification integrations (Slack/Email) for import completion and task reminders. |
|                                                              |
| **### Phase 4.2 – Observability & Security**                 |
| - Implement structured logging, request tracing, and error monitoring (e.g., Sentry). |
| - Harden authentication (password reset, 2FA optional, rate limiting) and audit trails. |
| - Expand RBAC (admin/manager/user) enforcement across UI and APIs. |
|                                                              |
| **### Phase 4.3 – Delivery Pipeline & QA Automation**        |
| - Establish CI/CD pipeline running lint, tests, Prisma migrations, and Playwright smoke suite. |
| - Add infrastructure-as-code for deployment (Docker compose/k8s manifests) with secrets management. |
| - Document runbooks for ops (import troubleshooting, queue monitoring, AI provider rotation). |
|                                                              |
| **## Dependencies & Cross-cutting Concerns**                 |
| - Ensure consistent usage of shared Prisma client and error handling across Next.js API and tRPC. |
| - Maintain accessibility standards and responsive layout while expanding UI. |
| - Keep documentation in sync (developer handbook, operator guides, API reference). |
