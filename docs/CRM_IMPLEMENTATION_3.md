# Komplett CRM-Design - Del 3: API, Autentisering & Export

## 🔌 API-STRUKTUR MED tRPC

### **1. tRPC Router Setup**

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Middleware för autentisering
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Middleware för admin-rättigheter
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user || ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);
```

```typescript
// server/context.ts
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function createContext({ req, res }: CreateNextContextOptions) {
  const session = await getServerSession(req, res, authOptions);

  return {
    prisma,
    session,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

---

### **2. Association Router**

```typescript
// server/routers/association.ts
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

const associationFilterSchema = z.object({
  search: z.string().optional(),
  municipalities: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  crmStatus: z.enum([
    'UNCONTACTED', 
    'CONTACTED', 
    'INTERESTED', 
    'NEGOTIATION', 
    'MEMBER', 
    'LOST', 
    'INACTIVE'
  ]).optional(),
  pipeline: z.enum([
    'PROSPECT',
    'QUALIFIED',
    'PROPOSAL_SENT',
    'FOLLOW_UP',
    'CLOSED_WON',
    'CLOSED_LOST'
  ]).optional(),
  tags: z.array(z.string()).optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  isMember: z.boolean().optional(),
  assignedTo: z.string().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  sortBy: z.enum([
    'name-asc',
    'name-desc',
    'updated-desc',
    'created-desc',
    'municipality-asc'
  ]).default('name-asc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const associationRouter = router({
  // Lista föreningar med filtrering
  list: protectedProcedure
    .input(associationFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        search,
        municipalities,
        types,
        activities,
        crmStatus,
        pipeline,
        tags,
        hasEmail,
        hasPhone,
        isMember,
        assignedTo,
        dateRange,
        sortBy,
        page,
        limit,
      } = input;

      // Bygg where-clause
      const where: Prisma.AssociationWhereInput = {
        AND: [
          // Textsökning
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { municipality: { contains: search, mode: 'insensitive' } },
              { 
                activities: { 
                  hasSome: [search] 
                } 
              },
              {
                contacts: {
                  some: {
                    OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                    ]
                  }
                }
              }
            ],
          } : {},
          
          // Filter
          municipalities?.length ? { municipality: { in: municipalities } } : {},
          types?.length ? { types: { hasSome: types } } : {},
          activities?.length ? { activities: { hasSome: activities } } : {},
          crmStatus ? { crmStatus } : {},
          pipeline ? { pipeline } : {},
          hasEmail ? { email: { not: null } } : {},
          hasPhone ? { phone: { not: null } } : {},
          isMember !== undefined ? { isMember } : {},
          assignedTo ? { assignedTo } : {},
          
          // Taggar
          tags?.length ? {
            tags: {
              some: {
                id: { in: tags }
              }
            }
          } : {},

          // Datumfilter
          dateRange?.from || dateRange?.to ? {
            updatedAt: {
              ...(dateRange.from && { gte: dateRange.from }),
              ...(dateRange.to && { lte: dateRange.to }),
            }
          } : {},
        ],
      };

      // Sortering
      const orderBy: Prisma.AssociationOrderByWithRelationInput = (() => {
        switch (sortBy) {
          case 'name-asc': return { name: 'asc' };
          case 'name-desc': return { name: 'desc' };
          case 'updated-desc': return { updatedAt: 'desc' };
          case 'created-desc': return { createdAt: 'desc' };
          case 'municipality-asc': return { municipality: 'asc' };
          default: return { name: 'asc' };
        }
      })();

      // Hämta data
      const [associations, total] = await Promise.all([
        ctx.prisma.association.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            contacts: {
              where: { isPrimary: true },
              take: 1,
            },
            tags: true,
            _count: {
              select: {
                notes: true,
                contacts: true,
              }
            }
          },
        }),
        ctx.prisma.association.count({ where }),
      ]);

      return {
        associations,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Hämta en specifik förening
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const association = await ctx.prisma.association.findUnique({
        where: { id: input.id },
        include: {
          contacts: {
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'desc' }
            ]
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          tags: true,
          groupMemberships: {
            include: {
              group: true,
            }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!association) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Förening hittades inte',
        });
      }

      return association;
    }),

  // Skapa ny förening
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      orgNumber: z.string().optional(),
      municipality: z.string(),
      types: z.array(z.string()).min(1),
      activities: z.array(z.string()).min(1),
      categories: z.array(z.string()).optional(),
      homepageUrl: z.string().url().optional().or(z.literal('')),
      streetAddress: z.string().optional(),
      postalCode: z.string().optional(),
      city: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      description: z.any().optional(),
      crmStatus: z.enum(['UNCONTACTED', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER', 'LOST', 'INACTIVE']).default('UNCONTACTED'),
      pipeline: z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL_SENT', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST']).default('PROSPECT'),
      assignedTo: z.string().optional(),
      isMember: z.boolean().default(false),
      memberSince: z.date().optional(),
      extras: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.prisma.association.create({
        data: {
          ...input,
          sourceSystem: 'MANUAL',
          municipality: input.municipality,
          scrapeRunId: 'manual-' + Date.now(),
          scrapedAt: new Date(),
        },
        include: {
          tags: true,
          contacts: true,
        }
      });

      // Logga aktivitet
      await ctx.prisma.activity.create({
        data: {
          type: 'CREATED',
          description: `Förening skapad: ${input.name}`,
          associationId: association.id,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }
      });

      return association;
    }),

  // Uppdatera förening
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        orgNumber: z.string().optional(),
        types: z.array(z.string()).optional(),
        activities: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        homepageUrl: z.string().url().optional().or(z.literal('')),
        streetAddress: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        description: z.any().optional(),
        crmStatus: z.enum(['UNCONTACTED', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER', 'LOST', 'INACTIVE']).optional(),
        pipeline: z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL_SENT', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
        assignedTo: z.string().optional(),
        isMember: z.boolean().optional(),
        memberSince: z.date().optional(),
        extras: z.any().optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const oldData = await ctx.prisma.association.findUnique({
        where: { id: input.id }
      });

      const association = await ctx.prisma.association.update({
        where: { id: input.id },
        data: input.data,
      });

      // Logga ändringar
      const changes: string[] = [];
      if (oldData?.crmStatus !== association.crmStatus) {
        changes.push(`Status ändrad: ${oldData?.crmStatus} → ${association.crmStatus}`);
      }
      if (oldData?.pipeline !== association.pipeline) {
        changes.push(`Pipeline ändrad: ${oldData?.pipeline} → ${association.pipeline}`);
      }

      if (changes.length > 0) {
        await ctx.prisma.activity.create({
          data: {
            type: 'UPDATED',
            description: changes.join(', '),
            associationId: association.id,
            userId: ctx.session.user.id,
            userName: ctx.session.user.name || 'Okänd',
          }
        });
      }

      return association;
    }),

  // Bulk update
  bulkUpdate: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
      data: z.object({
        crmStatus: z.enum(['UNCONTACTED', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER', 'LOST', 'INACTIVE']).optional(),
        pipeline: z.enum(['PROSPECT', 'QUALIFIED', 'PROPOSAL_SENT', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
        assignedTo: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const { ids, data } = input;

      // Uppdatera grunddata
      const updateData: Prisma.AssociationUpdateManyMutationInput = {};
      if (data.crmStatus) updateData.crmStatus = data.crmStatus;
      if (data.pipeline) updateData.pipeline = data.pipeline;
      if (data.assignedTo) updateData.assignedTo = data.assignedTo;

      await ctx.prisma.association.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      });

      // Hantera taggar separat
      if (data.tagIds) {
        await Promise.all(ids.map(id =>
          ctx.prisma.association.update({
            where: { id },
            data: {
              tags: {
                set: data.tagIds!.map(tagId => ({ id: tagId }))
              }
            }
          })
        ));
      }

      // Logga bulk-aktivitet
      await ctx.prisma.activity.createMany({
        data: ids.map(id => ({
          type: 'UPDATED' as const,
          description: `Bulk-uppdatering: ${Object.keys(data).join(', ')}`,
          associationId: id,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }))
      });

      return { updated: ids.length };
    }),

  // Ta bort förening
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.association.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Statistik
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const [
        total,
        members,
        contacted,
        uncontacted,
        byMunicipality,
        byType,
        recentActivities,
      ] = await Promise.all([
        ctx.prisma.association.count(),
        ctx.prisma.association.count({ where: { isMember: true } }),
        ctx.prisma.association.count({ 
          where: { 
            crmStatus: { in: ['CONTACTED', 'INTERESTED', 'NEGOTIATION'] } 
          } 
        }),
        ctx.prisma.association.count({ where: { crmStatus: 'UNCONTACTED' } }),
        ctx.prisma.association.groupBy({
          by: ['municipality'],
          _count: true,
          orderBy: { _count: { municipality: 'desc' } },
          take: 10,
        }),
        ctx.prisma.association.groupBy({
          by: ['types'],
          _count: true,
          take: 10,
        }),
        ctx.prisma.activity.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            association: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }),
      ]);

      return {
        total,
        members,
        memberPercentage: total > 0 ? ((members / total) * 100).toFixed(1) : 0,
        contacted,
        uncontacted,
        byMunicipality,
        byType,
        recentActivities,
      };
    }),
});
```

---

### **3. Contacts Router**

```typescript
// server/routers/contact.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const contactRouter = router({
  // Lista kontakter för en förening
  list: protectedProcedure
    .input(z.object({
      associationId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.contact.findMany({
        where: { associationId: input.associationId },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' }
        ],
      });
    }),

  // Skapa kontakt
  create: protectedProcedure
    .input(z.object({
      associationId: z.string(),
      name: z.string().min(1),
      role: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      linkedinUrl: z.string().url().optional().or(z.literal('')),
      facebookUrl: z.string().url().optional().or(z.literal('')),
      twitterUrl: z.string().url().optional().or(z.literal('')),
      instagramUrl: z.string().url().optional().or(z.literal('')),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Om detta ska vara primär, ta bort primär från andra
      if (input.isPrimary) {
        await ctx.prisma.contact.updateMany({
          where: { 
            associationId: input.associationId,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      const contact = await ctx.prisma.contact.create({
        data: input,
      });

      // Logga aktivitet
      await ctx.prisma.activity.create({
        data: {
          type: 'UPDATED',
          description: `Kontakt tillagd: ${input.name}${input.role ? ` (${input.role})` : ''}`,
          associationId: input.associationId,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }
      });

      return contact;
    }),

  // Uppdatera kontakt
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        linkedinUrl: z.string().url().optional().or(z.literal('')),
        facebookUrl: z.string().url().optional().or(z.literal('')),
        twitterUrl: z.string().url().optional().or(z.literal('')),
        instagramUrl: z.string().url().optional().or(z.literal('')),
        isPrimary: z.boolean().optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findUnique({
        where: { id: input.id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Kontakt hittades inte',
        });
      }

      // Om detta ska bli primär, ta bort primär från andra
      if (input.data.isPrimary) {
        await ctx.prisma.contact.updateMany({
          where: { 
            associationId: contact.associationId,
            isPrimary: true,
            id: { not: input.id }
          },
          data: { isPrimary: false },
        });
      }

      return ctx.prisma.contact.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // Ta bort kontakt
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findUnique({
        where: { id: input.id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Kontakt hittades inte',
        });
      }

      await ctx.prisma.contact.delete({
        where: { id: input.id },
      });

      // Logga aktivitet
      await ctx.prisma.activity.create({
        data: {
          type: 'UPDATED',
          description: `Kontakt borttagen: ${contact.name}`,
          associationId: contact.associationId,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }
      });

      return { success: true };
    }),
});
```

---

### **4. Notes Router**

```typescript
// server/routers/note.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const noteRouter = router({
  // Lista anteckningar
  list: protectedProcedure
    .input(z.object({
      associationId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.note.findMany({
        where: { associationId: input.associationId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  // Skapa anteckning
  create: protectedProcedure
    .input(z.object({
      associationId: z.string(),
      content: z.string().min(1),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.create({
        data: {
          ...input,
          authorId: ctx.session.user.id,
          authorName: ctx.session.user.name || 'Okänd',
        },
      });

      // Logga aktivitet
      await ctx.prisma.activity.create({
        data: {
          type: 'NOTE_ADDED',
          description: `Anteckning tillagd`,
          associationId: input.associationId,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
          metadata: { noteId: note.id },
        }
      });

      return note;
    }),

  // Uppdatera anteckning
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      content: z.string().min(1),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findUnique({
        where: { id: input.id },
      });

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Anteckning hittades inte',
        });
      }

      // Kontrollera att användaren äger anteckningen
      if (note.authorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Du kan bara redigera dina egna anteckningar',
        });
      }

      return ctx.prisma.note.update({
        where: { id: input.id },
        data: {
          content: input.content,
          ...(input.tags && { tags: input.tags }),
        },
      });
    }),

  // Ta bort anteckning
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.prisma.note.findUnique({
        where: { id: input.id },
      });

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Anteckning hittades inte',
        });
      }

      // Kontrollera att användaren äger anteckningen
      if (note.authorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Du kan bara ta bort dina egna anteckningar',
        });
      }

      await ctx.prisma.note.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
```

---

### **5. Main App Router**

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { associationRouter } from './association';
import { contactRouter } from './contact';
import { noteRouter } from './note';
import { tagRouter } from './tag';
import { groupRouter } from './group';
import { scrapeRouter } from './scrape';
import { statsRouter } from './stats';
import { aiRouter } from './ai';
import { exportRouter } from './export';

export const appRouter = router({
  association: associationRouter,
  contact: contactRouter,
  note: noteRouter,
  tag: tagRouter,
  group: groupRouter,
  scrape: scrapeRouter,
  stats: statsRouter,
  ai: aiRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
```

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

---

## 🔐 AUTENTISERING MED NEXTAUTH

### **6. NextAuth Configuration**

```typescript
// lib/auth.ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dagar
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-post', type: 'email' },
        password: { label: 'Lösenord', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Ogiltig inloggning');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error('Ingen användare hittades');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error('Felaktigt lösenord');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Uppdatera token om session uppdateras
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Logga första inloggningen
        await prisma.activity.create({
          data: {
            type: 'CREATED',
            description: `Ny användare registrerad: ${user.email}`,
            userId: user.id,
            userName: user.name || 'Okänd',
          }
        });
      }
    },
  },
};
```

---

### **7. User Schema (Prisma)**

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // För credentials provider
  role          Role      @default(USER)
  
  // NextAuth
  accounts      Account[]
  sessions      Session[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
}

enum Role {
  USER        // Grundläggande användare
  SALES       // Säljare
  MANAGER     // Manager
  ADMIN       // Administratör
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

### **8. Sign In Page**

```typescript
// app/auth/signin/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';
import Image from 'next/image';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError('Felaktig e-post eller lösenord');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setFormError('Ett fel uppstod. Försök igen.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Medlemsregistret"
              width={200}
              height={60}
            />
          </div>
          <CardTitle className="text-2xl text-center">
            Logga in på Medlemsregistret
          </CardTitle>
          <CardDescription className="text-center">
            Välj din inloggningsmetod
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || formError) && (
            <Alert variant="destructive">
              <AlertDescription>
                {error === 'OAuthAccountNotLinked'
                  ? 'Ett konto med denna e-post finns redan. Logga in med rätt metod.'
                  : formError || 'Ett fel uppstod vid inloggning'}
              </AlertDescription>
            </Alert>
          )}

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Fortsätt med Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Eller
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="namn@foretag.se"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Lösenord</Label>
                
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Glömt lösenord?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loggar in...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Logga in med e-post
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Har du inget konto?{' '}
            <a href="/auth/signup" className="text-blue-600 hover:underline">
              Registrera dig här
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### **9. Protected Route Middleware**

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-endast routes
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Manager+ routes
    if (path.startsWith('/stats') && 
        !['ADMIN', 'MANAGER'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/associations/:path*',
    '/contacts/:path*',
    '/groups/:path*',
    '/stats/:path*',
    '/admin/:path*',
  ],
};
```

---

### **10. Role-Based Access Control Component**

```typescript
// components/auth/RoleGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Laddar...</div>;
  }

  if (!session?.user) {
    return fallback;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return fallback;
  }

  return <>{children}</>;
}

