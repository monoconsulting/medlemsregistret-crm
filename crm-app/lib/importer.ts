import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Prisma, PrismaClient } from '@prisma/client'

export type ImportMode = 'new' | 'update' | 'replace'

export interface ScrapedAssociation {
  source_system: string
  municipality: string
  scrape_run_id?: string | null
  scraped_at?: string | null
  association: {
    name: string
    org_number?: string | null
    types?: string[] | null
    activities?: string[] | null
    categories?: string[] | null
    homepage_url?: string | null
    detail_url?: string | null
    street_address?: string | null
    postal_code?: string | null
    city?: string | null
    email?: string | null
    phone?: string | null
    description?: {
      sections?: Array<{
        title: string
        data: Record<string, unknown>
      }>
      free_text?: string | null
    } | null
  }
  contacts?: Array<{
    contact_person_name: string
    contact_person_role?: string | null
    contact_person_email?: string | null
    contact_person_phone?: string | null
  }>
  detail_url?: string | null
  source_navigation?: {
    list_page_index?: number | null
    position_on_page?: number | null
    pagination_model?: string | null
    filter_state?: Record<string, unknown> | null
  }
  extras?: Record<string, unknown> | null
}

export interface ImportFile {
  filename: string
  records: ScrapedAssociation[]
}

export interface ImporterOptions {
  prisma: PrismaClient
  files: ImportFile[]
  mode: ImportMode
  municipalityId?: string | null
  municipalityName?: string | null
  importedById?: string
  importedByName?: string
}

export interface ImportStats {
  batchId: string
  municipalityId: string
  municipalityName: string
  totalRecords: number
  importedCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  deletedCount: number
  errors: string[]
}

export class ImporterError extends Error {}

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export async function parseFixtureFile(filePath: string): Promise<ImportFile> {
  const content = await fs.readFile(filePath, 'utf-8')
  const filename = path.basename(filePath)
  const records = parseFixtureContent(filename, content)
  return { filename, records }
}

export function parseFixtureContent(filename: string, content: string): ScrapedAssociation[] {
  if (!content.trim()) {
    return []
  }

  try {
    if (filename.toLowerCase().endsWith('.jsonl')) {
      return content
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ScrapedAssociation)
    }

    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed as ScrapedAssociation[]
    }

    return [parsed as ScrapedAssociation]
  } catch (error) {
    throw new ImporterError(`Kunde inte tolka ${filename}: ${(error as Error).message}`)
  }
}

