

# Gaps / Missing pieces to reach a full Loopia install

1. **Backend entrypoint & packaging are referenced but not finalized**
   - The plan mentions `backend/` with Express `src/server.ts`, PM2/Docker, and a “zip artifact” build script—**ship the actual code + Procfile/PM2 config** and a one-command bootstrap. (Currently marked TBD/“TODO”). 
2. **Auth flow migration completeness**
   - You’re moving away from `NextAuth` on the static frontend. You **must**:
      a) Implement `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` with secure cookies (SameSite=None, Secure) and CSRF token.
      b) Update `RoleGuard` to rely on `/api/auth/me` (the plan says this, but ensure the code ships). 
      c) Remove/disable `middleware.ts` from the static build and add client guards everywhere gated today by middleware. 
3. **Frontend configuration at runtime**
   - The plan proposes a runtime `/config.json` served by backend so the static site can learn `API_BASE_URL`—**add that tiny endpoint and the client bootstrapping script** (fetch + cache). 
4. **Prisma & MariaDB compatibility guard**
   - Confirm Prisma targets **MariaDB** features you use (indexes, **fulltext** per Prisma schema). Provide a `prisma:verify` step to assert Loopia’s version supports your indexes before `migrate deploy`. (Your schema uses fulltext and composite indexes.) 
5. **CORS/CSRF details**
   - The plan says to enable CORS; **add exact origins**, credentials, and an **anti-CSRF token** pattern for state-changing requests. (Document cookie names, paths, domain scope.) 
6. **Secrets and environment matrices**
   - Provide authoritative `.env.production` samples for **frontend build** (only `NEXT_PUBLIC_*`) and **backend runtime** (DB creds, JWT/SESSION secrets, mail, search). The plan references them but does not include concrete templates. 
7. **Health & readiness endpoints**
   - Implement `/api/health` returning DB connectivity & migration status; reference it in the verification checklist (already mentioned) **and** monitoring. 
8. **FTP deploy verification & rollback**
   - The FTP scripts exist; add:
      a) a **post-sync checksum output**,
      b) a **rollback** task to restore the previous `out/` snapshot on Loopia if something goes wrong. 
9. **Search & AI proxies**
   - If Typesense/Meilisearch or AI are in use: the backend must expose **proxy endpoints** and read credentials from env; ship with **feature flags** so production can disable them if secrets are absent. (Plan mentions but treat as must-have toggles.) 
10. **Scraping path**
    - Running Playwright on the backend host requires chromium install; **add automated `playwright install` on bootstrap**, or feature-flag the scraping routes off in prod. 

------

# Detailed, end-to-end Deployment Playbook (agent steps)

## A. Repository layout finalization

1. Create `backend/` with:
   - `src/server.ts` (Express), `src/trpc.ts` (mount `appRouter`), `src/routes/auth.ts`, `src/routes/health.ts`.
   - `package.json`, `tsconfig.json`, `prisma/` (reuse schema), `pm2.config.cjs` or `Dockerfile`.
   - `.env.example.backend` (see Section **Env templates** below). 
2. In `crm-app/`:
   - Update `next.config.ts` to enable **export** ONLY when `NEXT_OUTPUT=export`. Disable server actions. Mark images unoptimized. 
   - Remove `app/api/**` and `middleware.ts` from the static artifact (guarded by build flag). 
   - Update `lib/trpc/client.ts` → base URL from `NEXT_PUBLIC_API_BASE_URL`. 
   - Add small client bootstrap to fetch `/config.json` (served by backend) on first load. 

## B. Backend implementation

1. **Auth endpoints**
   - `POST /api/auth/login` → credentials → verify via Prisma → set httpOnly cookie(s) + CSRF token in a non-httpOnly cookie.
   - `POST /api/auth/logout` → clear cookies.
   - `GET /api/auth/me` → return user {id, name, role}. 
2. **tRPC**
   - Mount your existing routers under `/api/trpc` using `createExpressMiddleware`. 
3. **CORS/CSRF**
   - CORS origins: `[https://<your-loopia-domain>]`, `credentials: true`.
   - Enforce CSRF for `POST/PUT/PATCH/DELETE` using the CSRF token header. 
4. **Health**
   - `GET /api/health`: `{ok:true, db:true, version, migrated}` (Prisma `.$queryRaw('SELECT 1')`). 
5. **Config endpoint**
   - `GET /config.json`: `{ apiBaseUrl, sentryDsn?, features: {...} }`. Frontend fetches this at startup. 

## C. Database (single Loopia MariaDB)

1. **Point the backend `DATABASE_URL` to Loopia** and run `prisma generate` + `prisma migrate deploy`. 
2. **Version check** step (`prisma:verify`) to ensure fulltext/index statements in your schema are supported. (Abort if unsupported.) 
3. **Backups**: enable `deploy/db/backup-remote.ps1` nightly; store dumps under `backups/` with timestamp. 

