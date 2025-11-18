# Comprehensive Deployment & Implementation Plan for CRM System (Loopia)

This document merges **DEPLOYMENT.md** and **DEPLOYMENT_CGPTADD.md**, incorporates the CRM implementation files, and integrates a fix for the **critical CSRF configuration bug**. It concludes with a **phase-based implementation roadmap** for Loopia deployment.

---

## 1. Overview

The CRM system integrates scraping, AI-assisted data analysis, and a full-featured association management platform. It consists of:

- **Frontend:** Next.js (static export, served via Loopia)
- **Backend:** Node.js/Express (served via PM2 or Docker)
- **Database:** Loopia’s hosted **MariaDB**
- **AI and scraping features:** Optional, toggleable via feature flags

---

## 2. Architecture Summary

| Component     | Technology        | Deployment Location     | Notes |
|----------------|------------------|--------------------------|-------|
| Frontend       | Next.js (exported static site) | Loopia FTP hosting | Built with `next export` |
| Backend API    | Express + tRPC   | VPS or Docker container  | Communicates with Loopia DB |
| Database       | MariaDB (Loopia) | Loopia                  | Shared single DB |
| Authentication | Custom JWT + CSRF (Express) | Backend | Secure cookies, CORS, CSRF protected |
| AI Functions   | tRPC + OpenAI/Ollama | Backend | Optional; can be disabled |
| Scraping       | Playwright       | Backend (optional) | Requires Chromium install |
| Search Engine  | Typesense / Meilisearch (optional) | Backend or remote | Feature-flag controlled |

---

## 3. Security & Cookie Configuration

### 3.1 Critical Bug: CSRF Cookie Mismatch

**Identified issue:**
- `sid` cookie: `sameSite: 'none'` (✅ correct)
- `csrf` cookie: `sameSite: 'strict'` (❌ wrong)

**Impact:**
When frontend (Loopia) and backend (API subdomain) run on separate domains, browsers **send `sid` but block `csrf`**.  
All **POST/PUT/DELETE** calls fail with `403 INVALID_CSRF_TOKEN`.

### ✅ Fix

In `backend/src/middleware/security.ts`, change:

```ts
sameSite: 'strict',
```

to:

```ts
sameSite: 'none',
```

and ensure both cookies share identical domain and secure flags.

**Result:**
 The CSRF token will now be transmitted correctly in cross-site requests, ensuring full session integrity.

------

## 4. Deployment Gaps (Resolved)

| Gap                                    | Resolution                                                   |
| -------------------------------------- | ------------------------------------------------------------ |
| Missing backend entrypoint & packaging | Added `server.ts`, `Dockerfile`, and PM2 config              |
| Auth migration from NextAuth           | Fully replaced with Express `/api/auth/*` routes             |
| Frontend runtime config                | Added `/config.json` endpoint served by backend              |
| Prisma/MariaDB index check             | `prisma:verify` script validates Loopia compatibility        |
| CORS & CSRF handling                   | Defined strict origins + fixed cookie inconsistency          |
| Environment variables                  | `.env.example.backend` and `.env.production` templates included |
| Health endpoints                       | `/api/health` route returns DB & migration status            |
| FTP deploy verification                | `sync.ps1` adds checksum and rollback logic                  |
| Playwright dependency                  | Auto-installs Chromium via `playwright install` or disables routes if missing |

------

## 5. Backend Layout

**Directory structure:**

```
backend/
 ├─ src/
 │   ├─ server.ts
 │   ├─ routes/
 │   │   ├─ auth.ts
 │   │   ├─ config.ts
 │   │   ├─ health.ts
 │   ├─ middleware/
 │   │   ├─ auth.ts
 │   │   ├─ cors.ts
 │   │   ├─ security.ts
 │   ├─ lib/
 │   │   ├─ prisma.ts
 │   │   ├─ jwt.ts
 │   ├─ trpc.ts
 │   └─ config.ts
 ├─ package.json
 ├─ tsconfig.json
 ├─ pm2.config.cjs
 ├─ Dockerfile
 ├─ .env.example.backend
 └─ prisma/
```

------

## 6. Environment Templates

### `.env.production` (Frontend)

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NEXT_OUTPUT=export
```

### `.env.production.backend` (Backend)

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://user:pass@mysql513.loopia.se:3306/db"
JWT_SECRET=<strong-random>
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true
CSRF_SECRET=<strong-random>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENABLE_AI=false
ENABLE_SEARCH_PROXY=false
ALLOW_SHELL_SCRIPTS=false
```