export async function importAssociations(options: ImporterOptions): Promise<ImportStats> {
  const { prisma, files, mode } = options
  if (!files.length) {
    throw new ImporterError('Minst en fil krävs för import')
  }

  const flattenedRecords = files.flatMap((file) =>
    file.records.map((record) => ({ record, filename: file.filename }))
  )

  if (!flattenedRecords.length) {
    throw new ImporterError('Filerna innehåller inga föreningar att importera')
  }

  const firstRecord = flattenedRecords[0]?.record
  const inferredMunicipalityName =
    options.municipalityName?.trim() || firstRecord?.municipality?.trim() || null

  const importedById = options.importedById ?? 'system'
  const importedByName = options.importedByName ?? 'System'

  const municipality = await resolveMunicipality(prisma, {
    municipalityId: options.municipalityId,
    municipalityName: inferredMunicipalityName,
  })

  if (!municipality) {
    throw new ImporterError('Kommun saknas – ange ett giltigt kommun-ID eller namn i filen')
  }

  const stats: Omit<ImportStats, 'batchId' | 'municipalityId' | 'municipalityName'> = {
    totalRecords: flattenedRecords.length,
    importedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    deletedCount: 0,
    errors: [],
  }

  const importBatch = await prisma.importBatch.create({
    data: {
      municipalityId: municipality.id,
      fileName: files.map((file) => file.filename).join(', '),
      fileCount: files.length,
      status: 'processing',
      importMode: mode,
      importedBy: importedById,
      importedByName,
    },
  })

  const processedDetailUrls = new Set<string>()
  const processedNameKeys = new Set<string>()
  const scrapeRunCache = new Map<string, string | null>()

  try {
    if (mode === 'replace') {
      const deletionResult = await prisma.association.deleteMany({
        where: { municipalityId: municipality.id },
      })
      stats.deletedCount = deletionResult.count
    }

    for (const item of flattenedRecords) {
      const record = item.record
      const recordMunicipality = record.municipality?.trim()
      if (!recordMunicipality) {
        throw new ImporterError(
          `Posten ${record.association.name ?? 'utan namn'} saknar kommunnamn och importen avbryts.`
        )
      }

      const filename = item.filename
      let resolvedScrapeRunId: string | null = null
      if (record.scrape_run_id) {
        if (scrapeRunCache.has(record.scrape_run_id)) {
          resolvedScrapeRunId = scrapeRunCache.get(record.scrape_run_id) ?? null
        } else {
          const scrapeRun = await prisma.scrapeRun.findUnique({
            where: { id: record.scrape_run_id },
            select: { id: true },
          })
          resolvedScrapeRunId = scrapeRun?.id ?? null
          scrapeRunCache.set(record.scrape_run_id, resolvedScrapeRunId)
        }
      }

      const associationPayload = buildAssociationPayload(record, {
        municipalityId: municipality.id,
        municipalityName: municipality.name,
        importBatchId: importBatch.id,
        scrapeRunId: resolvedScrapeRunId,
      })

      if (associationPayload instanceof ImporterError) {
        stats.errorCount += 1
        stats.errors.push(associationPayload.message)
        continue
      }

      const { data, contacts, descriptionSections, detailUrl, lookupNameKey } = associationPayload

      if (detailUrl) {
        if (processedDetailUrls.has(detailUrl)) {
          stats.errorCount += 1
          stats.errors.push(`Duplicerad detailUrl i batchen (${detailUrl}) - fil: ${filename}`)
          continue
        }
        processedDetailUrls.add(detailUrl)
      }

      if (lookupNameKey) {
        if (processedNameKeys.has(lookupNameKey) && !detailUrl) {
          stats.errorCount += 1
          stats.errors.push(`Duplicerat namn i batchen (${lookupNameKey.split(':')[1]}) - fil: ${filename}`)
          continue
        }
        processedNameKeys.add(lookupNameKey)
      }

      try {
        const outcome = await prisma.$transaction(
          async (tx) => {
            const existing = await findExistingAssociation(tx, {
              detailUrl,
              municipalityId: municipality.id,
              name: data.name,
            })

            if (existing) {
              if (mode === 'new') {
                return { status: 'skipped-existing' as const }
              }

              await updateAssociation(tx, existing.id, data, contacts, descriptionSections)
              return { status: 'updated' as const }
            }

            await createAssociation(tx, data, contacts, descriptionSections)
            return { status: 'imported' as const }
          },
          { timeout: 20000, maxWait: 10000 }
        )

        if (outcome.status === 'imported') {
          stats.importedCount += 1
        } else if (outcome.status === 'updated') {
          stats.updatedCount += 1
        } else {
          stats.skippedCount += 1
        }
      } catch (error) {
        stats.errorCount += 1
        stats.errors.push(
          `Kunde inte behandla ${data.name} (${detailUrl ?? 'saknar detailUrl'}): ${(error as Error).message}`
        )
        if (detailUrl) {
          processedDetailUrls.delete(detailUrl)
        }
        if (lookupNameKey) {
          processedNameKeys.delete(lookupNameKey)
        }
      }
    }
  } catch (error) {
    stats.errorCount += 1
    stats.errors.push(`Importen avbröts: ${(error as Error).message}`)

    try {
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'failed',
          totalRecords: stats.totalRecords,
          importedCount: stats.importedCount,
          updatedCount: stats.updatedCount,
          skippedCount: stats.skippedCount,
          errorCount: stats.errorCount,
          deletedCount: stats.deletedCount,
          errors: stats.errors as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      })
    } catch (updateError) {
      stats.errors.push(
        `Kunde inte uppdatera importBatch vid felhantering: ${(updateError as Error).message}`
      )
    }

    throw error
  }

  const finalStatus = stats.errorCount > 0 && stats.importedCount === 0 && stats.updatedCount === 0 ? 'failed' : 'completed'

  try {
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: finalStatus,
        totalRecords: stats.totalRecords,
        importedCount: stats.importedCount,
        updatedCount: stats.updatedCount,
        skippedCount: stats.skippedCount,
        errorCount: stats.errorCount,
        deletedCount: stats.deletedCount,
        errors: stats.errors as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    })
  } catch (updateError) {
    stats.errors.push(
      `Kunde inte uppdatera importBatch efter import: ${(updateError as Error).message}`
    )
  }

  return {
    batchId: importBatch.id,
    municipalityId: municipality.id,
    municipalityName: municipality.name,
    ...stats,
  }
}

