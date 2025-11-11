"use client";

import type { FocusEvent, JSX } from "react";
import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FolderKanban,
  LayoutDashboard,
  Map,
  Search,
  Settings,
  Tag,
  Upload,
  UserCog,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/providers/auth-provider";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kommunöversikt", href: "/municipalities", icon: Map },
  { name: "Föreningar", href: "/associations", icon: Building2 },
  { name: "Kontakter", href: "/contacts", icon: Users },
  { name: "Grupperingar", href: "/groups", icon: FolderKanban },
  { name: "Taggar", href: "/tags", icon: Tag },
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

  const [expanded, setExpanded] = useState(false);

  const handleMouseEnter = useCallback(() => setExpanded(true), []);
  const handleMouseLeave = useCallback(() => setExpanded(false), []);
  const handleFocus = useCallback(() => setExpanded(true), []);
  const handleBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setExpanded(false);
    }
  }, []);

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out lg:flex",
        expanded ? "w-72" : "w-20",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#ea580b]/10 text-[#ea580b] shadow-sm">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className={cn("flex flex-col transition-opacity", expanded ? "opacity-100" : "opacity-0")}>
          <span className="text-sm font-medium text-slate-500">Föreningssystem</span>
          <span className="text-base font-semibold text-slate-900">CRM System</span>
        </div>
      </div>

      <div className="px-3 py-4">
        {expanded ? (
          <label className="relative block text-sm text-slate-500">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              placeholder="Sök i systemet..."
              aria-label="Sök i systemet"
              className="h-10 rounded-lg border border-transparent bg-slate-100 pl-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#ea580b]/40 focus:bg-white focus:ring-0"
            />
          </label>
        ) : (
          <div className="flex h-10 items-center justify-center rounded-lg border border-transparent bg-slate-100 text-slate-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Öppna sök</span>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 pb-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-50 text-[#ea580b]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
              )}
              title={item.name}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isActive
                    ? "border-[#ea580b]/30 bg-white text-[#ea580b]"
                    : "border-transparent bg-slate-100 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-nowrap text-left transition-opacity",
                  expanded ? "opacity-100" : "opacity-0",
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 px-3 py-5">
        {expanded ? (
          <Link
            href="/settings"
            className="mb-4 inline-flex w-full items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Inställningar
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link
            href="/settings"
            className="mb-4 flex h-10 items-center justify-center rounded-lg border border-transparent bg-slate-100 text-slate-400 transition-colors hover:text-slate-700"
            title="Inställningar"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Avatar className="h-10 w-10 border border-slate-200">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-1 flex-col transition-opacity", expanded ? "opacity-100" : "opacity-0")}>
            <span className="text-sm font-medium text-slate-900">
              {user?.name ?? "Inloggad användare"}
            </span>
            <span className="text-xs text-slate-500">{user?.email ?? "Ingen e-post"}</span>
            {role ? (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs uppercase tracking-wide text-slate-600">
                  {role}
                </Badge>
              </div>
            ) : null}
          </div>
        </div>
        {expanded ? (
          <p className="mt-4 text-xs text-slate-400">
            © {new Date().getFullYear()} Medlemsregistret
          </p>
        ) : null}
      </div>
    </aside>
  );
}
