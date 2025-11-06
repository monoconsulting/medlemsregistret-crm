# API Contract (Standalone Frontend)

All API calls are performed against the same origin as the statically exported frontend. Every endpoint lives under the `/api/` path so the deployment can be copied verbatim to Loopia and to local environments.

## Base Rules

- **Base URL:** `https://<host>/api/`
- **Content type:** Every response is JSON (`application/json; charset=utf-8`).
- **Authentication:** PHP session cookie issued by `login.php`.
- **CSRF:** `GET /api/csrf.php` issues a readable `csrf` cookie. All state-changing requests must include an `X-CSRF-Token` header.
- **Credentials:** All fetches use `credentials: 'include'`.
- **Rate limiting:** State-changing requests are protected by in-session throttles (default: login 5/minute, association writes 30/minute, tag writes 20/minute, notes 40/minute). Exceeding the limit returns HTTP `429`.
- **Validation:** `associations.status` must be one of the allowed enum values. Override defaults via `CRM_ALLOWED_ASSOC_STATUSES`. Association `type` is validated against `CRM_ALLOWED_ASSOC_TYPES` when provided. Email addresses and URLs must pass RFC validation; strings are trimmed and truncated to safe lengths.

## Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/csrf.php` | GET | Issues CSRF token cookie and returns `{ token, ok }`. |
| `/api/login.php` | POST | Body `{ email, password }`. Establishes session on success. |
| `/api/logout.php` | POST | Clears session for authenticated user. |
| `/api/associations.php` | GET | Query parameters: `q`, `municipality`, `type`, `status`, repeated `tags[]`, `page`, `pageSize (≤100)`, `sort (name_asc/name_desc/updated_asc/updated_desc)`. Returns `{ items, total, page, pageSize }`. |
| `/api/associations.php` | POST | JSON body with association fields. Creates record and returns `{ id }`. |
| `/api/associations.php` | PUT/PATCH | JSON body `{ id, ...fields }`. Updates association. |
| `/api/associations.php?id=<id>` | DELETE | Soft deletes association by setting `deleted_at`. |
| `/api/association_notes.php?association_id=<id>` | GET | Lists notes for the given association. |
| `/api/association_notes.php` | POST | `{ association_id, content }` to add note. |
| `/api/municipalities.php` | GET | Lists municipalities (id, name, code). |
| `/api/tags.php` | GET | Lists tags sorted by name. |
| `/api/tags.php` | POST | `{ name }` creates tag. `{ action: 'attach'|'detach', associationId, tagId }` manages associations. |

All endpoints rely on parameterized SQL, enforce `SameSite=Lax` session cookies, and reject missing or invalid CSRF tokens on write operations.
