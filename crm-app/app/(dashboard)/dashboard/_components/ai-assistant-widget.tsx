"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

import { trpc } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export function AIAssistantWidget() {
  const [selectedAssociation, setSelectedAssociation] = useState<string | null>(null)
  const associationsQuery = trpc.association.list.useQuery({ page: 1, limit: 20 })
  useEffect(() => {
    if (!selectedAssociation && associationsQuery.data?.associations.length) {
      setSelectedAssociation(associationsQuery.data.associations[0].id)
    }
  }, [associationsQuery.data, selectedAssociation])
  const nextSteps = trpc.ai.nextSteps.useQuery(
    { associationId: selectedAssociation ?? "" },
    {
      enabled: Boolean(selectedAssociation),
      refetchOnWindowFocus: false,
    }
  )
  const analyze = trpc.ai.analyzeAssociation.useMutation({
    onError: (error) => toast({ title: "AI-analys misslyckades", description: error.message, variant: "destructive" }),
  })

  const handleAnalyze = async () => {
    if (!selectedAssociation) return
    try {
      await analyze.mutateAsync({ associationId: selectedAssociation })
      nextSteps.refetch()
    } catch (error) {
      console.error(error)
    }
  }

  const selected = associationsQuery.data?.associations.find((assoc) => assoc.id === selectedAssociation)

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>AI-assistent</CardTitle>
        </div>
        <Button size="sm" onClick={handleAnalyze} disabled={!selectedAssociation || analyze.isPending}>
          {analyze.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyserar…
            </>
          ) : (
            "Generera förslag"
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Välj förening</label>
          <Select value={selectedAssociation ?? undefined} onValueChange={setSelectedAssociation}>
            <SelectTrigger>
              <SelectValue placeholder="Välj en förening" />
            </SelectTrigger>
            <SelectContent>
              {associationsQuery.data?.associations.map((association) => (
                <SelectItem key={association.id} value={association.id}>
                  {association.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Status:</span> {selected.crmStatus} • {selected.pipeline}
            </p>
            <p>
              <span className="font-medium text-foreground">Kontakt:</span> {(selected as any).contacts?.[0]?.name ?? "Okänd"}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Föreslagna nästa steg</label>
          <div className="rounded-lg border bg-card">
            {nextSteps.isFetching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hämtar rekommendationer…
              </div>
            ) : selectedAssociation && nextSteps.data ? (
              <ul className="space-y-2 p-4">
                {nextSteps.data.suggestedNextSteps.map((step, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {step}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                Välj en förening för att se AI-genererade förslag.
              </p>
            )}
          </div>
        </div>

        {analyze.data && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Analys</label>
            <Textarea value={analyze.data.summary} readOnly rows={4} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
