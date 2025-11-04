import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface CsvRow {
  Kommun: string
  'Länk till föreningsregister': string
  Plattform: string
}

async function updateMunicipalitiesSystems() {
  console.log('🚀 Startar uppdatering av kommunsystem från CSV...\n')

  // Läs CSV-filen
  const csvPath = path.join(__dirname, '..', '..', 'csv', 'Municipalities - systems.csv')
  console.log(`📁 Läser fil: ${csvPath}\n`)

  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Parsa CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle UTF-8 BOM
  }) as CsvRow[]

  console.log(`📊 Hittade ${records.length} rader i CSV-filen\n`)

  let updated = 0
  let skipped = 0
  let notFound = 0
  let errors = 0

  for (const row of records) {
    // Hoppa över tomma rader
    if (!row.Kommun || row.Kommun.trim() === '') {
      skipped++
      continue
    }

    try {
      const name = row.Kommun.trim()
      const registerUrl = row['Länk till föreningsregister']?.trim() === 'SAKNAS' ? null : row['Länk till föreningsregister']?.trim() || null
      const platform = row.Plattform?.trim() === 'Saknas' ? null : row.Plattform?.trim() || null

      // Försök hitta befintlig kommun
      const existing = await prisma.municipality.findUnique({
        where: { name },
      })

      if (existing) {
        // Uppdatera kommun med system och länk
        await prisma.municipality.update({
          where: { id: existing.id },
          data: {
            platform,
            registerUrl,
          },
        })
        updated++
        console.log(`✅ Uppdaterade: ${name} - Plattform: ${platform}, Länk: ${registerUrl}`)
      } else {
        notFound++
        console.log(`⚠️  Kommun hittades inte: ${name}`)
      }
    } catch (error) {
      errors++
      console.error(`❌ Fel vid uppdatering av ${row.Kommun}:`, error)
    }
  }

  console.log('\n📈 Sammanfattning:')
  console.log(`   Uppdaterade: ${updated}`)
  console.log(`   Inte hittade: ${notFound}`)
  console.log(`   Överhoppade: ${skipped}`)
  console.log(`   Fel: ${errors}`)
  console.log('\n✨ Uppdatering klar!')
}

updateMunicipalitiesSystems()
  .catch((error) => {
    console.error('Fel vid uppdatering:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })