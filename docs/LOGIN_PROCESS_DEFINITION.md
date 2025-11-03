# Login Process Definition

Senast uppdaterad: 2 november 2025

## Översikt
Inloggningen består av ett flerstegsförlopp som sträcker sig över både frontend (`crm-app`) och backend (`backend` Express-servern). Flödet använder cookies (session + CSRF), JWT-signering och databasanrop via Prisma. Samtliga steg loggas till `logs/auth-flow.log` med ett gemensamt `flowId` (`X-Auth-Flow-Id`) som kopplar ihop händelser från klient och server.

## Aktörer och huvudberoenden
- **Användargränssnitt**: Next.js (React) i `crm-app/app/login`.
- **Auth-provider**: `crm-app/lib/providers/auth-provider.tsx` som orchestrerar session, login och logout mot backend.
- **Middleware**: `crm-app/middleware.ts` skyddar interna routes och tillåter `/api/debug/**`.
- **Backend API**: Express-router i `backend/src/routes/auth.ts`.
- **Sessions- & JWT-hantering**: `backend/src/auth/session.ts`, signering med `JWT_SECRET`.
- **Databas**: Prisma-klient (`backend/src/db.ts`) mot MariaDB (se `.env`-filer).
- **CSRF-skydd**: `backend/src/middleware/security.ts` samt klientens `ensureCsrfToken`.
- **Loggning**: `crm-app/lib/auth-flow/*` (frontend) och `backend/src/lib/auth-flow-logger.ts`.

## Detaljerat flöde
### 1. Sidladdning (`/` eller `/login`)
- **Klient**: Next.js `app/page.tsx` redirectar till `/dashboard`. Middleware upptäcker att sidan inte är öppen och redirectar vidare till `/login`.
- **Beroenden**: `crm-app/middleware.ts`, NextAuth-middleware (`auth()`), session-cookie om den finns.

### 2. Login-sidan initialiseras (`app/login/page.tsx`)
- **Klient**: `LoginForm` mountar och skriver logg `client.page.login.mount` inklusive förifylld e-post.
- **Auth-provider**: `BackendAuthProvider` mountar, loggar `client.auth.provider.mounted`, och kallar `refresh()`.
- **Beroenden**: `sessionStorage` (lagrar/tilldelar `flowId`), `fetchSession()` (nästa steg).

### 3. Initial sessionskontroll (`fetchSession`)
- **Klient**: `crm-app/lib/auth-client.ts` skickar `GET /api/auth/me` till backend med cookies + `X-Auth-Flow-Id`.
- **Backend**:
  1. `cookieParser` + `csrfMiddleware` körs.
  2. `getSessionFromRequest` i `backend/src/auth/session.ts` läser JWT ur cookie/Authorization-header.
  3. JWT valideras med `JWT_SECRET`.
  4. Prisma hämtar användare (`db.user.findFirst`).
- **Resultat**:
  - Om JWT saknas/ogiltigt: logg `backend.auth.session.no-token` eller liknande + svar `{ user: null }`.
  - Om JWT giltigt: logg `backend.auth.session.success` + svar med användardata.
- **Klient**: tolkar svaret. Vid null loggas `client.auth.refresh.unauthenticated` och RoleGuard visar fallback.
- **Beroenden**: JWT (`JWT_SECRET`), cookies (`SESSION_COOKIE_NAME`), Prisma/DB.

### 4. Användaren skickar in formuläret
- **Klient**:
  1. `LoginForm` validerar med Zod.
  2. Logg `client.auth.login.start` + `client.page.login.error`/`redirect` beroende på resultat.
  3. `loginRequest` POST:ar till `/api/auth/login` med CSRF-header via `ensureCsrfToken`.
- **Beroenden**: CSRF-cookie (`csrf_secret` + `csrf`), `NEXT_PUBLIC_API_BASE_URL`, fetch API.

### 5. Backend behandlar /api/auth/login
- **Router** `backend/src/routes/auth.ts`:
  1. Logg `backend.auth.login.received` (inkluderar IP/User-Agent).
  2. Zod-validering av JSON (`loginSchema`).
  3. Prisma-lookup av användare (`db.user.findFirst`).
  4. `bcrypt.compare` kontrollerar lösenord.
  5. Vid framgång:
     - JWT genereras (`createSessionToken`) och sätts i session-cookie (`res.cookie`).
     - CSRF-token roteras (`req.csrfToken()` + `setCsrfCookie`).
     - Logg `backend.auth.login.success`.
  6. Vid fel returneras 4xx och loggar `backend.auth.login.user-not-found` eller `invalid-password`.
