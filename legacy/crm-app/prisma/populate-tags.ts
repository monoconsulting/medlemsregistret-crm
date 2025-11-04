import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateTags() {
  console.log('Starting tag population from association fields...');

  const batchSize = 100;
  let offset = 0;
  let totalProcessed = 0;

  while (true) {
    const associations = await prisma.association.findMany({
      select: {
        id: true,
        types: true,
        activities: true,
        categories: true,
        tags: {
          select: { id: true, name: true }
        }
      },
      take: batchSize,
      skip: offset,
    });

    if (associations.length === 0) break;

    for (const association of associations) {
      const tagNames: string[] = [];

      // Extract from types
      if (Array.isArray(association.types)) {
        tagNames.push(...(association.types as string[]).map(t => t.toLowerCase()));
      }

      // Extract from activities
      if (Array.isArray(association.activities)) {
        tagNames.push(...(association.activities as string[]).map(a => a.toLowerCase()));
      }

      // Extract from categories
      if (Array.isArray(association.categories)) {
        tagNames.push(...(association.categories as string[]).map(c => c.toLowerCase()));
      }

      // Deduplicate
      const uniqueTagNames = [...new Set(tagNames)];

      if (uniqueTagNames.length === 0) continue;

      // Upsert tags
      const tagIds: string[] = [];
      for (const tagName of uniqueTagNames) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        tagIds.push(tag.id);
      }

      // Update association tags (overwrite existing)
      await prisma.association.update({
        where: { id: association.id },
        data: {
          tags: {
            set: tagIds.map(id => ({ id })),
          },
        },
      });
    }

    totalProcessed += associations.length;
    console.log(`Processed ${totalProcessed} associations...`);
    offset += batchSize;
  }

  console.log('Tag population completed.');
}

populateTags()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });