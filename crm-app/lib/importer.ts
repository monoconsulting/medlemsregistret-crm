import { Prisma, PrismaClient } from '@prisma/client'
import { z } from 'zod'

export type ImportMode = 'new' | 'update' | 'replace'

const descriptionSectionSchema = z.object({
  title: z.string(),
  data: z.record(z.unknown()),
})

const scrapedAssociationSchema = z.object({
  source_system: z.string(),
  municipality: z.string().min(1),
  scrape_run_id: z.string().nullish(),
  scraped_at: z.string().nullish(),
  association: z.object({
    name: z.string().min(1),
    org_number: z.string().nullish(),
    types: z.array(z.string()).nullish(),
    activities: z.array(z.string()).nullish(),
    categories: z.array(z.string()).nullish(),
    homepage_url: z.string().url().nullish(),
    detail_url: z.string().nullish(),
    street_address: z.string().nullish(),
    postal_code: z.string().nullish(),
    city: z.string().nullish(),
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
    description: z
      .object({
        sections: z.array(descriptionSectionSchema).nullish(),
        free_text: z.string().nullish(),
      })
      .nullish(),
  }),
  contacts: z
    .array(
      z.object({
        contact_person_name: z.string(),
        contact_person_role: z.string().nullish(),
        contact_person_email: z.string().email().nullish(),
        contact_person_phone: z.string().nullish(),
      })
    )
    .nullish(),
  detail_url: z.string().nullish(),
  source_navigation: z
    .object({
      list_page_index: z.number().int().nullish(),
      position_on_page: z.number().int().nullish(),
      pagination_model: z.string().nullish(),
      filter_state: z.record(z.unknown()).nullish(),
    })
    .nullish(),
  extras: z.record(z.unknown()).nullish(),
})

export type ScrapedAssociation = z.infer<typeof scrapedAssociationSchema>

export interface ParsedImportFile {
  name: string
  records: ScrapedAssociation[]
}

export function parseImportFile(name: string, content: string): ParsedImportFile {
  const trimmed = content.trim()
  if (!trimmed) {
    return { name, records: [] }
  }

  let rawRecords: unknown[] = []

  if (name.toLowerCase().endsWith('.jsonl')) {
    const lines = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    rawRecords = lines.map((line) => JSON.parse(line))
  } else {
    const parsed = JSON.parse(trimmed)
    rawRecords = Array.isArray(parsed) ? parsed : [parsed]
  }

  const records = rawRecords.map((record) => scrapedAssociationSchema.parse(record))

  return { name, records }
}

export interface ImportAssociationsOptions {
  prisma: PrismaClient
  files: ParsedImportFile[]
  mode: ImportMode
  municipalityId?: string
  actorId?: string
  actorName?: string
}

export interface ImportResult {
  municipalityId: string
  municipalityName: string
  importBatchId: string
  totalRecords: number
  importedCount: number
  updatedCount: number
  skippedCount: number
  deletedCount: number
  errorCount: number
  errors: string[]
}

function normaliseDetailUrl(record: ScrapedAssociation): string | null {
  const url = record.association.detail_url ?? record.detail_url ?? null
  return url ? url.trim() || null : null
}

