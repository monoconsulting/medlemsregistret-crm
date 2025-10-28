import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: process.env.BACKEND_ENV_FILE ?? undefined,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  ALLOWED_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET måste vara minst 16 tecken.'),
  SESSION_COOKIE_NAME: z.string().default('sid'),
  SESSION_COOKIE_DOMAIN: z
    .string()
    .trim()
    .min(1)
    .optional(),
  SESSION_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('true'),
  SESSION_COOKIE_SAME_SITE: z
    .enum(['lax', 'strict', 'none'])
    .default('none'),
  SESSION_TTL_DAYS: z.coerce.number().default(7),
  CSRF_COOKIE_NAME: z.string().default('csrf'),
  CSRF_SECRET_COOKIE_NAME: z.string().default('csrf_secret'),
  CSRF_COOKIE_DOMAIN: z
    .string()
    .trim()
    .min(1)
    .optional(),
  CSRF_COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  CSRF_SECRET: z
    .string()
    .min(16, 'CSRF_SECRET måste vara minst 16 tecken.')
    .default('development-secret-change-me'),
  PUBLIC_API_BASE_URL: z.string().optional(),
  ENABLE_AI: z.enum(['true', 'false']).default('false'),
  ENABLE_SEARCH_PROXY: z.enum(['true', 'false']).default('false'),
  ALLOW_SHELL_SCRIPTS: z.enum(['true', 'false']).default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Felaktiga miljövariabler för backend:', parsed.error.flatten().fieldErrors);
  throw new Error('Kunde inte läsa backend-konfiguration (env).');
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && env.CSRF_SECRET === 'development-secret-change-me') {
  throw new Error('CSRF_SECRET måste vara satt till ett slumpat värde i produktion.');
}

const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : [];

const sessionDomain = env.SESSION_COOKIE_DOMAIN?.trim() || undefined;
const csrfDomain = env.CSRF_COOKIE_DOMAIN?.trim() || sessionDomain;

const secureSessionCookie =
  env.SESSION_COOKIE_SAME_SITE === 'none' ? true : env.SESSION_COOKIE_SECURE === 'true';
const secureCsrfCookie = env.CSRF_COOKIE_SECURE
  ? env.CSRF_COOKIE_SECURE === 'true'
  : secureSessionCookie;

const ttlMs = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

const normalizedPublicApiBaseUrl = env.PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '') ?? '';

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  allowedOrigins,
  jwtSecret: env.JWT_SECRET,
  sessionCookie: {
    name: env.SESSION_COOKIE_NAME,
    domain: sessionDomain,
    secure: secureSessionCookie,
    sameSite: env.SESSION_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
    ttlMs,
  },
  csrf: {
    secret: env.CSRF_SECRET,
    headerName: 'X-CSRF-Token',
  },
  csrfCookie: {
    name: env.CSRF_COOKIE_NAME,
    domain: csrfDomain,
    secure: secureCsrfCookie,
    sameSite: 'none' as const,
    path: '/',
    maxAgeMs: ttlMs,
  },
  csrfSecretCookie: {
    name: env.CSRF_SECRET_COOKIE_NAME,
    domain: csrfDomain,
    secure: secureCsrfCookie,
    sameSite: 'none' as const,
    path: '/',
  },
  publicApiBaseUrl: normalizedPublicApiBaseUrl || null,
  features: {
    ai: env.ENABLE_AI === 'true',
    searchProxy: env.ENABLE_SEARCH_PROXY === 'true',
    allowShellScripts: env.ALLOW_SHELL_SCRIPTS === 'true',
  },
} as const;

