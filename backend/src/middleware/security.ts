import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';

import { config } from '../env';

const CSRF_HEADER_CANDIDATES = ['x-csrf-token', 'x-xsrf-token'];

export function helmetMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

export const cookieParserMiddleware = cookieParser();

function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

function ensureCsrfToken(req: Request, res: Response): string {
  const currentToken = req.cookies?.[config.csrfCookie.name];
  if (typeof currentToken === 'string' && currentToken.length > 0) {
    return currentToken;
  }

  const nextToken = generateCsrfToken();
  res.cookie(config.csrfCookie.name, nextToken, {
    sameSite: config.csrfCookie.sameSite,
    httpOnly: false,
    secure: config.csrfCookie.secure,
    domain: config.csrfCookie.domain,
    path: '/',
  });
  return nextToken;
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  const method = req.method?.toUpperCase() ?? 'GET';

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    ensureCsrfToken(req, res);
    return next();
  }

  const cookieToken = req.cookies?.[config.csrfCookie.name];
  const headerToken = CSRF_HEADER_CANDIDATES.map((header) => req.get(header))
    .find((value): value is string => typeof value === 'string' && value.length > 0);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const error = new Error('Ogiltig CSRF-token.');
    (error as { code?: string }).code = 'EBADCSRFTOKEN';
    return next(error);
  }

  return next();
}

export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') {
    const token = ensureCsrfToken(req, res);
    res.setHeader('X-CSRF-Token', token);
    res.setHeader('X-CSRF-Enabled', '1');
  }

  next();
}
