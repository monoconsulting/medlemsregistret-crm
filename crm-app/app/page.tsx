"use client"

import type { JSX } from "react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type AuthStatus } from "@/lib/providers/auth-provider"
import { logClientEvent } from "@/lib/logging"

export default function IndexPage(): JSX.Element {
  const router = useRouter()
  const { status } = useAuth()
  const lastStatusRef = useRef<AuthStatus | null>(null)

  useEffect(() => {
    if (lastStatusRef.current !== status) {
      logClientEvent("client.root.status", { status })
      lastStatusRef.current = status
    }
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "unauthenticated") {
      logClientEvent("client.root.prompt_login")
    }
  }, [status])

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Laddar...</div>
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Välkommen!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Logga in för att komma åt CRM-portalen.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
            >
              Gå till inloggning
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Omdirigerar...</div>
}
