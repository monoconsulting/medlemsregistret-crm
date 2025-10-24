import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface CsvRow {
  Kommun: string
  Stadskod: string
  'Länk till föreningsregister': string
  Status: string
  Plattform: string
  Region: string
  Befolkning: string
  Lon: string
  Lat: string
  Län: string
  Länskod: string
  Landskap: string
}

async function importMunicipalities() {
  console.log('🚀 Startar import av kommundata från CSV...\n')

  // Läs CSV-filen
  const csvPath = path.join(__dirname, '..', '..', 'temp', 'Föreningar2.csv')
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

  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const row of records) {
    // Hoppa över tomma rader
    if (!row.Kommun || row.Kommun.trim() === '') {
      skipped++
      continue
    }

    try {
      const municipalityData = {
        name: row.Kommun.trim(),
        code: row.Stadskod?.trim() || null,
        county: row.Län?.trim() || null,
        countyCode: row.Länskod?.trim() || null,
        province: row.Landskap?.trim() || null,
        population: row.Befolkning && row.Befolkning.trim() !== '' 
          ? parseInt(row.Befolkning.replace(/\s/g, '').replace(/,/g, '')) 
          : null,
        latitude: row.Lat && row.Lat.trim() !== '' ? parseFloat(row.Lat) : null,
        longitude: row.Lon && row.Lon.trim() !== '' ? parseFloat(row.Lon) : null,
        registerUrl: row['Länk till föreningsregister']?.trim() || null,
        registerStatus: row.Status?.trim() || null,
        platform: row.Plattform?.trim() || null,
      }

      // Försök hitta befintlig kommun
      const existing = await prisma.municipality.findUnique({
        where: { name: municipalityData.name },
      })

      if (existing) {
        // Uppdatera befintlig kommun
        await prisma.municipality.update({
          where: { id: existing.id },
          data: municipalityData,
        })
        updated++
        console.log(`✅ Uppdaterade: ${municipalityData.name}`)
      } else {
        // Skapa ny kommun
        await prisma.municipality.create({
          data: municipalityData,
        })
        created++
        console.log(`➕ Skapade: ${municipalityData.name}`)
      }
    } catch (error) {
      errors++
      console.error(`❌ Fel vid import av ${row.Kommun}:`, error)
    }
  }

  console.log('\n📈 Sammanfattning:')
  console.log(`   Skapade: ${created}`)
  console.log(`   Uppdaterade: ${updated}`)
  console.log(`   Överhoppade: ${skipped}`)
  console.log(`   Fel: ${errors}`)
  console.log('\n✨ Import klar!')
}

importMunicipalities()
  .catch((error) => {
    console.error('Fel vid import:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
