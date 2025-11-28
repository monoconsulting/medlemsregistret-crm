# CRM Pipeline & Status Redesign – Implementation Plan for AI Agents

This document defines a **strict, non-negotiable plan** for AI agents working on this repo.

Agents must:

- Only modify files explicitly listed in each task.
- Never introduce new enums or tables beyond those specified here.
- Never remove existing functionality or fields.
- Never comment out or delete code unrelated to the described scope.
- Treat HTTP 500 errors as blocking issues that must be fixed before deployment.
- Always ensure MySQL, Prisma, PHP, and frontend enum values stay in sync.

---

## Phase 0 – Safety, Baseline, and Verification

### Task 0.1 – Create a working branch

- **Goal:** Isolate changes.
- **Actions:**
  1. Create a new branch in the local Git repo:
     - Name: `feature/crm-pipeline-refactor`.
  2. Ensure all changes are committed on this branch only.

### Task 0.2 – Confirm database snapshot and environment variables

- **Files:**
  - `database_backup.sql`
  - `crm-app/.env`
  - `backend/.env` (if used locally)

- **Actions:**
  1. Verify that `DATABASE_URL` in `crm-app/.env` points to the correct MySQL instance (development, not production).
  2. Ensure `database_backup.sql` is up to date or take a new dump from the Loopia DB before running migrations.

### Task 0.3 – Baseline checks

- **Commands (run from `crm-app/`):**
  - `npm install`
  - `npm run build`
  - `npx prisma generate`
  - `npx prisma db pull` (read-only, to verify schema alignment if needed)

- **Commands (root or php env):**
  - `php -l api/associations.php`
  - `php -l api/contacts.php`

- **Requirement:** All commands must complete without introducing new errors before agents proceed.

---

## Phase 1 – Database Schema Extensions (Metadata + History)

All schema changes must be authored as:

1. **Raw SQL migration files**, and  
2. **Prisma schema updates**.

### Task 1.1 – Add metadata and history tables via SQL migration

- **Location for new migration file (SQL):**

  - If a `database/migrations/` directory exists:
    - Choose the **next available numeric prefix** higher than any existing file.
    - Example: `database/migrations/0100_crm_pipeline_metadata.sql`.
  - If no such directory exists:
    - Create `database/migrations/` and name the file:
      - `database/migrations/0001_crm_pipeline_metadata.sql`.

