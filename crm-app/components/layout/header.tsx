"use client"

import { Bell, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"

export function Header() {
  const { data } = useSession()
  const user = data?.user

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">CRM Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                {user?.image ? <AvatarImage src={user.image} alt={user.name ?? "Användare"} /> : null}
                <AvatarFallback>
                  {user?.name?.[0] ?? user?.email?.[0] ?? <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name ?? "Användare"}</p>
                {user?.email ? (
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">Roll: {user?.role ?? "Okänd"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              Inställningar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/auth/signin" })}>
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logga ut
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
