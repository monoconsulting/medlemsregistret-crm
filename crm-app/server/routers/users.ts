import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { createUserSchema, updateUserSchema, deleteUserSchema, listUsersSchema } from '../../lib/validators/user'
import * as bcrypt from 'bcryptjs'

export const userRouter = router({
  list: protectedProcedure
    .input(listUsersSchema)
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1
      const limit = input.limit ?? 25
      const skip = (page - 1) * limit

      const where: any = {
        isDeleted: false,
      }

      if (input.role) {
        where.role = input.role
      }

      if (input.search) {
        const term = input.search.trim()
        where.OR = [
          { name: { contains: term } },
          { email: { contains: term } },
        ]
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                associations: true,
                createdGroups: true,
                createdTasks: true,
                assignedTasks: true,
                notes: true,
                activities: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        ctx.db.user.count({ where }),
      ])

      return {
        users,
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
      const user = await ctx.db.user.findUnique({
        where: { id: input.id, isDeleted: false },
        include: {
          _count: {
            select: {
              associations: true,
              createdGroups: true,
              createdTasks: true,
              assignedTasks: true,
              notes: true,
              activities: true,
            },
          },
        },
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Användare hittades inte' })
      }

      return user
    }),

  create: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser && !existingUser.isDeleted) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'En användare med denna e-postadress finns redan',
        })
      }

      let passwordHash: string | undefined

      if (input.password) {
        passwordHash = await bcrypt.hash(input.password, 10)
      }

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          passwordHash,
        },
      })

      await ctx.db.activity.create({
        data: {
          type: 'CREATED',
          description: `Användare "${user.name}" skapad`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? 'Okänd användare',
        },
      })

      return user
    }),

  update: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { id: input.id, isDeleted: false },
      })

      if (!existingUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Användare hittades inte',
        })
      }

      if (input.email && input.email !== existingUser.email) {
        const emailExists = await ctx.db.user.findUnique({
          where: { email: input.email },
        })

        if (emailExists && emailExists.id !== input.id && !emailExists.isDeleted) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'En annan användare med denna e-postadress finns redan',
          })
        }
      }

      const updateData: any = {}

      if (input.name !== undefined) updateData.name = input.name
      if (input.email !== undefined) updateData.email = input.email
      if (input.role !== undefined) updateData.role = input.role

      if (input.password) {
        updateData.passwordHash = await bcrypt.hash(input.password, 10)
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.id },
        data: updateData,
      })

      await ctx.db.activity.create({
        data: {
          type: 'UPDATED',
          description: `Användare "${updatedUser.name}" uppdaterad`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? 'Okänd användare',
        },
      })

      return updatedUser
    }),

  delete: adminProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id, isDeleted: false },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Användare hittades inte',
        })
      }

      if (user.id === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Du kan inte ta bort dig själv',
        })
      }

      const deletedUser = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      })

      await ctx.db.activity.create({
        data: {
          type: 'UPDATED',
          description: `Användare "${deletedUser.name}" borttagen (soft delete)`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name ?? 'Okänd användare',
        },
      })

      return deletedUser
    }),
})
