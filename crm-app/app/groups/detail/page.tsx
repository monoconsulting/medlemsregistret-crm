"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Download,
  Edit,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import { api, type GroupDetail, type Association } from "@/lib/api"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const editFormSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  description: z.string().optional(),
  autoUpdate: z.boolean().default(false),
})

type EditFormValues = z.infer<typeof editFormSchema>

function GroupDetailPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const groupId = searchParams.get('id')

  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Search state for adding members
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Association[]>([])
  const [searching, setSearching] = useState(false)

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { name: "", description: "", autoUpdate: false },
  })

  const loadGroup = async () => {
    if (!groupId) {
      toast({ title: "Fel", description: "Inget grupp-ID angivet", variant: "destructive" })
      router.push("/groups")
      return
    }

    setLoading(true)
    try {
      const data = await api.getGroupById(groupId)
      setGroup(data)
      form.reset({
        name: data.name,
        description: data.description || "",
        autoUpdate: data.autoUpdate,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte hämta grupp"
      toast({ title: "Fel", description: message, variant: "destructive" })
      router.push("/groups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  const handleEdit = async (values: EditFormValues) => {
    if (!groupId) return

    setSubmitting(true)
    try {
      await api.updateGroup(groupId, {
        name: values.name,
        description: values.description,
        autoUpdate: values.autoUpdate,
      })
      toast({ title: "Grupp uppdaterad" })
      setEditModalOpen(false)
      await loadGroup()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte uppdatera grupp"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!groupId) return

    setSubmitting(true)
    try {
      await api.deleteGroup(groupId)
      toast({ title: "Grupp raderad" })
      router.push("/groups")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte radera grupp"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
      setDeleteAlertOpen(false)
    }
  }

  const handleExport = async () => {
    if (!groupId) return

    setExporting(true)
    try {
      const result = await api.exportGroupMembers(groupId)

      // Decode base64 and create blob
      const byteCharacters = atob(result.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: result.mimeType })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({ title: "Export klar", description: `Filen ${result.filename} har laddats ner` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte exportera medlemmar"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const results = await api.getAssociations({ q: query, page: 1, pageSize: 20 })
      // Filter out associations already in group
      const memberIds = new Set(group?.memberships.map(m => m.associationId) || [])
      const filtered = results.items.filter(a => !memberIds.has(a.id))
      setSearchResults(filtered)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte söka föreningar"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSearching(false)
    }
  }

  const handleAddMember = async (associationId: string) => {
    if (!groupId) return

    setSubmitting(true)
    try {
      await api.addMemberToGroup(groupId, associationId)
      toast({ title: "Förening tillagd" })
      setAddMemberModalOpen(false)
      setSearchQuery("")
      setSearchResults([])
      await loadGroup()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte lägga till förening"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (associationId: string) => {
    if (!groupId) return

    setSubmitting(true)
    try {
      await api.removeMemberFromGroup(groupId, associationId)
      toast({ title: "Förening borttagen" })
      setRemoveMemberId(null)
      await loadGroup()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte ta bort förening"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Laddar..." description="">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (!group) {
    return null
  }

  return (
    <AppLayout
      title={group.name}
      description={group.description || "Ingen beskrivning"}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/groups")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Tillbaka
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exporting || group.memberships.length === 0}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportera CSV
          </Button>
          <Button variant="outline" onClick={() => setEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Redigera
          </Button>
          <Button variant="destructive" onClick={() => setDeleteAlertOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Radera
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Group Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Skapad av:</span>{" "}
              <span className="text-muted-foreground">
                {group.createdBy?.name || group.createdBy?.email || "Okänd"}
              </span>
            </div>
            <div>
              <span className="font-medium">Antal medlemmar:</span>{" "}
              <span className="text-muted-foreground">{group.memberships.length} föreningar</span>
            </div>
            {group.autoUpdate && (
              <div>
                <Badge variant="secondary">Automatisk uppdatering aktiverad</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Medlemmar ({group.memberships.length})</CardTitle>
            <Button onClick={() => setAddMemberModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Lägg till förening
            </Button>
          </CardHeader>
          <CardContent>
            {group.memberships.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Inga föreningar i denna grupp ännu. Klicka på &quot;Lägg till förening&quot; för att lägga till.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Förening</TableHead>
                    <TableHead>Kommun</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.memberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">
                        {membership.association?.name || "Okänd förening"}
                      </TableCell>
                      <TableCell>{membership.association?.municipality || "-"}</TableCell>
                      <TableCell>
                        {membership.association?.crmStatus ? (
                          <Badge variant="outline">{membership.association.crmStatus}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveMemberId(membership.associationId)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera gruppering</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleEdit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namn</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beskrivning</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoUpdate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <FormLabel>Automatisk uppdatering</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Uppdatera gruppen automatiskt baserat på sparade filter.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sparar…" : "Spara"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lägg till förening</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Sök efter förening..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                void handleSearch(e.target.value)
              }}
            />
            {searching ? (
              <div className="py-8 text-center">
                <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {searchResults.map((association) => (
                  <div
                    key={association.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{association.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {association.municipality || "Okänd kommun"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(association.id)}
                      disabled={submitting}
                    >
                      Lägg till
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="py-8 text-center text-muted-foreground">
                Inga föreningar hittades för &quot;{searchQuery}&quot;
              </p>
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Sök efter en förening för att lägga till
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer att radera gruppen &quot;{group.name}&quot; permanent. Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {submitting ? "Raderar…" : "Radera"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMemberId} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort förening från grupp?</AlertDialogTitle>
            <AlertDialogDescription>
              Föreningen kan alltid läggas till igen senare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberId && handleRemoveMember(removeMemberId)}
              disabled={submitting}
            >
              {submitting ? "Tar bort…" : "Ta bort"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

export default function GroupDetailPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Laddar..." description="">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    }>
      <GroupDetailPageContent />
    </Suspense>
  )
}
