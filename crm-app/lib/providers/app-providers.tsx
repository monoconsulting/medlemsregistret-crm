'use client'

import { SessionProvider } from 'next-auth/react'
import { TRPCProvider } from '@/lib/providers/trpc-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </SessionProvider>
  )
}