export async function importAssociations({
  prisma,
  files,
  mode,
  municipalityId,
  actorId = 'system',
  actorName = 'System',
}: ImportAssociationsOptions): Promise<ImportResult> {
  if (files.length === 0) {
    throw new Error('Inga filer att importera')
  }

  const totalRecords = files.reduce((sum, file) => sum + file.records.length, 0)
  if (totalRecords === 0) {
    throw new Error('Filerna innehåller inga föreningar att importera')
  }

  const municipalityNames = new Set<string>()
  for (const file of files) {
    for (const record of file.records) {
      municipalityNames.add(record.municipality.trim())
    }
  }

  let inferredMunicipalityName: string | undefined
  if (municipalityNames.size === 1) {
    inferredMunicipalityName = Array.from(municipalityNames)[0]
  } else if (municipalityNames.size > 1) {
    throw new Error('Filerna innehåller föreningar från flera kommuner')
  }

  return prisma.$transaction(async (tx) => {
    let targetMunicipalityId = municipalityId ?? null
    let municipalityName = inferredMunicipalityName

    if (targetMunicipalityId) {
      const municipality = await tx.municipality.findUnique({ where: { id: targetMunicipalityId } })
      if (!municipality) {
        throw new Error('Kommun med angivet ID finns inte')
      }
      municipalityName = municipality.name
    } else {
      if (!municipalityName) {
        throw new Error('Kommun måste anges eller kunna utläsas ur filen')
      }

      const existing = await tx.municipality.findFirst({ where: { name: municipalityName } })
      if (existing) {
        targetMunicipalityId = existing.id
      } else {
        const created = await tx.municipality.create({
          data: {
            name: municipalityName,
          },
        })
        targetMunicipalityId = created.id
      }
    }

    if (!targetMunicipalityId || !municipalityName) {
      throw new Error('Kunde inte fastställa kommun att importera till')
    }

    const resolvedMunicipalityName = municipalityName as string

    const importBatch = await tx.importBatch.create({
      data: {
        municipalityId: targetMunicipalityId,
        fileName: files.map((file) => file.name).join(', '),
        fileCount: files.length,
        status: 'processing',
        importMode: mode,
        importedBy: actorId,
        importedByName: actorName,
      },
    })

    if (mode === 'replace') {
      await tx.association.deleteMany({ where: { municipalityId: targetMunicipalityId } })
    }

    const processedDetailUrls = new Set<string>()
    const processedNames = new Set<string>()
    const seenDetailUrls = new Set<string>()

    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let deletedCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const file of files) {
      for (const record of file.records) {
        try {
          const associationDetailUrl = normaliseDetailUrl(record)
          if (associationDetailUrl) {
            if (seenDetailUrls.has(associationDetailUrl)) {
              throw new Error(`Duplicerat detailUrl i importen: ${associationDetailUrl}`)
            }
            seenDetailUrls.add(associationDetailUrl)
          }

          const scrapeRunId = record.scrape_run_id ?? null
          let resolvedScrapeRunId: string | null = null
          if (scrapeRunId) {
            const scrapeRun = await tx.scrapeRun.findUnique({
              where: { id: scrapeRunId },
              select: { id: true },
            })
            resolvedScrapeRunId = scrapeRun?.id ?? null
          }

          const associationBase = {
            sourceSystem: record.source_system,
            municipality: resolvedMunicipalityName,
            municipalityId: targetMunicipalityId,
            importBatchId: importBatch.id,
            scrapeRunId: resolvedScrapeRunId,
            scrapedAt: record.scraped_at ? new Date(record.scraped_at) : new Date(),
            detailUrl: associationDetailUrl,
            name: record.association.name,
            orgNumber: record.association.org_number ?? null,
            types: (record.association.types ?? []) as Prisma.JsonValue,
            activities: (record.association.activities ?? []) as Prisma.JsonValue,
            categories: (record.association.categories ?? []) as Prisma.JsonValue,
            homepageUrl: record.association.homepage_url ?? null,
            email: record.association.email ?? null,
            phone: record.association.phone ?? null,
            streetAddress: record.association.street_address ?? null,
            postalCode: record.association.postal_code ?? null,
            city: record.association.city ?? null,
            description: record.association.description
              ? (record.association.description as Prisma.JsonValue)
              : null,
            descriptionFreeText: record.association.description?.free_text ?? null,
            listPageIndex: record.source_navigation?.list_page_index ?? null,
            positionOnPage: record.source_navigation?.position_on_page ?? null,
            paginationModel: record.source_navigation?.pagination_model ?? null,
            filterState: record.source_navigation?.filter_state
              ? (record.source_navigation.filter_state as Prisma.JsonValue)
              : null,
            extras: record.extras ? (record.extras as Prisma.JsonValue) : null,
          }

          const nameKey = `${targetMunicipalityId}:${associationBase.name}`

          let existingAssociation = null
          if (associationDetailUrl) {
            existingAssociation = await tx.association.findUnique({
              where: { detailUrl: associationDetailUrl },
            })
          }
          if (!existingAssociation) {
            existingAssociation = await tx.association.findFirst({
              where: {
                municipalityId: targetMunicipalityId,
                name: associationBase.name,
              },
            })
          }

          if (existingAssociation) {
            if (mode === 'update') {
              await tx.association.update({
                where: { id: existingAssociation.id },
                data: {
                  ...associationBase,
                  isDeleted: false,
                  deletedAt: null,
                },
              })

              if (record.contacts?.length) {
                await tx.contact.deleteMany({ where: { associationId: existingAssociation.id } })
                await tx.contact.createMany({
                  data: record.contacts.map((contact) => ({
                    associationId: existingAssociation!.id,
                    name: contact.contact_person_name,
                    role: contact.contact_person_role ?? null,
                    email: contact.contact_person_email ?? null,
                    phone: contact.contact_person_phone ?? null,
                  })),
                })
              }

              if (record.association.description?.sections?.length) {
                await tx.descriptionSection.deleteMany({ where: { associationId: existingAssociation.id } })
                await tx.descriptionSection.createMany({
                  data: record.association.description.sections.map((section, index) => ({
                    associationId: existingAssociation!.id,
                    title: section.title,
                    data: section.data as Prisma.JsonValue,
                    orderIndex: index,
                  })),
                })
              }

              updatedCount++
            } else if (mode === 'replace') {
              // replace mode removes everything upfront, so this should not happen
              skippedCount++
            } else {
              skippedCount++
            }
          } else {
            const createdAssociation = await tx.association.create({
              data: associationBase,
            })

            if (record.contacts?.length) {
              await tx.contact.createMany({
                data: record.contacts.map((contact) => ({
                  associationId: createdAssociation.id,
                  name: contact.contact_person_name,
                  role: contact.contact_person_role ?? null,
                  email: contact.contact_person_email ?? null,
                  phone: contact.contact_person_phone ?? null,
                })),
              })
            }

            if (record.association.description?.sections?.length) {
              await tx.descriptionSection.createMany({
                data: record.association.description.sections.map((section, index) => ({
                  associationId: createdAssociation.id,
                  title: section.title,
                  data: section.data as Prisma.JsonValue,
                  orderIndex: index,
                })),
              })
            }

            importedCount++
          }

          if (associationBase.detailUrl) {
            processedDetailUrls.add(associationBase.detailUrl)
          }
          processedNames.add(nameKey)
        } catch (error) {
          errorCount++
          const description = error instanceof Error ? error.message : 'Okänt fel'
          errors.push(description)
        }
      }
    }

    if (mode === 'update' && process.env.ASSOCIATION_REMOVE_ON_UPDATE === '1') {
      const existingAssociations = await tx.association.findMany({
        where: {
          municipalityId: targetMunicipalityId,
          isDeleted: false,
        },
        select: {
          id: true,
          detailUrl: true,
          name: true,
        },
      })

      const associationsToDelete = existingAssociations.filter((existing) => {
        if (existing.detailUrl && processedDetailUrls.has(existing.detailUrl)) {
          return false
        }
        const key = `${targetMunicipalityId}:${existing.name}`
        return !processedNames.has(key)
      })

      if (associationsToDelete.length > 0) {
        await tx.association.updateMany({
          where: { id: { in: associationsToDelete.map((item) => item.id) } },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        })
        deletedCount = associationsToDelete.length
      }
    }

    await tx.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: errorCount > 0 && importedCount === 0 ? 'failed' : 'completed',
        totalRecords,
        importedCount,
        updatedCount,
        skippedCount,
        errorCount,
        deletedCount,
        errors: errors.length > 0 ? (errors as unknown as Prisma.JsonArray) : null,
        completedAt: new Date(),
      },
    })

    return {
      municipalityId: targetMunicipalityId,
      municipalityName: resolvedMunicipalityName,
      importBatchId: importBatch.id,
      totalRecords,
      importedCount,
      updatedCount,
      skippedCount,
      deletedCount,
      errorCount,
      errors,
    }
  })
}
