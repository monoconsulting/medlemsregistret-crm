/**
 * @deprecated This script is deprecated since the system has migrated to a static website.
 * Database operations are no longer supported.
 * Keeping this file for reference only.
 */

import * as fs from "fs"
import * as path from "path"
import { parse } from "csv-parse/sync"

// Schema import removed - system has migrated to static website
// import { municipalityHomepageRowSchema, type MunicipalityHomepageRow } from "@/lib/schemas/municipality-homepage"

type MunicipalityHomepageRow = {
  kommun: string
  hemsida: string
  plattform?: string
}

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
      // Simple validation without schema (schema removed due to static migration)
      if (!record.kommun || !record.hemsida) {
        console.warn("⚠️  Ogiltig rad hoppad över (saknar kommun eller hemsida)", record)
        continue
      }

      const homepage = normalizeUrl(record.hemsida)
      if (!homepage) {
        console.warn(`⚠️  Ogiltig hemsideadress för ${record.kommun}`)
        continue
      }

      rows.push({
        kommun: record.kommun,
        hemsida: homepage,
        plattform: record.plattform
      })
    }

    console.log(`✅ Validerade ${rows.length} rader\n`)

    // Database operations removed - system has migrated to static website
    console.log("⚠️  VARNING: Detta script är deprecated och kan inte köras.")
    console.log("⚠️  Systemet har migrerat till en statisk hemsida utan databas.")
    console.log("\n📊 Parsad data (visas endast för referens):")
    rows.forEach(row => {
      console.log(`   ${row.kommun} → ${row.hemsida}${row.plattform ? ` (${row.plattform})` : ""}`)
    })
  } catch (error) {
    console.error("❌ Fel vid import:", error)
    throw error
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
