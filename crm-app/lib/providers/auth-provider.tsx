"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/lib/api"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"
export type UserRole = "ADMIN" | "MANAGER" | "USER"

export interface AuthSessionUser {
  id: string
  email: string | null
  name: string | null
  role: UserRole
}

export interface AuthSession {
  user: AuthSessionUser
}

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

const STORAGE_KEY = "crm-auth-user"

function readStoredUser(): AuthSessionUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSessionUser
    if (!parsed || typeof parsed.id !== "string") return null
    return parsed
  } catch (error) {
    console.warn("Failed to parse stored auth user", error)
    return null
  }
}

function writeStoredUser(user: AuthSessionUser | null) {
  if (typeof window === "undefined") return
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const refresh = useCallback(async () => {
    setStatus("loading")
    try {
      await api.getAssociations({ page: 1, pageSize: 1 })
      const stored = readStoredUser()
      if (stored) {
        setSession({ user: stored })
      } else {
        setSession(null)
      }
      setStatus("authenticated")
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("unauth")) {
        setSession(null)
        writeStoredUser(null)
        setStatus("unauthenticated")
      } else {
        console.error("Failed to refresh auth status", error)
        setSession(null)
        setStatus("unauthenticated")
      }
    }
  }, [])

  useEffect(() => {
    const stored = readStoredUser()
    if (stored) {
      setSession({ user: stored })
    }
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      await api.login(email, password)
      const user: AuthSessionUser = {
        id: "user",
        email,
        name: email ? email.split("@")[0] ?? null : null,
        role: "ADMIN",
      }
      writeStoredUser(user)
      setSession({ user })
      setStatus("authenticated")
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Inloggningen misslyckades"
      setSession(null)
      setStatus("unauthenticated")
      return { ok: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch (error) {
      console.warn("Logout request failed", error)
    } finally {
      writeStoredUser(null)
      setSession(null)
      setStatus("unauthenticated")
    }
  }, [])

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth måste användas inom AuthProvider")
  return ctx
}
