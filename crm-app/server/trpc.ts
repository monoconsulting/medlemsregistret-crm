import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import superjson from 'superjson'

// Context for tRPC
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()
  return {
    db,
    session,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
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
  if (ctx.session?.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Endast administratörer har behörighet.' })
  }

  return next()
})

export const protectedProcedure = t.procedure.use(enforceAuthed)
export const adminProcedure = t.procedure.use(enforceAuthed).use(enforceAdmin)

export const isAuthed = enforceAuthed
export const isAdmin = enforceAdmin
