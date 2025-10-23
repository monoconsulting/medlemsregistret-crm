import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "./_components/dashboard-stats"
import { TopMunicipalities } from "./_components/top-municipalities"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Översikt över föreningsregistret
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardStats />

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aktivitetsflöde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Aktivitetsflöde kommer här...
              </p>
            </div>
          </CardContent>
        </Card>

        <TopMunicipalities />
      </div>
    </div>
  )
}
