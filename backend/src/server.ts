/**
 * backend/src/server.ts
 * Minimal Express + tRPC server (decoupled from Next/NextAuth).
 * - No imports from crm-app.
 * - No CSRF/session coupling to frontend.
 * - CORS restricted by ALLOWED_ORIGINS (comma-separated).
 * - Health endpoints and local tRPC mounted.
 */

import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter, createContext } from './trpc';

import { config } from './env';
import { configRouter } from './routes/config';
import { healthRouter } from './routes/health';
import { importRouter } from './routes/import';
import { associationsRouter } from './routes/associations';
import { authRouter } from './routes/auth';

import { aiConfig, isAiEnabled } from './config/ai';

const app = express();

// ---- Base hardening & server info ----
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ---- CORS (only allow known frontends) ----
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server/curl (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: false, // no cross-site cookies in this simplified setup
  }),
);

// ---- Body parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Public endpoints ----
app.use('/config.json', configRouter);
app.use('/api/health', healthRouter);

// ---- Auth endpoints ----
app.use('/api/auth', authRouter);

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
