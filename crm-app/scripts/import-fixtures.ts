import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { db } from '@/lib/db'
import {
  importAssociations,
  parseFixtureContent,
  type ImportFile,
  type ImportMode,
} from '@/lib/importer'

interface FixtureCandidate {
  municipalityName: string | null
  records: ImportFile['records']
  filename: string
  displayPath: string
  source: 'filesystem' | 'archive'
  scrapedAtMs: number | null
  fileModifiedMs: number | null
}

interface CliOptions {
  mode: ImportMode
  municipality?: string
}

const VALID_MODES: ImportMode[] = ['new', 'update', 'replace']

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
  const fixtureDir = path.join(rootDir, 'scraping', 'json')
  const archivePath = path.join(rootDir, 'scraping.zip')

  const candidates: FixtureCandidate[] = []

  const localFixtures = await discoverFilesystemFixtures(fixtureDir)
  candidates.push(...localFixtures)

  const archiveFixtures = await discoverArchiveFixtures(archivePath)
  candidates.push(...archiveFixtures)

  if (!candidates.length) {
    console.error('Inga fixtures hittades under scraping/out eller i scraping.zip')
    process.exit(1)
  }

  const filteredCandidates = options.municipality
    ? candidates.filter((candidate) =>
        candidate.municipalityName
          ?.toLowerCase()
          .includes(options.municipality!.toLowerCase())
      )
    : candidates

  if (!filteredCandidates.length) {
    console.error(`Hittade inga fixtures som matchar kommunen "${options.municipality}"`)
    process.exit(1)
  }

  const { selected, skipped } = selectLatestPerMunicipality(filteredCandidates)

  logInventory(selected, skipped)

  const grouped = groupByMunicipality(selected)

  for (const [municipalityName, fixtures] of grouped) {
    console.log(`\n▶ Importerar ${municipalityName} (${fixtures.totalRecords} poster från ${fixtures.files.length} filer)`)

    try {
      const result = await importAssociations({
        prisma: db,
        files: fixtures.files,
        mode: options.mode,
        municipalityName,
      })

      console.log('   ✓ Klart:', {
        importerMode: options.mode,
        imported: result.importedCount,
        uppdaterade: result.updatedCount,
        hoppadeÖver: result.skippedCount,
        fel: result.errorCount,
      })

      if (result.errors.length) {
        result.errors.slice(0, 5).forEach((err) => console.warn('     •', err))
        if (result.errors.length > 5) {
          console.warn(`     • ...och ${result.errors.length - 5} fler fel`)
        }
      }
    } catch (error) {
      console.error(`   ✗ Import misslyckades för ${municipalityName}:`, error)
    }
  }

  await db.$disconnect()
}

function parseArgs(argv: string[]): CliOptions {
  let mode: ImportMode = 'update'
  let municipality: string | undefined

  for (const arg of argv) {
    if (arg.startsWith('--mode=')) {
      const value = arg.split('=')[1]?.toLowerCase()
      if (value && VALID_MODES.includes(value as ImportMode)) {
        mode = value as ImportMode
      } else {
        console.warn(`Ogiltigt importläge "${value}" – använder "update"`)
      }
    } else if (arg.startsWith('--municipality=')) {
      municipality = arg.split('=')[1]
    }
  }

  return { mode, municipality }
}

async function discoverFilesystemFixtures(dir: string, baseDir = dir): Promise<FixtureCandidate[]> {
  const results: FixtureCandidate[] = []

  const entries = await safeReadDir(dir)
  if (!entries) return results

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = await safeStat(fullPath)
    if (!stat) continue

    if (stat.isDirectory()) {
      results.push(...(await discoverFilesystemFixtures(fullPath, baseDir)))
      continue
    }

    if (!entry.toLowerCase().match(/\.jsonl?$/)) {
      continue
    }

    const content = await safeReadFile(fullPath)
    if (!content) continue

    const records = parseFixtureContent(entry, content)
    const municipalityName = records[0]?.municipality ?? null

    const scrapedAtMs = resolveScrapedAtMs(records)

    results.push({
      municipalityName,
      records,
      filename: entry,
      displayPath: path.relative(baseDir, fullPath),
      source: 'filesystem',
      scrapedAtMs,
      fileModifiedMs: stat.mtimeMs ?? null,
    })
  }

  return results
}

const execFileAsync = promisify(execFile)

