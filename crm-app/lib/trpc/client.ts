import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers/_app'
import superjson from 'superjson'

import { resolveApiUrl } from '@/lib/api-base'
import { getCsrfToken } from '@/lib/csrf'
import { CSRF_HEADER_NAME } from '@/lib/security/constants'

export const api = createTRPCReact<AppRouter>()

export function createTrpcClient(baseUrl: string): ReturnType<typeof api.createClient> {
  const targetUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/api/trpc`
    : resolveApiUrl('/api/trpc')

  return api.createClient({
    links: [
      httpBatchLink({
        url: targetUrl,
        transformer: superjson,
        fetch(input, init) {
          return fetch(input, {
            ...init,
            credentials: 'include',
          })
        },
        headers() {
          if (typeof window === 'undefined') {
            return {}
          }

          const token = getCsrfToken()
          if (token) {
            return {
              [CSRF_HEADER_NAME]: token,
            }
          }

          return {}
        },
      }),
    ],
  })
}

// Legacy export for backward compatibility
export const trpc = api
