#!/usr/bin/env tsx
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs, Dirent } from 'node:fs'
import { execSync } from 'node:child_process'
import { db } from '@/lib/db'
import { importAssociations, parseImportFile, type ImportMode, type ParsedImportFile } from '@/lib/importer'

interface FixtureInfo {
  file: string
  municipalityNames: Set<string>
  totalRecords: number
  parsed: ParsedImportFile
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const scrapingDir = path.join(repoRoot, 'scraping')
const fixturesDir = path.join(scrapingDir, 'out')
const zipPath = path.join(repoRoot, 'scraping.zip')
const extractedDir = path.join(scrapingDir, 'extracted')

async function ensureZipExtracted() {
  try {
    await fs.access(zipPath)
  } catch {
    return
  }

  try {
    await fs.access(extractedDir)
    return
  } catch {
    // directory missing – extract archive
  }

  console.log(`📦 Packar upp scraping.zip till ${path.relative(repoRoot, extractedDir)} ...`)
  await fs.mkdir(extractedDir, { recursive: true })
  execSync(`unzip -qq -o ${JSON.stringify(zipPath)} -d ${JSON.stringify(extractedDir)}`)
}

async function findFixtureFiles(): Promise<string[]> {
  const files: string[] = []

  async function walk(dir: string) {
    let entries: Dirent[] = []
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (/\.(json|jsonl)$/i.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  await walk(fixturesDir)
  await walk(extractedDir)

  return files.sort()
}

function parseMode(argv: string[]): ImportMode {
  const arg = argv.find((value) => value.startsWith('--mode='))
  if (!arg) return 'update'
  const mode = arg.split('=')[1] as ImportMode
  if (!['new', 'update', 'replace'].includes(mode)) {
    throw new Error(`Ogiltigt importläge: ${mode}`)
  }
  return mode
}

async function main() {
  const mode = parseMode(process.argv.slice(2))
  await ensureZipExtracted()

  const fixtureFiles = await findFixtureFiles()
  if (!fixtureFiles.length) {
    console.warn('❗️ Hittade inga JSON- eller JSONL-filer i scraping/out eller extraherade mappar.')
    return
  }

  const fixtures: FixtureInfo[] = []
  for (const file of fixtureFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const parsed = parseImportFile(path.basename(file), content)
      const municipalityNames = new Set(parsed.records.map((record) => record.municipality))
      fixtures.push({ file, municipalityNames, totalRecords: parsed.records.length, parsed })
    } catch (error) {
      console.error(`⚠️  Kunde inte läsa ${file}:`, error)
    }
  }

  if (!fixtures.length) {
    console.warn('❗️ Inga giltiga fixtures att importera.')
    return
  }

  console.log(`🚀 Startar import i läge "${mode}" ...`)

  const grouped = new Map<string, ParsedImportFile[]>()
  for (const fixture of fixtures) {
    if (fixture.municipalityNames.size === 0) {
      console.warn(`⚠️  Filen ${fixture.file} saknar kommunnamn och hoppas över.`)
      continue
    }
    if (fixture.municipalityNames.size > 1) {
      console.warn(`⚠️  Filen ${fixture.file} innehåller flera kommuner (${Array.from(fixture.municipalityNames).join(', ')}). Hoppas över.`)
      continue
    }
    const municipalityName = Array.from(fixture.municipalityNames)[0]
    const list = grouped.get(municipalityName) ?? []
    list.push(fixture.parsed)
    grouped.set(municipalityName, list)
  }

  if (!grouped.size) {
    console.warn('❗️ Inga filer med identifierade kommuner hittades att importera.')
    return
  }

  for (const [municipalityName, files] of grouped.entries()) {
    const totalRecords = files.reduce((sum, file) => sum + file.records.length, 0)
    console.log(`\n🏙️  ${municipalityName}: ${files.length} fil(er), ${totalRecords} poster`)

    try {
      const result = await importAssociations({
        prisma: db,
        files,
        mode,
      })

      console.log(
        `   ✔️  Importerat: ${result.importedCount}, uppdaterat: ${result.updatedCount}, hoppade över: ${result.skippedCount}, fel: ${result.errorCount}, mjukt raderade: ${result.deletedCount}`
      )
      if (result.errors.length) {
        for (const message of result.errors) {
          console.warn(`   ⚠️  ${message}`)
        }
      }
    } catch (error) {
      console.error(`   ❌  Importen misslyckades för ${municipalityName}:`, error)
    }
  }
}

main()
  .catch((error) => {
    console.error('❌  Importen avbröts med fel:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
