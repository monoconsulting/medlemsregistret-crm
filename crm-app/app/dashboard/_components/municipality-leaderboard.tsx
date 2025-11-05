"use client"

import type { JSX } from "react"
import { useMemo } from "react"
import { Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Association } from "@/lib/api"
import { cn } from "@/lib/utils"

interface MunicipalityLeaderboardProps {
  loading: boolean
  associations: Association[]
  className?: string
}

interface MunicipalityEntry {
  name: string
  count: number
}

export function MunicipalityLeaderboard(props: MunicipalityLeaderboardProps): JSX.Element {
  const { loading, associations, className } = props

  const leaderboard = useMemo<MunicipalityEntry[]>(() => {
    const map = new Map<string, number>()
    associations.forEach((association) => {
      const key = association.municipality_name ?? "Okänd kommun"
      map.set(key, (map.get(key) ?? 0) + 1)
    })

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [associations])

  return (
    <Card className={cn("border bg-white shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Aktivitet per kommun</CardTitle>
        <p className="text-sm text-muted-foreground">
          Snabbt hopp till kommuner med flest nyligen uppdaterade föreningar.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Det finns inga uppdaterade föreningar att summera ännu.
          </p>
        ) : (
          <ul className="space-y-2">
            {leaderboard.map((entry) => (
              <li
                key={entry.name}
                className="flex items-center justify-between rounded-md border bg-white p-3 shadow-sm"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {entry.name}
                </span>
                <span className="text-sm text-muted-foreground">{entry.count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
