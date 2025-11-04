"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/providers/auth-provider"

export default function IndexPage() {
  const router = useRouter()
  const { status } = useAuth()

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/associations")
    } else if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Laddar…</div>
}
