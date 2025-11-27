Här kommer en färdig, agentanpassad prompt för **Fas 0**. Den är skriven så att agenten ska kunna följa den steg för steg mot den kodbas du skickade (zippen) och hålla sig strikt till kontaktdelen.

------

## AGENT PROMPT – PHASE 0

**Goal: Fix and harden contact creation & error diagnostics (`api/contacts.php`) so that creating contacts works reliably and SQL errors are properly logged without leaking details to the client.**

You are an AI coding agent working **inside the repository contained in `codebasebackup_2025-11-20_16-21.zip`**.

### 0. Global constraints

Follow these rules strictly:

1. **Scope limitation**
   - You may only change code directly related to:
     - Contact creation, listing and soft delete in `api/contacts.php`.
     - Shared helpers used by `api/contacts.php` that are defined in `api/bootstrap.php` (such as `log_event`, `db`, `json_out`, `read_json`, etc.), **only if necessary** to complete Phase 0.
     - Schema/checks for the `Contact` table (SQL/migrations) and related documentation.
   - Do **not** modify scraping, other APIs, or frontend features beyond the minimal paths explicitly listed below.
2. **No deletion of code**
   - Do **not** remove existing code.
   - If you must disable or replace behavior, **comment out** the old lines and add a short comment explaining why, in English, e.g.:
     - `// REMOVED: old binding order was incompatible with Contact table schema (see Phase 0 fix).`
3. **Minimal impact**
   - Do **not** change behavior for associations, tagging, AI, or other domains.
   - Do **not** introduce new configuration mechanisms; reuse existing patterns in `api/bootstrap.php`.
4. **File boundaries**
   - The only files you are allowed to edit in Phase 0 are:
     - `api/contacts.php`
     - `api/bootstrap.php` (only if required for logging / error handling)
     - Optionally: a **new** SQL migration file under `db/migrations/` **or** a `.sql` snippet in docs if needed (you cannot actually execute it, but you must generate it).
5. **Environment limitations**
   - You might be running in a sandbox and **cannot** access the real Loopia database.
   - You must rely on:
     - `crm-app/prisma/schema.prisma`
     - `database_backup.sql`
     - Existing migrations under `db/migrations/`
   - Use those as “ground truth” to derive what the Loopia schema *should* look like and generate SQL that the human operator can run in Adminer/phpMyAdmin.
6. **Deliverables**
    At the end you must produce:
   - A clear summary of:
     - What was wrong / risky.
     - What you changed.
     - What SQL the user must run on Loopia.
     - How they can manually test from the frontend.
   - For each modified file:
     - A diff-like section (before/after or commented explanation) so the user can apply changes manually if needed.
   - No TODOs that require guessing; everything you propose must be concrete and runnable.

------

### 1. Ensure robust SQL error logging for contacts

**Objective:** When any SQL operation in `api/contacts.php` fails (especially in `handle_create_contact()`), the error must be logged to a file on the server, and the client must only see a generic error.

#### 1.1 Inspect existing error handling

1. Open `api/bootstrap.php`.
2. Locate the function `log_event(string $source, string $stage, array $context = []): void`.
   - Confirm that:
     - It uses a log directory under `__DIR__ . '/logs'`.
     - It ensures the directory exists (`mkdir` with recursive option).
     - It writes JSON lines to a log file (currently `remote-login.log`).
3. Do **not** change the general behavior unless absolutely necessary.
4. Open `api/contacts.php`.
5. At the top of the file, confirm that:
   - `require __DIR__ . '/bootstrap.php';` is present.
   - `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);` is present to convert SQL errors into exceptions.
6. Locate the `try { ... } catch (mysqli_sql_exception $e) { ... }` block in `api/contacts.php`.
   - Confirm that the `catch` block:
     - Calls `log_event('api', 'contacts.sql_error', [...])` with at least:
       - `code` = `$e->getCode()`
       - `message` = `$e->getMessage()`
     - Returns a generic error via `json_out(500, ['error' => 'Database query failed.']);`.

