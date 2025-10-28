import 'express-async-errors';
import express from 'express';
import morgan from 'morgan';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

import { appRouter } from '../crm-app/server/routers/_app';
import { config } from './env';
import { authRouter } from './routes/auth';
import { importRouter } from './routes/import';
import { associationsRouter } from './routes/associations';
import { getSessionFromRequest } from './auth/session';
import { createContext } from './context';
import { requireAuth } from './middleware/requireAuth';
import { corsMiddleware } from './middleware/cors';
import {
  attachCsrfToken,
  cookieParserMiddleware,
  csrfMiddleware,
  helmetMiddleware,
} from './middleware/security';
import { configRouter } from './routes/config';
import { healthRouter } from './routes/health';

const app = express();

app.disable('x-powered-by');

app.use(helmetMiddleware);
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(corsMiddleware);
app.use(cookieParserMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(csrfMiddleware);
app.use(attachCsrfToken);

app.use(async (req, _res, next) => {
  try {
    req.userSession = await getSessionFromRequest(req);
  } catch (error) {
    console.error('Misslyckades att läsa session:', error);
    req.userSession = null;
  }
  next();
});

app.use('/config.json', configRouter);
app.use('/api/health', healthRouter);

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

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (res.headersSent) {
    return;
  }

  const errorObject = err as { code?: string } | null;
  if (errorObject?.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ error: 'INVALID_CSRF_TOKEN' });
    return;
  }

  console.error('Ohanterat fel i backend:', err);
  res.status(500).json({ error: 'Internt serverfel.' });
});

app.listen(config.port, () => {
  console.log(`CRM-backend lyssnar på port ${config.port}`);
});

