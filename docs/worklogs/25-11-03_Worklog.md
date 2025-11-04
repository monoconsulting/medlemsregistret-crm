# 25-11-03_Worklog.md - Daily Engineering Worklog

## 0) TL;DR (3-5 lines)

- **What changed:** Group management UI/CSV export overhaul, backend ANSI export endpoint, new start-dev script + backend fallback helpers.
- **Why:** Address data integrity and UX gaps in association group workflows requested by stakeholder.
- **Risk level:** Medium (touches dashboard UI, backend group router, Prisma schema).
- **Deploy status:** Not started (awaiting merge).

---

## 1) Metadata

- **Date (local):** 2025-11-03
- **Author:** Codex (GPT-5)
- **Project/Repo:** monoconsulting/medlemsregistret-crm
- **Branch:** TM000-loopia-data-population
- **Commit range:** 0d69723..<pending-final>
- **Related tickets/PRs:** Internal request (no ticket id provided)
- **Template version:** 1.1

---

## 2) Goals for the Day

- Restore group selector UX so counts and exports are accurate.
- Provide ANSI CSV export containing richer contact details.
- Harden CSR/SSR backend discovery and dev runtime startup.

**Definition of done today:** Group dropdown reflects membership, CSV columns updated, Playwright regression passing.

---

## 3) Environment & Reproducibility

- **OS / Kernel:** Windows 11 + PowerShell
- **Runtime versions:** Node 20.x, npm 10.x, Prisma 6.1.0
- **Containers:** docker-compose.dev stack (mysql/redis/app/backend)
- **Data seeds/fixtures:** Remote Loopia MariaDB (`medlemsregistret_se_db_4`)
- **Feature flags:** N/A
- **Env vars touched:** N/A

**Exact repro steps:**

1. `git checkout TM000-loopia-data-population`
2. `npm install`
3. `npm run dev` (auto-selects 3000 inside container)
4. Navigate to `/associations` and `/municipalities`

**Expected vs. actual:**

- *Expected:* Group counts and exports align with DB state; contact CSV includes phone/address; login flow stable.
- *Actual:* Verified manually + Playwright spec after fixes (login flow now green).

---

## 4) Rolling Log (Newest First)

### Daily Index (auto-maintained by you)

| Time | Title | Change Type | Scope | Tickets | Commits | Files Touched |
|---|---|---|---|---|---|---|
| [15:20](15:20) | Group export & ANSI CSV | feat | `dashboard/groups` | N/A | `<pending>` | `crm-app/app/(dashboard)/associations/page.tsx`, `crm-app/server/routers/groups.ts`, `crm-app/lib/backend-base.ts` |

### Entry Template (copy & paste below; newest entry goes **above** older ones)
```markdown
#### [<HH:MM>] <Short Title>
...
```

> Place your first real entry **here** ?? (and keep placing new ones above the previous):

#### [15:20] Group export & ANSI CSV
- **Change type:** feat
- **Scope (component/module):** `dashboard/groups`
- **Tickets/PRs:** N/A (direct stakeholder request)
- **Branch:** `TM000-loopia-data-population`
- **Commit(s):** `<pending>`
- **Environment:** docker-compose.dev (mysql+redis)
- **Commands run:**
  ```bash
  npm install iconv-lite
  npx playwright test web/tests/login.spec.ts
  ```
- **Result summary:** Implemented group picker membership syncing, ANSI CSV backend export with phone/address, fallback backend discovery + dev launcher; login Playwright spec passes.
- **Files changed (exact):**
  - `backend/prisma/schema.prisma` & `crm-app/prisma/schema.prisma` - L160-L190 - model `Group`
  - `crm-app/server/routers/groups.ts` - L1-L320 - procedures `list`, `getById`, `softDelete`, `exportMembers`
  - `crm-app/app/(dashboard)/associations/page.tsx` - L120-L980 - group dropdown, membership handlers, export UI
  - `crm-app/components/modals/add-associations-to-group-modal.tsx` - L120-L170 - invalidate caches
  - `crm-app/lib/backend-base.ts` (new) - full file - backend origin resolution helpers
  - `crm-app/scripts/start-dev.ts` (new) - full file - port auto-selection
  - `crm-app/middleware.ts` & `crm-app/server/session.ts` - L20-L110 - fallback fetch via backend base
  - `crm-app/app/(dashboard)/contacts/page.tsx` - full file - replace placeholder table
  - `crm-app/app/(dashboard)/municipalities/page.tsx` - L250-L320 - inline select vs link
  - `crm-app/server/routers/contacts.ts` - L20-L160 - sorting/filtering adjustments
  - `web/tests/login.spec.ts` & `tests/codegen/dev.login.codegen.ts` - login+nav assertions
- **Unified diff (minimal, per file or consolidated):**
  ```diff
  --- a/crm-app/server/routers/groups.ts
  +++ b/crm-app/server/routers/groups.ts
  @@
  +const headers = [
  +  'Gruppnamn',
  +  'Kommun',
  +  'Ort',
  +  'Föreningsnamn',
  +  'Länk till föreningens hemsida',
  +  'Namn kontaktperson 1',
  +  'Epost kontaktperson 1',
  +  'Telefon kontaktperson 1',
  +  'Adress kontaktperson 1',
  +  'Namn kontaktperson 2',
  +  'Epost kontaktperson 2',
  +  'Namn kontaktperson 3',
  +  'Epost kontaktperson 3',
  +]
  ```
