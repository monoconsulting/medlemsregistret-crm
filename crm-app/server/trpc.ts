import { initTRPC } from '@trpc/server'
import { db } from '@/lib/db'
import superjson from 'superjson'

// Context for tRPC
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