async function resolveMunicipality(
  prisma: PrismaClient,
  options: { municipalityId?: string | null; municipalityName?: string | null }
) {
  if (options.municipalityId) {
    const existing = await prisma.municipality.findUnique({ where: { id: options.municipalityId } })
    if (existing) {
      return existing
    }
  }

  if (!options.municipalityName) {
    return null
  }

  const normalizedName = options.municipalityName.trim()

  const existingByName = await prisma.municipality.findUnique({
    where: { name: normalizedName },
  })
  if (existingByName) {
    return existingByName
  }

  return prisma.municipality.create({
    data: {
      name: normalizedName,
    },
  })
}

type AssociationPayload =
  | {
      data: NormalizedAssociationData
      contacts: Prisma.ContactCreateManyInput[]
      descriptionSections: Array<{
        title: string | null
        data: Prisma.InputJsonValue | null
        orderIndex: number
      }>
      detailUrl: string | null
      lookupNameKey: string | null
    }
  | ImporterError

interface NormalizedAssociationData {
  sourceSystem: string
  municipalityId: string
  municipality: string
  scrapeRunId: string | null
  scrapedAt: Date
  detailUrl: string | null
  name: string
  orgNumber: string | null
  types: Prisma.InputJsonValue
  activities: Prisma.InputJsonValue
  categories: Prisma.InputJsonValue
  homepageUrl: string | null
  streetAddress: string | null
  postalCode: string | null
  city: string | null
  email: string | null
  phone: string | null
  description: Prisma.InputJsonValue | null
  descriptionFreeText: string | null
  listPageIndex: number | null
  positionOnPage: number | null
  paginationModel: string | null
  filterState: Prisma.InputJsonValue | null
  extras: Prisma.InputJsonValue | null
  importBatchId: string
}

