import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers/_app'
import superjson from 'superjson'

import { getCsrfToken } from '@/lib/csrf'
import { CSRF_HEADER_NAME } from '@/lib/security/constants'

export const api = createTRPCReact<AppRouter>()

function normalizeOrigin(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function resolveTrpcOrigin(baseUrl?: string): string {
  if (typeof window !== 'undefined' && typeof window.location?.origin === 'string') {
    return normalizeOrigin(window.location.origin)
  }

  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL_DEV,
    process.env.NEXT_PUBLIC_APP_URL_PROD,
    baseUrl,
  ]

  const match = candidates.find((value) => typeof value === 'string' && value.trim().length > 0)
  const fallback = (match ?? 'http://localhost:3020').trim()

  return normalizeOrigin(fallback)
}

export function createTrpcClient(baseUrl: string): ReturnType<typeof api.createClient> {
  const targetOrigin = resolveTrpcOrigin(baseUrl)
  const targetUrl = targetOrigin + '/api/trpc'

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

