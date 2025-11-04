"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Map,
  Building2,
  Users,
  FolderKanban,
  Settings,
  Search,
  Upload,
  UserCog
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Kommunöversikt",
    href: "/municipalities",
    icon: Map,
  },
  {
    name: "Föreningar",
    href: "/associations",
    icon: Building2,
  },
  {
    name: "Kontakter",
    href: "/contacts",
    icon: Users,
  },
  {
    name: "Grupperingar",
    href: "/groups",
    icon: FolderKanban,
  },
  {
    name: "Användare",
    href: "/users",
    icon: UserCog,
  },
  {
    name: "Import",
    href: "/import",
    icon: Upload,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50/40">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-6 w-6 text-primary" />
          <span>Medlemsregistret</span>
        </Link>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök förening..."
            className="pl-8"
          />
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Link href="/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-3 h-5 w-5" />
            Inställningar
          </Button>
        </Link>
      </div>
    </div>
  )
}