#### 1.2 Strengthen logging if needed

If any of the above conditions are not met, then:

1. Update the `catch (mysqli_sql_exception $e)` block in `api/contacts.php` to:
   - Call `log_event('api', 'contacts.sql_error', [...])` with:
     - `code` (error code)
     - `message` (error message)
     - Optionally: `trace` (first part of stack trace) if safe.
   - Then call `json_out(500, ['error' => 'Database query failed.']);` without exposing SQL details.
2. If needed, adjust `log_event()` in `api/bootstrap.php`:
   - Ensure it always writes to `__DIR__ . '/logs'`.
   - Keep or reuse the existing log file (`remote-login.log`) unless there is a strong reason to introduce `contacts.log`.
   - If you add a dedicated file for contacts, do it in a backwards-compatible way:
     - For example, choose the log filename based on `$stage` prefix (`contacts.` → `contacts.log`), while leaving all other stages in `remote-login.log`.
3. Make sure any new logging behavior does **not** break other existing log usages.

------

### 2. Verify the `Contact` schema and generate SQL for Loopia

**Objective:** Ensure that the `Contact` table in the production database is compatible with both `crm-app/prisma/schema.prisma` and `api/contacts.php`. Since you cannot access the real DB, you must:

- Compare `schema.prisma` vs `database_backup.sql`.
- Produce SQL migrations / `ALTER TABLE` statements that the human can run if discrepancies are found.

#### 2.1 Extract Contact schema from Prisma

1. Open `crm-app/prisma/schema.prisma`.
2. Locate the `model Contact { ... }` definition.
3. Write down the fields and their types:
   - `id            String      @id @default(cuid())`
   - `associationId String`
   - `name          String?`
   - `role          String?`
   - `email         String?`
   - `phone         String?`
   - `mobile        String?`
   - `linkedinUrl   String?`
   - `facebookUrl   String?`
   - `twitterUrl    String?`
   - `instagramUrl  String?`
   - `isPrimary     Boolean     @default(false)`
   - `createdAt     DateTime    @default(now())`
   - `updatedAt     DateTime    @updatedAt`
   - `deletedAt     DateTime?`
   - Indexes and FK:
     - `@@index([associationId])`
     - `@@index([email])`
     - `association   Association @relation(fields: [associationId], references: [id], onDelete: Cascade)`

#### 2.2 Extract Contact schema from SQL backup

