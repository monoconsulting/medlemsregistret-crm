import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import type { Session, SessionUser } from './auth/session';
import { db } from './db';

export interface TrpcContext {
  db: typeof db;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  session: Session | null;
  user: SessionUser | null;
}

export function createContext({ req, res }: CreateExpressContextOptions): TrpcContext {
  const session = req.userSession ?? null;

  return {
    db,
    req,
    res,
    session,
    user: session?.user ?? null,
  };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  ping: publicProcedure.query(() => ({ pong: true, now: new Date().toISOString() })),
});

export type AppRouter = typeof appRouter;