- **Beroenden**: Prisma/DB, bcryptJS, JWT, CSRF-middleware, cookie-parser.

### 6. Klienten efter login
- **`loginRequest`** ser 200 OK, loggar `client.auth.login.success`.
- **Auth-provider** kallar `refresh()` igen → genomför steg 3 på nytt men nu med giltig JWT.
- **`fetchSession`** returnerar användare → logg `client.auth.refresh.authenticated`.
- **RoleGuard** re-evaluerar → logg `client.auth.role-guard.evaluate` med `allowed: true`.
- **Router**: `router.push('/dashboard')`.
- **Beroenden**: samma som tidigare plus React Router, RoleGuard.

### 7. Dashboard-rendering
- **Klient**: `RoleGuard` tillåter innehåll, `Sidebar`/`Header` renderas.
- **Backend**: efterföljande dataanrop går via befintliga TRPC/rest-endpoints, alla med sessioncookie+CSRF.
- **Beroenden**: Session-cookie, TRPC-klient/React Query, respektive domändata.

### 8. Logout (för referens)
- **Klient**: `logoutRequest` POST:ar `/api/auth/logout`, loggar `client.auth.logout.start/done`.
- **Backend**: Rensar session- och CSRF-cookies, loggar `backend.auth.logout.completed`.
- **Frontend**: `refresh()` sätter status till `unauthenticated`.

## Loggning och felsökning
- Samtliga klientsteg loggas via `logAuthClientEvent` (använder `navigator.sendBeacon` om möjligt).
- Serverdelen skriver loggar via `backend/src/lib/auth-flow-logger.ts`.
- Filen `logs/auth-flow.log` innehåller JSON-rader, exempel:
  ```json
  {"timestamp":"2025-11-02T12:34:56.789Z","source":"frontend-client","flowId":"40d5...","stage":"client.auth.login.start","context":{"email":"user@example.com"}}
  ```
- Ett enskilt flöde identifieras via `flowId`. Kombinera med backendloggar (`source: backend`).

## Beroendemappning per steg
| Steg | Huvudmoduler | Externa beroenden |
|------|--------------|-------------------|
| Sidladdning & Redirect | `app/page.tsx`, `middleware.ts`, NextAuth middleware | Next.js routing |
| AuthProvider init | `lib/providers/auth-provider.tsx`, `lib/auth-flow/client.ts` | sessionStorage |
| Fetch session | `lib/auth-client.ts`, `backend/src/routes/auth.ts` (`GET /me`) | JWT (`jsonwebtoken`), Prisma, MariaDB |
| CSRF bootstrap | `lib/csrf.ts`, `backend/src/middleware/security.ts` | `csurf`, signed cookies |
| Login POST | `lib/auth-client.ts`, `backend/src/routes/auth.ts` | BcryptJS, Prisma, JWT, CSRF |
| Session parsing | `backend/src/auth/session.ts` | JWT, Prisma |
| UI åtkomstkontroll | `components/auth/role-guard.tsx` | React, RoleGuard fallback |
| Logout | `lib/auth-client.ts`, `backend/src/routes/auth.ts` (`POST /logout`) | Cookie-clearing, CSRF |

## Relaterade filer
- Frontend auth-klient: `crm-app/lib/auth-client.ts`
- Auth-provider: `crm-app/lib/providers/auth-provider.tsx`
- RoleGuard: `crm-app/components/auth/role-guard.tsx`
- Backend auth-router: `backend/src/routes/auth.ts`
- Session-hantering: `backend/src/auth/session.ts`
- CSRF-middleware: `backend/src/middleware/security.ts`
- Loggverktyg: `crm-app/lib/auth-flow/*`, `backend/src/lib/auth-flow-logger.ts`
- API-log endpoint: `crm-app/app/api/debug/auth-flow-log/route.ts`

> Tips: Taila loggar med `pwsh -NoProfile -Command "Get-Content ..\logs\auth-flow.log -Wait"` under felsökning.
