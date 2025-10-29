- # CRM – Minimal Extended Implementation (Loopia Front + Docker Backend) 1.1

  ## Goals
  - Frontend **helt fristående** på Loopia (statisk export).
  - Backend i **en** container, kopplad direkt mot **Loopia MariaDB**.
  - **Inget** Next/NextAuth i backend, **inga** extra motorer (Redis/Meili/BullMQ).

  ## Current status – March 2025
  - ✅ `backend/package.json` är rensad från `next`/`next-auth` och har lokal `prisma`-CLI.
  - ✅ Prisma-schemat ligger nu i `backend/prisma/schema.prisma` och genereras via `npm run prisma:generate`.
  - ✅ Lokal tRPC-bas finns i `backend/src/trpc.ts` och delar `db`-klient via `backend/src/db.ts`.
  - ✅ `backend/Dockerfile` bygger en slimmad multi-stage image med `npm ci --omit=dev` i slutsteget.
  - ✅ Rotfilen `compose.yml` kör endast backend-containern mot Loopia MariaDB.

  ## Phase 1 – Backend decoupling & stability
  1. Remove Next from backend:
     - Delete `"next"` dep + `backend/package-lock.json`, rebuild node_modules.
  2. Create backend-local tRPC base:
     - `backend/src/trpc.ts` (init router/procedures), no NextAuth imports.
     - Copy required routers to `backend/src/routers` or import from `crm-app/server/trpc-core.ts` (auth-free).
     
     ```
    /**

     * backend/src/trpc.ts
     * Minimal, framework-agnostic tRPC bootstrap för backend-containern.
     * - Ingen koppling till Next.js / NextAuth.
     * - Delar Prisma-klienten och session från Express-requesten.
         */

    import { initTRPC } from '@trpc/server';
    import superjson from 'superjson';
    import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

    import type { Session, SessionUser } from './auth/session';
    import { db } from './db';

    export interface TrpcContext {
      db: typeof db;
      req: CreateExpressContextOptions['req'];
      res: CreateExpressContextOptions['res'];
      session: Session | null;
      user: SessionUser | null;
    }

    export function createContext({ req, res }: CreateExpressContextOptions): TrpcContext {
      const session = req.userSession ?? null;

      return {
        db,
        req,
        res,
        session,
        user: session?.user ?? null,
      };
    }

    const t = initTRPC.context<TrpcContext>().create({
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
  WORKDIR /app/backend

  # Copy backend package manifests only
  COPY backend/package.json backend/package-lock.json ./

  # Clean install with dev deps for build & Prisma CLI
  RUN npm ci

  # Copy backend source
  COPY backend/tsconfig.json ./tsconfig.json
  COPY backend/prisma ./prisma
  COPY backend/src ./src
  COPY backend/.env.production.backend ./

  # Generate Prisma client and compile TypeScript -> dist/
  RUN npm run prisma:generate
  RUN npm run build

  # ---------- Runtime stage ----------
  FROM node:20-alpine AS runtime
  WORKDIR /app/backend

  ENV NODE_ENV=production \
      BACKEND_ENV_FILE=/app/backend/.env.production.backend

  # Copy only production deps
  COPY backend/package.json backend/package-lock.json ./
  RUN npm ci --omit=dev

  # Copy compiled app and Prisma artifacts
  COPY --from=build /app/backend/dist ./dist
  COPY --from=build /app/backend/node_modules/.prisma ./node_modules/.prisma
  COPY --from=build /app/backend/.env.production.backend ./

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
      DATABASE_URL: "mysql://<USER>:<PASSWORD>@<LOOPIA_HOST>:3306/<DB>?sslaccept=strict"
      ALLOWED_ORIGINS: "https://your-frontend-on-loopia.example"
      ENABLE_AI: "false"
      AI_PROVIDER: "none"
      AI_API_KEY: ""
      AI_API_BASE: ""
      AI_MODEL: ""
      AI_TIMEOUT_MS: "30000"
      AI_MAX_TOKENS: "1024"
      AI_RATE_LIMIT_RPM: "60"
      ENABLE_SEARCH_PROXY: "false"
      ALLOW_SHELL_SCRIPTS: "false"
    ports:
      - "4040:4040"
    restart: unless-stopped
```

  

  ## Future (optional)

  - Introduce Meilisearch for large-scale fast search (own container).
  - Add BullMQ + Redis for scraping/import jobs.
  - Email/export pipelines.
  - Proper RBAC & audit trail.
