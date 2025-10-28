import { resolveApiUrl } from '@/lib/api-base'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const pattern = new RegExp(`(?:^|; )${name.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`)
  const match = document.cookie.match(pattern)
  if (!match) {
    return null
  }

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function getCsrfToken(): string | null {
  return readCookie('csrf')
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken()
  if (existing) {
    return existing
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    await fetch(resolveApiUrl('/api/auth/me'), {
      credentials: 'include',
    })
  } catch (error) {
    console.warn('Kunde inte hämta CSRF-token automatiskt:', error)
  }

  return getCsrfToken()
}
