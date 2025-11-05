# Backup Procedure (Loopia & Local)

This document describes the repeatable steps for capturing backups of both the
database and the deployed static/PHP files. Follow the same procedure for each
release and store the resulting artifacts in the configured secure location.

## 1. Database Backup

### 1.1 Loopia production

1. Sign in to the Loopia Control Panel.
2. Navigate to **Databaser → MySQL** and locate the database that serves the CRM site.
3. Click **phpMyAdmin** for the database and log in with the DB credentials.
4. In phpMyAdmin, select the database in the sidebar, then choose **Export**.
5. Pick the **Custom** export method with the following settings:
   - Format: `SQL`
   - Compression: `gzipped`
   - Object creation options: `Add DROP TABLE`, `Add IF NOT EXISTS`
   - Data creation options: `INSERT` (default)
6. Click **Go** to download a file named like `loopia_crm_YYYYMMDD.sql.gz`.
7. Store the dump in the secure backup directory, e.g. `backups/db/YYYY/MM/loopia_crm_<timestamp>.sql.gz`.

### 1.2 Local development

1. Ensure the local MySQL container/service is running.
2. From the project root, run:

   ```bash
   mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
     --routines --single-transaction --quick --result-file "backups/db/local_crm_$(date +%Y%m%d_%H%M%S).sql"
   ```

3. Verify the dump by importing it into a scratch database or using `mysql --dry-run`.

## 2. Web Files Snapshot

The deployable assets consist of the statically exported frontend (`crm-app/out`)
and the PHP API (`/api`). Capture a full snapshot before each release.

1. On the machine that produced the deployable artifacts:
   ```bash
   tar -czf backups/web/crm_web_$(date +%Y%m%d_%H%M%S).tar.gz \
     crm-app/out api
   ```
2. For Loopia, if the files are already uploaded, fetch them via SFTP:
   ```bash
   sftp user@loopia-host
   sftp> cd public_html
   sftp> get -r * ./backups/web/loopia_public_html_$(date +%Y%m%d_%H%M%S)
   ```
   Then compress the downloaded folder.
3. Record the checksum (e.g., `sha256sum`) of each archive and keep the values
   alongside the files for integrity checks.

## 3. Retention & Rotation

- Keep at least the previous three production releases and their database dumps.
- For daily local work, a single rotating backup is sufficient.
- Store credentials to access the archives securely (password managers or vault).

## 4. Validation Checklist

- [ ] Database dump imports into a temporary database without errors.
- [ ] Web snapshot contains both `index.html` and `api/bootstrap.php`.
- [ ] Checksums recorded and verified after transfer.
- [ ] Backup metadata logged in `docs/worklog/<date>_Worklog.md`.
