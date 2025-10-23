"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trpc } from "@/lib/trpc/client"
import { MapPin } from "lucide-react"

export function TopMunicipalities() {
  const { data: stats, isLoading } = trpc.association.getStats.useQuery()

  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Top 5 Kommuner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.topMunicipalities.length === 0) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Top 5 Kommuner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Ingen data ännu. Importera föreningar för att se statistik.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top 5 Kommuner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.topMunicipalities.map((municipality: { name: string; count: number }, index: number) => (
            <div key={municipality.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{municipality.name}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {municipality.count} förening{municipality.count !== 1 ? 'ar' : ''}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
