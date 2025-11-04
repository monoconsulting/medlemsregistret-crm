import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { Prisma } from '@prisma/client'
import { router, protectedProcedure, adminProcedure } from '../trpc'

const baseContactSchema = z.object({
  associationId: z.string(),
  name: z.string().min(1, 'Namn är obligatoriskt'),
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')).optional(),
  facebookUrl: z.string().url().optional().or(z.literal('')).optional(),
  twitterUrl: z.string().url().optional().or(z.literal('')).optional(),
  instagramUrl: z.string().url().optional().or(z.literal('')).optional(),
  isPrimary: z.boolean().default(false),
})

export const contactRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          associationId: z.string().optional(),
          search: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          onlyPrimary: z.boolean().optional(),
          sortBy: z.enum(['updatedAt', 'name']).optional(),
          sortDirection: z.enum(['asc', 'desc']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      const skip = (page - 1) * limit
      const sortBy = input?.sortBy ?? 'updatedAt'
      const sortDirection = input?.sortDirection ?? 'desc'

      const where: any = {}
      const orderBy: Prisma.ContactOrderByWithRelationInput = {
        [sortBy]: sortDirection,
      }

      if (input?.associationId) {
        where.associationId = input.associationId
      }

      if (input?.onlyPrimary) {
        where.isPrimary = true
      }

      if (input?.search) {
        const term = input.search.trim()
        where.OR = [
          { name: { contains: term } },
          { email: { contains: term } },
          { phone: { contains: term } },
        ]
      }

      const [contacts, total] = await Promise.all([
        ctx.db.contact.findMany({
          where,
          skip,
          take: limit,
          include: {
            association: {
              select: {
                id: true,
                name: true,
                municipality: true,
              },
            },
          },
          orderBy,
        }),
        ctx.db.contact.count({ where }),
      ])

      return {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.id },
        include: { association: true },
      })

      if (!contact) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kontakt hittades inte' })
      }

      return contact
    }),

  create: protectedProcedure.input(baseContactSchema).mutation(async ({ ctx, input }) => {
    const contact = await ctx.db.$transaction(async (tx) => {
      const existingPrimary = await tx.contact.findFirst({
        where: { associationId: input.associationId, isPrimary: true },
        select: { id: true },
      })

      const shouldBePrimary = input.isPrimary || !existingPrimary

      if (shouldBePrimary) {
        await tx.contact.updateMany({
          where: { associationId: input.associationId },
          data: { isPrimary: false },
        })
      }

      const created = await tx.contact.create({
        data: {
          ...input,
          isPrimary: shouldBePrimary,
        },
      })

      await tx.activity.create({
        data: {
          associationId: input.associationId,
          type: 'CONTACT_ADDED',
          description: `${ctx.session?.user.name ?? 'En användare'} lade till en ny kontakt: ${input.name}`,
          userId: ctx.session!.user.id,
          userName: ctx.session?.user.name ?? 'Okänd användare',
        },
      })

      return created
    })

    return contact
  }),

  update: protectedProcedure
    .input(
      baseContactSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const existing = await ctx.db.contact.findUnique({ where: { id } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kontakt saknas' })
      }

      const contact = await ctx.db.$transaction(async (tx) => {
        const shouldBePrimary = data.isPrimary ?? existing.isPrimary
        const targetAssociationId = data.associationId ?? existing.associationId

        if (shouldBePrimary) {
          await tx.contact.updateMany({
            where: {
              associationId: targetAssociationId,
              NOT: { id },
            },
            data: { isPrimary: false },
          })
        }

        const updated = await tx.contact.update({
          where: { id },
          data: {
            ...data,
            isPrimary: shouldBePrimary,
          },
        })

        if (!shouldBePrimary && existing.isPrimary) {
          const replacement = await tx.contact.findFirst({
            where: {
              associationId: targetAssociationId,
              NOT: { id },
            },
            orderBy: { createdAt: 'asc' },
          })

          if (replacement) {
            await tx.contact.update({
              where: { id: replacement.id },
              data: { isPrimary: true },
            })
          }
        }

        await tx.activity.create({
          data: {
            associationId: updated.associationId,
            type: 'UPDATED',
            description: `${ctx.session?.user.name ?? 'En användare'} uppdaterade kontaktuppgifter för ${updated.name}`,
            userId: ctx.session!.user.id,
            userName: ctx.session?.user.name ?? 'Okänd användare',
          },
        })

        return updated
      })

      return contact
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.$transaction(async (tx) => {
        const deleted = await tx.contact.delete({ where: { id: input.id } })

        await tx.activity.create({
          data: {
            associationId: deleted.associationId,
            type: 'UPDATED',
            description: `Kontakt borttagen: ${deleted.name}`,
            userId: ctx.session!.user.id,
            userName: ctx.session?.user.name ?? 'Okänd administratör',
          },
        })

        const newPrimary = await tx.contact.findFirst({
          where: { associationId: deleted.associationId },
          orderBy: { createdAt: 'asc' },
        })

        if (newPrimary) {
          await tx.contact.update({
            where: { id: newPrimary.id },
            data: { isPrimary: true },
          })
        }

        return deleted
      })

      return contact
    }),
})
