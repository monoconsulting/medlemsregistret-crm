import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

import { appRouter } from '../crm-app/server/routers/_app';
import { config } from './env';
import { authRouter } from './routes/auth';
import { importRouter } from './routes/import';
import { associationsRouter } from './routes/associations';
import { getSessionFromRequest } from './auth/session';
import { createContext } from './context';
import { requireAuth } from './middleware/requireAuth';

const app = express();

app.disable('x-powered-by');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} är inte tillåten.`));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(async (req, _res, next) => {
  try {
    req.userSession = await getSessionFromRequest(req);
  } catch (error) {
    console.error('Misslyckades att läsa session:', error);
    req.userSession = null;
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/import', importRouter);
app.use('/api/associations', associationsRouter);

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error('tRPC fel:', path, error);
    },
  }),
);

app.post('/api/scraping/:municipalityId/run', requireAuth(['ADMIN']), (_req, res) => {
  res
    .status(501)
    .json({ error: 'Automatiska scraping-körningar hanteras ännu inte av backend-servern.' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Ohanterat fel i backend:', err);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ error: 'Internt serverfel.' });
});

app.listen(config.port, () => {
  console.log(`CRM-backend lyssnar på port ${config.port}`);
});

