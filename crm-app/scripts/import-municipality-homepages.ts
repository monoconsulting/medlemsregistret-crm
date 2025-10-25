import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
  kommun: string
  hemsida: string
  [key: string]: string
}

async function importHomepages() {
  try {
    console.log('📖 Läser CSV-fil...')

    const csvPath = path.join(__dirname, '../../temp/Foreningar3.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    // Parse CSV manually (skip header row)
    const lines = csvContent.split('\n').slice(1)
    const rows: CSVRow[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      // Split by comma but respect quoted strings
      const values = line.split(',').map(v => v.trim())

      if (values.length >= 2) {
        const kommun = values[0]
        const hemsida = values[1]

        if (kommun && hemsida) {
          rows.push({ kommun, hemsida })
        }
      }
    }

    console.log(`✅ Läste ${rows.length} rader från CSV\n`)

    let updated = 0
    let notFound = 0
    let skipped = 0

    for (const row of rows) {
      // Find municipality by name
      const municipality = await prisma.municipality.findFirst({
        where: {
          name: row.kommun
        }
      })

      if (!municipality) {
        console.log(`⚠️  Kommun inte hittad: ${row.kommun}`)
        notFound++
        continue
      }

      if (municipality.homepage === row.hemsida) {
        skipped++
        continue
      }

      // Update homepage
      await prisma.municipality.update({
        where: { id: municipality.id },
        data: { homepage: row.hemsida }
      })

      console.log(`✓ Uppdaterad: ${municipality.name} → ${row.hemsida}`)
      updated++
    }

    console.log('\n📊 Sammanfattning:')
    console.log(`   ✅ Uppdaterade: ${updated}`)
    console.log(`   ⏭️  Hoppade över (redan korrekt): ${skipped}`)
    console.log(`   ⚠️  Inte hittade: ${notFound}`)

  } catch (error) {
    console.error('❌ Fel vid import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importHomepages()
  .then(() => {
    console.log('\n✅ Import klar!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Import misslyckades:', error)
    process.exit(1)
  })
