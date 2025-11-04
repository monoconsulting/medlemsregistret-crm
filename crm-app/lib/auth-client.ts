import { api } from '@/lib/api'

export type AuthRole = 'ADMIN' | 'MANAGER' | 'USER'

export interface AuthSessionUser {
  id: string
  email: string | null
  name: string | null
  role: AuthRole
}

export interface AuthSession {
  user: AuthSessionUser
}

export interface AuthError {
  error?: string
}

export async function fetchSession(): Promise<AuthSession | null> {
  const response = await fetch('/api/session.php', {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as { authenticated: boolean; uid?: number } | null
  if (!payload?.authenticated || !payload.uid) {
    return null
  }

  return {
    user: {
      id: String(payload.uid),
      email: null,
      name: null,
      role: 'ADMIN',
    },
  }
}

export async function loginRequest(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.login(email, password)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Inloggningen misslyckades',
    }
  }
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.logout()
  } catch (error) {
    console.error('Logout failed', error)
  }
}
