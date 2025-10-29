import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  backendPrisma?: PrismaClient;
};

export const db =
  globalForPrisma.backendPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.backendPrisma = db;
}

export type DbClient = typeof db;
