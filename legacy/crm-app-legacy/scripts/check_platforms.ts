import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://crm_user:crm_password_change_me@localhost:3316/crm_db'
    }
  }
});

async function main() {
  console.log('Checking platforms in database...\n');

  const ibgo = await prisma.municipality.findMany({
    where: { platform: 'IBGO' },
    select: { name: true, platform: true, registerUrl: true, registryEndpoint: true }
  });
  console.log(`IBGO municipalities: ${ibgo.length}`);

  const interbook = await prisma.municipality.findMany({
    where: { platform: 'Interbook Go' },
    select: { name: true, platform: true, registerUrl: true, registryEndpoint: true }
  });
  console.log(`Interbook Go municipalities: ${interbook.length}`);

  const actors = await prisma.municipality.findMany({
    where: { platform: 'Actors Smartbook' },
    select: { name: true, platform: true, registerUrl: true, registryEndpoint: true }
  });
  console.log(`Actors Smartbook municipalities: ${actors.length}`);

  const fri = await prisma.municipality.findMany({
    where: { platform: 'FRI' },
    select: { name: true, platform: true, registerUrl: true, registryEndpoint: true }
  });
  console.log(`FRI municipalities: ${fri.length}\n`);

  const friWithEndpoint = fri.filter(m => m.registryEndpoint !== null);
  const friWithRegisterUrl = fri.filter(m => m.registerUrl !== null);
  console.log(`FRI with registryEndpoint: ${friWithEndpoint.length}`);
  console.log(`FRI with registerUrl: ${friWithRegisterUrl.length}\n`);

  if (interbook.length > 0) {
    console.log('First 5 Interbook Go municipalities:');
    interbook.slice(0, 5).forEach(m => {
      console.log(`  - ${m.name}: endpoint=${m.registryEndpoint ? 'YES' : 'NO'}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