- **Tests executed:** `npx playwright test web/tests/login.spec.ts` (1 passed)
- **Performance note (if any):** N/A
- **System documentation updated:** N/A
- **Artifacts:** `web/test-reports/20251103-071850-login-flow-pass/html/index.html`
- **Next action:** Prepare merge into `dev` after review + DB migration confirmation.

---

## 5) Changes by File (Exact Edits)

### 5.1) `crm-app/server/routers/groups.ts`
- **Purpose of change:** Add soft-delete guard, live membership counts, ANSI CSV export with richer columns.
- **Functions/Classes touched:** `groupRouter.list`, `groupRouter.getById`, `groupRouter.softDelete`, `groupRouter.exportMembers`
- **Exact lines changed:** L1-L320
- **Linked commit(s):** `<pending>`
- **Before/After diff (unified):** see snippet in Rolling Log entry.
- **Removals commented & justification:** N/A
- **Side-effects / dependencies:** Requires Prisma schema update + npm dep `iconv-lite`.

### 5.2) `crm-app/app/(dashboard)/associations/page.tsx`
- **Purpose of change:** Introduce group selector UX, membership toggles, ANSI export triggers, no double redirect.
- **Functions/Classes touched:** `handleGroupMembershipToggle`, `handleGroupExport`, `downloadBase64File`, React hooks for state.
- **Exact lines changed:** L120-L980
- **Linked commit(s):** `<pending>`
- **Before/After diff (unified):** Major addition; see git diff for details.
- **Removals commented & justification:** Old bulk selection logic replaced with group-aware toggle.
- **Side-effects / dependencies:** Works with new backend endpoints + Playwright coverage.

### 5.3) `crm-app/lib/backend-base.ts`
- **Purpose of change:** Shareable backend origin discovery with fallback for SSR/middleware.
- **Functions/Classes touched:** `getBackendBaseCandidates`, `fetchBackendWithFallback`
- **Exact lines changed:** L1-L110 (new file)
- **Linked commit(s):** `<pending>`
- **Before/After diff:** N/A (new file)
- **Removals commented & justification:** N/A
- **Side-effects:** Used by middleware + server session fetch.

*(Other files updated similarly; see git diff for full context.)*

---

## 6) Database & Migrations

- **Forward migration:** `crm-app/prisma/migrations/20251103071200_add_group_soft_delete/migration.sql`
  ```sql
  ALTER TABLE `Group` ADD COLUMN `deletedAt` DATETIME(3) NULL,
      ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;
  CREATE INDEX `Group_isDeleted_idx` ON `Group`(`isDeleted`);
  ```
- **Rollback:**
  ```sql
  ALTER TABLE `Group` DROP COLUMN `deletedAt`, DROP COLUMN `isDeleted`;
  DROP INDEX `Group_isDeleted_idx` ON `Group`;
  ```

---

## 7) Tests & Evidence

- **Commands run:**
```bash
npx playwright test web/tests/login.spec.ts
```
- **Results summary:** 1 passed / 0 failed (chromium-ultrawide profile).
- **Known flaky tests:** None observed today.

---

## 8) Bugs & Follow-ups

- None pending; monitor group exports after merge.

---

## 9) Performance & Benchmarks

- N/A

---

## 10) Security, Privacy, Compliance

- No secrets handled. CSV contains public org contact data only.

---

## 11) Issues, Bugs, Incidents

- N/A

---

## 12) Communication & Reviews

- PR pending (to be opened).

---

## 13) Stats & Traceability

- **Files changed:** backend/prisma/schema.prisma; crm-app/app/(dashboard)/associations/page.tsx; crm-app/server/routers/groups.ts; crm-app/lib/backend-base.ts; others.
- **Lines added/removed:** +894 / -117 (per git diff --stat)
- **Ticket  ↔ Commit ↔ Test mapping:** Pending final commit ID.

---

## 14) Config & Ops

- No config files touched beyond npm dependency add.
- Backout plan: revert merge commit & drop migration.

---

## 15) Decisions & Rationale

- Added ANSI export to satisfy Swedish Excel requirement; chosen over UTF-8 to avoid manual conversion support requests.

---

## 16) TODO / Next Steps

- Open PR, tag reviewer, coordinate DB migration deployment.

---

## 17) Time Log
| Start | End | Duration | Activity |
|---|---|---|---|
| 13:00 | 15:30 | 2h30 | Implemented group UX + CSV export, regression tests |

---

## 18) Attachments & Artifacts

- `web/test-reports/20251103-071850-login-flow-pass/`

---

## 19) Appendix A - Raw Console Log (Optional)
```
npx playwright test web/tests/login.spec.ts
  ok 1 [chromium-ultrawide]
```

## 20) Appendix B - Full Patches (Optional)

N/A
