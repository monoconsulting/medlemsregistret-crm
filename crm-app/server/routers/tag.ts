import { z } from 'zod'
import { adminProcedure, protectedProcedure, router } from '../trpc'

const tagBaseInput = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
})

export const tagRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.tag.findMany({
      orderBy: { name: 'asc' },
    })
  ),
  create: adminProcedure
    .input(tagBaseInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tag.create({
        data: {
          name: input.name,
          color: input.color ?? '#3b82f6',
        },
      })
    }),
  update: adminProcedure
    .input(
      tagBaseInput.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.tag.update({
        where: { id },
        data: {
          ...data,
          color: data.color ?? '#3b82f6',
        },
      })
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tag.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
