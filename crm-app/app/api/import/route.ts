import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ScrapedAssociation {
  source_system: string
  municipality: string
  scrape_run_id?: string
  scraped_at?: string
  association: {
    name: string
    org_number?: string | null
    types?: string[]
    activities?: string[]
    categories?: string[]
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
      free_text?: string
    }
  }
  contacts?: Array<{
    contact_person_name: string
    contact_person_role?: string | null
    contact_person_email?: string | null
    contact_person_phone?: string | null
  }>
  detail_url?: string
  source_navigation?: {
    list_page_index?: number
    position_on_page?: number
    pagination_model?: string
    filter_state?: Record<string, unknown> | null
  }
  extras?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const municipalityId = formData.get('municipalityId') as string | null
    const mode = formData.get('mode') as 'new' | 'update' | 'replace'

    if (!files.length) {
      return NextResponse.json(
        { error: 'Ingen fil vald' },
        { status: 400 }
      )
    }

    // If municipalityId is not provided, try to extract it from the first record in the first file
    let targetMunicipalityId = municipalityId
    let municipality = null

    if (!targetMunicipalityId) {
      // Read first file to get municipality name
      const firstFile = files[0]
      const content = await firstFile.text()
      let firstRecord: ScrapedAssociation | null = null

      if (firstFile.name.endsWith('.jsonl')) {
        const lines = content.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          firstRecord = JSON.parse(lines[0])
        }
      } else {
        const parsed = JSON.parse(content)
        const records = Array.isArray(parsed) ? parsed : [parsed]
        if (records.length > 0) {
          firstRecord = records[0]
        }
      }

      if (firstRecord && firstRecord.municipality) {
        // Find municipality by name
        municipality = await prisma.municipality.findFirst({
          where: { name: firstRecord.municipality }
        })

        if (municipality) {
          targetMunicipalityId = municipality.id
        } else {
          return NextResponse.json(
            { error: `Kommun "${firstRecord.municipality}" hittades inte i databasen` },
            { status: 404 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Kommun krävs - antingen via formuläret eller i JSON-filen' },
          { status: 400 }
        )
      }
    } else {
      // Verify municipality exists
      municipality = await prisma.municipality.findUnique({
        where: { id: targetMunicipalityId }
      })

      if (!municipality) {
        return NextResponse.json(
          { error: 'Kommun hittades inte' },
          { status: 404 }
        )
      }
    }

    // If replace mode, delete existing associations for this municipality
    if (mode === 'replace') {
      await prisma.association.deleteMany({
        where: { municipalityId: targetMunicipalityId }
      })
    }

    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        municipalityId: targetMunicipalityId,
        fileName: files.map(f => f.name).join(', '),
        fileCount: files.length,
        status: 'processing',
        importMode: mode,
        importedBy: 'system', // TODO: Get from auth
        importedByName: 'System',
      }
    })

    let totalRecords = 0
    let importedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let deletedCount = 0
    const errors: string[] = []

    // Track processed associations by their identifiers
    const processedDetailUrls = new Set<string>()
    const processedNames = new Set<string>()
    
    // Cache for scrapeRunId lookup
    const scrapeRunCache = new Map<string, string | null>()

    // Process each file
    for (const file of files) {
      try {
        const content = await file.text()
        let records: ScrapedAssociation[] = []

        // Handle both JSON array and JSONL formats
        if (file.name.endsWith('.jsonl')) {
          records = content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
        } else {
          const parsed = JSON.parse(content)
          records = Array.isArray(parsed) ? parsed : [parsed]
        }

        totalRecords += records.length

        // Process each association
        for (const record of records) {
          try {
            // Handle scrapeRunId - check if it exists in DB, otherwise set to null
            let resolvedScrapeRunId: string | null = null
            if (record.scrape_run_id) {
              if (scrapeRunCache.has(record.scrape_run_id)) {
                resolvedScrapeRunId = scrapeRunCache.get(record.scrape_run_id)!
              } else {
                const scrapeRun = await prisma.scrapeRun.findUnique({
                  where: { id: record.scrape_run_id },
                  select: { id: true }
                })
                resolvedScrapeRunId = scrapeRun?.id || null
                scrapeRunCache.set(record.scrape_run_id, resolvedScrapeRunId)
              }
            }

            const associationData = {
              sourceSystem: record.source_system,
              municipalityId: targetMunicipalityId,
              importBatchId: importBatch.id,
              scrapeRunId: resolvedScrapeRunId,
              scrapedAt: record.scraped_at ? new Date(record.scraped_at) : new Date(),
              detailUrl: record.association.detail_url || record.detail_url || null,
              name: record.association.name,
              orgNumber: record.association.org_number || null,
              types: record.association.types || [],
              activities: record.association.activities || [],
              categories: record.association.categories || [],
              homepageUrl: record.association.homepage_url || null,
              email: record.association.email || null,
              phone: record.association.phone || null,
              streetAddress: record.association.street_address || null,
              postalCode: record.association.postal_code || null,
              city: record.association.city || null,
              description: record.association.description || null,
              descriptionFreeText: record.association.description?.free_text || null,
              listPageIndex: record.source_navigation?.list_page_index || null,
              positionOnPage: record.source_navigation?.position_on_page || null,
              paginationModel: record.source_navigation?.pagination_model || null,
              filterState: record.source_navigation?.filter_state || null,
              extras: record.extras || null,
            }

            // Check if association already exists (by detailUrl or name+municipality)
            let existingAssociation = null
            if (associationData.detailUrl) {
              existingAssociation = await prisma.association.findUnique({
                where: { detailUrl: associationData.detailUrl }
              })
            }

            if (!existingAssociation) {
              existingAssociation = await prisma.association.findFirst({
                where: {
                  municipalityId: targetMunicipalityId,
                  name: associationData.name
                }
              })
            }

            if (existingAssociation) {
              if (mode === 'update') {
                // Update existing association and restore if soft-deleted
                const { description, descriptionFreeText, extras, filterState, ...restData } = associationData
                await prisma.association.update({
                  where: { id: existingAssociation.id },
                  data: {
                    ...restData,
                    ...(description !== null ? { description: description as any } : {}),
                    ...(descriptionFreeText !== null ? { descriptionFreeText } : {}),
                    ...(extras !== null ? { extras: extras as any } : {}),
                    ...(filterState !== null ? { filterState: filterState as any } : {}),
                    importBatchId: importBatch.id,
                    isDeleted: false,
                    deletedAt: null,
                  }
                })

                // Update contacts
                if (record.contacts && record.contacts.length > 0) {
                  // Delete old contacts
                  await prisma.contact.deleteMany({
                    where: { associationId: existingAssociation.id }
                  })

                  // Create new contacts
                  await prisma.contact.createMany({
                    data: record.contacts.map(contact => ({
                      associationId: existingAssociation!.id,
                      name: contact.contact_person_name,
                      role: contact.contact_person_role || null,
                      email: contact.contact_person_email || null,
                      phone: contact.contact_person_phone || null,
                    }))
                  })
                }

                // Update description sections
                if (record.association.description?.sections) {
                  // Delete old sections
                  await prisma.descriptionSection.deleteMany({
                    where: { associationId: existingAssociation.id }
                  })

                  // Create new sections
                  await prisma.descriptionSection.createMany({
                    data: record.association.description.sections.map((section, index) => ({
                      associationId: existingAssociation!.id,
                      title: section.title,
                      data: section.data as any,
                      orderIndex: index,
                    }))
                  })
                }

                updatedCount++
              } else {
                skippedCount++
              }
            } else {
              // Create new association
              const { description: desc, descriptionFreeText: descFreeText, extras: ext, filterState: fs, ...createData } = associationData
              const newAssociation = await prisma.association.create({
                data: {
                  ...createData,
                  ...(desc !== null ? { description: desc as any } : {}),
                  ...(descFreeText !== null ? { descriptionFreeText: descFreeText } : {}),
                  ...(ext !== null ? { extras: ext as any } : {}),
                  ...(fs !== null ? { filterState: fs as any } : {}),
                }
              })

              // Create contacts
              if (record.contacts && record.contacts.length > 0) {
                await prisma.contact.createMany({
                  data: record.contacts.map(contact => ({
                    associationId: newAssociation.id,
                    name: contact.contact_person_name,
                    role: contact.contact_person_role || null,
                    email: contact.contact_person_email || null,
                    phone: contact.contact_person_phone || null,
                  }))
                })
              }

              // Create description sections
              if (record.association.description?.sections) {
                await prisma.descriptionSection.createMany({
                  data: record.association.description.sections.map((section, index) => ({
                    associationId: newAssociation.id,
                    title: section.title,
                    data: section.data as any,
                    orderIndex: index,
                  }))
                })
              }

              importedCount++
            }

            // Track processed association
            if (associationData.detailUrl) {
              processedDetailUrls.add(associationData.detailUrl)
            }
            processedNames.add(`${targetMunicipalityId}:${associationData.name}`)
          } catch (err) {
            errorCount++
            const errorMsg = `Fel vid import av ${record.association?.name || 'okänd'}: ${err instanceof Error ? err.message : 'Okänt fel'}`
            errors.push(errorMsg)
            console.error(errorMsg)
          }
        }
      } catch (err) {
        errorCount++
        const errorMsg = `Fel vid läsning av fil ${file.name}: ${err instanceof Error ? err.message : 'Okänt fel'}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Handle soft delete for missing associations if configured
    if (mode === 'update' && process.env.ASSOCIATION_REMOVE_ON_UPDATE === '1') {
      try {
        // Get all existing associations for this municipality that are not deleted
        const existingAssociations = await prisma.association.findMany({
          where: {
            municipalityId: targetMunicipalityId,
            isDeleted: false,
          },
          select: {
            id: true,
            detailUrl: true,
            name: true,
          }
        })

        // Find associations that weren't in the import
        const associationsToDelete = existingAssociations.filter(existing => {
          if (existing.detailUrl && processedDetailUrls.has(existing.detailUrl)) {
            return false
          }
          const nameKey = `${targetMunicipalityId}:${existing.name}`
          if (processedNames.has(nameKey)) {
            return false
          }
          return true
        })

        if (associationsToDelete.length > 0) {
          // Soft delete missing associations
          await prisma.association.updateMany({
            where: {
              id: { in: associationsToDelete.map(a => a.id) }
            },
            data: {
              isDeleted: true,
              deletedAt: new Date(),
            }
          })

          deletedCount = associationsToDelete.length
        }
      } catch (err) {
        errors.push(`Fel vid soft-delete: ${err instanceof Error ? err.message : 'Okänt fel'}`)
        console.error('Soft delete error:', err)
      }
    }

    // Update import batch with final stats
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: errorCount > 0 && importedCount === 0 ? 'failed' : 'completed',
        totalRecords,
        importedCount,
        updatedCount,
        skippedCount,
        errorCount,
        ...(errors.length > 0 ? { errors: errors as any } : {}),
        completedAt: new Date(),
      }
    })

    return NextResponse.json({
      totalRecords,
      importedCount,
      updatedCount,
      skippedCount,
      errorCount,
      deletedCount,
      errors,
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ett oväntat fel uppstod' },
      { status: 500 }
    )
  }
}
