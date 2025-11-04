"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { api, type Association, type AssocFilters, type Municipality, type Note, type Tag } from "@/lib/api"
import { useAuth } from "@/lib/providers/auth-provider"
import { Loader2, Plus, RefreshCcw, Tag as TagIcon, Notebook, Pencil, Trash2, Filter } from "lucide-react"

interface AssociationRecord extends Association {
  tags: Tag[]
}

interface AssociationFormState {
  name: string
  municipality_id: string
  type: string
  status: string
  email: string
  phone: string
  address: string
  website: string
  description: string
}

const DEFAULT_FILTERS: Required<Pick<AssocFilters, "page" | "pageSize" | "sort">> &
  Omit<AssocFilters, "page" | "pageSize" | "sort"> = {
  q: "",
  municipality: "",
  type: "",
  status: "",
  tags: [],
  page: 1,
  pageSize: 20,
  sort: "updated_desc",
}

const SORT_OPTIONS = [
  { value: "updated_desc" as const, label: "Senast uppdaterad" },
  { value: "updated_asc" as const, label: "Äldst uppdaterad" },
  { value: "name_asc" as const, label: "Namn A-Ö" },
  { value: "name_desc" as const, label: "Namn Ö-A" },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function AssociationsPage() {
  const { toast } = useToast()
  const { logout, refresh } = useAuth()
  const router = useRouter()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(false)
  const [associations, setAssociations] = useState<AssociationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formAssociation, setFormAssociation] = useState<AssociationRecord | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const [tagsOpen, setTagsOpen] = useState(false)
  const [tagAssociation, setTagAssociation] = useState<AssociationRecord | null>(null)
  const [tagSelection, setTagSelection] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [tagSubmitting, setTagSubmitting] = useState(false)

  const [notesOpen, setNotesOpen] = useState(false)
  const [notesAssociation, setNotesAssociation] = useState<AssociationRecord | null>(null)
  const [notesLoading, setNotesLoading] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AssociationRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const formDefaults: AssociationFormState = useMemo(() => {
    if (!formAssociation) {
      return {
        name: "",
        municipality_id: "",
        type: "",
        status: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        description: "",
      }
    }
    return {
      name: formAssociation.name ?? "",
      municipality_id: formAssociation.municipality_id ? String(formAssociation.municipality_id) : "",
      type: formAssociation.type ?? "",
      status: formAssociation.status ?? "",
      email: formAssociation.email ?? "",
      phone: formAssociation.phone ?? "",
      address: formAssociation.address ?? "",
      website: formAssociation.website ?? "",
      description: formAssociation.description ?? "",
    }
  }, [formAssociation])

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / filters.pageSize)), [total, filters.pageSize])

  const loadAssociations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getAssociations(filters)
      const mapped: AssociationRecord[] = result.items.map((item) => ({
        ...item,
        tags: item.tags ?? [],
      }))
      setAssociations(mapped)
      setTotal(result.total)
      const types = Array.from(new Set(mapped.map((item) => item.type).filter(Boolean))) as string[]
      const statuses = Array.from(new Set(mapped.map((item) => item.status).filter(Boolean))) as string[]
      setAvailableTypes(types)
      setAvailableStatuses(statuses)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta föreningar"
      if (message.toLowerCase().includes("not authenticated")) {
        await refresh()
      } else {
        setError(message)
        toast({ title: "Fel", description: message, variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }, [filters, refresh, toast])

  useEffect(() => {
    void loadAssociations()
  }, [loadAssociations])

  useEffect(() => {
    const run = async () => {
      try {
        const [municipalityList, tagList] = await Promise.all([api.getMunicipalities(), api.getTags()])
        setMunicipalities(municipalityList)
        setTags(tagList)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Kunde inte hämta referensdata"
        toast({ title: "Fel", description: message, variant: "destructive" })
      }
    }
    void run()
  }, [toast])

  const handleFilterChange = (next: Partial<AssocFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...next,
      page: next.page ?? 1,
    }))
  }

  const handleCreateAssociation = () => {
    setFormMode("create")
    setFormAssociation(null)
    setFormOpen(true)
  }

  const handleEditAssociation = (assoc: AssociationRecord) => {
    setFormMode("edit")
    setFormAssociation(assoc)
    setFormOpen(true)
  }

  const handleSubmitAssociation = async (values: AssociationFormState) => {
    setFormSubmitting(true)
    const payload: Partial<Association> = {
      name: values.name,
      municipality_id: values.municipality_id ? Number(values.municipality_id) : null,
      type: values.type || null,
      status: values.status || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      website: values.website || null,
      description: values.description || null,
    }
    try {
      if (formMode === "create") {
        await api.createAssociation(payload)
        toast({ title: "Förening skapad" })
      } else if (formAssociation) {
        await api.updateAssociation(formAssociation.id, payload)
        toast({ title: "Förening uppdaterad" })
      }
      setFormOpen(false)
      await loadAssociations()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte spara förening"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteAssociation = async () => {
    if (!deleteTarget) return
    setDeleteSubmitting(true)
    try {
      await api.deleteAssociation(deleteTarget.id)
      toast({ title: "Förening markerad som borttagen" })
      setDeleteTarget(null)
      await loadAssociations()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte radera förening"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const openTagDialog = (assoc: AssociationRecord) => {
    setTagAssociation(assoc)
    setTagSelection(assoc.tags.map((tag) => tag.id))
    setTagsOpen(true)
  }

  const toggleTag = async (tagId: number, checked: boolean) => {
    if (!tagAssociation) return
    setTagSubmitting(true)
    try {
      if (checked) {
        await api.attachTag(tagAssociation.id, tagId)
        toast({ title: "Tagg tillagd" })
      } else {
        await api.detachTag(tagAssociation.id, tagId)
        toast({ title: "Tagg borttagen" })
      }
      setTagSelection((prev) => {
        const next = new Set(prev)
        if (checked) next.add(tagId)
        else next.delete(tagId)
        return Array.from(next)
      })
      setAssociations((prev) =>
        prev.map((item) => {
          if (item.id !== tagAssociation.id) return item
          const sourceTag = tags.find((tag) => tag.id === tagId)
          const updatedTags = checked
            ? [...item.tags.filter((tag) => tag.id !== tagId), ...(sourceTag ? [sourceTag] : [])]
            : item.tags.filter((tag) => tag.id !== tagId)
          return { ...item, tags: updatedTags }
        }),
      )
      setTagAssociation((prev) => {
        if (!prev || prev.id !== tagAssociation.id) return prev
        const sourceTag = tags.find((tag) => tag.id === tagId)
        const updatedTags = checked
          ? [...prev.tags.filter((tag) => tag.id !== tagId), ...(sourceTag ? [sourceTag] : [])]
          : prev.tags.filter((tag) => tag.id !== tagId)
        return { ...prev, tags: updatedTags }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera taggar"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setTagSubmitting(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    setTagSubmitting(true)
    try {
      const result = await api.createTag(newTagName.trim())
      const created: Tag = { id: result.id, name: newTagName.trim() }
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTagName("")
      setTagSelection((prev) => [...prev, created.id])
      if (tagAssociation) {
        await api.attachTag(tagAssociation.id, created.id)
        setAssociations((prev) =>
          prev.map((item) => {
            if (item.id !== tagAssociation.id) return item
            return { ...item, tags: [...item.tags, created] }
          }),
        )
        setTagAssociation((prev) => {
          if (!prev || prev.id !== tagAssociation.id) return prev
          return { ...prev, tags: [...prev.tags, created] }
        })
      }
      toast({ title: "Tagg skapad" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte skapa tagg"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setTagSubmitting(false)
    }
  }

  const openNotesDialog = async (assoc: AssociationRecord) => {
    setNotesAssociation(assoc)
    setNotesOpen(true)
    setNotes([])
    setNoteContent("")
    setNotesLoading(true)
    try {
      const result = await api.getNotes(assoc.id)
      setNotes(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta anteckningar"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setNotesLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!notesAssociation || !noteContent.trim()) return
    setNoteSubmitting(true)
    try {
      await api.addNote(notesAssociation.id, noteContent.trim())
      const updated = await api.getNotes(notesAssociation.id)
      setNotes(updated)
      setNoteContent("")
      toast({ title: "Anteckning sparad" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte spara anteckning"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setNoteSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Föreningar</h1>
            <p className="text-sm text-muted-foreground">Hantera föreningar, taggar och anteckningar.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void loadAssociations()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Uppdatera
            </Button>
            <Button onClick={handleCreateAssociation}>
              <Plus className="mr-2 h-4 w-4" /> Ny förening
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await logout()
                router.replace("/login")
              }}
            >
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-6">
        <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,1fr]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök efter namn eller beskrivning"
                value={filters.q}
                onChange={(event) => handleFilterChange({ q: event.target.value })}
              />
            </div>
            <Select
              value={filters.municipality ?? ""}
              onValueChange={(value) => handleFilterChange({ municipality: value === "" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kommun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alla kommuner</SelectItem>
                {municipalities.map((municipality) => (
                  <SelectItem key={municipality.id} value={String(municipality.id)}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.type ?? ""}
              onValueChange={(value) => handleFilterChange({ type: value === "" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alla typer</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status ?? ""}
              onValueChange={(value) => handleFilterChange({ status: value === "" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alla statusar</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr,1fr,1fr]">
            <div className="rounded-md border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Taggar</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const checked = filters.tags?.includes(String(tag.id)) ?? false
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setFilters((prev) => {
                          const current = new Set(prev.tags ?? [])
                          if (current.has(String(tag.id))) current.delete(String(tag.id))
                          else current.add(String(tag.id))
                          return { ...prev, tags: Array.from(current), page: 1 }
                        })
                      }}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  )
                })}
                {tags.length === 0 && <p className="text-sm text-muted-foreground">Inga taggar skapade ännu.</p>}
              </div>
            </div>
            <Select
              value={filters.sort ?? "updated_desc"}
              onValueChange={(value) => handleFilterChange({ sort: value as AssocFilters["sort"] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sortering" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(filters.pageSize)}
              onValueChange={(value) => handleFilterChange({ pageSize: Number(value), page: 1 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Poster per sida" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} per sida
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="rounded-lg border bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Hämtar föreningar…
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Kommun</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Taggar</TableHead>
                  <TableHead>Uppdaterad</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associations.map((association) => (
                  <TableRow key={association.id}>
                    <TableCell className="font-medium">{association.name}</TableCell>
                    <TableCell>{association.municipality_name ?? "-"}</TableCell>
                    <TableCell>{association.type ?? "-"}</TableCell>
                    <TableCell>{association.status ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {association.tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Inga taggar</span>
                        ) : (
                          association.tags.map((tag) => (
                            <Badge key={tag.id} variant="secondary">
                              {tag.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {association.updated_at
                        ? format(new Date(association.updated_at), "PPP", { locale: sv })
                        : "-"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openNotesDialog(association)}>
                        <Notebook className="mr-1 h-4 w-4" /> Anteckningar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openTagDialog(association)}>
                        <TagIcon className="mr-1 h-4 w-4" /> Taggar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditAssociation(association)}>
                        <Pencil className="mr-1 h-4 w-4" /> Redigera
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(association)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Ta bort
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {associations.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      Inga föreningar matchar din filtrering.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </section>

        <footer className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
          <span>
            Sida {filters.page} av {pageCount} — {total} resultat
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => handleFilterChange({ page: filters.page - 1 })}
            >
              Föregående
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= pageCount}
              onClick={() => handleFilterChange({ page: filters.page + 1 })}
            >
              Nästa
            </Button>
          </div>
        </footer>
      </main>

      <AssociationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        defaults={formDefaults}
        municipalities={municipalities}
        onSubmit={handleSubmitAssociation}
        submitting={formSubmitting}
      />

      <TagsDialog
        open={tagsOpen}
        onOpenChange={setTagsOpen}
        association={tagAssociation}
        tags={tags}
        selection={tagSelection}
        submitting={tagSubmitting}
        newTagName={newTagName}
        onNewTagNameChange={setNewTagName}
        onToggleTag={toggleTag}
        onCreateTag={handleCreateTag}
      />

      <NotesDialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        association={notesAssociation}
        notes={notes}
        loading={notesLoading}
        noteContent={noteContent}
        onNoteContentChange={setNoteContent}
        onAddNote={handleAddNote}
        submitting={noteSubmitting}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort förening</AlertDialogTitle>
            <AlertDialogDescription>
              Företaget kommer att markeras som borttaget men finns kvar i databasen. Är du säker på att du vill fortsätta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssociation} disabled={deleteSubmitting}>
              {deleteSubmitting ? "Arbetar…" : "Bekräfta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AssociationFormDialog({
  open,
  onOpenChange,
  mode,
  defaults,
  municipalities,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  defaults: AssociationFormState
  municipalities: Municipality[]
  onSubmit: (values: AssociationFormState) => Promise<void>
  submitting: boolean
}) {
  const [formState, setFormState] = useState<AssociationFormState>(defaults)

  useEffect(() => {
    setFormState(defaults)
  }, [defaults, open])

  const handleChange = (field: keyof AssociationFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    await onSubmit(formState)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ny förening" : "Redigera förening"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input
            placeholder="Föreningens namn"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
          />
          <Select
            value={formState.municipality_id}
            onValueChange={(value) => handleChange("municipality_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kommun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Ingen kommun</SelectItem>
              {municipalities.map((municipality) => (
                <SelectItem key={municipality.id} value={String(municipality.id)}>
                  {municipality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Typ" value={formState.type} onChange={(event) => handleChange("type", event.target.value)} />
          <Input
            placeholder="Status"
            value={formState.status}
            onChange={(event) => handleChange("status", event.target.value)}
          />
          <Input placeholder="E-post" value={formState.email} onChange={(event) => handleChange("email", event.target.value)} />
          <Input placeholder="Telefon" value={formState.phone} onChange={(event) => handleChange("phone", event.target.value)} />
          <Input
            placeholder="Adress"
            value={formState.address}
            onChange={(event) => handleChange("address", event.target.value)}
          />
          <Input
            placeholder="Webbplats"
            value={formState.website}
            onChange={(event) => handleChange("website", event.target.value)}
          />
          <Textarea
            placeholder="Beskrivning"
            value={formState.description}
            onChange={(event) => handleChange("description", event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sparar…" : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TagsDialog({
  open,
  onOpenChange,
  association,
  tags,
  selection,
  submitting,
  newTagName,
  onNewTagNameChange,
  onToggleTag,
  onCreateTag,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  association: AssociationRecord | null
  tags: Tag[]
  selection: number[]
  submitting: boolean
  newTagName: string
  onNewTagNameChange: (value: string) => void
  onToggleTag: (tagId: number, checked: boolean) => void
  onCreateTag: () => Promise<void>
}) {
  const selected = useMemo(() => new Set(selection), [selection])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hantera taggar för {association?.name ?? ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {tags.map((tag) => {
              const checked = selected.has(tag.id)
              return (
                <label key={tag.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => onToggleTag(tag.id, Boolean(value))}
                      disabled={submitting}
                    />
                    <span>{tag.name}</span>
                  </div>
                </label>
              )
            })}
            {tags.length === 0 && <p className="text-sm text-muted-foreground">Inga taggar skapade ännu.</p>}
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Ny tagg"
              value={newTagName}
              onChange={(event) => onNewTagNameChange(event.target.value)}
            />
            <Button onClick={onCreateTag} disabled={submitting || !newTagName.trim()}>
              Skapa tagg
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Stäng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NotesDialog({
  open,
  onOpenChange,
  association,
  notes,
  loading,
  noteContent,
  onNoteContentChange,
  onAddNote,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  association: AssociationRecord | null
  notes: Note[]
  loading: boolean
  noteContent: string
  onNoteContentChange: (value: string) => void
  onAddNote: () => Promise<void>
  submitting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Anteckningar för {association?.name ?? ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="h-64 rounded-md border">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hämtar anteckningar…
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-3 p-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-md border bg-muted/30 p-3">
                      <p className="text-sm whitespace-pre-line">{note.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {note.author ?? "Okänd"} – {format(new Date(note.created_at), "PPP HH:mm", { locale: sv })}
                      </p>
                    </div>
                  ))}
                  {notes.length === 0 && <p className="text-sm text-muted-foreground">Inga anteckningar ännu.</p>}
                </div>
              </ScrollArea>
            )}
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Lägg till en anteckning"
              value={noteContent}
              onChange={(event) => onNoteContentChange(event.target.value)}
            />
            <Button onClick={onAddNote} disabled={submitting || !noteContent.trim()}>
              {submitting ? "Sparar…" : "Spara anteckning"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Stäng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
