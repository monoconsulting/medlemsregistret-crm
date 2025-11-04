import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { RoleGuard } from "@/components/auth/role-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-gray-50/30">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  )
}
