import type { AuthRole } from '@/lib/auth-client'
import { fetchBackendWithFallback } from '@/lib/backend-base'

interface BackendSessionUser {
  id: string
  email: string | null
  name: string | null
  role: AuthRole | string
}

export interface BackendSession {
  user: BackendSessionUser
}

export async function fetchBackendSession(req: Request): Promise<BackendSession | null> {
  const cookie = req.headers.get('cookie')
  if (!cookie) {
    return null
  }

  try {
    const { response } = await fetchBackendWithFallback('/api/auth/me', {
      method: 'GET',
      headers: {
        cookie,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { user?: BackendSessionUser | null }
    if (!data?.user) {
      return null
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        name: data.user.name ?? null,
        role: data.user.role ?? 'USER',
      },
    }
  } catch (error) {
    console.error('[trpc] Failed to fetch backend session:', error)
    return null
  }
}
