"use client"

import Link from "next/link"
import { Bookmark, Loader2 } from "lucide-react"

import { trpc } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function SavedGroupsWidget() {
  const { data, isLoading } = trpc.groups.list.useQuery(undefined, {
    staleTime: 60_000,
  })

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sparade grupperingar</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/groups">Visa alla</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hämtar grupperingar…
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Du har ännu inga sparade grupper. Skapa en ny segmentering från sidan Grupperingar.
          </p>
        )}

        {data?.slice(0, 5).map((group) => (
          <div key={group.id} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  <p className="font-medium leading-tight">{group.name}</p>
                </div>
                {group.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>
              <Badge variant="secondary">{group._count.memberships} st</Badge>
            </div>
            {group.autoUpdate && (
              <p className="mt-2 text-xs text-muted-foreground">
                Uppdateras automatiskt från sparad sökfråga
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