function buildAssociationPayload(
  record: ScrapedAssociation,
  context: {
    municipalityId: string
    municipalityName: string
    importBatchId: string
    scrapeRunId: string | null
  }
): AssociationPayload {
  const detailUrl = record.association.detail_url || record.detail_url || null
  const name = record.association.name?.trim()

  if (!name) {
    return new ImporterError('Förening saknar namn och kan inte importeras')
  }

  const data: NormalizedAssociationData = {
    sourceSystem: record.source_system,
    municipalityId: context.municipalityId,
    municipality: context.municipalityName,
    importBatchId: context.importBatchId,
    scrapeRunId: context.scrapeRunId ?? null,
    scrapedAt: record.scraped_at ? new Date(record.scraped_at) : new Date(),
    name,
    orgNumber: record.association.org_number ?? null,
    types: record.association.types ?? [],
    activities: record.association.activities ?? [],
    categories: record.association.categories ?? [],
    homepageUrl: record.association.homepage_url ?? null,
    streetAddress: record.association.street_address ?? null,
    postalCode: record.association.postal_code ?? null,
    city: record.association.city ?? null,
    email: record.association.email ?? null,
    phone: record.association.phone ?? null,
    description: (record.association.description as Prisma.InputJsonValue) ?? null,
    descriptionFreeText: record.association.description?.free_text ?? null,
    listPageIndex: record.source_navigation?.list_page_index ?? null,
    positionOnPage: record.source_navigation?.position_on_page ?? null,
    paginationModel: record.source_navigation?.pagination_model ?? null,
    filterState: (record.source_navigation?.filter_state as Prisma.InputJsonValue) ?? null,
    extras: (record.extras as Prisma.InputJsonValue) ?? null,
    detailUrl,
  }

  const contacts = (record.contacts ?? [])
    .filter((contact) => contact.contact_person_name?.trim())
    .map<Prisma.ContactCreateManyInput>((contact, index) => ({
      associationId: '',
      name: contact.contact_person_name.trim(),
      role: contact.contact_person_role ?? null,
      email: contact.contact_person_email ?? null,
      phone: contact.contact_person_phone ?? null,
      isPrimary: index === 0,
    }))

  const descriptionSections =
    record.association.description?.sections
      ?.map((section, index) => {
        const rawTitle = typeof section.title === 'string' ? section.title.trim() : ''
        const title = rawTitle.length ? rawTitle : null

        const hasData = section.data && Object.keys(section.data).length > 0
        const dataValue = hasData ? (section.data as Prisma.InputJsonValue) : Prisma.JsonNull

        return {
          title,
          data: dataValue,
          orderIndex: index,
        }
      })
      .filter((section) => section.title !== null || section.data !== Prisma.JsonNull) ?? []

  const lookupNameKey = `${context.municipalityId}:${name.toLowerCase()}`

  return {
    data,
    contacts,
    descriptionSections,
    detailUrl,
    lookupNameKey,
  }
}

async function findExistingAssociation(
  prisma: PrismaExecutor,
  options: { detailUrl: string | null; municipalityId: string; name: string }
) {
  if (options.detailUrl) {
    const byDetail = await prisma.association.findFirst({ where: { detailUrl: options.detailUrl } })
    if (byDetail) {
      return byDetail
    }
  }

  return prisma.association.findFirst({
    where: {
      municipalityId: options.municipalityId,
      name: options.name,
    },
  })
}

async function updateAssociation(
  prisma: PrismaExecutor,
  associationId: string,
  data: NormalizedAssociationData,
  contacts: Prisma.ContactCreateManyInput[],
  descriptionSections: Array<{ title: string | null; data: Prisma.InputJsonValue | null; orderIndex: number }>
) {
  await prisma.association.update({
    where: { id: associationId },
    data: {
      ...data,
      isDeleted: false,
      deletedAt: null,
    } as Prisma.AssociationUncheckedUpdateInput,
  })

  if (contacts.length) {
    await prisma.contact.deleteMany({ where: { associationId } })
    await prisma.contact.createMany({
      data: contacts.map((contact, index) => ({
        ...contact,
        associationId,
        isPrimary: index === 0,
      })),
    })
  }

  if (descriptionSections.length) {
    await prisma.descriptionSection.deleteMany({ where: { associationId } })
    await prisma.descriptionSection.createMany({
      data: descriptionSections.map((section) => ({
        associationId,
        title: section.title ?? null,
        data: section.data ?? Prisma.JsonNull,
        orderIndex: section.orderIndex,
      })),
    })
  }
}

async function createAssociation(
  prisma: PrismaExecutor,
  data: NormalizedAssociationData,
  contacts: Prisma.ContactCreateManyInput[],
  descriptionSections: Array<{ title: string | null; data: Prisma.InputJsonValue | null; orderIndex: number }>
) {
  const association = await prisma.association.create({
    data: data as Prisma.AssociationUncheckedCreateInput,
  })

  if (contacts.length) {
    await prisma.contact.createMany({
      data: contacts.map((contact, index) => ({
        ...contact,
        associationId: association.id,
        isPrimary: index === 0,
      })),
    })
  }

  if (descriptionSections.length) {
    await prisma.descriptionSection.createMany({
      data: descriptionSections.map((section) => ({
        associationId: association.id,
        title: section.title ?? null,
        data: section.data ?? Prisma.JsonNull,
        orderIndex: section.orderIndex,
      })),
    })
  }
}
