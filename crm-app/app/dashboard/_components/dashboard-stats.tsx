"use client"

import type { JSX } from "react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TriangleAlert } from "lucide-react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"

interface DashboardStatsProps {
  loading: boolean
  totalAssociations: number
  totalMunicipalities: number
  lastUpdatedAt: string | null
  error: string | null
}

export function DashboardStats({
  loading,
  totalAssociations,
  totalMunicipalities,
  lastUpdatedAt,
  error,
}: DashboardStatsProps): JSX.Element {
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "Ingen aktivitet registrerad"
    }
    try {
      return format(new Date(lastUpdatedAt), "PPP HH:mm", { locale: sv })
    } catch {
      return lastUpdatedAt
    }
  }, [lastUpdatedAt])

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Kunde inte läsa dashboardsdata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          loading={loading}
          title="Registrerade föreningar"
          value={totalAssociations.toLocaleString("sv-SE")}
        />
        <StatCard
          loading={loading}
          title="Kommuner i registret"
          value={totalMunicipalities.toLocaleString("sv-SE")}
        />
        <StatCard loading={loading} title="Senast uppdaterad" value={lastUpdatedLabel} />
      </section>
    </div>
  )
}

interface StatCardProps {
  loading: boolean
  title: string
  value: string
}

function StatCard({ loading, title, value }: StatCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
  )
}
