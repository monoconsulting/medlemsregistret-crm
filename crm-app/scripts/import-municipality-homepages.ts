import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'
import { z } from 'zod'

const prisma = new PrismaClient()

const rowSchema = z.object({
  kommun: z.string().min(1, 'Kommun saknas'),
  hemsida: z
    .string()
    .min(1, 'Hemsida saknas')
    .transform((value) => value.trim())
    .transform((value) => {
      if (!value) return value
      return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
    }),
})

type CsvRow = z.infer<typeof rowSchema>

async function importHomepages() {
  try {
    console.log('📖 Läser CSV-fil...')

    const csvPath = path.resolve(process.cwd(), 'temp/Foreningar3.csv')
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV-fil saknas på sökvägen ${csvPath}`)
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    const parsed = parse(csvContent, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      trim: true,
    }) as Record<string, string>[]

    const rows: CsvRow[] = []
    const invalidRows: { row: Record<string, string>; issues: string }[] = []

    for (const row of parsed) {
      const result = rowSchema.safeParse(row)
      if (result.success) {
        rows.push(result.data)
      } else {
        invalidRows.push({ row, issues: result.error.issues.map((issue) => issue.message).join(', ') })
      }
    }

    if (invalidRows.length) {
      console.warn('⚠️  Några rader hoppades över på grund av valideringsfel:')
      invalidRows.slice(0, 10).forEach(({ row, issues }) => {
        console.warn(` - ${JSON.stringify(row)} → ${issues}`)
      })
      if (invalidRows.length > 10) {
        console.warn(` …och ytterligare ${invalidRows.length - 10} rader.`)
      }
    }

    console.log(`✅ Validerade ${rows.length} rader från CSV\n`)

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
