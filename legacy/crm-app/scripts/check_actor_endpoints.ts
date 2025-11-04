import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
    }
  }
});

async function main() {
  const municipalities = await prisma.municipality.findMany({
    where: {
      OR: [
        { platform: 'Actors Smartbook' },
        { registryEndpoint: { not: null } }
      ]
    },
    select: {
      name: true,
      platform: true,
      registerUrl: true,
      registryEndpoint: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('Municipalities with Actor Smartbook or registryEndpoint:');
  console.log(JSON.stringify(municipalities, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
