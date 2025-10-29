import { initTRPC } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import superjson from 'superjson';

import { db } from './db';
import { getSessionFromRequest, type Session } from './auth/session';

export type Context = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  db: typeof db;
  session: Session | null;
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<Context> {
  let session: Session | null = opts.req.userSession ?? null;

  if (!session) {
    try {
      session = await getSessionFromRequest(opts.req);
    } catch (error) {
      console.error('[trpc] failed to resolve session', error);
    }
    opts.req.userSession = session;
  }

  return {
    req: opts.req,
    res: opts.res,
    db,
    session,
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
