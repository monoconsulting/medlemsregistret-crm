"use client";

import type { JSX } from "react";
import { useCallback, type ReactNode } from "react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/providers/auth-provider";

interface TopbarProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

function resolveRole(role: string | undefined): string | null {
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

function avatarFallback(name?: string | null, email?: string | null): string {
  const candidate = name && name.trim().length > 0 ? name : email ?? "";
  if (!candidate) {
    return "U";
  }
  return candidate.trim().charAt(0).toUpperCase();
}

export function Topbar({ title, description, actions }: TopbarProps): JSX.Element {
  const { session, logout } = useAuth();
  const user = session?.user;
  const role = resolveRole(user?.role);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Misslyckades att logga ut:", error);
    }
  }, [logout]);

  return (
    <header className="flex h-20 items-center justify-between border-b border-border/60 bg-white/95 px-6 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full border border-border/60 bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          aria-label="Notifieringar"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-1 top-1 flex size-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-2 py-1 pl-1 pr-3 text-left text-sm text-foreground transition-colors hover:border-primary/40"
            >
              <Avatar className="h-9 w-9 border border-border/60">
                <AvatarFallback>{avatarFallback(user?.name, user?.email)}</AvatarFallback>
              </Avatar>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="font-medium">{user?.name ?? "Användare"}</span>
                <span className="text-xs text-muted-foreground">{user?.email ?? "Ingen e-post"}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-xl border border-border/60 bg-white/95 p-3 shadow-xl backdrop-blur"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {user?.name ?? "Inloggad användare"}
                </span>
                <span className="text-xs text-muted-foreground">{user?.email ?? "Ingen e-post"}</span>
                {role ? (
                  <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-wide">
                    {role}
                  </Badge>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Inställningar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                void handleLogout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Logga ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
