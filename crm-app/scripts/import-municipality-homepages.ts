import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"
import { parse } from "csv-parse/sync"

import { municipalityHomepageRowSchema, type MunicipalityHomepageRow } from "@/lib/schemas/municipality-homepage"

const prisma = new PrismaClient()

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed.length) return null
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

async function importHomepages() {
  try {
    const csvPath = path.join(__dirname, "../../temp/Foreningar3.csv")

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV-fil saknas på ${csvPath}`)
    }

    console.log("📖 Läser CSV-fil…")
    const csvContent = fs.readFileSync(csvPath, "utf-8")

    const records = parse(csvContent, {
      columns: (header) => header.map((column: string) => column.trim().toLowerCase()),
      skip_empty_lines: true,
      delimiter: [";", ","],
      trim: true,
    }) as Record<string, string>[]

    const rows: MunicipalityHomepageRow[] = []

    for (const record of records) {
      const parsed = municipalityHomepageRowSchema.safeParse(record)
      if (!parsed.success) {
        console.warn("⚠️  Ogiltig rad hoppad över", record, parsed.error.message)
        continue
      }

      const homepage = normalizeUrl(parsed.data.hemsida)
      if (!homepage) {
        console.warn(`⚠️  Ogiltig hemsideadress för ${parsed.data.kommun}`)
        continue
      }

      rows.push({ ...parsed.data, hemsida: homepage })
    }

    console.log(`✅ Validerade ${rows.length} rader\n`)

    let updated = 0
    let notFound = 0
    let skipped = 0

    for (const row of rows) {
      const municipalityName = row.kommun.trim()

      const municipality = await prisma.municipality.findFirst({
        where: { name: { equals: municipalityName, mode: "insensitive" } },
      })

      if (!municipality) {
        console.log(`⚠️  Kommun inte hittad: ${municipalityName}`)
        notFound++
        continue
      }

      const dataToUpdate: { homepage?: string; platform?: string | null } = {}

      if (municipality.homepage !== row.hemsida) {
        dataToUpdate.homepage = row.hemsida
      }

      if (row.plattform && row.plattform.length && municipality.platform !== row.plattform) {
        dataToUpdate.platform = row.plattform
      }

      if (!Object.keys(dataToUpdate).length) {
        skipped++
        continue
      }

      await prisma.municipality.update({
        where: { id: municipality.id },
        data: dataToUpdate,
      })

      console.log(`✓ Uppdaterad: ${municipality.name} → ${row.hemsida}${row.plattform ? ` (${row.plattform})` : ""}`)
      updated++
    }

    console.log("\n📊 Sammanfattning:")
    console.log(`   ✅ Uppdaterade: ${updated}`)
    console.log(`   ⏭️  Hoppade över (ingen ändring): ${skipped}`)
    console.log(`   ⚠️  Inte hittade: ${notFound}`)
  } catch (error) {
    console.error("❌ Fel vid import:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importHomepages()
  .then(() => {
    console.log("\n✅ Import klar!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Import misslyckades:", error)
    process.exit(1)
  })
