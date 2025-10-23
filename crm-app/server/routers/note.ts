import { TRPCError } from '@trpc/server'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const noteInput = z.object({
  associationId: z.string(),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
})

function canManageNote(userRole: Role, authorId: string, userId: string) {
  if (authorId === userId) return true
  return userRole === Role.ADMIN || userRole === Role.MANAGER
}

export const noteRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          associationId: z.string(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit

      const [notes, total] = await Promise.all([
        ctx.db.note.findMany({
          where: { associationId: input.associationId },
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
        ctx.db.note.count({ where: { associationId: input.associationId } }),
      ])

      return {
        notes,
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
    .query(({ ctx, input }) =>
      ctx.db.note.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })
    ),
  create: protectedProcedure
    .input(noteInput)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session

      const note = await ctx.db.note.create({
        data: {
          associationId: input.associationId,
          content: input.content,
          tags: input.tags,
          authorId: user.id,
          authorName: user.name || user.email || 'Okänd användare',
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      })

      await ctx.db.activity.create({
        data: {
          associationId: input.associationId,
          type: 'NOTE_ADDED',
          description: 'Ny anteckning skapad',
          metadata: {
            preview: input.content.slice(0, 120),
          },
          userId: user.id,
          userName: user.name || user.email || 'Okänd användare',
        },
      })

      return note
    }),
  update: protectedProcedure
    .input(
      noteInput.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.note.findUnique({
        where: { id: input.id },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      if (!canManageNote(ctx.session.user.role, existing.authorId, ctx.session.user.id)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return ctx.db.note.update({
        where: { id: input.id },
        data: {
          content: input.content,
          tags: input.tags,
        },
      })
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.note.findUnique({
        where: { id: input.id },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      if (!canManageNote(ctx.session.user.role, existing.authorId, ctx.session.user.id)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await ctx.db.note.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
