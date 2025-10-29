import type { PrismaClient } from '@prisma/client';

async function loadDb(): Promise<PrismaClient> {
  const module = (await import('../db.js')) as { db: PrismaClient };
  return module.db;
}

async function run(): Promise<void> {
  const db = await loadDb();

  try {
    await db.$queryRaw`SELECT 1`;

    const tables = await db.$queryRawUnsafe<Array<{ table_name?: string }>>(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()',
    );

    const hasMigrations = tables.some((table) => {
      const name = table.table_name ?? '';
      return typeof name === 'string' && name.toLowerCase() === '_prisma_migrations';
    });

    console.log('[prisma:verify] Database connection OK');
    console.log('[prisma:verify] _prisma_migrations', hasMigrations ? 'OK' : 'saknas');
  } finally {
    await db.$disconnect().catch(() => undefined);
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[prisma:verify] misslyckades:', error);
    process.exit(1);
  });
