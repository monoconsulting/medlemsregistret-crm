import { Router } from 'express';
import pkg from '../../package.json' assert { type: 'json' };

import { db } from '../../../crm-app/lib/db';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    const migrations = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
      'SELECT COUNT(*) as applied FROM _prisma_migrations',
    );
    const appliedValue = (() => {
      if (!migrations?.length) {
        return 0;
      }
      const firstRow = migrations[0];
      if (typeof firstRow.applied === 'number' || typeof firstRow.applied === 'bigint') {
        return firstRow.applied;
      }
      const values = Object.values(firstRow ?? {});
      const candidate = values.find((value) => typeof value === 'number' || typeof value === 'bigint');
      return candidate ?? 0;
    })();

    res.json({
      ok: true,
      service: 'crm-backend',
      version: pkg.version,
      db: true,
      migrationsApplied: Number(appliedValue ?? 0),
      time: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: false,
      error: error instanceof Error ? error.message : 'Okänt fel',
      time: new Date().toISOString(),
    });
  }
});
