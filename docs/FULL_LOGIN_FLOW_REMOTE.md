# Full Login Flow – `crm.medlemsregistret.se` (Loopia Deployment)

> This document traces every step that happens when a remote user browses to `https://crm.medlemsregistret.se`, logs in, and lands on the “Föreningar” dashboard. The goal is to make it easy to diagnose failures by knowing exactly which component runs next, what data it expects, and which cookies/tokens keep the session alive.

---

## 1. Initial Navigation

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 1.1 | Browser requests `GET https://crm.medlemsregistret.se/`. | Static export in `crm-app/out/index.html` (served by Loopia). | Response is static HTML that bootstraps the Next.js client bundle (`_next/static/...`). No API calls yet. |
| 1.2 | Browser downloads the JS runtime (`_next/static/...chunks/...js`). React hydrates the root page component `crm-app/app/page.tsx`. | `crm-app/app/page.tsx` | The page renders a loading screen while auth status is determined. |
| 1.3 | The entire app tree is wrapped in `<AuthProvider>` (see `crm-app/app/layout.tsx`). On mount, `AuthProvider` runs `refresh()` in an effect. | `crm-app/app/layout.tsx`, `crm-app/lib/providers/auth-provider.tsx` | `refresh()` checks whether the user already has an authenticated PHP session. |

---

## 2. Background Auth Check (`AuthProvider.refresh`)

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 2.1 | `refresh()` calls `api.getAssociations({ page: 1, pageSize: 1 })`. | `crm-app/lib/providers/auth-provider.tsx`, `crm-app/lib/api.ts` | This request runs with `credentials: 'include'`, so any existing cookies (`PHPSESSID`, `csrf`) are sent. |
| 2.2 | `api.getAssociations` constructs the URL `/api/associations.php?page=1&pageSize=1` and issues a `GET` to the same origin. | `crm-app/lib/api.ts` (`jsonFetch`) | `jsonFetch` adds no CSRF header (read request). |
| 2.3 | PHP receives the request:<br>• `api/bootstrap.php` starts the session (storing files under `api/storage/sessions/`).<br>• `api/associations.php` calls `require_auth()`. | `api/bootstrap.php`, `api/associations.php` | If no `PHPSESSID` cookie or missing session file exists, `require_auth()` returns `401 {"error":"Not authenticated"}`. |
| 2.4 | Frontend handles the response: <br>• `refresh()` catches the 401 error. <br>• It clears any stored user from `localStorage` and sets `status = "unauthenticated"`. | `crm-app/lib/providers/auth-provider.tsx` | The root page now renders an unauthenticated view with a “Gå till inloggning” button (`crm-app/app/page.tsx`). |

---

## 3. User Opens the Login Page

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 3.1 | The user browses to `/login` (either manually or via the button). | `crm-app/app/login/page.tsx` | The login form is purely client-side, handled by React Hook Form + Zod. No API call yet. |
| 3.2 | As the form is submitted, `onSubmit` invokes `AuthProvider.login(email, password)`. | `crm-app/app/login/page.tsx` (lines ~37–66) | Button disabled while the promise resolves. |

---

## 4. Login Request Sequence

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 4.1 | `AuthProvider.login` delegates to `api.login(email, password)`. | `crm-app/lib/providers/auth-provider.tsx` (`login` function) | |
| 4.2 | Inside `api.login`, `jsonFetch` is called with `needsCsrf = true`. That triggers `ensureCsrf()` first. | `crm-app/lib/api.ts` | |
| 4.3 | `ensureCsrf()` checks for a `csrf` cookie. If missing, it does `GET /api/csrf.php`. | `crm-app/lib/api.ts` (`ensureCsrf`) | |
| 4.4 | PHP `api/csrf.php` generates/returns the CSRF token and sets cookies:<br>• `PHPSESSID` (HttpOnly, SameSite=Lax).<br>• `csrf` (readable by JS). | `api/csrf.php`, `api/bootstrap.php` | Session files live in `api/storage/sessions/`. |
| 4.5 | With the cookies in place, `api.login` sends `POST /api/login.php` with:<br>• Header `X-CSRF-Token: <value from cookie>`.<br>• JSON body `{ "email": "...", "password": "..." }`.<br>• `credentials: 'include'` so `PHPSESSID` goes along. | `crm-app/lib/api.ts` (`jsonFetch`) | |
| 4.6 | PHP `api/login.php` flow:<br>1. `require_csrf()` validates header vs. session token.<br>2. Simple rate limiting (`rate_limit('login', 5 req/min)`).<br>3. Looks up user in `User` table (`SELECT id, passwordHash FROM User WHERE email = ?`).<br>4. Verifies password with `password_verify` (bcrypt).<br>5. On success, stores the user id in `$_SESSION['uid']` and responds `{"ok":true}`. | `api/login.php`, `api/bootstrap.php` | Session changes persist to disk immediately because `session.save_path` points to the repo directory. |