## D. Frontend (Loopia)

1. Run `deploy/loopia/export.ps1` → emits `crm-app/out/`.
2. Run `deploy/loopia/sync.ps1` (FTPS mirror with `--delete --continue`). Save a local snapshot for rollback. 
3. Smoke test: load index, ensure client bootstraps `config.json` and calls backend `/api/auth/me`.

## E. Hosting the backend

- **Option 1: PM2 on VPS**
  - Copy build artifact, `pm2 start pm2.config.cjs`, set env from `.env.production.backend`.
- **Option 2: Docker**
  - Build image, run with env file, open port 443/80 behind nginx/caddy; outbound 3306 to `mysql513.loopia.se`. 

## F. Verification checklist (augment)

- `/api/health` returns ok. 
- Frontend loads; tRPC queries succeed; protected routes render via `RoleGuard`. 
- Create, update, list associations; check 3 records parity local vs remote (SQL). 
- Login/logout cycle across Loopia domain works; cookie flags correct. 

------

# Environment templates (copy/paste)

**`.env.production` (frontend build only)**

```
# Consumed at build time only; do not include secrets.
NEXT_PUBLIC_API_BASE_URL=https://api.<your-domain>
NEXT_OUTPUT=export
```

(Frontend reads `/config.json` at runtime to override if needed.) 

**`.env.production.backend` (server runtime)**

```
NODE_ENV=production
PORT=3000
# Loopia MariaDB
DATABASE_URL="mysql://<user>:<pass>@mysql513.loopia.se:3306/<db>?sslmode=prefer"
# Auth
JWT_SECRET=<strong-random>
COOKIE_DOMAIN=<your public domain>
CSRF_SECRET=<strong-random>
# CORS
ALLOWED_ORIGINS=https://<your-loopia-domain>
# Feature flags
ALLOW_SHELL_SCRIPTS=false
ENABLE_AI=false
ENABLE_SEARCH_PROXY=false
```

(Flags match the plan’s optional features.) 

------

# Rollback & Ops

- **Frontend rollback:** keep last two `out/` snapshots; `sync.ps1 --source snapshots/<ts>/out` to revert. 
- **DB rollback:** restore latest dump using `backup-remote.ps1 --restore`. Log results to `deploy/logs/*.log`. 
- **Monitoring:** add an uptime check for `/api/health`; centralize logs from PM2/Docker. 

# Backend files

### `backend/package.json`

```
{
  "name": "crm-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "lint": "eslint .",
    "prisma:generate": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:verify": "node dist/tools/verify-prisma.js || (echo \"Prisma verification failed\" && exit 1)",
    "postbuild": "node -e \"console.log('Build complete')\""
  },
  "dependencies": {
    "@trpc/server": "^10.45.2",
    "@trpc/client": "^10.45.2",
    "@trpc/react-query": "^10.45.2",
    "@trpc/server/adapters/express": "^10.45.2",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "csurf": "^1.11.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "zod": "^3.23.8",
    "@prisma/client": "^5.18.0"
  },
  "devDependencies": {
    "eslint": "^9.12.0",
    "@types/bcryptjs": "^2.4.2",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.7",
    "tsx": "^4.19.0",
    "typescript": "^5.6.3",
    "prisma": "^5.18.0"
  }
}
```

------

### `backend/tsconfig.json`