1. Open `database_backup.sql`.
2. Search for `CREATE TABLE \`Contact``.
3. Capture the full `CREATE TABLE` statement, including columns and indexes.
4. Compare:
   - Column names
   - Column types
   - Presence of `deletedAt`
   - `PRIMARY KEY`
   - Indexes on `associationId` and `email`
   - Foreign key to `Association`.

#### 2.3 Derive necessary changes

1. If `database_backup.sql` already matches `schema.prisma` for `Contact`:

   - Document that “schema for `Contact` is consistent between Prisma and SQL backup”.
   - Still proceed to verify that `api/contacts.php` uses the exact same columns.

2. If there are **differences** (missing `deletedAt`, wrong lengths, missing indexes, etc.):

   - Write concrete `ALTER TABLE` statements to fix them, e.g.:

     ```sql
     ALTER TABLE `Contact`
       ADD COLUMN `deletedAt` datetime(3) NULL AFTER `updatedAt`;
     ```

   - Or adjust column lengths (`varchar(191)` vs Prisma expectations) only if strictly needed by PHP logic (for Phase 0 you mostly care about presence/absence of columns).

3. In your final output, list these `ALTER TABLE` statements under a heading like:

   > “SQL to run in Loopia (Adminer/phpMyAdmin) to fix `Contact` table”

------

### 3. Validate `handle_create_contact()` INSERT statement

**Objective:** Ensure that the `INSERT INTO Contact (...) VALUES (...)` in `api/contacts.php` is consistent with the `Contact` table definition, uses the correct number and order of parameters, and does not reference non-existent columns.

#### 3.1 Inspect the INSERT

1. In `api/contacts.php`, locate the function:

   ```php
   function handle_create_contact(): void { ... }
   ```

2. Inside it, find the `INSERT INTO Contact` SQL string. It should look like:

   ```php
   $sql = "INSERT INTO Contact (
             id,
             associationId,
             name,
             role,
             email,
             phone,
             mobile,
             linkedinUrl,
             facebookUrl,
             twitterUrl,
             instagramUrl,
             isPrimary,
             createdAt,
             updatedAt,
             deletedAt
           ) VALUES (
             ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL
           )";
   ```

3. Confirm:

   - Column list matches exactly the columns from the SQL `CREATE TABLE` for `Contact`.
   - `createdAt` and `updatedAt` are set by `NOW()` (or equivalent) and not passed as parameters.
   - `deletedAt` is initially `NULL` for newly created contacts.

#### 3.2 Validate `bind_param` signature

1. Immediately after the SQL string, you should see:

   ```php
   $stmt = db()->prepare($sql);
   $stmt->bind_param(
     'sssssssssssi',
     $id,
     $associationId,
     $name,
     $role,
     $email,
     $phone,
     $mobile,
     $linkedin,
     $facebook,
     $twitter,
     $instagram,
     $isPrimary
   );
   ```

2. Verify:

   - The format string (`'sssssssssssi'`) has exactly **11 `s` + 1 `i`** (total 12), matching the 12 bound variables.
   - The order of variables matches the order of question marks and column list:
     - `id`
     - `associationId`
     - `name`
     - `role`
     - `email`
     - `phone`
     - `mobile`
     - `linkedinUrl`
     - `facebookUrl`
     - `twitterUrl`
     - `instagramUrl`
     - `isPrimary`

3. If any mismatch is found (wrong count, order, or type):

   - Fix the signature and/or the column order.
   - Never remove columns; align them with `CREATE TABLE` and Prisma.
   - Comment out old lines instead of deleting them, with a clear explanation.

#### 3.3 Build a sample INSERT for manual testing

1. Construct a complete sample `INSERT` statement that a human can run directly in SQL (Adminer/phpMyAdmin), using safe dummy values:

   ```sql
   INSERT INTO `Contact` (
     `id`,
     `associationId`,
     `name`,
     `role`,
     `email`,
     `phone`,
     `mobile`,
     `linkedinUrl`,
     `facebookUrl`,
     `twitterUrl`,
     `instagramUrl`,
     `isPrimary`,
     `createdAt`,
     `updatedAt`,
     `deletedAt`
   ) VALUES (
     'test-contact-id-123',
     'some-existing-association-id',
     'Test Contact',
     'Test Role',
     'test@example.com',
     '010-000000',
     '070-000000',
     'https://linkedin.com/test',
     NULL,
     NULL,
     NULL,
     0,
     NOW(),
     NOW(),
     NULL
   );
   ```

2. In your final output, provide this SQL (or similar) so the user can test the schema on Loopia.

------

### 4. Verify frontend → PHP API integration for contact creation

**Objective:** Ensure that the React/Next.js frontend sends a payload to `api/contacts.php` that matches what `handle_create_contact()` expects, and that the frontend correctly handles successful and failed responses.

#### 4.1 Inspect the contact creation modal

1. Open `crm-app/components/modals/add-contact-modal.tsx` (or corresponding file handling “Add Contact”).
2. Verify that:
   - On submit, it calls a function that ultimately issues a **POST** request to `'/api/contacts.php'`.
   - The request body is JSON with the following keys (snake_case), matching `handle_create_contact()`:
     - `association_id`
     - `name`
     - `role`
     - `email`
     - `phone`
     - `mobile`
     - `linkedin_url`
     - `facebook_url`
     - `twitter_url`
     - `instagram_url`
     - `is_primary`
3. If the frontend uses a wrapper (e.g. in `crm-app/lib/api.ts`), verify that:
   - The wrapper targets `/api/contacts.php`.
   - It serializes the body in exactly the expected shape.
   - It handles 4xx/5xx responses and surfaces the error to the UI where appropriate.
4. Do **not** change unrelated APIs in `lib/api.ts`. Only adjust the contact creation function if the endpoint or payload is mismatched with `api/contacts.php`.

#### 4.2 Check validators (if used)

1. Open `crm-app/lib/validators/contact.ts` (or similar).
2. Check if there is a Zod (or other) schema that describes contact payloads.
3. Ensure that:
   - Field names and types are compatible with the payload going to PHP.
   - If needed, **only** adjust the schema so it does not block valid payloads or send fields that `handle_create_contact()` cannot handle.
4. Do not expand scope beyond contact creation and basic validation.

------

### 5. Optional static checks / tests

**Objective:** Provide generic, sandbox-friendly checks that increase confidence without requiring access to Loopia or a running web server.

If your environment allows shell commands:

1. Run PHP syntax checks:

   - `php -l api/bootstrap.php`
   - `php -l api/contacts.php`

   Ensure that both files pass with “No syntax errors detected”.

2. If a PHP test runner is configured in this repo (e.g. PHPUnit under `api/` or `backend/`):

   - Attempt to run the minimal command (e.g. `vendor/bin/phpunit`) **only if the vendor directory exists and a phpunit config is present**.
   - If this fails due to environment limitations, report it but do not block the Phase 0 work.

If you cannot run any shell commands:

- Perform at least a manual, text-based review to ensure:
  - No unbalanced parentheses/braces.
  - No unmatched quotes in SQL strings you modified.
  - All modifications are self-consistent.

------

### 6. Final output for the human operator

At the end of Phase 0, your response to the human must include:

1. **Summary (high level)**
   - A short list (bullets) describing:
     - The root causes you identified that could break contact creation.
     - The precise fixes you implemented in `api/contacts.php` (and `api/bootstrap.php` if any).
     - Any schema mismatches and how your SQL fixes address them.
2. **File-level change log**
   - For each modified file (`api/contacts.php`, `api/bootstrap.php`, optional migration/SQL file):
     - Show a clear “before vs after” or diff-like description.
     - Highlight the `INSERT` statement and `bind_param` signature in `handle_create_contact()`.
     - Highlight the `catch (mysqli_sql_exception $e)` changes and logging behavior.
3. **SQL for Loopia**
   - A section titled e.g. **“SQL to run on Loopia (Adminer/phpMyAdmin)”**.
   - Include:
     - Any required `ALTER TABLE` statements to bring `Contact` in line with Prisma and the PHP code.
     - The sample `INSERT` statement for manual testing.
4. **Manual test instructions (frontend + API)**
   - Precise steps for the user to verify that contact creation works end-to-end:
     1. Apply SQL changes on Loopia.
     2. Deploy updated `api/contacts.php` (and `bootstrap.php` if altered) to Loopia.
     3. In the CRM frontend:
        - Navigate to a specific association.
        - Open the “Add Contact” dialog.
        - Fill in sample values and submit.
        - Confirm that:
          - The UI shows the new contact in the association view.
          - `GET /api/contacts.php?association_id={associationId}` returns the new contact.
          - `GET /api/contacts.php?page=1&pageSize=50` includes the contact in the global list (if applicable).
     4. On the server:
        - Inspect the log file in `api/logs/` and confirm:
          - No new `contacts.sql_error` entries for a successful run.
          - If you intentionally trigger an error (e.g. by temporarily corrupting the query), the error is written to the log and not exposed to the client.
5. **No loose ends**
   - Do not leave TODO-comments like “fix later”.
   - Every change must be consistent and ready for immediate manual application by the human.

------

Use this entire specification as your **single source of truth** for Phase 0. Do not extend scope to soft delete design in general, AI integration, or other parts of the system until Phase 0 has been completed and verified.