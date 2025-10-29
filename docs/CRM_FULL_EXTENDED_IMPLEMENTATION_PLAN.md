- # CRM – Minimal Extended Implementation (Loopia Front + Docker Backend) 1.1

  ## Goals
  - Frontend **helt fristående** på Loopia (statisk export).
  - Backend i **en** container, kopplad direkt mot **Loopia MariaDB**.
  - **Inget** Next/NextAuth i backend, **inga** extra motorer (Redis/Meili/BullMQ).

  ## Status (2025-10-29)
  - ✅ Backend dependency list trimmed: Next.js and NextAuth removed, Prisma CLI added for local client generation.
  - ✅ Backend runtime now ships in a minimal Docker image (multi-stage build, `npm ci --omit=dev`, `CMD ["node", "dist/server.js"]`).
  - ✅ Backend owns its Prisma schema/client (`backend/prisma/schema.prisma`, `backend/src/db.ts`) and no longer imports code from `crm-app`.
  - ✅ Minimal `compose.yml` defined with a single backend service targeting Loopia MariaDB and explicit feature flags.
  - ⚠️ `prisma generate` pending in CI because npm registry access for the Prisma CLI returned HTTP 403 during local install.

  ## Phase 1 – Backend decoupling & stability
  1. Remove Next from backend:
     - Delete `"next"` dep + `backend/package-lock.json`, rebuild node_modules.
  2. Create backend-local tRPC base:
     - `backend/src/trpc.ts` (init router/procedures), no NextAuth imports.
     - Copy required routers to `backend/src/routers` or import from `crm-app/server/trpc-core.ts` (auth-free).
     
     ```
     /**
     
      * backend/src/trpc.ts
      * Minimal, framework-agnostic tRPC bootstrap for the backend container.
      * - No Next.js / NextAuth imports.
      * - Provides a clean base to register backend-only routers.
          */
     
     import { initTRPC } from '@trpc/server';
     import superjson from 'superjson';
     import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
     
     export type Context = {
       // Add per-request services here (db, logger, user, etc.)
       // prisma?: PrismaClient;
       req: CreateExpressContextOptions['req'];
       res: CreateExpressContextOptions['res'];
       user: null | { id: string; email?: string; role?: string };
     };
     
     export function createContext(opts: CreateExpressContextOptions): Context {
       // If you later add API-key/JWT middleware, hydrate req.user here.
       return {
         req: opts.req,
         res: opts.res,
         user: null,
       };
     }
     
     const t = initTRPC.context<Context>().create({
       transformer: superjson,
     });
     
     export const router = t.router;
     export const publicProcedure = t.procedure;
     
     // ---- App router (extend/merge your feature routers here) ----
     export const appRouter = router({
       ping: publicProcedure.query(() => ({ pong: true, now: new Date().toISOString() })),
     });
     
     export type AppRouter = typeof appRouter;
     ```
     
     
  3. Local Prisma client:
     - Add `backend/prisma/schema.prisma` (or reuse generated output via shared path).
     - `npm run prisma:generate` within backend context.
  4. Docker correctness:
     - `CMD ["node","backend/dist/server.js"]`.
     - Final stage: `npm ci --omit=dev`.
  5. Sanity checks:
     - `GET /api/health` returns `ok`.
     - Basic list endpoints return data from Loopia DB.

  

  ```
  # backend/Dockerfile
  
  # Multi-stage build: clean prod image with no dev deps and no Next.js
  
  # ---------- Build stage ----------
  
  FROM node:20-alpine AS build
  WORKDIR /app
  
  # Copy backend package manifests only
  
  COPY backend/package.json backend/package-lock.json ./backend/
  WORKDIR /app/backend
  
  # Clean install with dev deps for build
  
  RUN npm ci
  
  # Copy backend source
  
  COPY backend/ ./
  
  # Build to dist/ (expects "build" script to compile TypeScript -> dist/)
  
  # Example package.json: "build": "tsup src/server.ts --format cjs --out-dir dist"
  
  RUN npm run build
  
  # ---------- Runtime stage ----------
  
  FROM node:20-alpine AS runtime
  WORKDIR /app/backend
  
  ENV NODE_ENV=production
  
  # Copy only production deps
  
  COPY --from=build /app/backend/package.json ./
  COPY --from=build /app/backend/package-lock.json ./
  RUN npm ci --omit=dev
  
  # Copy compiled app
  
  COPY --from=build /app/backend/dist ./dist
  
  # Expose port
  
  EXPOSE 4040
  
  # Correct start command (matches dist/server.js)
  
  CMD ["node", "dist/server.js"]
  ```

  

  ## Phase 2 – Minimal production run
  1. Compose:
     - Single service `backend`, `DATABASE_URL` → Loopia.
     - `ALLOWED_ORIGINS=https://<your-loopia-frontend>`.
  2. Frontend publish:
     - `next export` → deploy `/out` via your Loopia sync script.
  3. (Optional) Protect write endpoints:
     - Add `x-api-key` middleware and set `BACKEND_API_KEYS="your-secret"`.

  ## Phase 3 – Quality & docs
  1. Remove dormant features/flags from UI:
     - Hide AI/Meili/queues buttons/menus.
  2. Operational docs:
     - “How to deploy” (Loopia export + compose up).
     - “How to backup DB” (mysqldump against Loopia).
  3. Basic tests:
     - One Playwright smoke (frontend navigates & lists).
     - One API test (`/api/health`, `/api/associations?limit=5`).

  

  ## Files for implementation

  ### trpc.ts

  ```
  /**
   * backend/src/trpc.ts
   * Minimal, framework-agnostic tRPC bootstrap for the backend container.
   * - No Next.js / NextAuth imports.
   * - Provides a clean base to register backend-only routers.
       */
  
  import { initTRPC } from '@trpc/server';
  import superjson from 'superjson';
  import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
  
  export type Context = {
    // Add per-request services here (db, logger, user, etc.)
    // prisma?: PrismaClient;
    req: CreateExpressContextOptions['req'];
    res: CreateExpressContextOptions['res'];
    user: null | { id: string; email?: string; role?: string };
  };
  
  export function createContext(opts: CreateExpressContextOptions): Context {
    // If you later add API-key/JWT middleware, hydrate req.user here.
    return {
      req: opts.req,
      res: opts.res,
      user: null,
    };
  }
  
  const t = initTRPC.context<Context>().create({
    transformer: superjson,
  });
  
  export const router = t.router;
  export const publicProcedure = t.procedure;
  
  // ---- App router (extend/merge your feature routers here) ----
  export const appRouter = router({
    ping: publicProcedure.query(() => ({ pong: true, now: new Date().toISOString() })),
  });
  
  export type AppRouter = typeof appRouter;
  
  
  ```

  

  ### backend/src/server.ts

  ```
  /**
  
   * backend/src/server.ts
   * Minimal Express + tRPC server for the backend container.
   * - No Next.js / NextAuth dependencies.
   * - CORS is restricted by ALLOWED_ORIGINS (comma-separated).
   * - Health endpoint at /api/health.
   * - tRPC mounted at /trpc.
       */
  
  import express from 'express';
  import cors from 'cors';
  import morgan from 'morgan';
  import helmet from 'helmet';
  import { createExpressMiddleware } from '@trpc/server/adapters/express';
  import { appRouter, createContext } from './trpc';
  
  const PORT = Number(process.env.PORT || 4040);
  
  // Configure CORS from env
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  const app = express();
  
  // Security & logging
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(morgan('tiny'));
  
  // CORS
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // allow server-to-server & curl
        if (allowed.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: false, // no cross-site cookies in this minimal setup
    }),
  );
  
  // Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));
  
  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'crm-backend', ts: new Date().toISOString() });
  });
  
  // tRPC
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  
  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
  
  // Start server
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on http://0.0.0.0:${PORT}`);
  });
  ```

  

  ### backend/Dockerfile

  ```
  # backend/Dockerfile
  
  # Multi-stage build: clean prod image with no dev deps and no Next.js
  
  # ---------- Build stage ----------
  
  FROM node:20-alpine AS build
  WORKDIR /app
  
  # Copy backend package manifests only
  
  COPY backend/package.json backend/package-lock.json ./backend/
  WORKDIR /app/backend
  
  # Clean install with dev deps for build
  
  RUN npm ci
  
  # Copy backend source
  
  COPY backend/ ./
  
  # Build to dist/ (expects "build" script to compile TypeScript -> dist/)
  
  # Example package.json: "build": "tsup src/server.ts --format cjs --out-dir dist"
  
  RUN npm run build
  
  # ---------- Runtime stage ----------
  
  FROM node:20-alpine AS runtime
  WORKDIR /app/backend
  
  ENV NODE_ENV=production
  
  # Copy only production deps
  
  COPY --from=build /app/backend/package.json ./
  COPY --from=build /app/backend/package-lock.json ./
  RUN npm ci --omit=dev
  
  # Copy compiled app
  
  COPY --from=build /app/backend/dist ./dist
  
  # Expose port
  
  EXPOSE 4040
  
  # Correct start command (matches dist/server.js)
  
  CMD ["node", "dist/server.js"]
  ```

  

  

  ### compose.yml

  ```
  name: crm-backend
  services:
    backend:
      build:
        context: .
        dockerfile: backend/Dockerfile
      environment:
        NODE_ENV: production
        PORT: "4040"
  
        # Point directly to your Loopia MariaDB (fill in your real values):
  
  ​      DATABASE_URL: "mysql://<USER>:<PASSWORD>@<LOOPIA_HOST>:<PORT>/<DB>?sslaccept=strict"
  
        # Comma-separated list of allowed origins for CORS:
  
  ​      ALLOWED_ORIGINS: "https://your-frontend-on-loopia.se"
  
        # Feature flags kept OFF for minimal setup:
  
        # ---- AI feature flag & settings (prepared, off by default) ----
        ENABLE_AI: "false"            # set to "true" to enable
        AI_PROVIDER: "openai"           # "openai" | "anthropic" | "azure_openai" | "none"
        AI_API_KEY: ""                # required when ENABLE_AI=true
        AI_API_BASE: ""               # required for azure_openai
        AI_MODEL: ""                  # e.g., "gpt-4o-mini", "claude-3-5-sonnet", etc.
        AI_TIMEOUT_MS: "30000"
        AI_MAX_TOKENS: "1024"
        AI_RATE_LIMIT_RPM: "60"
  
        # Existing flags, kept off:
        ENABLE_SEARCH_PROXY: "false"
        ALLOW_SHELL_SCRIPTS: "false"
  
     - "4040:4040"
       start: unless-stopped
  
  ```

  

  ## Future (optional)

  - Introduce Meilisearch for large-scale fast search (own container).
  - Add BullMQ + Redis for scraping/import jobs.
  - Email/export pipelines.
  - Proper RBAC & audit trail.