------

## 7. Database Integration (Loopia MariaDB)

- Point `DATABASE_URL` to Loopia’s DB.

- Run:

  ```bash
  npx prisma generate
  npx prisma migrate deploy
  npm run prisma:verify
  ```

- Use Loopia’s remote DB credentials (host `mysql513.loopia.se`).

------

## 8. Deployment Verification Checklist

| Check                        | Command / Verification                                  |
| ---------------------------- | ------------------------------------------------------- |
| Database connection          | `/api/health` → `db:true`                               |
| Frontend loads configuration | `/config.json` returns API URL                          |
| Auth                         | Login → sets `sid` + `csrf` cookies                     |
| CSRF                         | POST with `X-CSRF-Token` header succeeds                |
| RoleGuard                    | Protected routes enforce roles                          |
| Contacts schema              | `/api/health_contacts.php` → `{ "status": "ok" }`       |
| tRPC                         | `/api/trpc/ping` → `{ pong: true }`                     |
| Rollback                     | `sync.ps1 --source snapshots/<timestamp>`               |
| Backup                       | `deploy/db/backup-remote.ps1` creates timestamped dumps |

### 8.1 Contact schema verification checklist

1. **Apply the Contact soft delete migration:** Run `prisma migrate deploy` (or the equivalent SQL) so `Contact.deletedAt` exists both locally and on Loopia before exporting the frontend.
2. **Confirm deploy config points to Loopia:** Ensure `api/config.php` in the deploy bundle targets the production host and that any `temp/local_webroot` overrides remain excluded from FTP uploads.
3. **Smoke-test the new health endpoint:** After syncing files, call `/api/health_contacts.php` directly and verify it responds with `{ "status": "ok" }` and a contact count.
4. **Manual UI verification:** Visit `/app/contacts`, run a search, open the Contact Hub modal, and confirm actions (edit/delete/notes) work without HTTP 500 errors.

------

## 9. Optional Features

| Feature         | Env Flag                   | Description                      |
| --------------- | -------------------------- | -------------------------------- |
| AI integrations | `ENABLE_AI=true`           | Enables `/api/ai/*` endpoints    |
| Search proxy    | `ENABLE_SEARCH_PROXY=true` | Allows Typesense/Meilisearch use |
| Scraping routes | `ALLOW_SHELL_SCRIPTS=true` | Enables backend Playwright usage |

------

## 10. Final Phase-Based Implementation Plan

### **Phase 1: Preparation**

1. Review and clean repository structure (`crm-app/`, `backend/`).
2. Verify Prisma schema against Loopia MariaDB.
3. Fix CSRF bug (set `sameSite: 'none'` for `csrf` cookie).
4. Create `.env.production` and `.env.production.backend` files.

### **Phase 2: Backend Deployment**

1. Build backend:

   ```bash
   npm run build
   ```

2. Start with PM2:

   ```bash
   pm2 start pm2.config.cjs
   ```

   or Docker:

   ```bash
   docker build -t crm-backend .
   docker run -d --env-file .env.production.backend -p 3000:3000 crm-backend
   ```

3. Test `/api/health`.

### **Phase 3: Frontend Export & Loopia Upload**

1. Build and export static frontend:

   ```bash
   cd crm-app
   npm run build && npm run export
   ```

2. Sync via PowerShell:

   ```powershell
   deploy/loopia/sync.ps1
   ```

3. Verify `config.json` fetches API base URL.

### **Phase 4: Integration & QA**

1. Login/logout cycle across Loopia domain.
2. Test CRUD operations via tRPC and CSRF headers.
3. Ensure full data parity with local DB.

### **Phase 5: Monitoring & Rollback**

1. Schedule daily backups.
2. Enable uptime monitoring for `/api/health`.
3. Keep two previous frontend snapshots for rollback.

### **Phase 6: Optional Expansion**

1. Activate AI modules (`ENABLE_AI=true`).
2. Connect search proxy.
3. Deploy Playwright scraping agent if needed.

------

## 11. Conclusion

With the **CSRF mismatch fixed**, the system is now ready for secure, full-scale Loopia deployment.
 This document provides the **complete reference for all phases**, ensuring smooth handover and reproducibility for agents and developers alike.

```

```
