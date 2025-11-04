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
import {
  fetchSession,
  loginRequest,
  logoutRequest,
  type AuthSession,
} from '@/lib/auth-client'
import { getAuthFlowId, logAuthClientEvent } from '@/lib/auth-flow/client'

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

function AuthProviderImpl({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refresh = useCallback(async () => {
    setStatus('loading')
    logAuthClientEvent({
      stage: 'client.auth.refresh.start',
      context: { flowId: getAuthFlowId() },
    })

    try {
      const next = await fetchSession()
      if (next) {
        setSession(next)
        setStatus('authenticated')
        logAuthClientEvent({
          stage: 'client.auth.refresh.authenticated',
          context: {
            userId: next.user.id,
            role: next.user.role,
          },
        })
      } else {
        setSession(null)
        setStatus('unauthenticated')
        logAuthClientEvent({
          stage: 'client.auth.refresh.unauthenticated',
        })
      }
    } catch (error) {
      console.error('Misslyckades att hämta session:', error)
      setSession(null)
      setStatus('unauthenticated')
      logAuthClientEvent({
        stage: 'client.auth.refresh.error',
        severity: 'error',
        error: error instanceof Error ? error : undefined,
      })
    }
  }, [])

  useEffect(() => {
    logAuthClientEvent({
      stage: 'client.auth.provider.mounted',
    })
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      logAuthClientEvent({
        stage: 'client.auth.login.start',
        context: { email },
      })
      const result = await loginRequest(email, password)
      if (result.ok) {
        await refresh()
        logAuthClientEvent({
          stage: 'client.auth.login.completed',
          context: { email },
        })
        return { ok: true }
      }

      logAuthClientEvent({
        stage: 'client.auth.login.failed-result',
        severity: 'warn',
        context: { email },
        error: result.error ? { message: result.error } : undefined,
      })

      return {
        ok: false,
        error: result.error ?? 'Inloggningen misslyckades',
      }
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    logAuthClientEvent({
      stage: 'client.auth.logout.start',
    })
    await logoutRequest()
    await refresh()
    logAuthClientEvent({
      stage: 'client.auth.logout.done',
    })
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
  return <AuthProviderImpl>{children}</AuthProviderImpl>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth måste användas inom AuthProvider')
  }
  return context
}
