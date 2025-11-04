# Runtime Environment Contract

The standalone CRM frontend runs as a static Next.js export served alongside a same-origin PHP API. The PHP runtime requires the following environment variables to be defined (in Loopia control panel or a local `.env` file sourced before `php -S`):

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DB_HOST` | Yes | MySQL/MariaDB hostname provided by Loopia or local Docker/MySQL instance. |
| `DB_NAME` | Yes | Database schema name containing the CRM tables. |
| `DB_USER` | Yes | Database user with read/write access to the schema. |
| `DB_PASS` | Yes | Password for `DB_USER`. |

The PHP bootstrap (`api/bootstrap.php`) first attempts to read these values from `getenv()`. If any are missing it will fall back to loading `api/config.php`, allowing local developers to copy `api/config.sample.php` and fill credentials.

Sessions and cookies:
- PHP session cookie is configured with `SameSite=Lax`, `HttpOnly`, and `Secure` when served over HTTPS.
- CSRF token cookie (`csrf`) is **not** HttpOnly so the frontend can read it. Writes require passing the value in the `X-CSRF-Token` header.

No external services, ports, or Node runtimes are required in production. Static assets and PHP scripts are deployed together on the same origin so the frontend can call `/api/*.php` directly without CORS.
