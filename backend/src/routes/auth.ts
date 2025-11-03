import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { db } from '../db';
import { clearSessionCookie, createSessionToken, setSessionCookie } from '../auth/session';
import { clearCsrfCookies, setCsrfCookie } from '../middleware/security';
import {
  AUTH_FLOW_HEADER,
  extractAuthFlowId,
  logAuthFlowEvent,
} from '../lib/auth-flow-logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const flowId = extractAuthFlowId(req.headers);
  await logAuthFlowEvent({
    source: 'backend',
    stage: 'backend.auth.login.received',
    flowId,
    context: {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
      hasCsrfHeader: typeof req.get('X-CSRF-Token') === 'string',
    },
  });

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    await logAuthFlowEvent({
      source: 'backend',
      stage: 'backend.auth.login.invalid-payload',
      severity: 'warn',
      flowId,
      context: {
        issues: parsed.error.issues?.length ?? 0,
      },
    });
    return res.status(400).json({ error: 'Ogiltigt format på inloggningsdata.' });
  }

  const { email, password } = parsed.data;

  await logAuthFlowEvent({
    source: 'backend',
    stage: 'backend.auth.login.lookup-user',
    flowId,
    context: { email },
  });

  const user = await db.user.findFirst({
    where: {
      email,
      isDeleted: false,
    },
  });

  if (!user || !user.passwordHash) {
    await logAuthFlowEvent({
      source: 'backend',
      stage: 'backend.auth.login.user-not-found',
      severity: 'warn',
      flowId,
      context: { email },
    });
    return res.status(401).json({ error: 'Felaktig e-post eller lösenord.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logAuthFlowEvent({
      source: 'backend',
      stage: 'backend.auth.login.invalid-password',
      severity: 'warn',
      flowId,
      context: { userId: user.id, email },
    });
    return res.status(401).json({ error: 'Felaktig e-post eller lösenord.' });
  }

  const sessionUser = {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role,
  };

  const token = createSessionToken(sessionUser);
  setSessionCookie(res, token);
  res.setHeader(AUTH_FLOW_HEADER, flowId ?? '');

  if (typeof req.csrfToken === 'function') {
    try {
      const nextToken = req.csrfToken();
      setCsrfCookie(res, nextToken);
      await logAuthFlowEvent({
        source: 'backend',
        stage: 'backend.auth.login.csrf-issued',
        flowId,
      });
    } catch (error) {
      console.error('Kunde inte generera CSRF-token vid inloggning:', error);
      await logAuthFlowEvent({
        source: 'backend',
        stage: 'backend.auth.login.csrf-error',
        severity: 'error',
        flowId,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : undefined,
      });
    }
  }

  await logAuthFlowEvent({
    source: 'backend',
    stage: 'backend.auth.login.success',
    flowId,
    context: { userId: user.id, role: user.role },
  });

  return res.json({ user: sessionUser });
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  clearCsrfCookies(res);
  void logAuthFlowEvent({
    source: 'backend',
    stage: 'backend.auth.logout.completed',
    flowId: extractAuthFlowId(req.headers),
    context: { ip: req.ip },
  });
  res.status(204).end();
});

authRouter.get('/me', (req, res) => {
  const session = req.userSession ?? null;
  void logAuthFlowEvent({
    source: 'backend',
    stage: 'backend.auth.me.request',
    flowId: extractAuthFlowId(req.headers),
    context: {
      ip: req.ip,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
    },
  });
  res.json({
    user: session?.user ?? null,
  });
});

