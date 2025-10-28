import type { CookieOptions, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import helmet from 'helmet';

import { config } from '../env';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
});

export const cookieParserMiddleware = cookieParser(config.csrf.secret);

const csrfSecretCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: config.csrfSecretCookie.sameSite,
  secure: config.csrfSecretCookie.secure,
  domain: config.csrfSecretCookie.domain,
  path: config.csrfSecretCookie.path,
  signed: true,
  maxAge: config.csrfCookie.maxAgeMs,
};

const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  sameSite: config.csrfCookie.sameSite,
  secure: config.csrfCookie.secure,
  domain: config.csrfCookie.domain,
  path: config.csrfCookie.path,
  maxAge: config.csrfCookie.maxAgeMs,
};

export const csrfMiddleware = csrf({
  cookie: {
    key: config.csrfSecretCookie.name,
    sameSite: csrfSecretCookieOptions.sameSite,
    secure: csrfSecretCookieOptions.secure,
    domain: csrfSecretCookieOptions.domain,
    httpOnly: csrfSecretCookieOptions.httpOnly,
    path: csrfSecretCookieOptions.path,
    signed: true,
    maxAge: csrfSecretCookieOptions.maxAge,
  },
  value(req) {
    const headerName = config.csrf.headerName.toLowerCase();
    const headerValue = req.headers[headerName] ?? req.headers['x-csrf-token'];
    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }
    return headerValue as string | undefined;
  },
});

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(config.csrfCookie.name, token, csrfCookieOptions);
}

export function clearCsrfCookies(res: Response): void {
  res.clearCookie(config.csrfCookie.name, { ...csrfCookieOptions, maxAge: 0 });
  res.clearCookie(config.csrfSecretCookie.name, {
    ...csrfSecretCookieOptions,
    maxAge: 0,
  });
}

export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (typeof req.csrfToken !== 'function') {
    next();
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    try {
      const token = req.csrfToken();
      setCsrfCookie(res, token);
      res.setHeader(config.csrf.headerName, token);
      res.setHeader('X-CSRF-Enabled', '1');
    } catch (error) {
      next(error);
      return;
    }
  }

  next();
}

