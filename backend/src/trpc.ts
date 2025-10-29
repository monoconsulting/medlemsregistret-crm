/**
 * backend/src/trpc.ts
 * Minimal, framework-agnostic tRPC bootstrap for the backend container.
 * - No Next.js / NextAuth imports.
 * - Provides a clean base to register backend-only routers.
 */

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import { db } from './db';

export type Context = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: null | { id: string; email?: string | null; role?: string | null };
  db: typeof db;
};

export function createContext(opts: CreateExpressContextOptions): Context {
  return {
    req: opts.req,
    res: opts.res,
    user: null,
    db,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  ping: publicProcedure.query(() => ({ pong: true, now: new Date().toISOString() })),
});

export type AppRouter = typeof appRouter;
