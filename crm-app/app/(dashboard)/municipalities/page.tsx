"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownAZ, ArrowUp01, Search } from "lucide-react"

import { SwedenMap } from "./_components/sweden-map"
import { trpc } from "@/lib/trpc/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type SortOption = "count_desc" | "count_asc" | "name_asc"

export default function MunicipalitiesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("count_desc")

  const statsQuery = trpc.association.getMunicipalityStats.useQuery({ search: search || undefined })

  const sorted = useMemo(() => {
    const stats = statsQuery.data ?? []
    const filtered = stats.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )

    return filtered.sort((a, b) => {
      if (sort === "count_desc") {
        return b.count - a.count
      }
      if (sort === "count_asc") {
        return a.count - b.count
      }
      return a.name.localeCompare(b.name, "sv")
    })
  }, [statsQuery.data, search, sort])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex h-96 flex-1 items-center justify-center bg-muted/40 p-6 lg:h-auto">
        {statsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Laddar karta…</p>
        ) : (
          <div className="w-full max-w-lg">
            <SwedenMap data={sorted.slice(0, 60)} />
          </div>
        )}
      </div>

      <div className="w-full border-l bg-background lg:max-w-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Kommunöversikt</h1>
            <p className="text-sm text-muted-foreground">
              Klicka på en kommun för att visa föreningar i listan.
            </p>
          </div>
          <Badge variant="secondary">{sorted.length} kommuner</Badge>
        </div>

        <div className="space-y-3 px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök kommun"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sort === "count_desc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("count_desc")}
            >
              <ArrowUp01 className="mr-2 h-4 w-4" /> Flest först
            </Button>
            <Button
              variant={sort === "count_asc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("count_asc")}
            >
              <ArrowUp01 className="mr-2 h-4 w-4 rotate-180" /> Färst först
            </Button>
            <Button
              variant={sort === "name_asc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSort("name_asc")}
            >
              <ArrowDownAZ className="mr-2 h-4 w-4" /> Alfabetiskt
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-220px)] px-6 pb-6">
          <div className="space-y-3">
            {sorted.map((municipality) => (
              <Card
                key={municipality.name}
                className="cursor-pointer transition hover:border-primary"
                onClick={() =>
                  router.push(`/associations?municipality=${encodeURIComponent(municipality.name)}`)
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">
                    {municipality.name}
                  </CardTitle>
                  <Badge variant="outline">{municipality.count}</Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Klicka för att visa föreningar i {municipality.name}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
