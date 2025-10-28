import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: process.env.BACKEND_ENV_FILE ?? undefined,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET måste vara minst 16 tecken.'),
  SESSION_COOKIE_NAME: z.string().default('crm_session'),
  SESSION_COOKIE_DOMAIN: z
    .string()
    .trim()
    .min(1)
    .optional(),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).default('true'),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('none'),
  SESSION_TTL_DAYS: z.coerce.number().default(7),
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET måste vara minst 16 tecken.'),
  CSRF_COOKIE_NAME: z.string().default('csrf'),
  CSRF_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('none'),
  CSRF_HEADER_NAME: z.string().default('X-CSRF-Token'),
  PUBLIC_API_BASE_URL: z.string().url().optional(),
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

const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : [];

const sessionSameSite = env.SESSION_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none';
const secureSessionCookie = sessionSameSite === 'none' ? true : env.SESSION_COOKIE_SECURE === 'true';

const csrfSameSite = env.CSRF_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none';
const csrfSecure = csrfSameSite === 'none' ? true : secureSessionCookie;

const csrfHeaderOriginal = env.CSRF_HEADER_NAME.trim() || 'X-CSRF-Token';
const csrfSecretCookieName = `${env.CSRF_COOKIE_NAME}_secret`;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL ?? null,
  allowedOrigins,
  jwtSecret: env.JWT_SECRET,
  sessionCookie: {
    name: env.SESSION_COOKIE_NAME,
    domain: env.SESSION_COOKIE_DOMAIN ?? undefined,
    secure: secureSessionCookie,
    sameSite: sessionSameSite,
    ttlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  },
  csrf: {
    secret: env.CSRF_SECRET,
    cookieName: env.CSRF_COOKIE_NAME,
    secretCookieName: csrfSecretCookieName,
    headerName: csrfHeaderOriginal.toLowerCase(),
    headerNameOriginal: csrfHeaderOriginal,
    sameSite: csrfSameSite,
    secure: csrfSecure,
    domain: env.SESSION_COOKIE_DOMAIN ?? undefined,
  },
  features: {
    enableAi: env.ENABLE_AI === 'true',
    enableSearchProxy: env.ENABLE_SEARCH_PROXY === 'true',
    allowShellScripts: env.ALLOW_SHELL_SCRIPTS === 'true',
  },
  publicApiBaseUrl: env.PUBLIC_API_BASE_URL ?? null,
} as const;

