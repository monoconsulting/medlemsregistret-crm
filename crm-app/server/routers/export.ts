import { router, adminProcedure } from '../trpc'
import { z } from 'zod'

const formatSchema = z.enum(['json', 'csv', 'excel'])

const associationExportFilters = z.object({
  ids: z.array(z.string()).optional(),
  municipality: z.string().optional(),
  crmStatus: z.string().optional(),
})

function toCsv<T extends Record<string, unknown>>(rows: T[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const lines = [headers.join(',')]

  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(','))
  }

  return lines.join('\n')
}

function toExcelXml<T extends Record<string, unknown>>(rows: T[]) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const headerRow = headers
    .map((header) => `<Cell><Data ss:Type="String">${header}</Data></Cell>`)
    .join('')

  const dataRows = rows
    .map((row) => {
      const cells = headers
        .map((header) => {
          const value = row[header]
          const stringValue = value === null || value === undefined ? '' : String(value)
          return `<Cell><Data ss:Type="String">${stringValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`
        })
        .join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Associations">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`
}

export const exportRouter = router({
  associations: adminProcedure
    .input(
      z.object({
        format: formatSchema.default('json'),
        filters: associationExportFilters.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where: any = {}
      if (input.filters?.ids?.length) {
        where.id = { in: input.filters.ids }
      }

      if (input.filters?.municipality) {
        where.municipality = input.filters.municipality
      }

      if (input.filters?.crmStatus) {
        where.crmStatus = input.filters.crmStatus
      }

      const associations = await ctx.db.association.findMany({
        where,
        include: {
          tags: true,
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              contacts: true,
              notes: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const rows = associations.map((association) => ({
        id: association.id,
        name: association.name,
        municipality: association.municipality,
        crmStatus: association.crmStatus,
        pipeline: association.pipeline,
        isMember: association.isMember,
        memberSince: association.memberSince?.toISOString() ?? '',
        tags: association.tags.map((tag) => tag.name).join(', '),
        primaryContact: association.contacts[0]?.name ?? '',
        primaryContactEmail: association.contacts[0]?.email ?? '',
        contactsCount: association._count.contacts,
        notesCount: association._count.notes,
        updatedAt: association.updatedAt.toISOString(),
      }))

      const baseFilename = `associations-${new Date().toISOString()}`

      if (input.format === 'json') {
        return {
          filename: `${baseFilename}.json`,
          contentType: 'application/json',
          data: JSON.stringify(rows, null, 2),
          count: rows.length,
        }
      }

      if (input.format === 'csv') {
        return {
          filename: `${baseFilename}.csv`,
          contentType: 'text/csv',
          data: toCsv(rows),
          count: rows.length,
        }
      }

      return {
        filename: `${baseFilename}.xml`,
        contentType: 'application/vnd.ms-excel',
        data: toExcelXml(rows),
        count: rows.length,
      }
    }),
  contacts: adminProcedure
    .input(
      z.object({
        format: formatSchema.default('csv'),
        associationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where = input.associationId ? { associationId: input.associationId } : {}
      const contacts = await ctx.db.contact.findMany({
        where,
        include: {
          association: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const rows = contacts.map((contact) => ({
        id: contact.id,
        associationId: contact.associationId,
        associationName: contact.association.name,
        name: contact.name,
        role: contact.role ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        mobile: contact.mobile ?? '',
        isPrimary: contact.isPrimary,
        updatedAt: contact.updatedAt.toISOString(),
      }))

      const filenameBase = `contacts-${new Date().toISOString()}`

      if (input.format === 'json') {
        return {
          filename: `${filenameBase}.json`,
          contentType: 'application/json',
          data: JSON.stringify(rows, null, 2),
          count: rows.length,
        }
      }

      if (input.format === 'excel') {
        return {
          filename: `${filenameBase}.xml`,
          contentType: 'application/vnd.ms-excel',
          data: toExcelXml(rows),
          count: rows.length,
        }
      }

      return {
        filename: `${filenameBase}.csv`,
        contentType: 'text/csv',
        data: toCsv(rows),
        count: rows.length,
      }
    }),
})
