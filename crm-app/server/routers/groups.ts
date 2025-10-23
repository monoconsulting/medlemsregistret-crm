import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, adminProcedure } from '../trpc'

const groupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  searchQuery: z.any().optional(),
  autoUpdate: z.boolean().default(false),
})

export const groupRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input?.search) {
        where.name = { contains: input.search, mode: 'insensitive' }
      }

      return ctx.db.group.findMany({
        where,
        include: {
          _count: {
            select: { memberships: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.id },
        include: {
          memberships: {
            include: {
              association: {
                select: {
                  id: true,
                  name: true,
                  municipality: true,
                  crmStatus: true,
                },
              },
            },
          },
          createdBy: true,
        },
      })

      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      return group
    }),

  create: protectedProcedure.input(groupSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.group.create({
      data: {
        ...input,
        createdById: ctx.session!.user.id,
      },
    })
  }),

  update: protectedProcedure
    .input(
      groupSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const group = await ctx.db.group.findUnique({ where: { id } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan uppdatera gruppen' })
      }

      return ctx.db.group.update({
        where: { id },
        data,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.group.delete({ where: { id: input.id } })
      return { success: true }
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        associationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({ where: { id: input.groupId } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan uppdatera gruppen' })
      }

      return ctx.db.groupMembership.upsert({
        where: {
          groupId_associationId: {
            groupId: input.groupId,
            associationId: input.associationId,
          },
        },
        update: {},
        create: {
          groupId: input.groupId,
          associationId: input.associationId,
        },
      })
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        associationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({ where: { id: input.groupId } })
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grupp saknas' })
      }

      if (group.createdById !== ctx.session!.user.id && ctx.session!.user.role !== 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast ägare eller admin kan uppdatera gruppen' })
      }

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
