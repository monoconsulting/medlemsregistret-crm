import type { NextFunction, Request, Response } from 'express';
import csrf from 'csurf';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { config } from '../env';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
});

export const cookieParserMiddleware = cookieParser();

const csrfSecretCookieKey = 'csrf_secret';

export const csrfMiddleware = csrf({
  cookie: {
    key: csrfSecretCookieKey,
    sameSite: 'none',
    httpOnly: true,
    secure: config.sessionCookie.secure,
    domain: config.sessionCookie.domain,
    path: '/',
  },
  value(req) {
    const headerToken =
      req.header('x-csrf-token') ||
      req.header('csrf-token') ||
      req.header('x-xsrf-token');

    if (headerToken) {
      return headerToken;
    }

    if (req.body && typeof req.body === 'object') {
      const body = req.body as Record<string, unknown>;
      const tokenFromBody = body.csrfToken ?? body._csrf;
      if (typeof tokenFromBody === 'string') {
        return tokenFromBody;
      }
    }

    const queryToken =
      typeof req.query === 'object' && req.query !== null
        ? (req.query as Record<string, unknown>)._csrf
        : undefined;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return undefined;
  },
});

const csrfTokenCookieName = 'csrf';

export function attachCsrfToken(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' || typeof req.csrfToken !== 'function') {
    return next();
  }

  try {
    const token = req.csrfToken();

    res.cookie(csrfTokenCookieName, token, {
      sameSite: 'none',
      httpOnly: false,
      secure: config.sessionCookie.secure,
      domain: config.sessionCookie.domain,
      path: '/',
      maxAge: config.sessionCookie.ttlMs,
    });

    res.setHeader('X-CSRF-Token', token);
  } catch (error) {
    console.error('Kunde inte generera CSRF-token:', error);
  }

  next();
}
