import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers/_app'
import superjson from 'superjson'
import { getApiBaseUrl, resolveApiUrl } from '@/lib/api-base'

export const api = createTRPCReact<AppRouter>()

export const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: resolveApiUrl('/api/trpc'),
      transformer: superjson,
    }),
  ],
})

// Legacy export for backward compatibility
export const trpc = api
