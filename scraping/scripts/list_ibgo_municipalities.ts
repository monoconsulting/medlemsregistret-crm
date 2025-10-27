/**
 * List all IBGO municipalities in database
 */

import { PrismaClient } from '../../crm-app/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const municipalities = await prisma.municipality.findMany({
    where: { platform: 'IBGO' },
    orderBy: { name: 'asc' }
  });

  console.log('IBGO Municipalities in Database\n');
  console.log('='.repeat(60));
  console.log(`Total: ${municipalities.length}\n`);

  municipalities.forEach((m, i) => {
    const status = m.registryEndpoint ? '✓' : '✗';
    console.log(`${(i + 1).toString().padStart(2)}. ${status} ${m.name.padEnd(20)} ${m.registryEndpoint || 'No endpoint'}`);
  });

  await prisma.$disconnect();
}

main();
