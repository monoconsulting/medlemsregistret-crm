"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, type AuthSession, type AuthUser } from "@/lib/api"
import { logClientEvent } from "@/lib/logging"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface LoginResult {
  ok: boolean
  error?: string
}

interface AuthContextValue {
  session: AuthSession | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refresh: () => Promise<AuthSession | null>
}

const STORAGE_KEY = "crm-auth-user"

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed || typeof parsed.id !== "string" || parsed.id === "") return null
    return {
      id: parsed.id,
      email: typeof parsed.email === "string" && parsed.email !== "" ? parsed.email : null,
      name: typeof parsed.name === "string" && parsed.name !== "" ? parsed.name : null,
      role: typeof parsed.role === "string" && parsed.role !== "" ? parsed.role : "USER",
    }
  } catch (error) {
    console.warn("Failed to parse stored auth user", error)
    return null
  }
}

function writeStoredUser(user: AuthUser | null) {
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

  const refresh = useCallback(async (): Promise<AuthSession | null> => {
    setStatus("loading")
    try {
      logClientEvent("client.auth.refresh.start")
      const current = await api.getSession()
      if (!current) {
        writeStoredUser(null)
        setSession(null)
        setStatus("unauthenticated")
        logClientEvent("client.auth.refresh.unauthenticated")
        return null
      }

      writeStoredUser(current.user)
      setSession(current)
      setStatus("authenticated")
      logClientEvent("client.auth.refresh.authenticated", { userId: current.user.id, role: current.user.role })
      return current
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("unauth")) {
        setSession(null)
        writeStoredUser(null)
        setStatus("unauthenticated")
        logClientEvent("client.auth.refresh.unauthenticated")
      } else {
        console.error("Failed to refresh auth status", error)
        setSession(null)
        setStatus("unauthenticated")
        logClientEvent("client.auth.refresh.error", {
          message: error instanceof Error ? error.message : "unknown",
        })
      }
      return null
    }
  }, [])

  useEffect(() => {
    logClientEvent("client.auth.provider.mounted")
    const stored = readStoredUser()
    if (stored) {
      setSession({ user: stored })
    }
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        logClientEvent("client.auth.login.start", { email })
        await api.login(email, password)
        const refreshed = await refresh()
        if (refreshed) {
          logClientEvent("client.auth.login.success", { email, userId: refreshed.user.id })
          return { ok: true }
        }

        writeStoredUser(null)
        setSession(null)
        setStatus("unauthenticated")
        logClientEvent("client.auth.login.missing-session", { email })
        return { ok: false, error: "Kunde inte hämta session efter inloggning" }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Inloggningen misslyckades"
        writeStoredUser(null)
        setSession(null)
        setStatus("unauthenticated")
        logClientEvent("client.auth.login.failed", {
          email,
          error: message,
        })
        return { ok: false, error: message }
      }
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    logClientEvent("client.auth.logout.start")
    try {
      await api.logout()
    } catch (error) {
      console.warn("Logout request failed", error)
    } finally {
      writeStoredUser(null)
      setSession(null)
      setStatus("unauthenticated")
      logClientEvent("client.auth.logout.completed")
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





