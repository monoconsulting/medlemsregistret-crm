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
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'
import {
  fetchSession,
  loginRequest,
  logoutRequest,
  type AuthSession,
} from '@/lib/auth-client'

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

const backendAuthEnabled = true

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function BackendAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

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
      console.error('Misslyckades att hämta session:', error)
      setSession(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

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

function NextAuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        return {
          ok: false,
          error: result.error ?? 'Inloggningen misslyckades',
        }
      }

      await update()
      return { ok: true }
    },
    [update],
  )

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    await update()
  }, [update])

  const refresh = useCallback(async () => {
    await update()
  }, [update])

  const normalizedSession: AuthSession | null = useMemo(() => {
    if (!session?.user) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        role: session.user.role as AuthSession['user']['role'],
      },
    }
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      session: normalizedSession,
      status: status as AuthStatus,
      login,
      logout,
      refresh,
    }),
    [normalizedSession, status, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (backendAuthEnabled) {
    return <BackendAuthProvider>{children}</BackendAuthProvider>
  }

  return (
    <SessionProvider>
      <NextAuthContextProvider>{children}</NextAuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth måste användas inom AuthProvider')
  }
  return context
}