async function discoverArchiveFixtures(zipPath: string): Promise<FixtureCandidate[]> {
  const results: FixtureCandidate[] = []
  const zipExists = await safeStat(zipPath)
  if (!zipExists) {
    return results
  }

  let listOutput: string
  try {
    const { stdout } = await execFileAsync('unzip', ['-Z1', zipPath])
    listOutput = stdout
  } catch (error) {
    console.warn('Kunde inte lista arkiv-innehåll via unzip:', (error as Error).message)
    return results
  }

  const entries = listOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const entryName of entries) {
    const normalized = entryName.toLowerCase()
    if (!normalized.startsWith('scraping/json/')) {
      continue
    }

    if (!normalized.match(/\.jsonl?$/)) {
      continue
    }

    let content: string
    try {
      const { stdout } = await execFileAsync('unzip', ['-p', zipPath, entryName], { maxBuffer: 1024 * 1024 * 64 })
      content = stdout
    } catch (error) {
      console.warn(`Kunde inte extrahera ${entryName}:`, (error as Error).message)
      continue
    }

    const filename = path.basename(entryName)
    const records = parseFixtureContent(filename, content)
    const municipalityName = records[0]?.municipality ?? null

    const scrapedAtMs = resolveScrapedAtMs(records)

    results.push({
      municipalityName,
      records,
      filename,
      displayPath: entryName,
      source: 'archive',
      scrapedAtMs,
      fileModifiedMs: extractTimestampFromFilename(filename),
    })
  }

  return results
}

function selectLatestPerMunicipality(
  candidates: FixtureCandidate[],
): { selected: FixtureCandidate[]; skipped: FixtureCandidate[] } {
  const selected = new Map<string, FixtureCandidate>()
  const skipped: FixtureCandidate[] = []

  for (const candidate of candidates) {
    const key = (candidate.municipalityName ?? 'Okänd kommun').toLowerCase()
    const existing = selected.get(key)

    if (!existing) {
      selected.set(key, candidate)
      continue
    }

    if (isCandidateNewer(candidate, existing)) {
      skipped.push(existing)
      selected.set(key, candidate)
    } else {
      skipped.push(candidate)
    }
  }

  return {
    selected: Array.from(selected.values()),
    skipped,
  }
}

function groupByMunicipality(candidates: FixtureCandidate[]) {
  const grouped = new Map<
    string,
    {
      files: ImportFile[]
      totalRecords: number
      sources: Array<{ path: string; source: string }>
    }
  >()

  for (const candidate of candidates) {
    const name = candidate.municipalityName ?? 'Okänd kommun'
    const importFile: ImportFile = {
      filename: candidate.filename,
      records: candidate.records,
    }

    grouped.set(name, {
      files: [importFile],
      totalRecords: candidate.records.length,
      sources: [{ path: candidate.displayPath, source: candidate.source }],
    })
  }

  return grouped
}

function logInventory(selected: FixtureCandidate[], skipped: FixtureCandidate[]) {
  console.log('Hittade fixtures (senaste per kommun):')
  for (const candidate of selected) {
    console.log(
      ` • ${candidate.municipalityName ?? 'Okänd kommun'} – ${candidate.records.length} poster (${candidate.source}, ${candidate.displayPath})`,
    )
  }

  if (skipped.length) {
    console.log('\nFöljande filer hoppades över (äldre upplagor):')
    for (const candidate of skipped) {
      console.log(`   · ${candidate.municipalityName ?? 'Okänd kommun'} – ${candidate.displayPath}`)
    }
  }
}

function resolveScrapedAtMs(records: ImportFile['records']): number | null {
  const timestamps = records
    .map((record) => record.scraped_at)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => Date.parse(value))
    .filter((value): value is number => Number.isFinite(value))

  if (!timestamps.length) {
    return null
  }

  return Math.max(...timestamps)
}

function extractTimestampFromFilename(filename: string): number | null {
  const match = filename.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/i)
  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute] = match
  const iso = `${year}-${month}-${day}T${hour}:${minute}:00Z`
  const parsed = Date.parse(iso)
  return Number.isFinite(parsed) ? parsed : null
}

function candidateTimestamp(candidate: FixtureCandidate): number {
  return (
    candidate.scrapedAtMs ??
    candidate.fileModifiedMs ??
    extractTimestampFromFilename(candidate.filename) ??
    -Infinity
  )
}

function isCandidateNewer(next: FixtureCandidate, current: FixtureCandidate): boolean {
  return candidateTimestamp(next) > candidateTimestamp(current)
}

async function safeReadDir(dir: string) {
  try {
    return await (await import('node:fs/promises')).readdir(dir)
  } catch (error) {
    return null
  }
}

async function safeStat(filePath: string) {
  try {
    return await (await import('node:fs/promises')).stat(filePath)
  } catch (error) {
    return null
  }
}

async function safeReadFile(filePath: string) {
  try {
    return await (await import('node:fs/promises')).readFile(filePath, 'utf-8')
  } catch (error) {
    return null
  }
}

main().catch((error) => {
  console.error('Import-skriptet misslyckades:', error)
  db.$disconnect().finally(() => process.exit(1))
})
