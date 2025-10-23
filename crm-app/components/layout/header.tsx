"use client"

import { Bell, User, LogOut } from "lucide-react"
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
import { useSession, signOut } from "next-auth/react"
import { UserRole } from "@prisma/client"

export function Header() {
  const { data: session } = useSession()
  const user = session?.user

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
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name ?? 'Användare'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email ?? 'Ingen e-post angiven'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role && (
              <DropdownMenuItem className="text-xs uppercase tracking-wide text-muted-foreground">
                Roll: {user.role === UserRole.ADMIN ? 'Administratör' : user.role === UserRole.MANAGER ? 'Ansvarig' : 'Användare'}
              </DropdownMenuItem>
            )}
            {user?.role && <DropdownMenuSeparator />}
            <DropdownMenuItem>
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              Inställningar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={(event) => {
                event.preventDefault()
                signOut({ callbackUrl: '/login' })
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
