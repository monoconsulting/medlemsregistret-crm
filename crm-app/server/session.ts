import type { AuthRole } from '@/lib/auth-client'

interface BackendSessionUser {
  id: string
  email: string | null
  name: string | null
  role: AuthRole | string
}

export interface BackendSession {
  user: BackendSessionUser
}

const FALLBACK_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '') ||
  `http://localhost:${process.env.BACKEND_PORT ?? '4040'}`

function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (!path.startsWith('/')) {
    return `${FALLBACK_API_BASE}/${path}`
  }
  return `${FALLBACK_API_BASE}${path}`
}

export async function fetchBackendSession(req: Request): Promise<BackendSession | null> {
  const cookie = req.headers.get('cookie')
  if (!cookie) {
    return null
  }

  try {
    const response = await fetch(buildApiUrl('/api/auth/me'), {
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
