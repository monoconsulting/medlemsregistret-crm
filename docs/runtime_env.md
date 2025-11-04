# Runtime Environment Variables (PHP API)

The PHP API in `/api/` requires the following configuration values. Provide them via environment variables when possible. On shared hosting (Loopia), you can alternatively create `api/config.php` based on `config.sample.php`.

| Variable | Description | Required |
| --- | --- | --- |
| `DB_HOST` | MySQL/MariaDB host name provided by Loopia. | Yes |
| `DB_NAME` | Database name containing the CRM schema. | Yes |
| `DB_USER` | Database user with read/write access to the schema. | Yes |
| `DB_PASS` | Password for the database user. | Yes |

Additional notes:
- Sessions use PHP's default `session.save_path`. Ensure the hosting account allows sessions and that filesystem permissions permit writes.
- All PHP scripts assume UTF-8 (`utf8mb4`) encoding.
- HTTPS is recommended so that the session cookie can be marked `Secure`.
