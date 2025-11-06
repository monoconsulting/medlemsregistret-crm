# Rollback Procedure (Static Frontend + PHP API)

Use this playbook to restore the previous release if the current deployment
introduces regressions. Ensure the relevant backup artifacts (database dump and
web snapshot) are available before proceeding.

## Prerequisites

- Latest successful backups (`docs/backup.md`).
- SSH/SFTP access to the Loopia web host (or equivalent target).
- Credentials for the production database.
- Maintenance window announced to stakeholders.

## Step-by-step

### 1. Put the site in maintenance mode

1. Upload a temporary `maintenance.html` to the webroot (or rename `index.html`)
   so visitors receive a clear message.
2. Optionally set up an `.htaccess` rewrite that serves maintenance mode for all
   requests except your IP.

### 2. Restore database

1. Create a new database dump of the *current* state (for forensic purposes).
2. Drop and recreate the production database (or truncate tables) via phpMyAdmin.
3. Import the previous dump:
   - phpMyAdmin → **Import** → select the `.sql`/`.sql.gz` file from the backup.
   - Alternatively: `mysql -h <host> -u <user> -p <db> < previous_dump.sql`.
4. Verify a few records in `associations`, `tags`, and `notes` tables to ensure
   the data matches expectations.

### 3. Restore web files

1. Remove the current deployment from the webroot:
   ```bash
   sftp user@loopia-host
   sftp> cd public_html
   sftp> rm -rf *
   ```
2. Extract the archived snapshot locally:
   ```bash
   tar -xzf crm_web_previous.tar.gz -C /tmp/rollback_build
   ```
   The archive should contain:
   - `out/` (static export)
   - `api/` (PHP API)
   - `.htaccess` files (root + `api/`)
3. Upload the static export contents to `public_html/`:
   ```bash
   sftp> lcd /tmp/rollback_build/out
   sftp> put -r * 
   ```
4. Upload the PHP API folder:
   ```bash
   sftp> lcd /tmp/rollback_build/api
   sftp> mkdir api
   sftp> cd api
   sftp> put -r *
   ```
5. Ensure file permissions (directories `0755`, PHP files `0644`) and that both
   `.htaccess` files exist (`public_html/.htaccess` and `public_html/api/.htaccess`).

### 4. Verification

1. Remove the maintenance page and verify the site loads.
2. Run the `scripts/verification/curl-smoke.sh` script against the public URL to
   confirm login, list fetch, and logout works.
3. Execute a condensed version of the Phase 4 checklist (login, filters, CRUD)
   to ensure the restored version behaves as expected.

### 5. Post-rollback actions

- Notify stakeholders that the rollback is complete.
- Record the rollback in the worklog (`docs/worklog/<date>_Worklog.md`), including
  reasons, artifacts used, and follow-up tasks.
- Open an issue for the failed release with observed symptoms and next steps.