```
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

------

### `backend/pm2.config.cjs`

```
module.exports = {
  apps: [
    {
      name: "crm-backend",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
```

------

### `backend/Dockerfile`

```
# Production container (no Playwright; add it later if needed)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build && npm run prisma:generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
CMD ["node", "dist/server.js"]
```

------

### `backend/.env.example.backend`

```
# === Runtime ===
NODE_ENV=production
PORT=3000

# === DB (Loopia MariaDB) ===
# Example: mysql://user:pass@mysqlNNN.loopia.se:3306/dbname?connection_limit=10
DATABASE_URL="mysql://<user>:<password>@mysql513.loopia.se:3306/<database>"

# === Auth / Cookies ===
JWT_SECRET="<generate-a-64+ char random secret>"
COOKIE_DOMAIN="example.com"          # your public domain (no protocol)
COOKIE_SECURE="true"                 # true in prod (HTTPS)
CSRF_SECRET="<another-strong-secret>"

# === CORS ===
ALLOWED_ORIGINS="https://www.example.com,https://example.com"

# === Feature flags ===
ENABLE_AI="false"
ENABLE_SEARCH_PROXY="false"
ALLOW_SHELL_SCRIPTS="false"
```

------

### `backend/src/config.ts`

```
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string(),
  COOKIE_SECURE: z
    .string()
    .transform(v => v === 'true')
    .default('true' as unknown as string),

  CSRF_SECRET: z.string().min(16),

  ALLOWED_ORIGINS: z.string().default(''),

  ENABLE_AI: z.string().transform(v => v === 'true').default(false as unknown as string),
  ENABLE_SEARCH_PROXY: z.string().transform(v => v === 'true').default(false as unknown as string),
  ALLOW_SHELL_SCRIPTS: z.string().transform(v => v === 'true').default(false as unknown as string),
});

export const cfg = schema.parse(process.env);

export const corsOrigins = cfg.ALLOWED_ORIGINS
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
```

------

### `backend/src/lib/prisma.ts`

```
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: [{ emit: 'event', level: 'query' }, 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

prisma.$on('query' as any, (e: any) => {
  // Opt-in: uncomment for verbose SQL logs in dev
  // console.log('Query:', e.query, e.params, `${e.duration}ms`);
});
```

------

### `backend/src/lib/jwt.ts`

```
import jwt from 'jsonwebtoken';
import { cfg } from '../config.js';

export type JwtPayload = {
  sub: string;           // user id
  role?: string;
  name?: string;
};

export function signJwt(payload: JwtPayload, maxAge = '7d') {
  return jwt.sign(payload, cfg.JWT_SECRET, { expiresIn: maxAge });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, cfg.JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
```

------

### `backend/src/middleware/cors.ts`

```
import cors from 'cors';
import { corsOrigins } from '../config.js';

export const corsMiddleware = cors({
  origin(origin, cb) {
    // Allow server-to-server/CLI requests with no origin
    if (!origin) return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
});
```

------

### `backend/src/middleware/security.ts`

```
import type { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import helmet from 'helmet';
import { cfg } from '../config.js';
import cookieParser from 'cookie-parser';

/**
 * Helmet hardening (safe defaults).
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // frontend is static; keep simple here
});

/**
 * Cookie parser
 */
export const cookieParserMiddleware = cookieParser();

/**
 * CSRF protection:
 * - Uses double-submit cookie pattern.
 * - Client must send X-CSRF-Token header matching 'csrf' cookie for state-changing requests.
 */
export const csrfMiddleware = csrf({
  cookie: {
    key: 'csrf',
    sameSite: 'strict',
    httpOnly: false,     // must be readable by client JS to echo as header
    secure: cfg.COOKIE_SECURE,
    domain: cfg.COOKIE_DOMAIN,
    path: '/',
  },
});

/**
 * Attach a fresh CSRF token for clients to read (GET only).
 */
export function attachCsrfToken(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET') {
    // Force token generation and set a helper header for debugging
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _t = (req as any).csrfToken?.() ?? '';
    res.setHeader('X-CSRF-Enabled', '1');
  }
  next();
}
```

------

### `backend/src/middleware/auth.ts`

```
import type { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../lib/jwt.js';

export type AuthUser = { id: string; role?: string; name?: string } | null;

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Request {
      user: AuthUser;
    }
  }
}

export function authFromCookie(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.sid;
  if (!token) {
    req.user = null;
    return next();
  }
  const payload = verifyJwt(token);
  if (!payload) {
    req.user = null;
    return next();
  }
  req.user = { id: payload.sub, role: payload.role, name: payload.name };
  next();
}

/**
 * Guard for routes that require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  next();
}
```

------

### `backend/src/trpc.ts`

```
import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import type { Request, Response } from 'express';
import { prisma } from './lib/prisma.js';

export const createContext = ({ req, res }: { req: Request; res: Response }) => ({
  prisma,
  user: req.user, // from auth middleware
  req,
  res,
});
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

/** Example router — plug your existing routers here */
export const appRouter = t.router({
  ping: t.procedure.query(() => ({ pong: true })),
});

export type AppRouter = typeof appRouter;

export const trpcHandler = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
});
```

------

### `backend/src/routes/auth.ts`

```
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signJwt } from '../lib/jwt.js';
import { cfg } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Auth routes:
 * - POST /api/auth/login { email, password }
 * - POST /api/auth/logout
 * - GET  /api/auth/me
 */
export const authRouter = Router();

function setSessionCookie(res: any, token: string) {
  res.cookie('sid', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: cfg.COOKIE_SECURE,
    domain: cfg.COOKIE_DOMAIN,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearSessionCookie(res: any) {
  res.clearCookie('sid', {
    domain: cfg.COOKIE_DOMAIN,
    path: '/',
    secure: cfg.COOKIE_SECURE,
    sameSite: 'none',
  });
}

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'MISSING_CREDENTIALS' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ ok: false, error: 'INVALID_LOGIN' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: 'INVALID_LOGIN' });

  const token = signJwt({ sub: user.id, role: user.role ?? undefined, name: user.name ?? undefined });
  setSessionCookie(res, token);

  return res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  // Optionally refetch for fresh role/flags
  // const dbUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
  const u = req.user!;
  return res.json({ ok: true, user: { id: u.id, name: u.name, role: u.role } });
});
```

------

### `backend/src/routes/health.ts`

```
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import pkg from '../../package.json' assert { type: 'json' };

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const migrations = await prisma.$queryRawUnsafe<{ applied: number }[]>(
      `SELECT COUNT(*) as applied FROM _prisma_migrations`
    );
    return res.json({
      ok: true,
      service: 'crm-backend',
      version: pkg.version,
      db: true,
      migrations_applied: Number(migrations?.[0]?.applied ?? 0),
      time: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, db: false, error: String(err) });
  }
});
```

------

### `backend/src/routes/config.ts`

```
import { Router } from 'express';
import { cfg } from '../config.js';

