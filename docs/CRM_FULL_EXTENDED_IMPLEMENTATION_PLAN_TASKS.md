# CRM Full Extended Implementation Task Checklist v.1.1.



## SYSTEM PROMPT — TASK EXECUTION PLAN  

**Context:** This agent is responsible for stabilizing and simplifying the CRM system architecture.  
**Objective:** Decouple backend from Next.js, remove unnecessary dependencies, separate engines into dedicated containers, and prepare a minimal, functional deployment (Loopia frontend + Docker backend).  

---

## 🔧 CORE RULES
1. **Do not reintroduce** any connection between frontend (Next.js) and backend (Node/Express).  
2. **No user authentication coupling** between Loopia frontend and backend.  
3. **Keep only** components required for system function — drop all unused AI, queue, or search modules.  
4. **Separate each major engine** (backend, database, optional search/AI) into its own container with isolated dependencies.  
5. **Ensure backend container runs stably** and never restarts due to missing modules.  
6. **Keep Prisma and DB schema intact** and connected to Loopia MariaDB.  
7. **Focus on simplicity** — this system will be used by only two people.  

---

## 🧩 TASK LIST — EXECUTION STEPS

### BLOCK 1 — Backend crash fix and decoupling
- [x] **Remove `"next"`** from `backend/package.json`.
- [x] **Delete** `backend/package-lock.json` to allow clean dependency rebuild.
- [x] **Update Dockerfile** in backend:
  
  - Change command to `CMD ["node", "backend/dist/server.js"]`.
  - Use `npm ci --omit=dev` in final stage.
- [x] **Create new file** `backend/src/trpc.ts` that initializes tRPC **without any NextAuth imports**.
- [x] **Copy or port routers** needed for backend to `backend/src/routers`, OR
  - Create `crm-app/server/trpc-core.ts` (auth-free) and import only that.  
- [x] **Generate a local Prisma client** in backend (`prisma generate`).
- [x] **Remove imports** from `crm-app/lib/db` — backend must use its own DB client.
- [ ] **Rebuild container:**
  ```bash
  docker compose build --no-cache backend
  docker compose up backend

------

### BLOCK 2 — Minimal production environment

- [x] **Simplify compose setup**:

  - Keep only the backend container.
  - Remove MySQL, Redis, Meilisearch, phpMyAdmin.

- [x] **Connect directly to Loopia MariaDB** via `DATABASE_URL`.

- [x] **Add environment variables:**

  ```
  ALLOWED_ORIGINS=https://your-loopia-domain.se
  ENABLE_AI=false
  ENABLE_SEARCH_PROXY=false
  ALLOW_SHELL_SCRIPTS=false
  ```

-  **Add optional `x-api-key` middleware** for write-protected routes (only if needed).

-  **Verify** backend health endpoint:
   `GET /api/health` → must return `{ ok: true }`.

------

### BLOCK 3 — Frontend (Loopia static export)

-  **Build and export** static frontend:

  ```bash
  cd crm-app
  next build && next export
  ```

-  **Deploy `/out` folder** to Loopia web host via existing deployment script.

-  **Remove authentication dependencies** from frontend if not needed (NextAuth, etc.).

-  **Optional:** Add a local UI “lock” (e.g., admin mode via localStorage) — no backend dependency.

------

### BLOCK 4 — Cleanup and verification

- [x] **Set environment flags:**

  ```
  ENABLE_AI=false
  ENABLE_SEARCH_PROXY=false
  ALLOW_SHELL_SCRIPTS=false
  ```

-  **Remove or hide** all UI elements and code referring to dropped features:

  - AI panels
  - Queue/jobs dashboards
  - Search engine integrations

-  **Confirm container isolation:**

  - Backend runs alone
  - DB is remote (Loopia)
  - Frontend is static

-  **Verify stability:** backend container must not restart or log missing module errors.

------

### BLOCK 5 — Optional hardening (future)

-  Add a minimal `x-api-key` auth layer for protected API endpoints.
-  Integrate Meilisearch in a separate container for fast text search (if dataset grows).
-  Add basic cron job container for background scraping or imports.

------

## ✅ SUCCESS CRITERIA

- Backend container runs without restart loops.
- No `next` or `next-auth` dependencies remain in backend.
- Frontend deploys statically and loads normally from Loopia.
- Database connected and responding to queries.
- Only required containers are active (`backend`).
- Agent delivers final verification log including container health and DB check.

------

**Output format:**
 Agent must deliver:

1. Log of removed packages and cleaned imports.
2. Confirmation of successful backend startup.
3. Updated `compose.yml`, `Dockerfile`, and `backend/package.json`.
4. Updated “Extended Implementation Plan” reflecting minimal setup.
