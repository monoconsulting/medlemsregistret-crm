import { db } from '../../crm-app/lib/db';

async function main(): Promise<void> {
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
}

main()
  .then(async () => {
    await db.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[prisma:verify] misslyckades:', error);
    await db.$disconnect().catch(() => undefined);
    process.exit(1);
  });
