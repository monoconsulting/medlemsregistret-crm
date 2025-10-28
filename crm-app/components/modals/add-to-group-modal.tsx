"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import { Loader2, PlusCircle, Users } from "lucide-react"

interface AddToGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationIds: string[]
  onCompleted: () => void
}

export function AddToGroupModal({ open, onOpenChange, associationIds, onCompleted }: AddToGroupModalProps) {
  const utils = api.useUtils()
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")

  const groupsQuery = api.groups.list.useQuery(undefined, {
    enabled: open,
    staleTime: 60_000,
  })

  const createGroup = api.groups.create.useMutation({
    onError: (error) => toast({ title: "Kunde inte skapa grupp", description: error.message, variant: "destructive" }),
  })

  const addMember = api.groups.addMember.useMutation({
    onError: (error) => toast({ title: "Kunde inte lägga till i grupp", description: error.message, variant: "destructive" }),
  })

  useEffect(() => {
    if (!open) {
      setActiveTab("existing")
      setSelectedGroupId(null)
      setSearchTerm("")
      setNewGroupName("")
      setNewGroupDescription("")
    }
  }, [open])

  const filteredGroups = useMemo(() => {
    const groups = groupsQuery.data ?? []
    if (!searchTerm.trim()) {
      return groups
    }
    const term = searchTerm.trim().toLowerCase()
    return groups.filter((group) => group.name.toLowerCase().includes(term))
  }, [groupsQuery.data, searchTerm])

  const isSubmitting = createGroup.isPending || addMember.isPending

  const handleAddAssociationsToGroup = async (groupId: string) => {
    if (!associationIds.length) {
      toast({ title: "Inga föreningar valda", description: "Markera minst en förening först.", variant: "destructive" })
      return
    }

    await Promise.all(
      associationIds.map((associationId) =>
        addMember.mutateAsync({ groupId, associationId }).catch((error) => {
          console.error(error)
          throw error
        })
      )
    )

    await utils.groups.list.invalidate()
    toast({ title: "Föreningar tillagda", description: "Valda föreningar har lagts till i gruppen." })
    onCompleted()
  }

  const handleSubmit = async () => {
    try {
      if (activeTab === "existing") {
        if (!selectedGroupId) {
          toast({ title: "Välj en grupp", description: "Markera en befintlig grupp att använda.", variant: "destructive" })
          return
        }
        await handleAddAssociationsToGroup(selectedGroupId)
      } else {
        const name = newGroupName.trim()
        const description = newGroupDescription.trim()
        if (!name) {
          toast({ title: "Ange ett gruppnamn", description: "Skriv ett namn för den nya gruppen.", variant: "destructive" })
          return
        }
        const group = await createGroup.mutateAsync({ name, description: description || undefined, autoUpdate: false })
        await handleAddAssociationsToGroup(group.id)
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    }
  }

  const canSubmit =
    associationIds.length > 0 &&
    (activeTab === "existing" ? Boolean(selectedGroupId) : newGroupName.trim().length > 0) &&
    !isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till i grupp</DialogTitle>
          <DialogDescription>
            Välj en befintlig grupp eller skapa en ny för de markerade föreningarna ({associationIds.length} st).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "existing" | "new") } className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" /> Befintlig
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2 text-sm">
              <PlusCircle className="h-4 w-4" /> Ny grupp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            <Input
              placeholder="Sök efter grupp"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <ScrollArea className="max-h-60 rounded-md border">
              {groupsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Hämtar grupper…
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Inga grupper hittades.</div>
              ) : (
                <div className="divide-y">
                  {filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition hover:bg-muted ${selectedGroupId === group.id ? "bg-muted" : ""}`}
                    >
                      <div>
                        <div className="font-medium text-foreground">{group.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {group._count?.memberships ?? 0} föreningar • {group.createdBy?.name ?? group.createdBy?.email ?? "Okänd"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gruppnamn</label>
              <Input
                placeholder="Ex. Idrottsföreningar Västerås"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Beskrivning (valfri)</label>
              <Textarea
                placeholder="Beskriv syftet med gruppen"
                value={newGroupDescription}
                onChange={(event) => setNewGroupDescription(event.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lägg till i grupp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
