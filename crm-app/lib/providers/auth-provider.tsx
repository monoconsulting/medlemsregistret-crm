'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { fetchSession, loginRequest, logoutRequest, type AuthSession } from '@/lib/auth-client'
import { UNAUTHORIZED_EVENT } from '@/lib/api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface LoginResult {
  ok: boolean
  error?: string
}

interface AuthContextValue {
  session: AuthSession | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const router = useRouter()

  const refresh = useCallback(async () => {
    setStatus('loading')
    try {
      const next = await fetchSession()
      if (next) {
        setSession(next)
        setStatus('authenticated')
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Failed to fetch session', error)
      setSession(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleUnauthorized = () => {
      setSession(null)
      setStatus('unauthenticated')

      const path = window.location.pathname + window.location.search
      if (window.location.pathname.startsWith('/login')) {
        return
      }

      const redirectTo = path && path !== '/' ? `?redirectTo=${encodeURIComponent(path)}` : ''
      router.push(`/login${redirectTo}`)
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [router])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await loginRequest(email, password)
      if (result.ok) {
        await refresh()
        return { ok: true }
      }
      return {
        ok: false,
        error: result.error ?? 'Inloggningen misslyckades',
      }
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    await logoutRequest()
    await refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      login,
      logout,
      refresh,
    }),
    [session, status, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthStateProvider>{children}</AuthStateProvider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
