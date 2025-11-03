#!/usr/bin/env tsx
/**
 * Compare two MySQL dump files:
 *  - Table presence
 *  - Column definitions (order-sensitive)
 *  - Approximate row counts by parsing INSERT statements
 *
 * Usage:
 *   npx tsx scripts/compare-dumps.ts --a temp/crm_db.sql --b temp/medlemsregistret_se_db_4.sql
 */

import { createReadStream, promises as fs } from 'node:fs'
import * as readline from 'node:readline'

interface CliOptions {
  fileA: string
  fileB: string
}

interface TableInfo {
  createStatement: string
  columns: string[]
  rowCount: number
}

type DumpSummary = Map<string, TableInfo>

function parseArgs(argv: string[]): CliOptions {
  const args = [...argv]
  let fileA = ''
  let fileB = ''

  while (args.length) {
    const arg = args.shift()
    if (!arg) continue
    if (arg === '--a') {
      fileA = args.shift() ?? ''
    } else if (arg === '--b') {
      fileB = args.shift() ?? ''
    }
  }

  if (!fileA || !fileB) {
    throw new Error('Usage: npx tsx scripts/compare-dumps.ts --a <dump1.sql> --b <dump2.sql>')
  }

  return { fileA, fileB }
}

function extractTableName(token: string): string | null {
  const match = token.match(/`([^`]+)`/)
  return match ? match[1] : null
}

function extractColumns(createStatement: string): string[] {
  const start = createStatement.indexOf('(')
  const end = createStatement.lastIndexOf(')')
  if (start === -1 || end === -1 || end <= start) return []
  const body = createStatement.slice(start + 1, end)
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('`'))
    .map((line) => line.replace(/,$/, '').replace(/\s+/g, ' '))
}

function countValueTuples(insertStatement: string): number {
  const valuesPartMatch = insertStatement.match(/VALUES\s*(.+);?$/is)
  if (!valuesPartMatch) return 0
  const valuesPart = valuesPartMatch[1]
  let count = 0
  let depth = 0
  let inString = false

  for (let i = 0; i < valuesPart.length; i += 1) {
    const char = valuesPart[i]
    if (char === "'" && valuesPart[i - 1] !== '\\') {
      inString = !inString
    }
    if (inString) continue
    if (char === '(') {
      if (depth === 0) count += 1
      depth += 1
    } else if (char === ')') {
      depth = Math.max(0, depth - 1)
    }
  }
  return count
}

async function parseDump(path: string): Promise<DumpSummary> {
  await fs.access(path)
  const summary: DumpSummary = new Map()

  const stream = createReadStream(path, { encoding: 'utf8' })
  const rl = readline.createInterface({ input: stream })

  let buffer = ''
  let mode: 'create' | 'insert' | null = null
  let currentTable: string | null = null

  const commit = () => {
    if (!currentTable || !mode) return
    const entry = summary.get(currentTable) ?? { createStatement: '', columns: [], rowCount: 0 }
    if (mode === 'create') {
      entry.createStatement = buffer.trim()
      entry.columns = extractColumns(entry.createStatement)
    } else if (mode === 'insert') {
      entry.rowCount += countValueTuples(buffer)
    }
    summary.set(currentTable, entry)
  }

  for await (const line of rl) {
    const trimmed = line.trim()
    if (mode) {
      buffer += `${line}\n`
      if (trimmed.endsWith(';')) {
        commit()
        buffer = ''
        currentTable = null
        mode = null
      }
      continue
    }

    if (trimmed.startsWith('CREATE TABLE')) {
      const tableName = extractTableName(trimmed)
      if (tableName) {
        currentTable = tableName
        mode = 'create'
        buffer = `${line}\n`
      }
      continue
    }

    if (trimmed.startsWith('INSERT INTO')) {
      const tableName = extractTableName(trimmed)
      if (tableName) {
        currentTable = tableName
        mode = 'insert'
        buffer = `${line}\n`
        if (trimmed.endsWith(';')) {
          commit()
          buffer = ''
          currentTable = null
          mode = null
        }
      }
      continue
    }
  }

  rl.close()
  return summary
}

function compareTables(a: DumpSummary, b: DumpSummary) {
  const tables = new Set<string>([...a.keys(), ...b.keys()])

  const missingInB: string[] = []
  const missingInA: string[] = []
  const columnDiffs: { table: string; reason: string; firstDifference?: { index: number; a?: string; b?: string } }[] = []
  const rowDiffs: { table: string; a: number; b: number }[] = []

  for (const table of tables) {
    const infoA = a.get(table)
    const infoB = b.get(table)

    if (!infoA && infoB) {
      missingInA.push(table)
      continue
    }
    if (infoA && !infoB) {
      missingInB.push(table)
      continue
    }
    if (!infoA || !infoB) continue

    const colsA = infoA.columns.join('|')
    const colsB = infoB.columns.join('|')
    if (colsA !== colsB) {
      const lengthReason =
        infoA.columns.length !== infoB.columns.length
          ? `column count differs (A=${infoA.columns.length}, B=${infoB.columns.length})`
          : 'column definitions differ'

      let firstDifference: { index: number; a?: string; b?: string } | undefined
      const maxLen = Math.max(infoA.columns.length, infoB.columns.length)
      for (let i = 0; i < maxLen; i += 1) {
        const colA = infoA.columns[i]
        const colB = infoB.columns[i]
        if (colA !== colB) {
          firstDifference = { index: i, a: colA, b: colB }
          break
        }
      }

      columnDiffs.push({
        table,
        reason: lengthReason,
        firstDifference,
      })
    }

    if (infoA.rowCount !== infoB.rowCount) {
      rowDiffs.push({ table, a: infoA.rowCount, b: infoB.rowCount })
    }
  }

  return { missingInA, missingInB, columnDiffs, rowDiffs }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  console.log(`Comparing dumps:\n  A: ${options.fileA}\n  B: ${options.fileB}`)

  const [summaryA, summaryB] = await Promise.all([parseDump(options.fileA), parseDump(options.fileB)])

  const comparison = compareTables(summaryA, summaryB)

  console.log('\n=== Table presence ===')
  if (comparison.missingInA.length > 0) {
    console.log('Tables only in B:', comparison.missingInA.join(', '))
  }
  if (comparison.missingInB.length > 0) {
    console.log('Tables only in A:', comparison.missingInB.join(', '))
  }
  if (comparison.missingInA.length === 0 && comparison.missingInB.length === 0) {
    console.log('Both dumps contain the same tables.')
  }

  console.log('\n=== Column differences ===')
  if (comparison.columnDiffs.length === 0) {
    console.log('No column definition differences detected.')
  } else {
    for (const diff of comparison.columnDiffs) {
      console.log(`• ${diff.table}: ${diff.reason}`)
      if (diff.firstDifference) {
        const { index, a, b } = diff.firstDifference
        console.log(`   first difference at column index ${index}`)
        if (a !== undefined) console.log(`     A: ${a}`)
        if (b !== undefined) console.log(`     B: ${b}`)
      }
    }
  }

  console.log('\n=== Row count differences (approx.) ===')
  if (comparison.rowDiffs.length === 0) {
    console.log('No row count differences detected.')
  } else {
    for (const diff of comparison.rowDiffs) {
      console.log(`• ${diff.table}: A=${diff.a} vs B=${diff.b}`)
    }
  }
}

main().catch((error) => {
  console.error('Comparison failed:', error)
  process.exitCode = 1
})
