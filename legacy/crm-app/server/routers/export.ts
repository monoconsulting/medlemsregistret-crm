import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const exportFormats = z.enum(['csv', 'json', 'xlsx'])

type ExportFormat = z.infer<typeof exportFormats>

type ExportPayload = {
  filename: string
  mimeType: string
  data: string // base64 encoded payload
}

const toCsv = (rows: Record<string, any>[]): string => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const headerRow = headers.join(';')
  const valueRows = rows.map((row) =>
    headers
      .map((key) => {
        const value = row[key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(';')
  )
  return [headerRow, ...valueRows].join('\n')
}

const encode = (content: string): string => Buffer.from(content).toString('base64')

const formatPayload = (format: ExportFormat, baseName: string, content: string): ExportPayload => {
  switch (format) {
    case 'json':
      return {
        filename: `${baseName}.json`,
        mimeType: 'application/json',
        data: encode(content),
      }
    case 'xlsx':
      // Placeholder: deliver CSV but label as Excel compatible
      return {
        filename: `${baseName}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        data: encode(content),
      }
    case 'csv':
    default:
      return {
        filename: `${baseName}.csv`,
        mimeType: 'text/csv',
        data: encode(content),
      }
  }
}

export const exportRouter = router({
  associations: protectedProcedure
    .input(
      z.object({
        format: exportFormats.default('csv'),
        search: z.string().optional(),
        municipality: z.string().optional(),
        municipalityId: z.string().optional(),
        municipalityIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where: any = {}

      if (input.search) {
        where.OR = [
          { name: { contains: input.search } },
          { municipality: { contains: input.search } },
        ]
      }

      if (input.municipality) {
        where.municipality = input.municipality
      }

      if (input.municipalityIds?.length) {
        where.municipalityId = { in: input.municipalityIds }
      } else if (input.municipalityId) {
        where.municipalityId = input.municipalityId
      }

      const associations = await ctx.db.association.findMany({
        where,
        include: {
          tags: true,
          contacts: true,
        },
        orderBy: { name: 'asc' },
        take: 1000,
      })

      if (input.format === 'json') {
        return formatPayload(input.format, 'associations-export', JSON.stringify(associations, null, 2))
      }

      const rows = associations.map((assoc) => ({
        Namn: assoc.name,
        Kommun: assoc.municipality,
        Status: assoc.crmStatus,
        Pipeline: assoc.pipeline,
        Medlem: assoc.isMember ? 'Ja' : 'Nej',
        Taggar: assoc.tags.map((tag) => tag.name).join(', '),
        PrimärKontakt: assoc.contacts.find((c) => c.isPrimary)?.email ?? '',
      }))

      const csv = toCsv(rows)
      return formatPayload(input.format, 'associations-export', csv)
    }),

  contacts: protectedProcedure
    .input(
      z.object({
        format: exportFormats.default('csv'),
        associationId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where = input.associationId ? { associationId: input.associationId } : undefined
      const contacts = await ctx.db.contact.findMany({
        where,
        include: {
          association: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 2000,
      })

      if (input.format === 'json') {
        return formatPayload(input.format, 'contacts-export', JSON.stringify(contacts, null, 2))
      }

      const rows = contacts.map((contact) => ({
        Namn: contact.name,
        Roll: contact.role ?? '',
        Epost: contact.email ?? '',
        Telefon: contact.phone ?? '',
        Mobil: contact.mobile ?? '',
        Förening: contact.association?.name ?? '',
      }))

      const csv = toCsv(rows)
      return formatPayload(input.format, 'contacts-export', csv)
    }),
})
