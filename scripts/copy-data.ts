#!/usr/bin/env tsx
/**
 * Copy data from the local development database (crm_db on 127.0.0.1:3316)
 * to the Loopia production database, mapping columns explicitly so that
 * differences in column order do not corrupt data.
 *
 * Usage:
 *   npx tsx scripts/copy-data.ts
 *
 * Environment: uses credentials hardcoded in script (matching current setup).
 */

import mysql from 'mysql2/promise'

interface TableConfig {
  columns: string[]
  sourceSelect?: string[]
  orderBy?: string
}

const SOURCE_CONFIG = {
  host: '127.0.0.1',
  port: 3316,
  user: 'root',
  password: 'root_password_change_me',
  database: 'crm_db',
}

const TARGET_CONFIG = {
  host: 'mysql513.loopia.se',
  port: 3306,
  user: 'walla3jk@m383902',
  password: 'Banjo192652',
  database: 'medlemsregistret_se_db_4',
}

const TABLES: Record<string, TableConfig> = {
  Activity: {
    columns: ['id', 'associationId', 'type', 'description', 'metadata', 'userId', 'userName', 'createdAt'],
    orderBy: 'createdAt',
  },
  Association: {
    columns: [
      'id',
      'sourceSystem',
      'municipalityId',
      'municipality',
      'scrapeRunId',
      'scrapedAt',
      'detailUrl',
      'name',
      'orgNumber',
      'types',
      'activities',
      'categories',
      'homepageUrl',
      'streetAddress',
      'postalCode',
      'city',
      'email',
      'phone',
      'description',
      'descriptionFreeText',
      'crmStatus',
      'isMember',
      'memberSince',
      'pipeline',
      'assignedToId',
      'listPageIndex',
      'positionOnPage',
      'paginationModel',
      'filterState',
      'extras',
      'createdAt',
      'updatedAt',
      'importBatchId',
      'deletedAt',
      'isDeleted',
    ],
    orderBy: 'id',
  },
  Contact: {
    columns: [
      'id',
      'associationId',
      'name',
      'role',
      'email',
      'phone',
      'mobile',
      'linkedinUrl',
      'facebookUrl',
      'twitterUrl',
      'instagramUrl',
      'isPrimary',
      'createdAt',
      'updatedAt',
    ],
    orderBy: 'id',
  },
  DescriptionSection: {
    columns: ['id', 'associationId', 'title', 'data', 'orderIndex', 'createdAt', 'updatedAt'],
    orderBy: 'id',
  },
  Group: {
    columns: ['id', 'name', 'description', 'searchQuery', 'autoUpdate', 'createdById', 'createdAt', 'updatedAt'],
    orderBy: 'id',
  },
  GroupMembership: {
    columns: ['id', 'groupId', 'associationId', 'addedAt'],
    orderBy: 'id',
  },
  ImportBatch: {
    columns: [
      'id',
      'municipalityId',
      'fileName',
      'fileCount',
      'totalRecords',
      'importedCount',
      'updatedCount',
      'skippedCount',
      'errorCount',
      'deletedCount',
      'status',
      'importMode',
      'errors',
      'importedBy',
      'importedByName',
      'createdAt',
      'completedAt',
    ],
    orderBy: 'createdAt',
  },
  Municipality: {
    columns: [
      'id',
      'name',
      'code',
      'county',
      'population',
      'region',
      'latitude',
      'longitude',
      'homepage',
      'createdAt',
      'updatedAt',
      'platform',
      'province',
      'registerStatus',
      'registerUrl',
      'registryEndpoint',
      'countyCode',
    ],
    orderBy: 'name',
  },
  Note: {
    columns: ['id', 'associationId', 'authorId', 'authorName', 'content', 'tags', 'createdAt', 'updatedAt'],
    orderBy: 'createdAt',
  },
  ScrapeRun: {
    columns: ['id', 'status', 'startedAt', 'completedAt', 'totalFound', 'totalProcessed', 'errors', 'municipalityId'],
    orderBy: 'startedAt',
  },
  Tag: {
    columns: ['id', 'name', 'type', 'createdAt'],
    orderBy: 'createdAt',
  },
  Task: {
    columns: [
      'id',
      'associationId',
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'assignedToId',
      'createdById',
      'createdAt',
      'updatedAt',
      'completedAt',
    ],
    orderBy: 'dueDate',
  },
  _AssociationTags: {
    columns: ['A', 'B'],
    orderBy: 'A',
  },
}

