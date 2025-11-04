import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import iconv from 'iconv-lite'

import { router, protectedProcedure } from '../trpc'

const groupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  searchQuery: z.any().optional(),
  autoUpdate: z.boolean().default(false),
})

const escapeCsvValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)
  if (stringValue === '') {
    return ''
  }

  const needsQuoting = /[;"\n\r]/.test(stringValue)
  const cleaned = stringValue.replace(/"/g, '""')
  return needsQuoting ? `"${cleaned}"` : cleaned
}

const slugify = (value: string): string => {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export const groupRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { isDeleted: false }

      if (input?.search?.trim()) {
        where.name = { contains: input.search.trim() }
      }

      return ctx.db.group.findMany({
        where,
        include: {
          _count: {
            select: { memberships: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findFirst({
        where: { id: input.id, isDeleted: false },
        include: {
          memberships: {
            include: {
              association: {
                select: {
                  id: true,
                  name: true,
                  municipality: true,
                  crmStatus: true,
                },
              },
            },
          },
          _count: {
            select: { memberships: true },
          },
          createdBy: true,
        },
      })

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas eller är raderad' })
      }

      return group
    }),

  create: protectedProcedure.input(groupSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.group.create({
      data: {
        ...input,
        createdById: ctx.session!.user.id,
      },
    })
  }),

  update: protectedProcedure
    .input(
      groupSchema.extend({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const group = await ctx.db.group.findUnique({ where: { id } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.isDeleted) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Gruppen är raderad' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan uppdatera gruppen' })
      }

      return ctx.db.group.update({
        where: { id },
        data,
      })
    }),

  softDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({ where: { id: input.id } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan radera gruppen' })
      }

      if (group.isDeleted) {
        return { success: true }
      }

      await ctx.db.group.update({
        where: { id: group.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      })

      return { success: true }
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        associationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({ where: { id: input.groupId } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.isDeleted) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Gruppen är raderad' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan uppdatera gruppen' })
      }

      return ctx.db.groupMembership.upsert({
        where: {
          groupId_associationId: {
            groupId: input.groupId,
            associationId: input.associationId,
          },
        },
        update: {},
        create: {
          groupId: input.groupId,
          associationId: input.associationId,
        },
      })
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        associationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({ where: { id: input.groupId } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.isDeleted) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Gruppen är raderad' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan uppdatera gruppen' })
      }

      await ctx.db.groupMembership.delete({
        where: {
          groupId_associationId: {
            groupId: input.groupId,
            associationId: input.associationId,
          },
        },
      })

      return { success: true }
    }),

  exportMembers: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findFirst({
        where: { id: input.groupId, isDeleted: false },
        include: {
          memberships: {
            include: {
              association: {
                include: {
                  contacts: {
                    orderBy: [
                      { isPrimary: 'desc' },
                      { createdAt: 'asc' },
                    ],
                    take: 3,
                  },
                },
              },
            },
          },
        },
      })

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas eller är raderad' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan exportera gruppen' })
      }

      const headers = [
        'Gruppnamn',
        'Kommun',
        'Ort',
        'Föreningsnamn',
        'Länk till föreningens hemsida',
        'Namn kontaktperson 1',
        'Epost kontaktperson 1',
        'Telefon kontaktperson 1',
        'Adress kontaktperson 1',
        'Namn kontaktperson 2',
        'Epost kontaktperson 2',
        'Namn kontaktperson 3',
        'Epost kontaktperson 3',
      ]

      const rows = group.memberships
        .map((membership) => {
          const association = membership.association
          if (!association) {
            return null
          }

          const contacts = association.contacts ?? []
          const contact1 = contacts[0]
          const contact2 = contacts[1]
          const contact3 = contacts[2]
          const contact1Phone =
            contact1?.phone ?? contact1?.mobile ?? association.phone ?? ''
          const contact1Address = [
            association.streetAddress ?? '',
            [association.postalCode, association.city].filter(Boolean).join(' ').trim(),
          ]
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
            .join(', ')

          return [
            group.name ?? '',
            association.municipality ?? '',
            association.city ?? '',
            association.name ?? '',
            association.homepageUrl ?? '',
            contact1?.name ?? '',
            contact1?.email ?? '',
            contact1Phone,
            contact1Address,
            contact2?.name ?? '',
            contact2?.email ?? '',
            contact3?.name ?? '',
            contact3?.email ?? '',
          ]
        })
        .filter((row): row is string[] => row !== null)

      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvValue).join(';'))
        .join('\r\n')

      const encoded = iconv.encode(csvContent, 'win1252')
      const safeName = slugify(group.name ?? 'grupp') || 'grupp'

      return {
        filename: `${safeName}-medlemmar.csv`,
        mimeType: 'text/csv',
        data: encoded.toString('base64'),
      }
    }),
})
