import { z } from 'zod'
import { TRPCError } from '@trpc/server'
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
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1
      const limit = input?.limit ?? 20
      const skip = (page - 1) * limit

      const where: any = {}

      if (input?.associationId) {
        where.associationId = input.associationId
      }

      if (input?.onlyPrimary) {
        where.isPrimary = true
      }

      if (input?.search) {
        const term = input.search.trim()
        where.OR = [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
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
          orderBy: {
            updatedAt: 'desc',
          },
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
    const contact = await ctx.db.contact.create({
      data: {
        ...input,
      },
    })

    await ctx.db.activity.create({
      data: {
        associationId: input.associationId,
        type: 'CALL_MADE',
        description: `${ctx.session?.user.name ?? 'En användare'} lade till en ny kontakt: ${input.name}`,
        userId: ctx.session!.user.id,
        userName: ctx.session?.user.name ?? 'Okänd användare',
      },
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

      const contact = await ctx.db.contact.update({
        where: { id },
        data,
      })

      await ctx.db.activity.create({
        data: {
          associationId: contact.associationId,
          type: 'UPDATED',
          description: `${ctx.session?.user.name ?? 'En användare'} uppdaterade kontaktuppgifter för ${contact.name}`,
          userId: ctx.session!.user.id,
          userName: ctx.session?.user.name ?? 'Okänd användare',
        },
      })

      return contact
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.db.contact.delete({ where: { id: input.id } })

      await ctx.db.activity.create({
        data: {
          associationId: contact.associationId,
          type: 'UPDATED',
          description: `${ctx.session?.user.name ?? 'En administratör'} tog bort kontakten ${contact.name}`,
          userId: ctx.session!.user.id,
          userName: ctx.session?.user.name ?? 'Okänd administratör',
        },
      })

      return contact
    }),
})
