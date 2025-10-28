"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface BulkAddToGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationIds: string[]
  onComplete?: () => void
}

export function BulkAddToGroupModal({ open, onOpenChange, associationIds, onComplete }: BulkAddToGroupModalProps) {
  const utils = api.useUtils()
  const groupsQuery = api.groups.list.useQuery(undefined, { enabled: open })
  const createGroup = api.groups.create.useMutation({
    onSuccess: async () => {
      await utils.groups.list.invalidate()
    },
  })
  const addMember = api.groups.addMember.useMutation()

  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupSearch, setGroupSearch] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredGroups = useMemo(() => {
    const groups = groupsQuery.data ?? []
    if (!groupSearch.trim()) {
      return groups
    }
    const lower = groupSearch.trim().toLowerCase()
    return groups.filter((group) => group.name.toLowerCase().includes(lower))
  }, [groupsQuery.data, groupSearch])

  useEffect(() => {
    if (!open) {
      setMode("existing")
      setSelectedGroupId(null)
      setGroupSearch("")
      setNewGroupName("")
      setNewGroupDescription("")
      setIsSubmitting(false)
    }
  }, [open])

  const submitLabel = mode === "existing" ? "Lägg till i grupp" : "Skapa och lägg till"

  const handleSubmit = async () => {
    if (associationIds.length === 0) {
      toast({ title: "Inga föreningar valda", description: "Välj minst en förening innan du fortsätter." })
      return
    }

    let targetGroupId = selectedGroupId

    try {
      setIsSubmitting(true)

      if (mode === "existing") {
        if (!targetGroupId) {
          toast({
            title: "Välj en grupp",
            description: "Markera den grupp du vill lägga till föreningarna i.",
            variant: "destructive",
          })
          return
        }
      } else {
        const trimmedName = newGroupName.trim()
        if (!trimmedName) {
          toast({
            title: "Gruppnamn saknas",
            description: "Ange ett namn för den nya gruppen.",
            variant: "destructive",
          })
          return
        }

        const group = await createGroup.mutateAsync({
          name: trimmedName,
          description: newGroupDescription.trim() || undefined,
          autoUpdate: false,
        })
        targetGroupId = group.id
      }

      if (!targetGroupId) {
        return
      }

      await Promise.all(
        associationIds.map((associationId) =>
          addMember.mutateAsync({ groupId: targetGroupId!, associationId })
        )
      )

      await utils.groups.getById.invalidate({ id: targetGroupId })
      toast({
        title: "Klart!",
        description: `${associationIds.length} föreningar lades till i gruppen`,
      })
      onComplete?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Något gick fel vid uppdateringen."
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till i grupp</DialogTitle>
          <DialogDescription>
            {associationIds.length} {associationIds.length === 1 ? "förening" : "föreningar"} kommer att kopplas till en grupp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "existing" ? "default" : "outline"}
              onClick={() => setMode("existing")}
            >
              Befintlig grupp
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "new" ? "default" : "outline"}
              onClick={() => setMode("new")}
            >
              Skapa ny grupp
            </Button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-3">
              <Input
                placeholder="Sök efter grupp"
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
              />
              <ScrollArea className="max-h-56 space-y-2 pr-1">
                {filteredGroups.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Inga grupper hittades.
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                        selectedGroupId === group.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary"
                      )}
                    >
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(group._count?.memberships ?? 0).toLocaleString()} medlemmar
                      </div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-group-name">Gruppnamn</Label>
                <Input
                  id="new-group-name"
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Ange namn på grupp"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-group-description">Beskrivning (valfri)</Label>
                <Textarea
                  id="new-group-description"
                  value={newGroupDescription}
                  onChange={(event) => setNewGroupDescription(event.target.value)}
                  placeholder="Kort beskrivning av gruppen"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (mode === "existing" && !selectedGroupId && filteredGroups.length > 0)}
          >
            {isSubmitting ? "Arbetar..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
