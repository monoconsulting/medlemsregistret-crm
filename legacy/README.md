# Legacy Runtime Parking

This directory archives the previous Node/tRPC runtime, Prisma schema, Docker compose setup, scraping utilities, and automated test tooling. The runtime is no longer part of the active deployment now that the standalone frontend talks directly to the PHP API under `/api/`. Nothing in this folder is deleted so the prior stack can be restored if needed.

## Contents

- `backend/` – Express + tRPC server code and supporting scripts.
- `crm-app/` – tRPC client glue, server routers, Prisma schema, Playwright tests, and scraping helpers that depended on the Node runtime.
- `migrations/` – Prisma migrations associated with the retired backend.
- `scraping/` – Root-level scraping utilities and automation scripts.
- `tests/` – Legacy Playwright and integration test harnesses.
- `compose.yml` – Docker Compose definition for the removed runtime services.

Retain this directory for reference or rollback. New development should target the PHP API exposed from `/api/` and the fetch-based client in `crm-app/lib/api.ts`.
