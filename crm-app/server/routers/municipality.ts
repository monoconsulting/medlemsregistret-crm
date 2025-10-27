
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const municipalityRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(10).max(300).default(290),
        sortBy: z.enum(['name', 'code', 'county', 'region', 'province', 'population', 'platform', 'associations']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const municipalities = await ctx.db.municipality.findMany({
        where: input?.search
          ? { name: { contains: input.search } }
          : undefined,
        take: input?.limit ?? 290,
        orderBy: input?.sortBy
          ? input.sortBy === 'associations'
            ? { associations: { _count: input.sortOrder ?? 'asc' } }
            : { [input.sortBy]: input.sortOrder ?? 'asc' }
          : { name: 'asc' },
        include: {
          _count: {
            select: { associations: true },
          },
        },
      });
      return municipalities;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const municipality = await ctx.db.municipality.findUnique({
        where: { id: input.id },
      });

      if (!municipality) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kommun hittades inte' });
      }

      return municipality;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          population: z.number().optional(),
          registerUrl: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const municipality = await ctx.db.municipality.update({
        where: { id: input.id },
        data: input.data,
      });

      return municipality;
    }),
});
