/**
 * backend/src/server.ts
 * Minimal Express + tRPC server (decoupled from Next/NextAuth).
 * - No imports from crm-app.
 * - Local session + CSRF handled via Express middleware (no Next coupling).
 * - CORS restricted by ALLOWED_ORIGINS from env config.
 * - Health endpoints and local tRPC mounted.
 */

import express from 'express';
import morgan from 'morgan';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from './trpc';

import { config } from './env';
import { configRouter } from './routes/config';
import { healthRouter } from './routes/health';
import { importRouter } from './routes/import';
import { associationsRouter } from './routes/associations';

import { aiConfig, isAiEnabled } from './config/ai';
import { corsMiddleware } from './middleware/cors';
import {
  attachCsrfToken,
  cookieParserMiddleware,
  csrfMiddleware,
  helmetMiddleware,
} from './middleware/security';
import { getSessionFromRequest } from './auth/session';

const app = express();

// ---- Base hardening & server info ----
app.disable('x-powered-by');
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ---- CORS & baseline middleware ----
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParserMiddleware);
app.use(async (req, _res, next) => {
  try {
    req.userSession = await getSessionFromRequest(req);
  } catch (error) {
    console.error('[session] failed to resolve session', error);
    req.userSession = null;
  }
  next();
});
app.use(csrfMiddleware);
app.use(attachCsrfToken);

// ---- Body parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Public endpoints ----
app.use('/config.json', configRouter);
app.use('/api/health', healthRouter);

// ---- Feature endpoints (no auth coupling) ----
app.use('/api/import', importRouter);
app.use('/api/associations', associationsRouter);

// ---- AI health / placeholder (only mounted for diagnostics here) ----
app.get('/api/ai/health', (_req, res) => {
  res.status(200).json({
    ai_feature_flag: !!aiConfig.ENABLE_AI,
    ai_provider: aiConfig.AI_PROVIDER,
    is_ready: isAiEnabled(),
  });
});

// (Optional) Mount future AI routes only when fully configured
// if (isAiEnabled()) {
//   app.post('/api/ai/generate', async (req, res) => {
//     return res.status(501).json({ error: 'AI not implemented yet' });
//   });
// }

// ---- tRPC (local, no Next) ----
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error('[tRPC error]', { path, error: error.message });
    },
  }),
);

// ---- 404 fallback ----
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ---- Global error handler ----
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;

    console.error('[Unhandled error]', err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

// ---- Start server ----
app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://0.0.0.0:${config.port}`);
});