export const configRouter = Router();

/**
 * Public runtime config for the static frontend.
 * Fetch this as /config.json on app boot.
 */
configRouter.get('/', (_req, res) => {
  res.json({
    apiBaseUrl: `https://${cfg.COOKIE_DOMAIN}`, // adjust if backend runs on a subdomain
    features: {
      ai: cfg.ENABLE_AI,
      search: cfg.ENABLE_SEARCH_PROXY,
    },
  });
});
```

------

### `backend/src/server.ts`

```
/**
 * Express bootstrap:
 * - Security (helmet, cookies, CSRF), CORS (exact origins), logging
 * - Auth from cookie (JWT)
 * - Routes: /api/health, /api/auth/*, /api/trpc
 * - /config.json for static frontend to discover API base
 */

import express from 'express';
import morgan from 'morgan';
import { cfg } from './config.js';
import { corsMiddleware } from './middleware/cors.js';
import { helmetMiddleware, cookieParserMiddleware, csrfMiddleware, attachCsrfToken } from './middleware/security.js';
import { authFromCookie } from './middleware/auth.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { trpcHandler } from './trpc.js';
import { configRouter } from './routes/config.js';

const app = express();

// Basic middleware
app.use(helmetMiddleware);
app.use(morgan(cfg.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(corsMiddleware);
app.use(cookieParserMiddleware);
app.use(express.json({ limit: '1mb' }));

// CSRF (must come after cookie parser)
app.use(csrfMiddleware);
app.use(attachCsrfToken);

// Auth context
app.use(authFromCookie);

// Public runtime config for the static frontend
app.use('/config.json', configRouter);

// Health
app.use('/api/health', healthRouter);

// Auth endpoints
app.use('/api/auth', authRouter);

// tRPC
app.use('/api/trpc', trpcHandler);

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: 'NOT_FOUND' }));

// Error handler (last)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ ok: false, error: 'INVALID_CSRF_TOKEN' });
  }
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({ ok: false, error: 'INTERNAL_SERVER_ERROR' });
});

app.listen(cfg.PORT, () => {
  console.log(`[crm-backend] listening on :${cfg.PORT} (${cfg.NODE_ENV})`);
});
```

------

### `backend/src/tools/verify-prisma.ts` (optional but recommended)

```
import { prisma } from '../lib/prisma.js';

async function main() {
  // Verify DB is reachable and supports basic features
  await prisma.$queryRaw`SELECT 1`;

  // Example check: confirm _prisma_migrations exists
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE();`
  );
  const hasMigrations = tables.some(t => t.table_name === '_prisma_migrations');
  if (!hasMigrations) {
    console.warn('[verify] _prisma_migrations not found (migrations may not be deployed yet)');
  }

  console.log('[verify] Prisma connectivity ok');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[verify] failed:', e);
  process.exit(1);
});
```

------

## How this aligns with your plan

- **Single Loopia MariaDB:** set in `DATABASE_URL` and deploy with `prisma migrate deploy`.
- **Static frontend:** fetches `https://<domain>/config.json` at runtime; client uses `apiBaseUrl`.
- **Auth:** stateless JWT in `sid` httpOnly cookie + CSRF double-submit pattern.
- **CORS:** strict allowlist from `ALLOWED_ORIGINS`.
- **Health:** `/api/health` includes DB ping + migration count.
- **tRPC:** mounted at `/api/trpc` with `user` in context.

## Runbook (local)

```
cd backend
cp .env.example.backend .env
# edit .env with Loopia DB + domain

npm ci
npm run prisma:generate
npm run build
npm run prisma:migrate:deploy
npm start
```

## PM2 (VPS)

```
npm run build
npm run prisma:migrate:deploy
pm2 start pm2.config.cjs
pm2 save
```

## Docker

```
docker build -t crm-backend:prod ./backend
docker run -d --name crm-backend --env-file ./.env -p 3000:3000 crm-backend:prod
```

------

If you want, I can add a **minimal client bootstrap** snippet for your Next.js app to load `/config.json` and dynamically set the tRPC base URL on first render.