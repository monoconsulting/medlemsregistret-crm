'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getApiBaseUrl, setApiBaseUrl } from '@/lib/api-base'
import { createTrpcClient, trpc } from '@/lib/trpc/client'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
      },
    },
  }))

  const [clientState, setClientState] = useState(() => {
    const baseUrl = getApiBaseUrl()
    return {
      baseUrl,
      client: createTrpcClient(baseUrl),
    }
  })

  useEffect(() => {
    let cancelled = false

    async function loadRuntimeConfig() {
      const baseCandidate = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '')
      if (!baseCandidate) {
        return
      }

      try {
        const response = await fetch(`${baseCandidate.replace(/\/$/, '')}/config.json`, {
          credentials: 'include',
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as {
          apiBaseUrl?: string | null
        }

        const nextBase = data.apiBaseUrl?.trim()
        if (!nextBase || cancelled) {
          return
        }

        const normalized = nextBase.replace(/\/$/, '')

        setClientState((prev) => {
          if (prev.baseUrl === normalized) {
            return prev
          }

          setApiBaseUrl(normalized)

          return {
            baseUrl: normalized,
            client: createTrpcClient(normalized),
          }
        })
      } catch (error) {
        console.warn('Kunde inte läsa runtime-konfiguration:', error)
      }
    }

    void loadRuntimeConfig()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <trpc.Provider client={clientState.client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
