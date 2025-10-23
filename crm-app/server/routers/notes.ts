import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'

const noteSchema = z.object({
  associationId: z.string(),
  content: z.string().min(1, 'Anteckningen kan inte vara tom'),
  tags: z.array(z.string()).default([]),
})

export const noteRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        associationId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const notes = await ctx.db.note.findMany({
        where: { associationId: input.associationId },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        take: input.limit + 1,
        orderBy: { createdAt: 'desc' },
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })

      let nextCursor: string | undefined = undefined
      if (notes.length > input.limit) {
        const nextItem = notes.pop()
        nextCursor = nextItem?.id
      }

      return {
        notes,
        nextCursor,
      }
    }),

  create: protectedProcedure.input(noteSchema).mutation(async ({ ctx, input }) => {
    const authorName = ctx.session?.user.name ?? 'Okänd användare'
    const note = await ctx.db.note.create({
      data: {
        associationId: input.associationId,
        content: input.content,
        tags: input.tags,
        authorId: ctx.session!.user.id,
        authorName,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    await ctx.db.activity.create({
      data: {
        associationId: input.associationId,
        type: 'NOTE_ADDED',
        description: `${authorName} skapade en ny anteckning`,
        userId: ctx.session!.user.id,
        userName: authorName,
      },
    })

    return note
  }),

  update: protectedProcedure
    .input(
      noteSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.note.findUnique({ where: { id: input.id } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Anteckning saknas' })
      }

      const isOwner = existing.authorId === ctx.session!.user.id
      const isAdmin = ctx.session!.user.role === 'ADMIN'
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Du kan bara uppdatera dina egna anteckningar' })
      }

      const note = await ctx.db.note.update({
        where: { id: input.id },
        data: {
          content: input.content,
          tags: input.tags,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      await ctx.db.activity.create({
        data: {
          associationId: note.associationId,
          type: 'NOTE_UPDATED',
          description: `${ctx.session?.user.name ?? 'En användare'} uppdaterade en anteckning`,
          userId: ctx.session!.user.id,
          userName: ctx.session?.user.name ?? 'Okänd användare',
        },
      })

      return note
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.note.findUnique({ where: { id: input.id } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Anteckning saknas' })
      }

      const isOwner = existing.authorId === ctx.session!.user.id
      const isAdmin = ctx.session!.user.role === 'ADMIN'
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Du kan inte ta bort den här anteckningen' })
      }

      const note = await ctx.db.note.delete({ where: { id: input.id } })

      await ctx.db.activity.create({
        data: {
          associationId: note.associationId,
          type: 'NOTE_DELETED',
          description: `${ctx.session?.user.name ?? 'En användare'} tog bort en anteckning`,
          userId: ctx.session!.user.id,
          userName: ctx.session?.user.name ?? 'Okänd användare',
        },
      })

      return note
    }),
})
