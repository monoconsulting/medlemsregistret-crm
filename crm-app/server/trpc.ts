import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import superjson from 'superjson'
import { db } from '../lib/db'
import { auth } from '../lib/auth'

// Context for tRPC
export const createTRPCContext = async (opts: { headers: Headers; req: Request }) => {
  const session = await auth()
  return {
    db,
    session,
    headers: opts.headers,
  }
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

const enforceAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Du måste vara inloggad.' })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Du måste vara inloggad.' })
  }

  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast administratörer har behörighet.' })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceAuthed)
export const adminProcedure = t.procedure.use(enforceAuthed).use(enforceAdmin)

export const isAuthed = enforceAuthed
export const isAdmin = enforceAdmin
