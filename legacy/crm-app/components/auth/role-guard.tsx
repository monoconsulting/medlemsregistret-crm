'use client'

import { useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { useAuth } from '@/lib/providers/auth-provider'
import { logAuthClientEvent } from '@/lib/auth-flow/client'

export function RoleGuard({
  children,
  allowedRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  fallback,
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
}) {
  const { session, status } = useAuth()

  const isAllowed = useMemo(() => {
    if (!session?.user) return false
    return allowedRoles.includes(session.user.role as UserRole)
  }, [session?.user, allowedRoles])

  useEffect(() => {
    logAuthClientEvent({
      stage: 'client.auth.role-guard.evaluate',
      context: {
        status,
        userId: session?.user?.id ?? null,
        role: session?.user?.role ?? null,
        allowed: isAllowed,
        allowedRoles,
      },
    })
  }, [status, session?.user?.id, session?.user?.role, isAllowed, allowedRoles])

  if (status === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Laddar behörighetskontroll.
      </div>
    )
  }

  if (!isAllowed) {
    return (
      fallback ?? (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-2 text-center">
          <h2 className="text-lg font-semibold">Åtkomst nekad</h2>
          <p className="text-sm text-muted-foreground">
            Du saknar rättigheter för att se detta innehåll. Kontakta en administratör.
          </p>
        </div>
      )
    )
  }

  return <>{children}</>
}
