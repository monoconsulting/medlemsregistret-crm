# Runtime Environment Variables (PHP API)

The PHP API under `/api/` requires the following variables to be available at runtime:

| Variable | Description |
| --- | --- |
| `DB_HOST` | MySQL/MariaDB host provided by Loopia or the local stack. |
| `DB_NAME` | Database name containing the CRM tables. |
| `DB_USER` | Database user with read/write access. |
| `DB_PASS` | Password for the database user. |

The bootstrap first checks `getenv()` for each value. If any of them are missing it will attempt to load `api/config.php`, which should return an associative array with the same keys (see `api/config.sample.php`). Never commit real credentials—copy the sample file when developing locally.

All environments must expose identical values so the statically exported frontend behaves the same on local machines and on Loopia. Session cookies are configured with `SameSite=Lax`, HttpOnly, and `Secure` when served over HTTPS.