- **The migration file must:**

  1. Create:

     - `CrmLeadStatusDefinition`
     - `CrmPipelineStageDefinition`
     - `CrmLifecycleStageDefinition`
     - `AssociationLeadStatusHistory`
     - `AssociationPipelineHistory`
     - `AssociationLifecycleHistory`

     using the exact SQL definitions from `crm_pipeline_context.md` (Section 5).

  2. Optionally add `Association.lifecycleStage`:

     ```sql
     ALTER TABLE `Association`
       ADD COLUMN `lifecycleStage` varchar(50) NULL AFTER `pipeline`;

  3. Not drop or alter any existing columns other than this optional `lifecycleStage` addition.

- **HTTP 500 safeguard:**
  - This phase only adds new tables and one nullable column.
  - No PHP changes yet, so no new 500s should be introduced by this migration alone.

### Task 1.2 – Seed metadata tables (idempotent pattern)

- **New SQL migration file:**
  - Next numeric prefix in `database/migrations/`, name:
    - `<next>_crm_pipeline_seed_metadata.sql`.

- **Content requirements:**

  - Use `INSERT ... ON DUPLICATE KEY UPDATE` (or `INSERT IGNORE`) to ensure idempotency.
  - Seed the following rows:

  **For `CrmLeadStatusDefinition`:**

  ```sql
  INSERT INTO `CrmLeadStatusDefinition` (`code`, `label`, `description`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
  VALUES
    ('UNCONTACTED', 'Uncontacted', 'No outbound contact has been made.', 10, 1, NOW(3), NOW(3)),
    ('CONTACTED', 'Contacted', 'Initial contact attempt has been made.', 20, 1, NOW(3), NOW(3)),
    ('INTERESTED', 'Interested', 'The association has shown explicit interest.', 30, 1, NOW(3), NOW(3)),
    ('NURTURING', 'Nurturing', 'Long-term nurturing with content and follow-ups.', 40, 1, NOW(3), NOW(3)),
    ('MQL', 'Marketing Qualified Lead', 'Qualified by marketing based on engagement.', 50, 1, NOW(3), NOW(3)),
    ('SQL', 'Sales Qualified Lead', 'Qualified by sales and ready for pipeline.', 60, 1, NOW(3), NOW(3)),
    ('DISQUALIFIED', 'Disqualified', 'Not relevant or not a fit.', 70, 1, NOW(3), NOW(3))
  ON DUPLICATE KEY UPDATE
    `label` = VALUES(`label`),
    `description` = VALUES(`description`),
    `sortOrder` = VALUES(`sortOrder`),
    `isActive` = VALUES(`isActive`),
    `updatedAt` = VALUES(`updatedAt`);

**For `CrmPipelineStageDefinition` (pipelineType = 'SALES'):**

```
INSERT INTO `CrmPipelineStageDefinition`
(`code`, `pipelineType`, `label`, `description`, `sortOrder`, `isClosedWon`, `isClosedLost`, `defaultProbability`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('QUALIFIED_LEAD', 'SALES', 'Qualified lead', 'Lead is qualified and ready for sales.', 10, 0, 0, 20, 1, NOW(3), NOW(3)),
  ('DISCOVERY', 'SALES', 'Discovery', 'Needs analysis and discovery meetings.', 20, 0, 0, 40, 1, NOW(3), NOW(3)),
  ('PROPOSAL_SENT', 'SALES', 'Proposal sent', 'Proposal or demo has been presented.', 30, 0, 0, 60, 1, NOW(3), NOW(3)),
  ('NEGOTIATION', 'SALES', 'Negotiation', 'Commercial terms being negotiated.', 40, 0, 0, 75, 1, NOW(3), NOW(3)),
  ('CLOSED_WON', 'SALES', 'Closed won', 'Deal successfully closed.', 90, 1, 0, 100, 1, NOW(3), NOW(3)),
  ('CLOSED_LOST', 'SALES', 'Closed lost', 'Deal lost.', 100, 0, 1, 0, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `description` = VALUES(`description`),
  `sortOrder` = VALUES(`sortOrder`),
  `isClosedWon` = VALUES(`isClosedWon`),
  `isClosedLost` = VALUES(`isClosedLost`),
  `defaultProbability` = VALUES(`defaultProbability`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = VALUES(`updatedAt`);
```

**For `CrmLifecycleStageDefinition`:**

```
INSERT INTO `CrmLifecycleStageDefinition`
(`code`, `label`, `description`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('PROSPECT', 'Prospect', 'Not yet a paying member.', 10, 1, NOW(3), NOW(3)),
  ('READY_FOR_ONBOARDING', 'Ready for onboarding', 'Deal won and ready for onboarding.', 20, 1, NOW(3), NOW(3)),
  ('ONBOARDING_IN_PROGRESS', 'Onboarding in progress', 'Implementation and setup ongoing.', 30, 1, NOW(3), NOW(3)),
  ('ONBOARDED', 'Onboarded', 'Customer is fully onboarded and active.', 40, 1, NOW(3), NOW(3)),
  ('INACTIVE_MEMBER', 'Inactive member', 'Temporarily inactive member.', 50, 1, NOW(3), NOW(3)),
  ('CHURNED', 'Churned', 'Membership terminated.', 60, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `description` = VALUES(`description`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = VALUES(`updatedAt`);
```

### Task 1.3 – Prisma schema alignment

- **File to edit:**

  - `crm-app/prisma/schema.prisma`

- **Actions:**

  1. Add Prisma models mirroring the new tables:

     - `CrmLeadStatusDefinition`
     - `CrmPipelineStageDefinition`
     - `CrmLifecycleStageDefinition`
     - `AssociationLeadStatusHistory`
     - `AssociationPipelineHistory`
     - `AssociationLifecycleHistory`

     Fields must match the SQL columns. Use `@db.VarChar(50)` etc. where appropriate.

  2. Optionally add `lifecycleStage` to the `Association` model if the column was added in SQL.

- **Commands:**

  - `npx prisma generate`
  - `npx prisma db push --accept-data-loss=false` **must not be used** here; migrations are handled via SQL. Only use `prisma generate` for client code.

------

## Phase 2 – Pipeline Enum Migration (Association.pipeline)

This phase updates the **enum values** used for `Association.pipeline` in **MySQL, Prisma, frontend, and PHP**.

### Task 2.1 – MySQL enum migration for `Association.pipeline`

- **New SQL migration file:** next prefix in `database/migrations/`, named:

  - `<next>_crm_pipeline_enum_update.sql`.

- **Required actions:**

  1. Map existing rows to the new values:

     ```
     UPDATE `Association` SET `pipeline` = 'QUALIFIED_LEAD' WHERE `pipeline` = 'PROSPECT';
     UPDATE `Association` SET `pipeline` = 'DISCOVERY'      WHERE `pipeline` = 'QUALIFIED';
     UPDATE `Association` SET `pipeline` = 'NEGOTIATION'    WHERE `pipeline` = 'FOLLOW_UP';
     ```

  2. Alter the enum definition to:

     ```
     ALTER TABLE `Association`
       MODIFY `pipeline` enum(
         'QUALIFIED_LEAD',
         'DISCOVERY',
         'PROPOSAL_SENT',
         'NEGOTIATION',
         'CLOSED_WON',
         'CLOSED_LOST'
       ) NOT NULL DEFAULT 'QUALIFIED_LEAD';
     ```

- **Constraint:**

  - Perform the `UPDATE` statements **before** the `ALTER TABLE`.
  - Do not remove the `pipeline` column.
  - Do not modify any other columns in this file.

### Task 2.2 – Prisma enum update

- **File:**

  - `crm-app/prisma/schema.prisma`

- **Actions:**

  - Replace the `Pipeline` enum definition with:

    ```
    enum Pipeline {
      QUALIFIED_LEAD
      DISCOVERY
      PROPOSAL_SENT
      NEGOTIATION
      CLOSED_WON
      CLOSED_LOST
    }
    ```

- **Command:**

  - `npx prisma generate`

### Task 2.3 – Frontend enum/constants update

- **Files:**

  - `crm-app/components/modals/association-details-dialog.tsx`
  - `crm-app/lib/validators/association.ts`

- **Actions:**

  1. Update the `PIPELINES` constant arrays to:

     ```
     export const PIPELINES = [
       'QUALIFIED_LEAD',
       'DISCOVERY',
       'PROPOSAL_SENT',
       'NEGOTIATION',
       'CLOSED_WON',
       'CLOSED_LOST',
     ] as const
     ```

  2. Ensure all TypeScript union types or Zod schemas rely on this updated array.

- **Constraints:**

  - Do not change the `CRM_STATUSES` array in this phase.
  - Do not alter unrelated UI fields.
  - Keep all labels as-is (codes change only).

### Task 2.4 – PHP normalization and validation

- **File:**
  - `api/associations.php`
- **Actions:**
  1. Locate any functions that normalize pipeline values (e.g. `normalize_pipeline`).
  2. Ensure they accept and validate only the new codes:
     - `QUALIFIED_LEAD`, `DISCOVERY`, `PROPOSAL_SENT`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`.
  3. If there is any server-side mapping from legacy values (`PROSPECT`, `QUALIFIED`, `FOLLOW_UP`) to new codes, it must match the SQL mapping used in Task 2.1.
- **HTTP 500 safeguard:**
  - In this task you must not change the number of bound parameters in any `bind_param` call.
     Only adjust enumerated values and validation logic.

------

## Phase 3 – Recording Status and Pipeline History

This phase connects UI/API writes to the new history tables.

### Task 3.1 – Extend PHP update logic to write pipeline history

- **File:**
  - `api/associations.php`
- **Scope:**
  - Only inside the `handle_update_association()` and `handle_create_association()` functions.
- **Actions:**
  1. When an association is created with an initial `pipeline`:
     - Insert a row into `AssociationPipelineHistory`:
       - `id`: use the same `generate_id()` helper used for `Association.id`.
       - `associationId`: the new association id.
       - `fromStage`: `NULL`.
       - `toStage`: initial pipeline value.
       - `changedAt`: `NOW(3)` (or equivalent).
       - `changedByUserId`: current user id from the auth/session helper (same value stored elsewhere).
       - `source`: `'api_associations_create'`.
  2. When an association’s `pipeline` is updated:
     - Before executing the `UPDATE` statement, read the current `pipeline` for that association ID (single `SELECT`).
     - After a successful `UPDATE`, insert a row into `AssociationPipelineHistory` with:
       - `fromStage`: old value from `SELECT`.
       - `toStage`: new value from request body.
       - `source`: `'api_associations_update'`.
- **HTTP 500 safeguards:**
  - Always use prepared statements with `bind_param` using only **variables**, not array indices or function calls.
  - After each new prepared statement:
    - Call `$stmt->close();` when done.
  - If a `mysqli_sql_exception` occurs, let the existing catch block handle it; do not change error handling structure.

### Task 3.2 – Extend PHP update logic to write lead status history

- **File:**
  - `api/associations.php`
- **Actions:**
  1. Mirror the same logic as Task 3.1 but for `crmStatus`:
     - On create: insert into `AssociationLeadStatusHistory` with `fromStatus = NULL`, `toStatus = initial status`.
     - On update: log changes when `status` is present in the body and the value differs from the current value.
- **Constraints:**
  - Do not alter how `crmStatus` is used elsewhere.
  - Only append history rows; never modify or delete history.

### Task 3.3 – Optional lifecycle history wiring

- This task is optional and should only be executed if `Association.lifecycleStage` is actively used.
- **File:**
  - `api/associations.php`
- **Actions:**
  - When lifecycle changes (once the UI uses it), mirror the same pattern into `AssociationLifecycleHistory`.

------

## Phase 4 – Frontend Integration and UI Adjustments

### Task 4.1 – Ensure modal displays the new pipeline names correctly

- **File:**

  - `crm-app/components/modals/association-details-dialog.tsx`

- **Actions:**

  1. Confirm the pipeline dropdown uses the updated `PIPELINES` constant.

  2. Optionally, map technical codes to user-friendly labels in the UI.

     Example mapping:

     ```
     const PIPELINE_LABELS: Record<string, string> = {
       QUALIFIED_LEAD: 'Qualified lead',
       DISCOVERY: 'Discovery',
       PROPOSAL_SENT: 'Proposal sent',
       NEGOTIATION: 'Negotiation',
       CLOSED_WON: 'Closed – won',
       CLOSED_LOST: 'Closed – lost',
     }
     ```

  3. Display both `Status` and `Pipeline` clearly at the top, keeping status semantics unchanged for now.

- **Constraint:**

  - Do not add any new network calls in the modal.
     All necessary data is already available in the association payload.

### Task 4.2 – Optionally expose lifecycle stage

- **File:**
  - Same modal as above (or a dedicated “Membership” section).
- **Actions:**
  - If `lifecycleStage` is present on the association JSON:
    - Render it as a read-only badge or dropdown (depending on current needs).
  - No changes to API are required in this phase; lifecycle API work can be done later.

------

## Phase 5 – Testing and Deployment

### Task 5.1 – Local testing

- **Commands:**
  - From `crm-app/`:
    - `npm run build`
  - From repo root (or where PHP is available):
    - `php -l api/associations.php`
    - `php -l api/contacts.php`
- **Manual tests (against dev DB):**
  1. Create a new association via the UI.
     - Verify:
       - `Association` row is created.
       - `AssociationPipelineHistory` and `AssociationLeadStatusHistory` each have one row.
  2. Change pipeline step several times via the UI.
     - Verify:
       - `Association.pipeline` changes correctly.
       - A new row is appended to `AssociationPipelineHistory` for each change.
  3. Change status via the UI.
     - Verify:
       - `Association.crmStatus` changes correctly.
       - A new row in `AssociationLeadStatusHistory`.
  4. Check logs:
     - Ensure no new HTTP 500s appear when calling:
       - `GET /api/associations.php`
       - `POST /api/associations.php`
       - `PUT /api/associations.php`

### Task 5.2 – Static export and deployment

- **Commands (from `crm-app/`):**
  - `npm run export`
- **Result:**
  - Static files generated into `temp/local_webroot`.
- **Deployment:**
  - From repo root (or `scripts/`), run:
    - `scripts/deploy_loopia_frontend.bat`
- **Verification:**
  1. Open the deployed CRM at the Loopia URL.
  2. Repeat the manual tests against **production**:
     - Creating an association.
     - Updating pipeline.
     - Updating status.
  3. Check the Loopia PHP error log:
     - Confirm no new `mysqli_stmt::bind_param` errors.
     - Confirm no new HTTP 500 responses on the API endpoints used by the modal.