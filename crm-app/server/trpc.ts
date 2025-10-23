import { initTRPC, TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import superjson from 'superjson'
import { getToken } from 'next-auth/jwt'
import { Role } from '@prisma/client'
import type { Session } from 'next-auth'

type CreateContextOptions = {
  headers: Headers
}

export const createTRPCContext = async ({ headers }: CreateContextOptions) => {
  const token = await getToken({
    req: { headers } as any,
    secret: process.env.NEXTAUTH_SECRET,
  })

  let session: Session | null = null

  if (token?.sub) {
    session = {
      user: {
        id: token.sub,
        email: (token.email as string | undefined) ?? undefined,
        name: (token.name as string | undefined) ?? undefined,
        image: (token.picture as string | undefined) ?? undefined,
        role: (token.role as Role | undefined) ?? Role.USER,
      },
      expires: token.exp
        ? new Date(token.exp * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  return {
    db,
    session,
    headers,
  }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>
export type TRPCContext = Context

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user.role
  if (!role || (role !== Role.ADMIN && role !== Role.MANAGER)) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return next()
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
export const adminProcedure = protectedProcedure.use(enforceUserIsAdmin)