---

## 5. Post-Login State on the Frontend

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 5.1 | `api.login` resolves. `AuthProvider.login` stores a lightweight user object in `localStorage` (id/email/role) and sets `status = "authenticated"`. | `crm-app/lib/providers/auth-provider.tsx` (`writeStoredUser`) | |
| 5.2 | Login page redirects the browser with `router.replace("/dashboard")`. | `crm-app/app/login/page.tsx` | |
| 5.3 | The root page effect also notices `status === "authenticated"` and keeps the user on `/dashboard` when they hit `/`. | `crm-app/app/page.tsx` | |

---

## 6. Loading Dashboard and Navigating to “Föreningar”

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 6.1 | `/dashboard` renders in the shared `AppLayout`, fetching a lightweight association sample and municipality list for the widgets. | `crm-app/app/dashboard/page.tsx`, `crm-app/components/layout/app-layout.tsx` | Header + sidebar become available immediately after login. |
| 6.2 | From the sidebar, choosing “Föreningar” pushes `/associations`, which triggers sequential fetches: <br>• `GET /api/associations.php?page=1&pageSize=20`.<br>• `GET /api/tags.php`.<br>• `GET /api/municipalities.php`. | `crm-app/app/associations/page.tsx`, `crm-app/lib/api.ts` | All requests reuse the authenticated PHP session (`PHPSESSID`), and mutating calls add CSRF headers. |
| 6.3 | Backend responses: <br>• `api/associations.php` joins `Association`, `Municipality`, and tag data with UTF-8 normalisation.<br>• `api/tags.php` returns Tag list.<br>• `api/municipalities.php` returns Municipality list. | `api/associations.php`, `api/tags.php`, `api/municipalities.php` | Every endpoint calls `require_auth()` first; failure returns `401`. |
| 6.4 | UI state is refreshed, and the user remains “logged in” until they explicitly log out or the PHP session expires. | `crm-app/app/associations/page.tsx` | |

---

## 7. Logout (for completeness)

| Step | What happens | Code/Files | Notes |
|------|--------------|------------|-------|
| 7.1 | Frontend calls `api.logout()` (e.g., when the user hits the logout button). | `crm-app/lib/api.ts`, `crm-app/lib/providers/auth-provider.tsx` | |
| 7.2 | `POST /api/logout.php` requires a valid CSRF header and clears the session server-side (`session_destroy`). | `api/logout.php` | |
| 7.3 | Frontend removes the user from `localStorage`, sets status to `unauthenticated`, and the user is redirected to `/login`. | `crm-app/lib/providers/auth-provider.tsx` | |

---

## 8. Key Moving Parts Summary

- **Frontend state**: `AuthProvider` keeps an in-memory session and mirrors it in `localStorage` under `crm-auth-user`.
- **Transport layer**: `crm-app/lib/api.ts` enforces same-origin requests with `credentials: 'include'` and handles CSRF bootstrap automatically.
- **CSRF & session cookies**: <br>`PHPSESSID` (HttpOnly, SameSite=Lax, Secure) ties the user to a session file under `api/storage/sessions`. <br>`csrf` cookie is readable client-side so the JS client can send `X-CSRF-Token`.
- **Authentication checks**: Every PHP endpoint that touches data calls `require_auth()` which reads `$_SESSION['uid']`. Missing session ⇒ `401 {"error":"Not authenticated"}`.
- **Rate limiting**: Implemented via `$_SESSION['_rate']` buckets in `api/bootstrap.php` for login and other write operations.
- **Database integration**: Credentials come from environment variables or `api/config.php`. `login.php` queries `User`; `associations.php` and friends read/write to `Association`, `Tag`, etc.
- **Event logging**: All server-side steps append JSON lines to `api/logs/remote-login.log` via `log_event(...)` in `api/bootstrap.php` (e.g., `csrf.issued`, `login.success`, `associations.response`). Frontend stages call `logClientEvent(...)` (`crm-app/lib/logging.ts`) which POSTs to `/api/log.php`; those entries land in the same log with `source: "client"`.

---

## 9. Troubleshooting Checklist

If login fails on Loopia:
1. `GET /api/csrf.php` must return 200 and set both `PHPSESSID` and `csrf` cookies.
2. `POST /api/login.php` must include `X-CSRF-Token` (from cookie) **and** send the same `PHPSESSID` cookie.
3. After success, `GET /api/associations.php` must see a session file under `api/storage/sessions/` and return 200.
4. Ensure deployment uploaded both `crm-app/out` **and** the `api/` folder (including `storage/sessions`).

With these steps verified, a user starting at `https://crm.medlemsregistret.se/` will reach the dashboard and can navigate to “Föreningar” without unexpected redirects or `Invalid CSRF token` errors.
