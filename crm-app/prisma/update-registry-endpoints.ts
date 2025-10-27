import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Derive API endpoint from registry URL based on platform
 */
function deriveApiEndpoint(registerUrl: string, platform: string): string | null {
  try {
    const url = new URL(registerUrl)
    const baseUrl = `${url.protocol}//${url.host}`

    if (platform === 'Interbook Go') {
      // IBGO API pattern: https://[municipality].ibgo.se/APIAssociationRegister/GetAssociationsList/
      return `${baseUrl}/APIAssociationRegister/GetAssociationsList/`
    } else if (platform === 'Actors Smartbook') {
      // Actors Smartbook API pattern: https://[municipality].actorsmartbook.se
      return baseUrl
    }

    return null
  } catch (error) {
    console.error(`Failed to parse URL: ${registerUrl}`, error)
    return null
  }
}

async function updateRegistryEndpoints() {
  console.log('🔄 Uppdaterar registry endpoints från register URLs...\n')

  // Hämta alla municipalities med IBGO eller Actors Smartbook som inte har endpoint satt
  const municipalities = await prisma.municipality.findMany({
    where: {
      platform: {
        in: ['Interbook Go', 'Actors Smartbook']
      },
      registerUrl: {
        not: null
      },
      registryEndpoint: null
    },
    select: {
      id: true,
      name: true,
      platform: true,
      registerUrl: true
    }
  })

  console.log(`📊 Hittade ${municipalities.length} municipalities utan endpoint\n`)

  let updated = 0
  let skipped = 0

  for (const municipality of municipalities) {
    if (!municipality.registerUrl) {
      console.log(`⚠️  ${municipality.name}: Ingen registerUrl`)
      skipped++
      continue
    }

    const endpoint = deriveApiEndpoint(municipality.registerUrl, municipality.platform!)

    if (!endpoint) {
      console.log(`❌ ${municipality.name}: Kunde inte derivera endpoint från ${municipality.registerUrl}`)
      skipped++
      continue
    }

    try {
      await prisma.municipality.update({
        where: { id: municipality.id },
        data: { registryEndpoint: endpoint }
      })

      console.log(`✅ ${municipality.name}: ${endpoint}`)
      updated++
    } catch (error) {
      console.error(`❌ Fel vid uppdatering av ${municipality.name}:`, error)
      skipped++
    }
  }

  console.log('\n📈 Sammanfattning:')
  console.log(`   Uppdaterade: ${updated}`)
  console.log(`   Hoppade över: ${skipped}`)
  console.log('\n✨ Klar!')
}

updateRegistryEndpoints()
  .catch((error) => {
    console.error('Fel:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })