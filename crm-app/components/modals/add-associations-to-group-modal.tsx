"use client"

import { useEffect, useMemo, useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { api, type Group } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Users } from "lucide-react"

interface AddAssociationsToGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationIds: string[]
  onCompleted?: () => void
}

export function AddAssociationsToGroupModal({ open, onOpenChange, associationIds, onCompleted }: AddAssociationsToGroupModalProps) {
  const { toast } = useToast()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupSearch, setGroupSearch] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load groups when modal opens
  useEffect(() => {
    if (open) {
      void loadGroups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const data = await api.getGroups()
      setGroups(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte hämta grupper"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) {
      return groups
    }
    const term = groupSearch.trim().toLowerCase()
    return groups.filter((group) => group.name.toLowerCase().includes(term))
  }, [groupSearch, groups])

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setSelectedGroupId(null)
      setGroupSearch("")
      setNewGroupName("")
      setNewGroupDescription("")
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!associationIds.length || isSubmitting) {
      return
    }

    let targetGroupId = selectedGroupId
    const trimmedName = newGroupName.trim()

    if (!targetGroupId && !trimmedName) {
      toast({
        title: "Välj grupp",
        description: "Välj en befintlig grupp eller ange ett nytt gruppnamn.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Create new group if name provided
      if (trimmedName) {
        const createdGroup = await api.createGroup({
          name: trimmedName,
          description: newGroupDescription.trim() || undefined,
          autoUpdate: false,
        })
        targetGroupId = createdGroup.id
        // Refresh groups list
        await loadGroups()
      }

      if (!targetGroupId) {
        toast({ title: "Kunde inte lägga till", description: "Gruppen saknas.", variant: "destructive" })
        return
      }

      // Add all selected associations to the group
      await Promise.all(
        associationIds.map((associationId) =>
          api.addMemberToGroup(targetGroupId!, associationId)
        )
      )

      toast({ title: "Föreningar uppdaterade", description: "Valda föreningar har lagts till i gruppen." })
      handleClose(false)
      onCompleted?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte lägga till i grupp"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lägg till i grupp</DialogTitle>
          <DialogDescription>
            Lägg till {associationIds.length} valda föreningar i en befintlig grupp eller skapa en ny.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Befintliga grupper</h3>
              <p className="text-xs text-muted-foreground">Sök och välj en grupp att använda.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="Sök grupp..."
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-64 rounded-md border">
              <div className="divide-y">
                {isLoadingGroups ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Laddar grupper…
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">Inga grupper hittades.</p>
                ) : (
                  filteredGroups.map((group) => {
                    const isSelected = selectedGroupId === group.id
                    return (
                      <button
                        key={group.id}
                        type="button"
                        className={`w-full px-4 py-3 text-left transition hover:bg-muted ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{group.name}</span>
                          <Badge variant={isSelected ? "default" : "secondary"} className="gap-1 text-xs">
                            <Users className="h-3 w-3" /> {group._count?.memberships ?? 0}
                          </Badge>
                        </div>
                        {group.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{group.description}</p>
                        ) : null}
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Skapa ny grupp</h3>
              <p className="text-xs text-muted-foreground">Ange ett namn för att skapa en ny gruppering.</p>
            </div>
            <div className="space-y-2">
              <Input
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                placeholder="Gruppnamn"
              />
              <Textarea
                value={newGroupDescription}
                onChange={(event) => setNewGroupDescription(event.target.value)}
                rows={4}
                placeholder="Beskrivning (valfritt)"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Om du anger ett nytt namn skapas gruppen automatiskt och de valda föreningarna läggs till.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
            Avbryt
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Bekräfta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
