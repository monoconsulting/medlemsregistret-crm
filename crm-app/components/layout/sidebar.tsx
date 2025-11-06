"use client";

import type { JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  Map,
  Search,
  Settings,
  Upload,
  UserCog,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/providers/auth-provider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kommunöversikt", href: "/municipalities", icon: Map },
  { name: "Föreningar", href: "/associations", icon: Building2 },
  { name: "Kontakter", href: "/contacts", icon: Users },
  { name: "Grupperingar", href: "/groups", icon: FolderKanban },
  { name: "Användare", href: "/users", icon: UserCog },
  { name: "Import", href: "/import", icon: Upload },
];

function roleLabel(role: string | undefined): string | null {
  switch (role) {
    case "ADMIN":
      return "Administratör";
    case "MANAGER":
      return "Ansvarig";
    case "USER":
      return "Användare";
    default:
      return null;
  }
}

function userInitials(name?: string | null, email?: string | null): string {
  const source = name && name.trim().length > 0 ? name : email ?? "";
  if (!source) {
    return "M";
  }
  return source
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
    .padEnd(2, "M");
}

export function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const { session } = useAuth();
  const user = session?.user;
  const role = roleLabel(user?.role);
  const initials = userInitials(user?.name, user?.email);

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-border/60 bg-white/95 backdrop-blur-lg lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border/60 px-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Medlemsregistret
          </Link>
          <span className="text-base font-semibold text-foreground">CRM Portal</span>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Sök förening eller kontakt"
            aria-label="Sök i registret"
            className="h-10 rounded-lg bg-muted/60 pl-10 text-sm text-foreground placeholder:text-muted-foreground/80 focus-visible:bg-white"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 pb-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-md border transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/40 text-muted-foreground group-hover:border-muted-foreground/30 group-hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-left">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border/60 px-4 py-5">
        <Link
          href="/settings"
          className="mb-3 inline-flex w-full items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Inställningar
          </span>
          <span aria-hidden="true">-&gt;</span>
        </Link>

        <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/10 bg-muted/40 p-3">
          <Avatar className="h-10 w-10 border border-border/60">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">
              {user?.name ?? "Inloggad användare"}
            </span>
            <span className="text-xs text-muted-foreground">{user?.email ?? "Ingen e-post"}</span>
            {role ? (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs uppercase tracking-wide">
                  {role}
                </Badge>
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Medlemsregistret
        </p>
      </div>
    </aside>
  );
}
