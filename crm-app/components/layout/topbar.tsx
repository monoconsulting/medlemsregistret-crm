"use client"

import type { JSX } from "react"
import { useCallback, type ReactNode } from "react"
import { Bell, LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/providers/auth-provider"

interface TopbarProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function Topbar({ title, description, actions }: TopbarProps): JSX.Element {
  const { session, logout } = useAuth()
  const user = session?.user

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      window.location.href = "/login"
    } catch (error) {
      console.error("Misslyckades att logga ut:", error)
    }
  }, [logout])

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administratör"
      : user?.role === "MANAGER"
      ? "Ansvarig"
      : user?.role
      ? "Användare"
      : null

  const fallbackLabel = (() => {
    const candidate = user?.name || user?.email || ""
    if (!candidate) {
      return "U"
    }
    const [first] = candidate.trim()
    return (first ?? "U").toUpperCase()
  })()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>

      <div className="flex items-center gap-4">
        {actions}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifieringar">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{fallbackLabel}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name ?? "Användare"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email ?? "Ingen e-post"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roleLabel ? (
              <DropdownMenuItem className="text-xs uppercase tracking-wide text-muted-foreground">
                Roll: {roleLabel}
              </DropdownMenuItem>
            ) : null}
            {roleLabel ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Inställningar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={(event) => {
                event.preventDefault()
                void handleLogout()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logga ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
