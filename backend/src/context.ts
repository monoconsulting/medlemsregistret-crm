import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

import { prisma } from './lib/prisma';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) {
          headers.append(key, entry);
        }
      }
      return;
    }

    if (typeof value === 'string') {
      headers.set(key, value);
    }
  });

  return {
    db: prisma,
    session: req.userSession ?? null,
    headers,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

