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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { api, type Association, type AssocFilters, type Municipality, type Note } from "@/lib/api"
import { useAuth } from "@/lib/providers/auth-provider"
import { Loader2, Plus, RefreshCcw, Notebook, Pencil, Trash2, Filter, X } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { AssociationDetailsDialog } from "@/components/modals/association-details-dialog"

type AssociationRecord = Association

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
  page: number
  pageSize: number
  sort: NonNullable<AssocFilters["sort"]>
}

const DEFAULT_FILTERS: AssociationsFiltersState = {
  q: "",
  municipality: "",
  type: "",
  status: "",
  page: 1,
  pageSize: 20,
  sort: "updated_desc",
}

const FILTER_ALL_VALUE = "__all__"
const SELECT_NONE_VALUE = "__none__"

const SORT_OPTIONS = [
  { value: "updated_desc" as const, label: "Senast uppdaterad" },
  { value: "updated_asc" as const, label: "Äldst uppdaterad" },
  { value: "name_asc" as const, label: "Namn A-Ö" },
  { value: "name_desc" as const, label: "Namn Ö-A" },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

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
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formAssociation, setFormAssociation] = useState<AssociationRecord | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const [notesOpen, setNotesOpen] = useState(false)
  const [notesAssociation, setNotesAssociation] = useState<AssociationRecord | null>(null)
  const [notesLoading, setNotesLoading] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AssociationRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [detailAssociationId, setDetailAssociationId] = useState<string | null>(null)

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
      description: typeof formAssociation.description === "string" ? formAssociation.description : "",
    }
  }, [formAssociation])

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / filters.pageSize)), [total, filters.pageSize])
  const rowOffset = useMemo(
    () => Math.max(0, (filters.page - 1) * filters.pageSize),
    [filters.page, filters.pageSize],
  )

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
      setAssociations(result.items as AssociationRecord[])
      setTotal(result.total)
      const types = Array.from(new Set(result.items.map((item) => item.type).filter(Boolean))) as string[]
      const statuses = Array.from(new Set(result.items.map((item) => item.status).filter(Boolean))) as string[]
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
        const municipalityList = await api.getMunicipalities()
        setMunicipalities(municipalityList)
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

  const headerActions = (
    <div className="flex items-center gap-2">
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
  )

  return (
    <AppLayout title="Föreningar" description="Hantera föreningar och anteckningar." actions={headerActions}>
      <div className="space-y-6">
        <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök efter namn eller beskrivning"
                value={filters.q}
                onChange={(event) => handleFilterChange({ q: event.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                value={filters.municipality ?? ""}
                onValueChange={(value) =>
                  handleFilterChange({ municipality: value === FILTER_ALL_VALUE ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kommun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL_VALUE}>Alla kommuner</SelectItem>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={String(municipality.id)}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.type ?? ""}
                onValueChange={(value) =>
                  handleFilterChange({ type: value === FILTER_ALL_VALUE ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL_VALUE}>Alla typer</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status ?? ""}
                onValueChange={(value) =>
                  handleFilterChange({ status: value === FILTER_ALL_VALUE ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL_VALUE}>Alla statusar</SelectItem>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedMunicipality ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-3">
              <span className="text-sm font-medium text-muted-foreground">Aktiv kommun:</span>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1 rounded-full"
                onClick={handleClearMunicipalityFilter}
              >
                {selectedMunicipality.name}
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
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
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Kommun</TableHead>
                  <TableHead>Förening</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Föreningstyp</TableHead>
                  <TableHead>Uppdaterad</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associations.map((association, index) => {
                  const rowNumber = rowOffset + index + 1
                  const primaryContact = association.primary_contact ?? null
                  const contactName = primaryContact?.name ?? "Ingen primär kontakt"
                  const contactEmail =
                    association.email ?? primaryContact?.email ?? "Ingen e-post registrerad"
                  const contactPhone =
                    association.phone ??
                    primaryContact?.phone ??
                    primaryContact?.mobile ??
                    "Ingen telefon registrerad"
                  const typeValues =
                    association.types && association.types.length > 0
                      ? association.types
                      : association.type
                        ? association.type
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean)
                        : []
                  return (
                    <TableRow key={association.id}>
                      <TableCell className="text-xs text-muted-foreground">{rowNumber}</TableCell>
                      <TableCell className="space-y-1">
                        <div className="font-medium">{association.municipality_name ?? "Okänd"}</div>
                        <div className="text-xs text-muted-foreground">
                          {association.city ?? "Stad saknas"}
                        </div>
                      </TableCell>
                      <TableCell className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setDetailAssociationId(association.id)}
                          className="font-semibold text-left text-primary hover:underline"
                        >
                          {association.name}
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {association.org_number
                            ? `Org.nr ${association.org_number}`
                            : "Organisationsnummer saknas"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {association.status ? (
                          <Badge variant="outline" className="uppercase">
                            {association.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ingen status</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {association.pipeline ? (
                          <Badge variant="secondary" className="uppercase">
                            {association.pipeline}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ingen pipeline</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{contactName}</div>
                          <div className="text-xs text-muted-foreground">{contactEmail}</div>
                          <div className="text-xs text-muted-foreground">{contactPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {typeValues.length ? (
                          <div className="flex flex-wrap gap-1">
                            {typeValues.slice(0, 3).map((type) => (
                              <Badge key={type} variant="outline" className="text-xs font-medium">
                                {type}
                              </Badge>
                            ))}
                            {typeValues.length > 3 ? (
                              <Badge variant="secondary" className="text-xs">
                                +{typeValues.length - 3}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ej klassificerad</span>
                        )}
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
                        <Button variant="outline" size="sm" onClick={() => handleEditAssociation(association)}>
                          <Pencil className="mr-1 h-4 w-4" /> Redigera
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(association)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Ta bort
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {associations.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
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

      <AssociationDetailsDialog
        associationId={detailAssociationId}
        open={detailAssociationId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailAssociationId(null)
          }
        }}
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
            onValueChange={(value) =>
              handleChange("municipality_id", value === SELECT_NONE_VALUE ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Kommun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE_VALUE}>Ingen kommun</SelectItem>
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
