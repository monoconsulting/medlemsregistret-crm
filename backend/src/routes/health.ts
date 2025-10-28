import { Router } from 'express';

import { prisma } from '../lib/prisma';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const migrations = await prisma.$queryRawUnsafe<{ applied: bigint | number }[]>(
      'SELECT COUNT(*) as applied FROM _prisma_migrations',
    );

    const applied = migrations?.[0]?.applied ?? 0;

    res.json({
      ok: true,
      service: 'crm-backend',
      db: true,
      migrationsApplied: Number(applied),
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: false,
      error: error instanceof Error ? error.message : 'Okänt fel',
    });
  }
});
