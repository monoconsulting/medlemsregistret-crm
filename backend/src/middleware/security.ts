import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import helmet from 'helmet';

import { config } from '../env';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
});

export const cookieParserMiddleware = cookieParser(config.csrf.secret);

const csrfHeaderKey = config.csrf.headerName;
const csrfSecretCookieName = config.csrf.secretCookieName;

export const csrfMiddleware = csrf({
  cookie: {
    key: csrfSecretCookieName,
    sameSite: config.csrf.sameSite,
    secure: config.csrf.secure,
    domain: config.csrf.domain,
    path: '/',
    httpOnly: true,
    signed: true,
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req) => {
    const header = req.headers[csrfHeaderKey];
    if (Array.isArray(header)) {
      return header[0] ?? '';
    }
    if (typeof header === 'string') {
      return header;
    }

    const bodyToken =
      req.body && typeof req.body === 'object' && '_csrf' in req.body
        ? (req.body as Record<string, unknown>)._csrf
        : undefined;
    return typeof bodyToken === 'string' ? bodyToken : '';
  },
});

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(config.csrf.cookieName, token, {
    sameSite: config.csrf.sameSite,
    secure: config.csrf.secure,
    domain: config.csrf.domain,
    path: '/',
    httpOnly: false,
  });
  res.setHeader('X-CSRF-Enabled', '1');
  res.setHeader('X-CSRF-Header', config.csrf.headerNameOriginal);
}

export function refreshCsrfToken(req: Request, res: Response): void {
  if (typeof req.csrfToken !== 'function') {
    return;
  }

  try {
    const token = req.csrfToken();
    if (token) {
      setCsrfCookie(res, token);
    }
  } catch (error) {
    if (config.nodeEnv !== 'production') {
      console.warn('Kunde inte uppdatera CSRF-token:', error);
    }
  }
}

export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    refreshCsrfToken(req, res);
  }
  next();
}

export function clearCsrfCookies(res: Response): void {
  res.clearCookie(config.csrf.cookieName, {
    sameSite: config.csrf.sameSite,
    secure: config.csrf.secure,
    domain: config.csrf.domain,
    path: '/',
    httpOnly: false,
  });
  res.clearCookie(csrfSecretCookieName, {
    sameSite: config.csrf.sameSite,
    secure: config.csrf.secure,
    domain: config.csrf.domain,
    path: '/',
    httpOnly: true,
    signed: true,
  });
}
