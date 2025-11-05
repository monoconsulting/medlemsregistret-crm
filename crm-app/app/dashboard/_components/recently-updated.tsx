"use client"

import type { JSX } from "react"
import { useMemo } from "react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type Association } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RecentlyUpdatedAssociationsProps {
  loading: boolean
  associations: Association[]
  className?: string
}

export function RecentlyUpdatedAssociations(props: RecentlyUpdatedAssociationsProps): JSX.Element {
  const { loading, associations, className } = props

  const items = useMemo(() => {
    return associations.slice(0, 6)
  }, [associations])

  return (
    <Card className={cn("border bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Senast uppdaterade föreningar</CardTitle>
          <p className="text-sm text-muted-foreground">
            Snabb vy över de senaste ändringarna i registret.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href="/associations">Visa alla</a>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga föreningar har uppdaterats ännu.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((association) => (
              <li
                key={association.id}
                className="flex flex-col gap-1 rounded-md border bg-white p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{association.name ?? "Namnlös förening"}</p>
                  <p className="text-sm text-muted-foreground">
                    {(association.municipality_name ?? "Okänd kommun") +
                      " • " +
                      (association.type ?? "Okänd typ")}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {association.updated_at
                    ? `Uppdaterad ${format(new Date(association.updated_at), "PPP HH:mm", { locale: sv })}`
                    : "Ingen uppdatering"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
