# Same-Origin PHP API Contract

The frontend communicates with the PHP backend under the `/api/` path on the same origin. All responses are JSON encoded as UTF-8. Requests must include `credentials: include` so the PHP session cookie is sent.

## Authentication & CSRF
- `GET /api/csrf.php` – Issues a CSRF cookie (`csrf`) and returns `{ token, ok }`.
- `POST /api/login.php` – Body `{ email, password }`. Requires `X-CSRF-Token`. Returns `{ ok: true }` on success and sets the PHP session cookie.
- `POST /api/logout.php` – Requires authentication and CSRF token. Returns `{ ok: true }` and clears the session.

All state-changing requests (`POST`, `PUT`, `DELETE`) must send the `X-CSRF-Token` header. The frontend retrieves the value from the `csrf` cookie.

## Associations
`/api/associations.php`
- `GET` with optional query params:
  - `q`, `municipality`, `type`, `status`
  - `tags[]` (IDs or names)
  - `page` (default 1), `pageSize` (default 20, max 100)
  - `sort` (`name_asc`, `name_desc`, `updated_asc`, `updated_desc`)
  - Returns `{ items, total, page, pageSize }`.
- `POST` body contains association fields. Requires auth + CSRF. Returns `{ id }` for the new record.
- `PUT`/`PATCH` body includes `id` and fields to update. Requires auth + CSRF. Returns `{ ok: true }`.
- `DELETE` query `?id=`. Performs soft delete (`deleted_at`). Requires auth + CSRF. Returns `{ ok: true }`.

## Notes
`/api/association_notes.php`
- `GET ?association_id=` – Returns `{ items: Note[] }` sorted by newest first.
- `POST` `{ association_id, content }` – Adds a note. Requires auth + CSRF. Returns `{ id }`.

## Tags
`/api/tags.php`
- `GET` – Returns `{ items: Tag[] }`.
- `GET ?association_id=` – Returns `{ items: Tag[], assigned: number[] }` for the specified association.
- `POST { name }` – Creates a tag. Requires auth + CSRF. Returns `{ id }`.
- `POST { action: "attach" | "detach", associationId, tagId }` – Manages tag relations. Requires auth + CSRF. Returns `{ ok: true }`.

## Municipalities
`/api/municipalities.php`
- `GET` – Returns `{ items: Municipality[] }` ordered by name.

## Error Handling
- 401 – Missing or invalid session (`{ error: "Not authenticated" }`).
- 403 – Missing/invalid CSRF token.
- 405 – Unsupported HTTP method.
- Validation errors return 400 with `{ error: string }`.

All endpoints close execution with `json_out`, guaranteeing JSON output and appropriate HTTP status codes.
