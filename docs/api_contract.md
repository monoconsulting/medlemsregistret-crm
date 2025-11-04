# API Contract (Phase 0 Task 0.2.2)

- Base URL: the frontend and PHP endpoints are served from the same origin.
- All requests target paths under `/api/` (e.g. `/api/associations.php`).
- No cross-origin requests or CORS headers are required.
- Authentication relies on PHP sessions with cookies scoped to the site origin.
- CSRF protection uses a readable `csrf` cookie and an `X-CSRF-Token` header on write operations.
