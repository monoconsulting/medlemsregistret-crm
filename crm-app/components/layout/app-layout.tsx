"use client"

import { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AppLayout({ title, description, actions, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#f6f8fc] text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title={title} description={description} actions={actions} />
        <main className={cn("flex-1 overflow-y-auto px-6 py-8 md:px-10")}>
          <div className="w-full space-y-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