const JSON_COLUMNS: Record<string, Set<string>> = {
  Activity: new Set(['metadata']),
  Association: new Set(['types', 'activities', 'categories', 'description', 'filterState', 'extras']),
  Contact: new Set([]),
  DescriptionSection: new Set(['data']),
  Group: new Set(['searchQuery']),
  GroupMembership: new Set([]),
  ImportBatch: new Set(['errors']),
  Municipality: new Set(['extras']),
  Note: new Set(['tags']),
  ScrapeRun: new Set(['errors']),
  Tag: new Set([]),
  Task: new Set([]),
  _AssociationTags: new Set([]),
}

async function main(): Promise<void> {
  const source = await mysql.createConnection({
    ...SOURCE_CONFIG,
    namedPlaceholders: true,
  })
  const target = await mysql.createConnection({
    ...TARGET_CONFIG,
    namedPlaceholders: true,
  })

  try {
    await target.query('SET FOREIGN_KEY_CHECKS=0')
    await target.query('SET UNIQUE_CHECKS=0')
    await target.query('SET check_constraint_checks=0')

    for (const [table, config] of Object.entries(TABLES)) {
      console.log(`\n>>> Syncing table ${table}`)
      await target.execute(`TRUNCATE TABLE \`${table}\``)

      const cols = config.columns
      const selectColumns = config.sourceSelect ?? cols.map((c) => `\`${c}\``)
      const selectSql = `SELECT ${selectColumns.join(', ')} FROM \`${table}\`${config.orderBy ? ` ORDER BY \`${config.orderBy.replace(/`/g, '')}\`` : ''}`
      console.log(`Fetching rows from local (${selectSql})`)
      const [rows] = await source.query(selectSql)
      const typedRows = rows as Record<string, unknown>[]

      if (!typedRows.length) {
        console.log('No rows to insert.')
        continue
      }

      const batchSize = 1000
      const insertSql = `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES `

      for (let i = 0; i < typedRows.length; i += batchSize) {
        const chunk = typedRows.slice(i, i + batchSize)
        const valuesPlaceholders = chunk
          .map((row) => `(${cols.map(() => '?').join(',')})`)
          .join(', ')
      const values: unknown[] = []
      for (const row of chunk) {
        for (const col of cols) {
            const raw = row[col]
            if (raw === undefined || raw === null) {
              values.push(null)
              continue
            }
            if (JSON_COLUMNS[table]?.has(col)) {
              if (typeof raw === 'string') {
                values.push(raw)
              } else {
                values.push(JSON.stringify(raw))
              }
              continue
            }
            if (raw instanceof Date) {
              if (Number.isNaN(raw.valueOf())) {
                values.push('1970-01-01 00:00:00')
              } else {
                values.push(raw)
              }
              continue
            }
            values.push(raw)
        }
      }
        await target.query(insertSql + valuesPlaceholders, values)
      }

      console.log(`Inserted ${typedRows.length} rows into ${table}`)
    }
    await target.query('SET check_constraint_checks=1')
    await target.query('SET UNIQUE_CHECKS=1')
    await target.query('SET FOREIGN_KEY_CHECKS=1')
  } finally {
    await target.end()
    await source.end()
  }
}

main().catch((err) => {
  console.error('Copy failed:', err)
  process.exitCode = 1
})
