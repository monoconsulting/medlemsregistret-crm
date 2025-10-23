import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, adminProcedure } from '../trpc'

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
})

export const tagRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }),

  create: adminProcedure.input(tagSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.tag.create({ data: input })
  }),

  update: adminProcedure
    .input(
      tagSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const existing = await ctx.db.tag.findUnique({ where: { id } })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tagg saknas' })
      }

      return ctx.db.tag.update({
        where: { id },
        data,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tag.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
