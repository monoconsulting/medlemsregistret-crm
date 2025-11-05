"use client"

import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logClientEvent } from "@/lib/logging"
import { api, type Municipality } from "@/lib/api"

interface MunicipalityGroup {
  letter: string
  items: Municipality[]
}

export default function MunicipalitiesPage(): JSX.Element {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [query, setQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        logClientEvent("client.municipalities.fetch.start")
        const data = await api.getMunicipalities()
        setMunicipalities(data)
        logClientEvent("client.municipalities.fetch.success", { count: data.length })
      } catch (error) {
        console.error("Failed to load municipalities", error)
        logClientEvent("client.municipalities.fetch.error", {
          message: error instanceof Error ? error.message : "unknown",
        })
      } finally {
        setLoading(false)
      }
    }

    logClientEvent("client.municipalities.view")
    void load()
  }, [])

  const normalise = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()

  const filteredMunicipalities = useMemo(() => {
    return municipalities.filter((municipality) => {
      const name = municipality.name ?? ""
      if (query && !normalise(name).includes(normalise(query))) {
        return false
      }
      if (selectedLetter) {
        const first = name.trim().charAt(0).toUpperCase()
        return first === selectedLetter.toUpperCase()
      }
      return true
    })
  }, [municipalities, query, selectedLetter])

  const grouped = useMemo<MunicipalityGroup[]>(() => {
    const groups = new Map<string, Municipality[]>()
    for (const municipality of filteredMunicipalities) {
      const first = municipality.name?.trim().charAt(0).toUpperCase() || "#"
      const key = /[A-ZÅÄÖ]/.test(first) ? first : "#"
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(municipality)
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b, "sv"))
      .map(([letter, items]) => ({
        letter,
        items: items.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "sv")),
      }))
  }, [filteredMunicipalities])

  const alphabet = useMemo(() => {
    const letters = new Set<string>()
    municipalities.forEach((municipality) => {
      const first = municipality.name?.trim().charAt(0).toUpperCase() || "#"
      letters.add(/^[A-ZÅÄÖ]$/.test(first) ? first : "#")
    })
    return Array.from(letters).sort((a, b) => a.localeCompare(b, "sv"))
  }, [municipalities])

  const totalWithCodes = useMemo(
    () => municipalities.filter((municipality) => municipality.code && municipality.code.trim() !== "").length,
    [municipalities],
  )

  const headerActions = (
    <Button variant="outline" onClick={() => router.push("/associations")}>
      Gå till föreningar
    </Button>
  )

  return (
    <AppLayout title="Kommunöversikt" description="Kommuner i medlemsregistret" actions={headerActions}>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Antal kommuner" value={municipalities.length.toLocaleString("sv-SE") } loading={loading} />
          <StatCard
            title="Kommuner med SCB-kod"
            value={totalWithCodes.toLocaleString("sv-SE")}
            loading={loading}
          />
          <StatCard
            title="Filtrerade resultat"
            value={filteredMunicipalities.length.toLocaleString("sv-SE")}
            loading={loading}
          />
        </section>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Filtrera kommuner</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sök på namn eller hoppa till en bokstav för att hitta rätt kommun.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sök efter kommun…"
                className="max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                {alphabet.map((letter) => (
                  <Button
                    key={letter}
                    variant={selectedLetter === letter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLetter((prev) => (prev === letter ? null : letter))}
                  >
                    {letter === "#" ? "Övrigt" : letter}
                  </Button>
                ))}
                {alphabet.length > 0 ? (
                  <Button
                    variant={!selectedLetter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedLetter(null)}
                  >
                    Alla
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-64" />
                ))}
              </div>
            ) : filteredMunicipalities.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Inga kommuner matchar filtreringen.</div>
            ) : (
              <ScrollArea className="h-[540px]">
                <div className="space-y-6 p-6">
                  {grouped.map((group) => (
                    <div key={group.letter} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-base font-semibold">
                          {group.letter === "#" ? "Övrigt" : group.letter}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {group.items.length.toLocaleString("sv-SE")} kommuner
                        </span>
                      </div>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {group.items.map((municipality) => (
                          <li
                            key={municipality.id}
                            className="rounded-md border bg-white p-3 shadow-sm transition hover:border-primary/50 hover:shadow"
                          >
                            <p className="font-medium">{municipality.name}</p>
                            {municipality.code ? (
                              <p className="text-xs text-muted-foreground">SCB-kod: {municipality.code}</p>
                            ) : null}
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="px-2 text-xs"
                                onClick={() =>
                                  router.push(`/associations?municipality=${encodeURIComponent(municipality.id)}`)
                                }
                              >
                                Visa föreningar
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

interface StatCardProps {
  title: string
  value: string
  loading: boolean
}

function StatCard({ title, value, loading }: StatCardProps): JSX.Element {
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
