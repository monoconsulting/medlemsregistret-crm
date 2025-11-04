# Runtime Environment Variables (PHP API)

The PHP endpoints under `/api/` expect the following environment variables to be configured by the hosting platform:

| Variable | Description |
| --- | --- |
| `DB_HOST` | Hostname or IP address of the MySQL/MariaDB server. |
| `DB_NAME` | Database schema name containing the CRM tables. |
| `DB_USER` | Database user with read/write permissions for the schema. |
| `DB_PASS` | Password for `DB_USER`. |

All values are read at runtime via `getenv()` inside `api/bootstrap.php`. None of the secrets are committed to source control.
