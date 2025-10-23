import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const associationRouter = router({
  // Get all associations with pagination and filtering
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        municipality: z.string().optional(),
        crmStatus: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, municipality, crmStatus } = input
      const skip = (page - 1) * limit

      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { city: { contains: search } },
        ]
      }

      if (municipality) {
        where.municipality = municipality
      }

      if (crmStatus) {
        where.crmStatus = crmStatus
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
          },
          orderBy: { updatedAt: 'desc' },
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
  getById: protectedProcedure
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
  getStats: protectedProcedure.query(async ({ ctx }) => {
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
          assignedTo: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.db.association.update({
        where: { id: input.id },
        data: input.data,
      })

      // Create activity log
      await ctx.db.activity.create({
        data: {
          associationId: input.id,
          type: 'STATUS_CHANGED',
          description: `Status updated to ${input.data.crmStatus || input.data.pipeline}`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || ctx.session.user.email || 'Okänd användare',
        },
      })

      return association
    }),
})
