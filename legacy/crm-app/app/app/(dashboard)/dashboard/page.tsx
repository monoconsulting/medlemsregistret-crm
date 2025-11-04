import { DashboardStats } from "./_components/dashboard-stats"
import { TopMunicipalities } from "./_components/top-municipalities"
import { ActivityFeed } from "./_components/activity-feed"
import { UpcomingTasks } from "./_components/upcoming-tasks"
import { MemberGrowthChart } from "./_components/member-growth-chart"
import { SavedGroupsWidget } from "./_components/saved-groups-widget"
import { AIAssistantWidget } from "./_components/ai-assistant-widget"

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
      <div className="grid gap-6 lg:grid-cols-7">
        <ActivityFeed />
        <TopMunicipalities />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <MemberGrowthChart />
        <UpcomingTasks />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <AIAssistantWidget />
        <SavedGroupsWidget />
      </div>
    </div>
  )
}
