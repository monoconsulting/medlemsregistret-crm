"use client"

import type { JSX } from "react"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReadonlyURLSearchParams } from "next/navigation"
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
import {
  Loader2,
  Plus,
  RefreshCcw,
  Tag as TagIcon,
  Notebook,
  Pencil,
  Trash2,
  Filter,
  X,
  Search as SearchIcon,
  Download,
  Layers,
  MapPin,
  Building2,
  User,
  Clock,
  Mail
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/app-layout"

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

type AssociationsFiltersState = {
  q: string
  municipality: string
  type: string
  status: string
  tags: string[]
  page: number
  pageSize: number
  sort: NonNullable<AssocFilters["sort"]>
}

const DEFAULT_FILTERS: AssociationsFiltersState = {
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

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500]

function parseFiltersFromParams(params: ReadonlyURLSearchParams): AssociationsFiltersState {
  const next: AssociationsFiltersState = {
    ...DEFAULT_FILTERS,
  }

  const qValue = params.get("q")
  if (qValue !== null) {
    next.q = qValue
  }

  const municipalityValue = params.get("municipality")
  if (municipalityValue) {
    next.municipality = municipalityValue
  }

  const typeValue = params.get("type")
  if (typeValue) {
    next.type = typeValue
  }

  const statusValue = params.get("status")
  if (statusValue) {
    next.status = statusValue
  }

  const tagsValue = params.get("tags")
  if (tagsValue) {
    next.tags = tagsValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  }

  const pageValue = Number.parseInt(params.get("page") ?? "", 10)
  if (Number.isInteger(pageValue) && pageValue > 0) {
    next.page = pageValue
  }

  const pageSizeValue = Number.parseInt(params.get("pageSize") ?? "", 10)
  if (Number.isInteger(pageSizeValue) && PAGE_SIZE_OPTIONS.includes(pageSizeValue)) {
    next.pageSize = pageSizeValue
  }

  const sortValue = params.get("sort")
  if (sortValue && SORT_OPTIONS.some((option) => option.value === sortValue)) {
    next.sort = sortValue as AssociationsFiltersState["sort"]
  }

  return next
}

function buildQueryFromFilters(filters: AssociationsFiltersState): string {
  const params = new URLSearchParams()

  if (filters.q) {
    params.set("q", filters.q)
  }

  if (filters.municipality) {
    params.set("municipality", filters.municipality)
  }

  if (filters.type) {
    params.set("type", filters.type)
  }

  if (filters.status) {
    params.set("status", filters.status)
  }

  if (filters.tags.length > 0) {
    params.set("tags", filters.tags.join(","))
  }

  if (filters.page !== DEFAULT_FILTERS.page) {
    params.set("page", String(filters.page))
  }

  if (filters.pageSize !== DEFAULT_FILTERS.pageSize) {
    params.set("pageSize", String(filters.pageSize))
  }

  if (filters.sort !== DEFAULT_FILTERS.sort) {
    params.set("sort", filters.sort)
  }

  return params.toString()
}

export default function AssociationsPage(): JSX.Element {
  return (
    <Suspense fallback={<AssociationsPageFallback />}>
      <AssociationsPageInner />
    </Suspense>
  )
}

function AssociationsPageFallback(): JSX.Element {
  return (
    <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Laddar föreningar...</span>
    </div>
  )
}

function AssociationsPageInner(): JSX.Element {
  const { toast } = useToast()
  const { logout, refresh } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<AssociationsFiltersState>(() => parseFiltersFromParams(searchParams))
  const lastSyncedQueryRef = useRef<string>(searchParams.toString())
  const hasBootstrappedRef = useRef(false)
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
  const [tagSelection, setTagSelection] = useState<string[]>([])
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
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([])

  useEffect(() => {
    const incomingQuery = searchParams.toString()
    if (!hasBootstrappedRef.current) {
      lastSyncedQueryRef.current = incomingQuery
      return
    }

    if (incomingQuery === lastSyncedQueryRef.current) {
      return
    }

    lastSyncedQueryRef.current = incomingQuery
    setFilters(parseFiltersFromParams(searchParams))
  }, [searchParams])

  useEffect(() => {
    const nextQuery = buildQueryFromFilters(filters)
    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true
      lastSyncedQueryRef.current = nextQuery
      return
    }

    if (nextQuery === lastSyncedQueryRef.current) {
      return
    }

    lastSyncedQueryRef.current = nextQuery
    const target = nextQuery ? `${pathname}?${nextQuery}` : pathname
    router.replace(target, { scroll: false })
  }, [filters, pathname, router])

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
      description: typeof formAssociation.description === "string" ? formAssociation.description : (formAssociation.description ? JSON.stringify(formAssociation.description) : ""),
    }
  }, [formAssociation])

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / filters.pageSize)), [total, filters.pageSize])

  const selectedMunicipality = useMemo(() => {
    if (!filters.municipality) {
      return null
    }

    return municipalities.find((municipality) => String(municipality.id) === String(filters.municipality)) ?? null
  }, [filters.municipality, municipalities])

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
    setFilters((prev) => {
      const merged: AssociationsFiltersState = {
        ...prev,
        ...next,
      }

      if (next.page === undefined || (typeof next.page === "number" && next.page < 1)) {
        merged.page = 1
      }

      return merged
    })
  }

  const handleClearMunicipalityFilter = () => {
    handleFilterChange({ municipality: "", page: 1 })
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
      municipality_id: values.municipality_id ? values.municipality_id : null,
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

  const toggleTag = async (tagId: string, checked: boolean) => {
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
    <AppLayout
      title="Föreningar"
      description={`Visar ${associations.length} av ${total} föreningar${selectedAssociations.length > 0 ? ` (${selectedAssociations.length} valda)` : ""}`}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Exportera
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-gray-200 rounded-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Sök föreningar eller ansvariga..."
                  value={filters.q}
                  onChange={(event) => handleFilterChange({ q: event.target.value })}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.municipality || "__all__"}
                onValueChange={(value) => handleFilterChange({ municipality: value === "__all__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kommun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Alla kommuner</SelectItem>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={String(municipality.id)}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type || "__all__"}
                onValueChange={(value) => handleFilterChange({ type: value === "__all__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Alla kategorier</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(filters.pageSize)}
                onValueChange={(value) => handleFilterChange({ pageSize: Number(value), page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue />
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
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Föreningslista</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Hämtar föreningar…
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-destructive">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Kommun</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Förening</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Status</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Pipeline</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Kontakt</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Föreningstyp</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Taggar</TableHead>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Uppdaterad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {associations.map((association) => (
                      <TableRow key={association.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{association.municipality_name ?? "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 hover:text-orange-600 transition-colors">
                              {association.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={
                              association.status === 'Aktiv' ? 'border-green-200 text-green-700 bg-green-50' :
                              association.status === 'Inaktiv' ? 'border-gray-200 text-gray-700 bg-gray-50' :
                              'border-yellow-200 text-yellow-700 bg-yellow-50'
                            }
                          >
                            {association.status ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                            {association.type ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 hover:text-orange-600 transition-colors">
                              {association.email || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="border-gray-200 text-gray-700"
                          >
                            {association.type ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {association.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-700"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {association.tags.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gray-100 text-gray-700"
                              >
                                +{association.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {association.updated_at
                                ? format(new Date(association.updated_at), "yyyy-MM-dd", { locale: sv })
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {associations.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                          Inga föreningar matchar din filtrering.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

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
    </AppLayout>
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
  selection: string[]
  submitting: boolean
  newTagName: string
  onNewTagNameChange: (value: string) => void
  onToggleTag: (tagId: string, checked: boolean) => void
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
