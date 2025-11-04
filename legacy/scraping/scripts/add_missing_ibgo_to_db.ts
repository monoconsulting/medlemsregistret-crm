/**
 * Add the 3 missing IBGO municipalities to database
 */

import { PrismaClient } from '../../crm-app/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

const municipalities = [
  {
    name: 'Kinda',
    registerUrl: 'https://kinda.interbookfri.se/#/AssociationRegister',
    endpoint: 'https://kinda.interbookfri.se/APIAssociationRegister/GetAssociationsList/',
    count: 113
  },
  {
    name: 'Kristinehamn',
    registerUrl: 'https://kristinehamn.ibgo.se/#/AssociationRegister',
    endpoint: 'https://kristinehamn.ibgo.se/APIAssociationRegister/GetAssociationsList/',
    count: 128
  },
  {
    name: 'Linköping',
    registerUrl: 'https://ibgo.linkoping.se/#/AssociationRegister',
    endpoint: 'https://ibgo.linkoping.se/APIAssociationRegister/GetAssociationsList/',
    count: 417
  }
];

async function main() {
  console.log('Adding missing IBGO municipalities to database\n');

  for (const mun of municipalities) {
    try {
      let municipality = await prisma.municipality.findFirst({
        where: { name: mun.name }
      });

      if (!municipality) {
        municipality = await prisma.municipality.create({
          data: {
            name: mun.name,
            platform: 'IBGO',
            registerUrl: mun.registerUrl,
            registryEndpoint: mun.endpoint,
            registerStatus: 'verified'
          }
        });
        console.log(`✓ Created ${mun.name} (${mun.count} associations)`);
      } else {
        await prisma.municipality.update({
          where: { id: municipality.id },
          data: {
            platform: 'IBGO',
            registerUrl: mun.registerUrl,
            registryEndpoint: mun.endpoint,
            registerStatus: 'verified'
          }
        });
        console.log(`✓ Updated ${mun.name} (${mun.count} associations)`);
      }
    } catch (error) {
      console.error(`✗ Failed ${mun.name}:`, error);
    }
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

main();
