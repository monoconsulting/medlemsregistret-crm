import { z } from 'zod'

import { router, protectedProcedure } from '../trpc'

const baseTaskSchema = z.object({
  title: z.string().min(1, 'Titel krävs'),
  description: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  associationId: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
})

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.array(z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED'])).optional(),
          assignedToId: z.string().optional(),
          associationId: z.string().optional(),
          dueBefore: z.date().optional(),
          dueAfter: z.date().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input?.status?.length) {
        where.status = { in: input.status }
      }

      if (input?.assignedToId) {
        where.assignedToId = input.assignedToId
      }

      if (input?.associationId) {
        where.associationId = input.associationId
      }

      if (input?.dueBefore || input?.dueAfter) {
        where.dueDate = {}
        if (input.dueBefore) {
          where.dueDate.lte = input.dueBefore
        }
        if (input.dueAfter) {
          where.dueDate.gte = input.dueAfter
        }
      }

      if (input?.search) {
        where.title = { contains: input.search, mode: 'insensitive' }
      }

      const tasks = await ctx.db.task.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        take: input?.limit ?? 20,
        include: {
          association: {
            select: { id: true, name: true, municipality: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      return tasks
    }),

  create: protectedProcedure.input(baseTaskSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.task.create({
      data: {
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ?? null,
        priority: input.priority,
        associationId: input.associationId ?? null,
        assignedToId: input.assignedToId ?? null,
        createdById: ctx.session!.user.id,
      },
    })
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED']),
        completedAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, completedAt } = input
      return ctx.db.task.update({
        where: { id },
        data: {
          status,
          completedAt: completedAt ?? (status === 'COMPLETED' ? new Date() : null),
        },
      })
    }),

  update: protectedProcedure
    .input(
      baseTaskSchema.extend({
        id: z.string(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.task.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate ?? null,
          associationId: data.associationId ?? null,
          assignedToId: data.assignedToId ?? null,
        },
      })
    }),

  remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.task.delete({ where: { id: input.id } })
    return { success: true }
  }),
})
