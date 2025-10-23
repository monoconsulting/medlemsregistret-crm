import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export const associationRouter = router({
  // Get all associations with pagination and filtering
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        municipality: z.string().optional(),
        crmStatuses: z.array(z.string()).optional(),
        pipelines: z.array(z.string()).optional(),
        types: z.array(z.string()).optional(),
        activities: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        hasEmail: z.boolean().optional(),
        hasPhone: z.boolean().optional(),
        isMember: z.boolean().optional(),
        assignedToId: z.string().optional(),
        dateRange: z
          .object({
            from: z.date(),
            to: z.date().optional(),
          })
          .optional(),
        lastActivityDays: z.number().min(1).max(365).optional(),
        sortBy: z
          .enum([
            'updatedAt',
            'name',
            'createdAt',
            'recentActivity',
          ])
          .default('updatedAt'),
        sortDirection: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        search,
        municipality,
        crmStatuses,
        pipelines,
        types,
        activities,
        tags,
        hasEmail,
        hasPhone,
        isMember,
        assignedToId,
        dateRange,
        lastActivityDays,
        sortBy,
        sortDirection,
      } = input
      const skip = (page - 1) * limit

      const where: any = {}
      const and: any[] = []

      if (search) {
        const normalized = search.trim()
        where.OR = [
          { name: { contains: normalized, mode: 'insensitive' } },
          { city: { contains: normalized, mode: 'insensitive' } },
          { municipality: { contains: normalized, mode: 'insensitive' } },
        ]
      }

      if (municipality) {
        where.municipality = municipality
      }

      if (crmStatuses?.length) {
        and.push({ crmStatus: { in: crmStatuses } })
      }

      if (pipelines?.length) {
        and.push({ pipeline: { in: pipelines } })
      }

      if (typeof hasEmail === 'boolean') {
        and.push(hasEmail ? { email: { not: null } } : { email: null })
      }

      if (typeof hasPhone === 'boolean') {
        and.push(
          hasPhone
            ? {
                OR: [
                  { phone: { not: null } },
                  { phone: { gt: '' } },
                  {
                    contacts: {
                      some: {
                        OR: [{ phone: { not: null } }, { mobile: { not: null } }],
                      },
                    },
                  },
                ],
              }
            : {
                phone: null,
              }
        )
      }

      if (typeof isMember === 'boolean') {
        and.push({ isMember })
      }

      if (assignedToId) {
        and.push({ assignedToId })
      }

      if (types?.length) {
        and.push({
          types: {
            hasSome: types,
          },
        })
      }

      if (activities?.length) {
        and.push({
          activities: {
            hasSome: activities,
          },
        })
      }

      if (tags?.length) {
        and.push({
          tags: {
            some: {
              id: { in: tags },
            },
          },
        })
      }

      if (dateRange?.from) {
        and.push({
          createdAt: {
            gte: startOfDay(dateRange.from),
            lte: endOfDay(dateRange.to ?? dateRange.from),
          },
        })
      }

      if (lastActivityDays) {
        const since = subDays(new Date(), lastActivityDays)
        and.push({
          activityLog: {
            some: {
              createdAt: {
                gte: since,
              },
            },
          },
        })
      }

      if (and.length) {
        where.AND = and
      }

      const [associations, total] = await Promise.all([
        ctx.db.association.findMany({
          where,
          skip,
          take: limit,
          include: {
            contacts: {
              where: { isPrimary: true },
              take: 1,
            },
            tags: true,
            _count: {
              select: { contacts: true, notes: true },
            },
            assignedTo: true,
            activityLog: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
          orderBy:
            sortBy === 'recentActivity'
              ? {
                  activityLog: {
                    _max: {
                      createdAt: sortDirection,
                    },
                  },
                }
              : { [sortBy]: sortDirection },
        }),
        ctx.db.association.count({ where }),
      ])

      return {
        associations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  // Get single association by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const association = await ctx.db.association.findUnique({
        where: { id: input.id },
        include: {
          contacts: true,
          notes: {
            orderBy: { createdAt: 'desc' },
          },
          tags: true,
          groupMemberships: {
            include: {
              group: true,
            },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      })

      return association
    }),

  // Get dashboard stats
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [
      total,
      members,
      contacted,
      interested,
      municipalities,
    ] = await Promise.all([
      ctx.db.association.count(),
      ctx.db.association.count({ where: { isMember: true } }),
      ctx.db.association.count({ where: { crmStatus: 'CONTACTED' } }),
      ctx.db.association.count({ where: { crmStatus: 'INTERESTED' } }),
      ctx.db.association.groupBy({
        by: ['municipality'],
        _count: true,
        orderBy: {
          _count: {
            municipality: 'desc',
          },
        },
        take: 5,
      }),
    ])

    const conversionRate = total > 0 ? ((members / total) * 100).toFixed(1) : '0.0'

    return {
      total,
      members,
      contacted,
      interested,
      conversionRate,
      topMunicipalities: municipalities.map((m: { municipality: string; _count: number }) => ({
        name: m.municipality,
        count: m._count,
      })),
    }
  }),

  // Update association
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          crmStatus: z.enum(['UNCONTACTED', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER', 'LOST', 'INACTIVE']).optional(),
          pipeline: z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL_SENT', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
          isMember: z.boolean().optional(),
          memberSince: z.date().optional(),
          assignedToId: z.string().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.db.association.update({
        where: { id: input.id },
        data: {
          ...input.data,
        },
        })

      // Create activity log
      await ctx.db.activity.create({
        data: {
          associationId: input.id,
          type: 'STATUS_CHANGED',
          description: `Status uppdaterad av ${ctx.session?.user?.name ?? 'okänd användare'}`,
          userId: ctx.session!.user.id,
          userName: ctx.session?.user?.name ?? 'Okänd användare',
        },
      })

      return association
    }),
})
