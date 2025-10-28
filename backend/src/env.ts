import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: process.env.BACKEND_ENV_FILE ?? undefined,
});

const envSchema = z.object({
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
  PUBLIC_API_BASE_URL: z
    .string()
    .trim()
    .optional(),
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

const secureCookie =
  env.SESSION_COOKIE_SAME_SITE === 'none' ? true : env.SESSION_COOKIE_SECURE === 'true';

export const config = {
  port: env.PORT,
  allowedOrigins,
  jwtSecret: env.JWT_SECRET,
  sessionCookie: {
    name: env.SESSION_COOKIE_NAME,
    domain: env.SESSION_COOKIE_DOMAIN,
    secure: secureCookie,
    sameSite: env.SESSION_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
    ttlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  },
  publicApiBaseUrl: env.PUBLIC_API_BASE_URL?.length
    ? env.PUBLIC_API_BASE_URL.replace(/\/$/, '')
    : null,
  features: {
    ai: env.ENABLE_AI === 'true',
    searchProxy: env.ENABLE_SEARCH_PROXY === 'true',
    allowShellScripts: env.ALLOW_SHELL_SCRIPTS === 'true',
  },
} as const;

