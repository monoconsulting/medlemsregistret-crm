'use client'

import { type Role } from '@prisma/client'
import { useSession } from 'next-auth/react'

interface RoleGuardProps {
  allowedRoles: Role[]
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, fallback = null, loadingFallback = null, children }: RoleGuardProps) {
  const { data, status } = useSession()

  if (status === 'loading') {
    return <>{loadingFallback ?? fallback}</>
  }

  const userRole = data?.user?.role

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
