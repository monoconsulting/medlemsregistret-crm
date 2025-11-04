"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { trpc } from "@/lib/trpc/client"
import { Loader2, Play, FileText } from "lucide-react"

export default function WebScrapingPage() {
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [runningScrapes, setRunningScrapes] = useState<Set<string>>(new Set())

  const municipalitiesQuery = trpc.municipality.list.useQuery()
  const scrapeMutation = trpc.scraping.runScrape.useMutation()

  const handleSelectMunicipality = (id: string) => {
    setSelectedMunicipalities(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    )
  }

  const handleRunScrape = async (municipalityId: string) => {
    setRunningScrapes(prev => new Set(prev).add(municipalityId))
    try {
      await scrapeMutation.mutateAsync({ municipalityId })
      // Refresh data
      municipalitiesQuery.refetch()
    } catch (error) {
      console.error("Scrape failed:", error)
    } finally {
      setRunningScrapes(prev => {
        const newSet = new Set(prev)
        newSet.delete(municipalityId)
        return newSet
      })
    }
  }

  const handleRunBatchScrape = async () => {
    for (const id of selectedMunicipalities) {
      await handleRunScrape(id)
    }
    setSelectedMunicipalities([])
  }

  if (municipalitiesQuery.isLoading) {
    return <div className="p-6">Laddar kommuner...</div>
  }

  const municipalities = municipalitiesQuery.data || []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Web-scraping</h1>
        {selectedMunicipalities.length > 0 && (
          <Button onClick={handleRunBatchScrape} disabled={scrapeMutation.isPending}>
            {scrapeMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Kör scrape för {selectedMunicipalities.length} kommuner
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {municipalities.map((municipality) => (
            <Card key={municipality.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{municipality.name}</CardTitle>
                  <input
                    type="checkbox"
                    checked={selectedMunicipalities.includes(municipality.id)}
                    onChange={() => handleSelectMunicipality(municipality.id)}
                    className="rounded"
                  />
                </div>
                <Badge variant="outline">
                  {municipality._count?.associations || 0} föreningar
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRunScrape(municipality.id)}
                    disabled={runningScrapes.has(municipality.id)}
                  >
                    {runningScrapes.has(municipality.id) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Kör scrape
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Visa JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}