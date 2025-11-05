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
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title={title} description={description} actions={actions} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
