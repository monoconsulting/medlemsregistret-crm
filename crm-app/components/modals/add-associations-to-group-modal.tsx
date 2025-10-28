"use client"

import { useEffect, useMemo, useState } from "react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import { Loader2, PlusCircle, Users } from "lucide-react"

interface AddAssociationsToGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationIds: string[]
  onCompleted?: () => void
}

export function AddAssociationsToGroupModal({
  open,
  onOpenChange,
  associationIds,
  onCompleted,
}: AddAssociationsToGroupModalProps) {
  const utils = api.useUtils()
  const groupsQuery = api.groups.list.useQuery(undefined, { enabled: open })
  const addMembers = api.groups.addMembers.useMutation({
    onError: (error) => toast({ title: "Kunde inte uppdatera grupp", description: error.message, variant: "destructive" }),
  })
  const createGroup = api.groups.create.useMutation({
    onError: (error) => toast({ title: "Kunde inte skapa grupp", description: error.message, variant: "destructive" }),
  })

  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const hasAssociations = associationIds.length > 0
  const isSubmitting = addMembers.isPending || createGroup.isPending

  useEffect(() => {
    if (open) {
      setFormError(null)
      if (!groupsQuery.data?.length) {
        setMode("new")
      }
      return
    }

    setMode("existing")
    setSelectedGroupId("")
    setNewGroupName("")
    setNewGroupDescription("")
    setFormError(null)
  }, [open, groupsQuery.data?.length])

  const availableGroups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data])

  useEffect(() => {
    if (mode === "existing" && availableGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(availableGroups[0].id)
    }
  }, [mode, availableGroups, selectedGroupId])

  const handleConfirm = async () => {
    if (!hasAssociations) {
      setFormError("Välj minst en förening att lägga till i gruppen.")
      return
    }

    try {
      setFormError(null)
      let targetGroupId: string | null = null

      if (mode === "existing") {
        if (!selectedGroupId) {
          setFormError("Välj en befintlig grupp.")
          return
        }
        targetGroupId = selectedGroupId
      } else {
        const trimmedName = newGroupName.trim()
        if (!trimmedName) {
          setFormError("Ange ett namn för den nya gruppen.")
          return
        }

        const group = await createGroup.mutateAsync({
          name: trimmedName,
          description: newGroupDescription.trim() || undefined,
          autoUpdate: false,
        })
        targetGroupId = group.id
        await utils.groups.list.invalidate()
      }

      if (!targetGroupId) return

      await addMembers.mutateAsync({ groupId: targetGroupId, associationIds })
      await utils.groups.list.invalidate()
      toast({
        title: "Grupp uppdaterad",
        description: `${associationIds.length} föreningar har lagts till i gruppen.`,
      })
      onCompleted?.()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message)
      } else {
        setFormError("Något gick fel. Försök igen.")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till i grupp</DialogTitle>
          <DialogDescription>
            Välj en befintlig grupp eller skapa en ny grupp för {associationIds.length} markerade föreningar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="existing" disabled={!availableGroups.length}>
              <Users className="mr-2 h-4 w-4" /> Befintlig grupp
            </TabsTrigger>
            <TabsTrigger value="new">
              <PlusCircle className="mr-2 h-4 w-4" /> Ny grupp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            {availableGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Det finns inga grupper att välja. Skapa en ny grupp istället.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Välj grupp</label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj grupp" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="max-h-48">
                      {availableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex flex-col">
                            <span>{group.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {group._count?.memberships ?? 0} föreningar
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-group-name">
                Gruppnamn
              </label>
              <Input
                id="new-group-name"
                placeholder="Ex. Nya medlemmar"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-group-description">
                Beskrivning (valfritt)
              </label>
              <Textarea
                id="new-group-description"
                placeholder="Beskriv kort vad som kännetecknar denna grupp."
                value={newGroupDescription}
                onChange={(event) => setNewGroupDescription(event.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              isSubmitting || (mode === "existing" && (!availableGroups.length || !selectedGroupId))
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sparar…
              </>
            ) : (
              "Lägg till"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
