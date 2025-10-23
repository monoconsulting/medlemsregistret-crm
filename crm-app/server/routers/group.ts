import { z } from 'zod'
import { adminProcedure, protectedProcedure, router } from '../trpc'

const baseGroupInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  searchQuery: z.any().optional(),
  autoUpdate: z.boolean().optional(),
})

export const groupRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
        .default({ page: 1, limit: 20 })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit
      const where = input.search
        ? {
            name: {
              contains: input.search,
              mode: 'insensitive',
            },
          }
        : {}

      const [groups, total] = await Promise.all([
        ctx.db.group.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        }),
        ctx.db.group.count({ where }),
      ])

      return {
        groups,
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
    .query(async ({ ctx, input }) =>
      ctx.db.group.findUnique({
        where: { id: input.id },
        include: {
          memberships: {
            include: {
              association: {
                include: {
                  tags: true,
                  _count: {
                    select: {
                      contacts: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    ),
  create: adminProcedure
    .input(baseGroupInput)
    .mutation(async ({ ctx, input }) =>
      ctx.db.group.create({
        data: {
          name: input.name,
          description: input.description,
          searchQuery: input.searchQuery,
          autoUpdate: input.autoUpdate ?? false,
          createdBy: ctx.session.user.id,
        },
      })
    ),
  update: adminProcedure
    .input(
      baseGroupInput.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.group.update({
        where: { id },
        data: {
          ...data,
          autoUpdate: data.autoUpdate ?? false,
        },
      })
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.group.delete({ where: { id: input.id } })
      return { success: true }
    }),
  addMembership: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        associationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.groupMembership.upsert({
        where: {
          groupId_associationId: {
            groupId: input.groupId,
            associationId: input.associationId,
          },
        },
        create: {
          groupId: input.groupId,
          associationId: input.associationId,
        },
        update: {},
      })

      return ctx.db.group.findUnique({
        where: { id: input.groupId },
        include: {
          memberships: {
            include: {
              association: true,
            },
          },
        },
      })
    }),
  removeMembership: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        associationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
})
