import { subDays } from 'date-fns'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const activityRouter = router({
  recent: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
          sinceDays: z.number().min(1).max(90).default(14),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10
      const since = subDays(new Date(), input?.sinceDays ?? 14)

      const activities = await ctx.db.activity.findMany({
        where: { createdAt: { gte: since } },
        include: {
          association: { select: { id: true, name: true, municipality: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      return activities
    }),

  timeline: protectedProcedure
    .input(
      z.object({
        associationId: z.string(),
        limit: z.number().min(5).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.activity.findMany({
        where: { associationId: input.associationId },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      })
    }),
})
