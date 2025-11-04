import { db } from '@/lib/db'

async function main() {
  console.log('Rensar associationsrelaterade tabeller...')

  await db.$transaction(async (tx) => {
    await tx.activity.deleteMany()
    await tx.note.deleteMany()
    await tx.contact.deleteMany()
    await tx.descriptionSection.deleteMany()
    await tx.groupMembership.deleteMany()
    await tx.task.updateMany({
      data: { associationId: null },
      where: { associationId: { not: null } },
    })

    await tx.association.deleteMany()
    await tx.importBatch.deleteMany()
    await tx.scrapeRun.deleteMany()
  })

  console.log('Alla poster borttagna. Databasen är redo för ny import.')
}

main()
  .catch((error) => {
    console.error('Kunde inte rensa databasen:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
