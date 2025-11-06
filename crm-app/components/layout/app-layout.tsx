"use client"

import { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

interface AppLayoutProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AppLayout({ title, description, actions, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-background/80 text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title={title} description={description} actions={actions} />
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