// Användning:
// <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
//   <AdminPanel />
// </RoleGuard>
```

---

## 📤 EXPORT-FUNKTIONALITET

### **11. Export Router**

```typescript
// server/routers/export.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import ExcelJS from 'exceljs';
import { Parser } from '@json2csv/plainjs';

export const exportRouter = router({
  // Exportera föreningar till Excel
  toExcel: protectedProcedure
    .input(z.object({
      associationIds: z.array(z.string()).optional(),
      filters: z.any().optional(),
      includeContacts: z.boolean().default(true),
      includeNotes: z.boolean().default(false),
      includeActivities: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Hämta föreningar
      const where = input.associationIds
        ? { id: { in: input.associationIds } }
        : input.filters || {};

      const associations = await ctx.prisma.association.findMany({
        where,
        include: {
          contacts: input.includeContacts,
          notes: input.includeNotes ? { take: 50 } : false,
          activities: input.includeActivities ? { take: 100 } : false,
          tags: true,
        },
      });

      // Skapa Excel-fil
      const workbook = new ExcelJS.Workbook();
      
      // Sheet 1: Föreningar
      const associationsSheet = workbook.addWorksheet('Föreningar');
      associationsSheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Namn', key: 'name', width: 40 },
        { header: 'Org.nr', key: 'orgNumber', width: 15 },
        { header: 'Kommun', key: 'municipality', width: 20 },
        { header: 'Typ', key: 'types', width: 25 },
        { header: 'Aktiviteter', key: 'activities', width: 30 },
        { header: 'E-post', key: 'email', width: 30 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'Adress', key: 'streetAddress', width: 35 },
        { header: 'Postnummer', key: 'postalCode', width: 12 },
        { header: 'Ort', key: 'city', width: 20 },
        { header: 'Hemsida', key: 'homepageUrl', width: 40 },
        { header: 'CRM-Status', key: 'crmStatus', width: 15 },
        { header: 'Pipeline', key: 'pipeline', width: 15 },
        { header: 'Medlem', key: 'isMember', width: 10 },
        { header: 'Medlem sedan', key: 'memberSince', width: 15 },
        { header: 'Taggar', key: 'tags', width: 30 },
        { header: 'Skapad', key: 'createdAt', width: 20 },
        { header: 'Uppdaterad', key: 'updatedAt', width: 20 },
      ];

      // Lägg till data
      associations.forEach(assoc => {
        associationsSheet.addRow({
          id: assoc.id,
          name: assoc.name,
          orgNumber: assoc.orgNumber,
          municipality: assoc.municipality,
          types: assoc.types.join(', '),
          activities: assoc.activities.join(', '),
          email: assoc.email,
          phone: assoc.phone,
          streetAddress: assoc.streetAddress,
          postalCode: assoc.postalCode,
          city: assoc.city,
          homepageUrl: assoc.homepageUrl,
          crmStatus: assoc.crmStatus,
          pipeline: assoc.pipeline,
          isMember: assoc.isMember ? 'Ja' : 'Nej',
          memberSince: assoc.memberSince?.toLocaleDateString('sv-SE'),
          tags: assoc.tags.map(t => t.name).join(', '),
          createdAt: assoc.createdAt.toLocaleDateString('sv-SE'),
          updatedAt: assoc.updatedAt.toLocaleDateString('sv-SE'),
        });
      });

      // Formatera header
      associationsSheet.getRow(1).font = { bold: true };
      associationsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };
      associationsSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Sheet 2: Kontakter (om inkluderade)
      if (input.includeContacts) {
        const contactsSheet = workbook.addWorksheet('Kontakter');
        contactsSheet.columns = [
          { header: 'Förenings-ID', key: 'associationId', width: 30 },
          { header: 'Förening', key: 'associationName', width: 40 },
          { header: 'Namn', key: 'name', width: 30 },
          { header: 'Roll', key: 'role', width: 20 },
          { header: 'E-post', key: 'email', width: 30 },
          { header: 'Telefon', key: 'phone', width: 15 },
          { header: 'Mobil', key: 'mobile', width: 15 },
          { header: 'LinkedIn', key: 'linkedinUrl', width: 40 },
          { header: 'Primär', key: 'isPrimary', width: 10 },
        ];

        associations.forEach(assoc => {
          if ('contacts' in assoc) {
            assoc.contacts.forEach(contact => {
              contactsSheet.addRow({
                associationId: assoc.id,
                associationName: assoc.name,
                name: contact.name,
                role: contact.role,
                email: contact.email,
                phone: contact.phone,
                mobile: contact.mobile,
                linkedinUrl: contact.linkedinUrl,
                isPrimary: contact.isPrimary ? 'Ja' : 'Nej',
              });
            });
          }
        });

        // Formatera header
        contactsSheet.getRow(1).font = { bold: true };
        contactsSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' },
        };
        contactsSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }

      // Sheet 3: Anteckningar (om inkluderade)
      if (input.includeNotes) {
        const notesSheet = workbook.addWorksheet('Anteckningar');
        notesSheet.columns = [
          { header: 'Förenings-ID', key: 'associationId', width: 30 },
          { header: 'Förening', key: 'associationName', width: 40 },
          { header: 'Författare', key: 'authorName', width: 25 },
          { header: 'Innehåll', key: 'content', width: 60 },
          { header: 'Taggar', key: 'tags', width: 30 },
          { header: 'Skapad', key: 'createdAt', width: 20 },
        ];

        associations.forEach(assoc => {
          if ('notes' in assoc) {
            assoc.notes.forEach(note => {
              notesSheet.addRow({
                associationId: assoc.id,
                associationName: assoc.name,
                authorName: note.authorName,
                content: note.content,
                tags: note.tags.join(', '),
                createdAt: note.createdAt.toLocaleString('sv-SE'),
              });
            });
          }
        });

        notesSheet.getRow(1).font = { bold: true };
        notesSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEAB308' },
        };
        notesSheet.getRow(1).font = { color: { argb: 'FF000000' }, bold: true };
      }

      // Generera buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = buffer.toString('base64');

      // Logga export
      await ctx.prisma.activity.create({
        data: {
          type: 'UPDATED',
          description: `Export av ${associations.length} föreningar till Excel`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }
      });

      return {
        data: base64,
        filename: `foreningar_export_${new Date().toISOString().split('T')[0]}.xlsx`,
        count: associations.length,
      };
    }),

  // Exportera till CSV
  toCSV: protectedProcedure
    .input(z.object({
      associationIds: z.array(z.string()).optional(),
      filters: z.any().optional(),
      fields: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const where = input.associationIds
        ? { id: { in: input.associationIds } }
        : input.filters || {};

      const associations = await ctx.prisma.association.findMany({
        where,
        include: {
          tags: true,
          contacts: { where: { isPrimary: true }, take: 1 },
        },
      });

      // Platta ut data för CSV
      const flatData = associations.map(assoc => ({
        id: assoc.id,
        name: assoc.name,
        orgNumber: assoc.orgNumber || '',
        municipality: assoc.municipality,
        types: assoc.types.join('; '),
        activities: assoc.activities.join('; '),
        email: assoc.email || '',
        phone: assoc.phone || '',
        streetAddress: assoc.streetAddress || '',
        postalCode: assoc.postalCode || '',
        city: assoc.city || '',
        homepageUrl: assoc.homepageUrl || '',
        crmStatus: assoc.crmStatus,
        pipeline: assoc.pipeline,
        isMember: assoc.isMember ? 'Ja' : 'Nej',
        memberSince: assoc.memberSince?.toLocaleDateString('sv-SE') || '',
        tags: assoc.tags.map(t => t.name).join('; '),
        primaryContact: assoc.contacts[0]?.name || '',
        primaryContactEmail: assoc.contacts[0]?.email || '',
        primaryContactPhone: assoc.contacts[0]?.phone || '',
        createdAt: assoc.createdAt.toLocaleDateString('sv-SE'),
        updatedAt: assoc.updatedAt.toLocaleDateString('sv-SE'),
      }));

      // Generera CSV
      const parser = new Parser({
        delimiter: ';',
        withBOM: true, // För korrekt svenska tecken i Excel
      });
      const csv = parser.parse(flatData);

      // Logga export
      await ctx.prisma.activity.create({
        data: {
          type: 'UPDATED',
          description: `Export av ${associations.length} föreningar till CSV`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }
      });

      return {
        data: Buffer.from(csv).toString('base64'),
        filename: `foreningar_export_${new Date().toISOString().split('T')[0]}.csv`,
        count: associations.length,
      };
    }),

  // Exportera till JSON
  toJSON: protectedProcedure
    .input(z.object({
      associationIds: z.array(z.string()).optional(),
      filters: z.any().optional(),
      pretty: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const where = input.associationIds
        ? { id: { in: input.associationIds } }
        : input.filters || {};

      const associations = await ctx.prisma.association.findMany({
        where,
        include: {
          contacts: true,
          tags: true,
          notes: { take: 50 },
        },
      });

      const json = input.pretty
        ? JSON.stringify(associations, null, 2)
        : JSON.stringify(associations);

      await ctx.prisma.activity.create({
        data: {
          type: 'UPDATED',
          description: `Export av ${associations.length} föreningar till JSON`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
        }
      });

      return {
        data: Buffer.from(json).toString('base64'),
        filename: `foreningar_export_${new Date().toISOString().split('T')[0]}.json`,
        count: associations.length,
      };
    }),
});
```

---

### **12. Export Component (Frontend)**

```typescript
// components/export/ExportDialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc';
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationIds?: string[];
  filters?: any;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  associationIds,
  filters 
}: ExportDialogProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<'excel' | 'csv' | 'json'>('excel');
  const [includeContacts, setIncludeContacts] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeActivities, setIncludeActivities] = useState(false);

  const excelMutation = trpc.export.toExcel.useMutation();
  const csvMutation = trpc.export.toCSV.useMutation();
  const jsonMutation = trpc.export.toJSON.useMutation();

  const handleExport = async () => {
    try {
      let result;

      if (format === 'excel') {
        result = await excelMutation.mutateAsync({
          associationIds,
          filters,
          includeContacts,
          includeNotes,
          includeActivities,
        });
      } else if (format === 'csv') {
        result = await csvMutation.mutateAsync({
          associationIds,
          filters,
        });
      } else {
        result = await jsonMutation.mutateAsync({
          associationIds,
          filters,
          pretty: true,
        });
      }

      // Ladda ner filen
      const blob = new Blob(
        [Buffer.from(result.data, 'base64')],
        { 
          type: format === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : format === 'csv'
            ? 'text/csv'
            : 'application/json'
        }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export slutförd',
        description: `${result.count} föreningar exporterade till ${format.toUpperCase()}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Export misslyckades',
        description: 'Ett fel uppstod vid export. Försök igen.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = excelMutation.isLoading || csvMutation.isLoading || jsonMutation.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportera föreningar</DialogTitle>
          <DialogDescription>
            {associationIds 
              ? `Exportera ${associationIds.length} markerade föreningar`
              : 'Exportera filtrerade föreningar'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Välj format</Label>
            <RadioGroup value={format} onValueChange={(val) => setFormat(val as any)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Excel (XLSX)</p>
                      <p className="text-xs text-gray-500">
                        Bäst för analys och bearbetning i Excel
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">CSV</p>
                      <p className="text-xs text-gray-500">
                        Enkel textfil, kompatibel med de flesta verktyg
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-gray-500">
                        För teknisk integration och API-användning
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {format === 'excel' && (
            <div className="space-y-3">
              <Label>Inkludera</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="contacts" 
                    checked={includeContacts}
                    onCheckedChange={setIncludeContacts}
                  />
                  <Label htmlFor="contacts" className="cursor-pointer">
                    Kontaktpersoner (separat sheet)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="notes" 
                    checked={includeNotes}
                    onCheckedChange={setIncludeNotes}
                  />
                  <Label htmlFor="notes" className="cursor-pointer">
                    Anteckningar (senaste 50 per förening)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="activities" 
                    checked={includeActivities}
                    onCheckedChange={setIncludeActivities}
                  />
                  <Label htmlFor="activities" className="cursor-pointer">
                    Aktivitetslogg (senaste 100 per förening)
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporterar...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportera
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---
