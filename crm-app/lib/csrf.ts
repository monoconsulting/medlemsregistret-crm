import { CSRF_COOKIE_NAME } from '@/lib/security/constants'

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie ? document.cookie.split(';') : []
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split('=')
    if (rawName === CSRF_COOKIE_NAME) {
      return decodeURIComponent(rawValue.join('='))
    }
  }

  return null
}

export async function ensureCsrfToken(fetcher?: () => Promise<unknown>): Promise<string | null> {
  const current = getCsrfToken()
  if (current || typeof window === 'undefined') {
    return current
  }

  if (fetcher) {
    try {
      await fetcher()
    } catch (error) {
      console.warn('Kunde inte hämta CSRF-token:', error)
    }
  }

  return getCsrfToken()
}
