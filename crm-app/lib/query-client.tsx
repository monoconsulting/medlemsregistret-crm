"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof Error && /Not authenticated/i.test(error.message)) {
            return false
          }
          return failureCount < 2
        },
      },
    },
  }))

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
