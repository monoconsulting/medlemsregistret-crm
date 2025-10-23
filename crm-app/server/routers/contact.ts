import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const contactInput = z.object({
  associationId: z.string(),
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  isPrimary: z.boolean().optional(),
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
        })
        .default({ page: 1, limit: 20 })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.associationId) {
        where.associationId = input.associationId
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
          { phone: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const skip = (input.page - 1) * input.limit

      const [contacts, total] = await Promise.all([
        ctx.db.contact.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { updatedAt: 'desc' },
        }),
        ctx.db.contact.count({ where }),
      ])

      return {
        contacts,
        pagination: {
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        },
      }
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => ctx.db.contact.findUnique({ where: { id: input.id } })),
  create: protectedProcedure
    .input(contactInput)
    .mutation(async ({ ctx, input }) => {
      if (input.isPrimary) {
        await ctx.db.contact.updateMany({
          where: { associationId: input.associationId, isPrimary: true },
          data: { isPrimary: false },
        })
      }

      return ctx.db.contact.create({
        data: {
          associationId: input.associationId,
          name: input.name,
          role: input.role,
          email: input.email || undefined,
          phone: input.phone,
          mobile: input.mobile,
          linkedinUrl: input.linkedinUrl,
          facebookUrl: input.facebookUrl,
          twitterUrl: input.twitterUrl,
          instagramUrl: input.instagramUrl,
          isPrimary: input.isPrimary ?? false,
        },
      })
    }),
  update: protectedProcedure
    .input(
      contactInput.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, associationId, isPrimary, ...data } = input

      if (isPrimary) {
        await ctx.db.contact.updateMany({
          where: { associationId, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        })
      }

      return ctx.db.contact.update({
        where: { id },
        data: {
          ...data,
          associationId,
          isPrimary: isPrimary ?? false,
          email: data.email || undefined,
        },
      })
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contact.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
