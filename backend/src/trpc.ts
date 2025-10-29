import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import { db } from './db';
import type { Session } from './auth/session';

export type Context = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: Session['user'] | null;
  db: typeof db;
};

export function createContext(opts: CreateExpressContextOptions): Context {
  const session = (opts.req.userSession ?? null) as Session | null;

  return {
    req: opts.req,
    res: opts.res,
    user: session?.user ?? null,
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
