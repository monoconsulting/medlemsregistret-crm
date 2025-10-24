import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { getSearchClient } from '@/lib/search'

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
        useSearchIndex: z.boolean().optional(),
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
        useSearchIndex,
      } = input
      const skip = (page - 1) * limit

      const where: any = {}
      const and: any[] = []

      if (useSearchIndex) {
        const searchClient = getSearchClient()
        if (searchClient && (search?.length || tags?.length || types?.length)) {
          const searchResult = await searchClient.search({
            query: search,
            filters: {
              municipality,
              crmStatuses,
              pipelines,
              types,
              activities,
              tags,
              isMember,
            },
            page,
            limit,
          })

          if (searchResult?.ids?.length) {
            and.push({ id: { in: searchResult.ids } })
          } else {
            return {
              associations: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
            }
          }
        }
      }

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
          activityLog: {
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
        by: ['municipalityId'],
        _count: true,
        orderBy: {
          _count: {
            municipalityId: 'desc',
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
      topMunicipalities: municipalities.map((m: { municipalityId: string; _count: number }) => ({
        name: m.municipalityId,
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

  getMemberGrowth: protectedProcedure
    .input(
      z
        .object({
          months: z.number().min(3).max(24).default(12),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const months = input?.months ?? 12
      const now = new Date()
      const labels: string[] = []
      const series: number[] = []

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))
        const count = await ctx.db.association.count({
          where: {
            isMember: true,
            memberSince: {
              lte: monthEnd,
            },
          },
        })
        labels.push(format(monthStart, 'MMM', { locale: sv }))
        series.push(count)
      }

      return { labels, series }
    }),

  getMunicipalityStats: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(10).max(300).default(290),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const municipalities = await ctx.db.association.groupBy({
        by: ['municipality'],
        _count: true,
        where: input?.search
          ? {
              municipality: { contains: input.search, mode: 'insensitive' },
            }
          : undefined,
        orderBy: {
          _count: {
            municipality: 'desc',
          },
        },
        take: input?.limit ?? 290,
      })

      return municipalities.map((m) => ({
        name: m.municipality,
        count: m._count,
      }))
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
