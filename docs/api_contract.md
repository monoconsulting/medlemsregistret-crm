# API Contract — Same-Origin PHP Endpoints

All frontend data access uses same-origin `fetch` calls against PHP scripts in `/api/`. Responses are JSON (`Content-Type: application/json; charset=utf-8`). Authentication relies on PHP sessions with a CSRF token. All mutating requests must include the `X-CSRF-Token` header using the value from the `csrf` cookie provided by `/api/csrf.php`.

## Authentication
- **POST `/api/login.php`** — Body `{ email: string, password: string }`. On success returns `{ ok: true }`, starts a session, and rotates the CSRF token.
- **POST `/api/logout.php`** — Body `{}`. Destroys the session and returns `{ ok: true }`.
- **GET `/api/csrf.php`** — Issues `{ token: string }` and sets the `csrf` cookie. Safe to call multiple times.

## Reference Data
- **GET `/api/municipalities.php`** — Returns `{ items: Municipality[] }` with `id`, `name`, `code`.
- **GET `/api/tags.php`** — Returns `{ items: Tag[] }`. Supports `POST`/`DELETE` actions for tag management (see source for exact contract).

## Associations
- **GET `/api/associations.php`** — Query parameters:
  - `q`: free-text search.
  - `municipality`: municipality id or name.
  - `type`, `status`: string filters.
  - `tags[]`: tag ids or names (multi-value).
  - `page`, `pageSize` (≤ 100): pagination.
  - `sort`: one of `name_asc`, `name_desc`, `updated_desc`, `updated_asc`.
  Returns `{ items, total, page, pageSize }`.
- **POST `/api/associations.php`** — Body with association fields (name required). Creates record, returns `{ id }`.
- **PUT/PATCH `/api/associations.php`** — Body includes `id` plus fields to update. Returns `{ ok: true }`.
- **DELETE `/api/associations.php?id=ID`** — Soft deletes association. Returns `{ ok: true }`.

## Notes
- **GET `/api/association_notes.php?associationId=ID`** — Returns `{ items: Note[] }` (latest first).
- **POST `/api/association_notes.php`** — Body `{ association_id, content }`. Returns `{ id }`.

## Error Handling
- 401 → `{ error: 'Not authenticated' }`. Frontend redirects to `/login`.
- 403 → `{ error: 'Missing or invalid CSRF token' }`.
- 400 → `{ error: 'Validation message' }`.
- 500 → `{ error: 'Server error message' }`.

All endpoints sanitize inputs using prepared statements and enforce soft deletes for associations.
