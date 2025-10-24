import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Svenska kommuner med SCB-koder och länsindelning
const municipalities = [
  // Stockholms län
  { name: 'Stockholm', code: '0180', county: 'Stockholms län', region: 'Stockholm', latitude: 59.3293, longitude: 18.0686, population: 975551 },
  { name: 'Sollentuna', code: '0163', county: 'Stockholms län', region: 'Stockholm', latitude: 59.4280, longitude: 17.9510, population: 73882 },
  { name: 'Järfälla', code: '0123', county: 'Stockholms län', region: 'Stockholm', latitude: 59.4250, longitude: 17.8358, population: 79051 },
  { name: 'Ekerö', code: '0125', county: 'Stockholms län', region: 'Stockholm', latitude: 59.2833, longitude: 17.8000, population: 29898 },

  // Västra Götalands län
  { name: 'Göteborg', code: '1480', county: 'Västra Götalands län', region: 'Västra Götaland', latitude: 57.7089, longitude: 11.9746, population: 579281 },
  { name: 'Borås', code: '1490', county: 'Västra Götalands län', region: 'Västra Götaland', latitude: 57.7210, longitude: 12.9401, population: 113764 },

  // Skåne län
  { name: 'Malmö', code: '1280', county: 'Skåne län', region: 'Skåne', latitude: 55.6050, longitude: 13.0038, population: 347949 },
  { name: 'Lund', code: '1281', county: 'Skåne län', region: 'Skåne', latitude: 55.7047, longitude: 13.1910, population: 125177 },
  { name: 'Helsingborg', code: '1283', county: 'Skåne län', region: 'Skåne', latitude: 56.0465, longitude: 12.6945, population: 149280 },
  { name: 'Laholm', code: '1215', county: 'Hallands län', region: 'Halland', latitude: 56.5117, longitude: 13.0444, population: 25604 },
  { name: 'Halmstad', code: '1380', county: 'Hallands län', region: 'Halland', latitude: 56.6745, longitude: 12.8576, population: 103358 },
  { name: 'Båstad', code: '1278', county: 'Skåne län', region: 'Skåne', latitude: 56.4252, longitude: 12.8494, population: 14799 },
  { name: 'Bromölla', code: '1272', county: 'Skåne län', region: 'Skåne', latitude: 56.0739, longitude: 14.4680, population: 12795 },

  // Värmlands län
  { name: 'Karlstad', code: '1780', county: 'Värmlands län', region: 'Värmland', latitude: 59.3793, longitude: 13.5036, population: 94656 },
  { name: 'Årjäng', code: '1765', county: 'Värmlands län', region: 'Värmland', latitude: 59.3836, longitude: 12.1358, population: 9631 },
  { name: 'Forshaga', code: '1763', county: 'Värmlands län', region: 'Värmland', latitude: 59.5333, longitude: 13.5000, population: 11395 },
  { name: 'Torsby', code: '1737', county: 'Värmlands län', region: 'Värmland', latitude: 60.1317, longitude: 12.9950, population: 11492 },

  // Gävleborgs län
  { name: 'Gävle', code: '2180', county: 'Gävleborgs län', region: 'Gävleborg', latitude: 60.6749, longitude: 17.1413, population: 100603 },
  { name: 'Söderhamn', code: '2182', county: 'Gävleborgs län', region: 'Gävleborg', latitude: 61.3042, longitude: 17.0656, population: 25564 },
  { name: 'Hudiksvall', code: '2184', county: 'Gävleborgs län', region: 'Gävleborg', latitude: 61.7281, longitude: 17.1078, population: 37545 },

  // Dalarnas län
  { name: 'Älvdalen', code: '2039', county: 'Dalarnas län', region: 'Dalarna', latitude: 61.2314, longitude: 14.0003, population: 7027 },
  { name: 'Leksand', code: '2029', county: 'Dalarnas län', region: 'Dalarna', latitude: 60.7308, longitude: 14.9986, population: 15758 },
  { name: 'Malung-Sälen', code: '2023', county: 'Dalarnas län', region: 'Dalarna', latitude: 60.6833, longitude: 13.7167, population: 10143 },

  // Västernorrlands län
  { name: 'Härnösand', code: '2280', county: 'Västernorrlands län', region: 'Västernorrland', latitude: 62.6322, longitude: 17.9378, population: 24827 },
  { name: 'Ånge', code: '2260', county: 'Västernorrlands län', region: 'Västernorrland', latitude: 62.5267, longitude: 15.6600, population: 9369 },

  // Norrbottens län
  { name: 'Piteå', code: '2581', county: 'Norrbottens län', region: 'Norrbotten', latitude: 65.3264, longitude: 21.4761, population: 42448 },
  { name: 'Älvsbyn', code: '2560', county: 'Norrbottens län', region: 'Norrbotten', latitude: 65.6764, longitude: 21.0028, population: 8169 },

  // Jönköpings län
  { name: 'Eksjö', code: '0686', county: 'Jönköpings län', region: 'Jönköping', latitude: 57.6667, longitude: 14.9667, population: 17369 },

  // Kalmar län
  { name: 'Emmaboda', code: '0882', county: 'Kalmar län', region: 'Kalmar', latitude: 56.6333, longitude: 15.5333, population: 9239 },

  // Västmanlands län
  { name: 'Fagersta', code: '1982', county: 'Västmanlands län', region: 'Västmanland', latitude: 59.9947, longitude: 15.7950, population: 13400 },

  // Örebro län
  { name: 'Askersund', code: '1863', county: 'Örebro län', region: 'Örebro', latitude: 58.8833, longitude: 14.9000, population: 11404 },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Seed municipalities
  console.log('📍 Seeding municipalities...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const mun of municipalities) {
    try {
      await prisma.municipality.upsert({
        where: { name: mun.name },
        update: mun,
        create: mun,
      });
      createdCount++;
      console.log(`  ✓ ${mun.name}`);
    } catch (error) {
      skippedCount++;
      console.log(`  ⚠ Skipped ${mun.name} (already exists)`);
    }
  }

  console.log(`\n✅ Seed completed!`);
  console.log(`   Created/Updated: ${createdCount} municipalities`);
  console.log(`   Skipped: ${skippedCount} municipalities`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
