"use client"

import type { JSX } from "react"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
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
import { cn } from "@/lib/utils"
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
  Mail,
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/app-layout"
import { EditAssociationModal } from "@/components/modals/edit-association-modal"
import { AddNoteModal } from "@/components/modals/add-note-modal"
import { ContactHubModal, type ContactHubAssociationSummary } from "@/components/modals/contact-hub-modal"
import { AssociationDetailsDialog } from "@/components/modals/association-details-dialog"
import { AddAssociationsToGroupModal } from "@/components/modals/add-associations-to-group-modal"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import { associationUpdateSchema, type AssociationUpdateInput } from "@/lib/validators/association"

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
  pageSize: 100,
  sort: "updated_desc",
}

const SORT_OPTIONS = [
  { value: "updated_desc" as const, label: "Senast uppdaterad" },
  { value: "updated_asc" as const, label: "Äldst uppdaterad" },
  { value: "name_asc" as const, label: "Namn A-Ö" },
  { value: "name_desc" as const, label: "Namn Ö-A" },
]

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500]

function parseFiltersFromParams(params: URLSearchParams | null): AssociationsFiltersState {
  const next: AssociationsFiltersState = {
    ...DEFAULT_FILTERS,
  }

  if (!params) {
    return next
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

interface SortableHeaderProps {
  column: string
  currentSort: string
  onSort: (column: string) => void
  children: React.ReactNode
  className?: string
}

function SortableHeader({ column, currentSort, onSort, children, className }: SortableHeaderProps) {
  const isAsc = currentSort === `${column}_asc`
  const isDesc = currentSort === `${column}_desc`
  const isActive = isAsc || isDesc

  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium"
      >
        <span>{children}</span>
        {isActive ? (
          isAsc ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-40" />
        )}
      </button>
    </TableHead>
  )
}

function AssociationsPageInner(): JSX.Element {
  const { toast } = useToast()
  const { logout, refresh } = useAuth()
  const pathname = usePathname()
  const [filters, setFilters] = useState<AssociationsFiltersState>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_FILTERS
    }
    return parseFiltersFromParams(new URLSearchParams(window.location.search))
  })
  const initialQuery = typeof window === "undefined" ? "" : window.location.search.slice(1)
  const lastSyncedQueryRef = useRef<string>(initialQuery)
  const hasBootstrappedRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [associations, setAssociations] = useState<AssociationRecord[]>([])
  const [total, setTotal] = useState(0)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(filters.q)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editAssociation, setEditAssociation] = useState<AssociationRecord | null>(null)

  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [contactsAssociation, setContactsAssociation] = useState<ContactHubAssociationSummary | null>(null)
  const [contactsSelectedContactId, setContactsSelectedContactId] = useState<string | null>(null)

  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsAssociation, setDetailsAssociation] = useState<AssociationRecord | null>(null)

  const [groupModalOpen, setGroupModalOpen] = useState(false)

  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [emailAssociation, setEmailAssociation] = useState<AssociationRecord | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<AssociationRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [selectedAssociations, setSelectedAssociations] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const incomingQuery = params.toString()
      lastSyncedQueryRef.current = incomingQuery
      const newFilters = parseFiltersFromParams(params)
      setFilters(newFilters)
      setSearchInput(newFilters.q)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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

    if (typeof window !== "undefined" && window.history?.replaceState) {
      const current = `${window.location.pathname}${window.location.search}`
      if (current !== target) {
        window.history.replaceState(null, "", target)
      }
    }
  }, [filters, pathname])

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

  const handleSearchChange = (value: string) => {
    setSearchInput(value)

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout to update filters after 300ms
    searchTimeoutRef.current = setTimeout(() => {
      handleFilterChange({ q: value, page: 1 })
    }, 300)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

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

  const handleSortChange = (column: string) => {
    const currentSort = filters.sort
    let newSort: AssocFilters["sort"] = "updated_desc"

    // Toggle between asc/desc for the same column
    if (column === "name") {
      newSort = currentSort === "name_asc" ? "name_desc" : "name_asc"
    } else if (column === "updated") {
      newSort = currentSort === "updated_desc" ? "updated_asc" : "updated_desc"
    } else if (column === "created") {
      newSort = currentSort === "created_desc" ? "created_asc" : "created_desc"
    } else if (column === "crm_status") {
      newSort = currentSort === "crm_status_asc" ? "crm_status_desc" : "crm_status_asc"
    } else if (column === "pipeline") {
      newSort = currentSort === "pipeline_asc" ? "pipeline_desc" : "pipeline_asc"
    } else if (column === "municipality") {
      newSort = currentSort === "municipality_asc" ? "municipality_desc" : "municipality_asc"
    } else if (column === "email") {
      newSort = currentSort === "email_asc" ? "email_desc" : "email_asc"
    } else if (column === "type") {
      newSort = currentSort === "type_asc" ? "type_desc" : "type_asc"
    }

    handleFilterChange({ sort: newSort })
  }

  const handleToggleAll = () => {
    if (selectedAssociations.size === associations.length && associations.length > 0) {
      setSelectedAssociations(new Set())
    } else {
      setSelectedAssociations(new Set(associations.map((a) => a.id)))
    }
  }

  const handleToggleAssociation = (id: string) => {
    setSelectedAssociations((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
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

  const openNotesDialog = (assoc: AssociationRecord) => {
    setNotesAssociation(assoc)
    setNotesOpen(true)
  }

  const handleOpenEditModal = (assoc: AssociationRecord) => {
    setEditAssociation(assoc)
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (values: AssociationUpdateInput) => {
    if (!editAssociation) return
    setFormSubmitting(true)
    try {
      // Convert camelCase to snake_case for API
      const payload: Partial<Association> = {
        crm_status: values.crmStatus,
        pipeline: values.pipeline,
        is_member: values.isMember,
        member_since: values.memberSince ?? null,
        street_address: values.streetAddress ?? null,
        postal_code: values.postalCode ?? null,
        city: values.city ?? null,
        email: values.email ?? null,
        phone: values.phone ?? null,
        website: values.homepageUrl ?? null,
        activities: values.activities ?? [],
        description: values.otherInformation ?? null,
        description_free_text: values.descriptionFreeText ?? null,
      }

      // Handle assigned_to separately to avoid type error
      if (values.assignedToId) {
        (payload as any).assigned_to_id = values.assignedToId
      }

      await api.updateAssociation(editAssociation.id, payload)

      // If there are notes, add them separately
      if (values.notes?.trim()) {
        await api.addNote(editAssociation.id, values.notes.trim())
      }

      toast({ title: "Förening uppdaterad" })
      setEditModalOpen(false)
      await loadAssociations()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera förening"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleOpenContactsModal = (assoc: Association, contactId?: string | null) => {
    setContactsAssociation({
      id: assoc.id,
      name: assoc.name,
      municipalityName: assoc.municipality_name ?? assoc.municipality ?? null,
      streetAddress: assoc.street_address ?? (assoc as any).streetAddress ?? null,
      postalCode: assoc.postal_code ?? (assoc as any).postalCode ?? null,
      city: assoc.city ?? assoc.municipality ?? null,
    })
    setContactsSelectedContactId(contactId ?? (assoc as any).primary_contact?.id ?? null)
    setContactsModalOpen(true)
  }

  const handleOpenDetailsModal = (assoc: AssociationRecord) => {
    setDetailsAssociation(assoc)
    setDetailsModalOpen(true)
  }

  const handleOpenGroupModal = () => {
    setGroupModalOpen(true)
  }

  const handleGroupModalCompleted = () => {
    setSelectedAssociations(new Set())
    void loadAssociations()
  }

  const handleOpenEmailModal = (assoc: AssociationRecord) => {
    setEmailAssociation(assoc)
    setSendEmailModalOpen(true)
  }

  return (
    <AppLayout
      title="Föreningar"
      description={`Visar ${associations.length} av ${total} föreningar${selectedAssociations.size > 0 ? ` (${selectedAssociations.size} valda)` : ""}`}
      actions={
        <div className="flex items-center gap-3">
          {selectedAssociations.size > 1 && (
            <Button variant="default" className="rounded-lg" onClick={handleOpenGroupModal}>
              <Layers className="w-4 h-4 mr-2" />
              Gruppera
            </Button>
          )}
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
                  value={searchInput}
                  onChange={(event) => handleSearchChange(event.target.value)}
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
                  <SelectValue placeholder={`${filters.pageSize} per sida`}>
                    {filters.pageSize} per sida
                  </SelectValue>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900">Föreningslista</CardTitle>
            {pageCount > 1 && (
              <div className="text-sm text-gray-600">
                Sida {filters.page} av {pageCount}
              </div>
            )}
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
                      <TableHead className="px-4 py-3 w-12">
                        <Checkbox
                          checked={selectedAssociations.size === associations.length && associations.length > 0}
                          onCheckedChange={handleToggleAll}
                          aria-label="Välj alla föreningar"
                        />
                      </TableHead>
                      <SortableHeader
                        column="municipality"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Kommun
                      </SortableHeader>
                      <SortableHeader
                        column="name"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Förening
                      </SortableHeader>
                      <SortableHeader
                        column="crm_status"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Status
                      </SortableHeader>
                      <SortableHeader
                        column="pipeline"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Pipeline
                      </SortableHeader>
                      <SortableHeader
                        column="email"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Kontakt
                      </SortableHeader>
                      <SortableHeader
                        column="type"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Föreningstyp
                      </SortableHeader>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Taggar</TableHead>
                      <SortableHeader
                        column="updated"
                        currentSort={filters.sort}
                        onSort={handleSortChange}
                        className="px-6 py-3 text-left text-sm text-gray-600"
                      >
                        Uppdaterad
                      </SortableHeader>
                      <TableHead className="px-6 py-3 text-left text-sm text-gray-600">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {associations.map((association) => (
                      <TableRow
                        key={association.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleOpenDetailsModal(association)}
                      >
                        <TableCell className="px-4 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedAssociations.has(association.id)}
                            onCheckedChange={() => handleToggleAssociation(association.id)}
                            aria-label={`Välj ${association.name}`}
                          />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{association.municipality_name ?? "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {association.website ? (
                              <a
                                href={association.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-gray-900 hover:text-orange-600 transition-colors hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {association.name}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-900">
                                {association.name}
                              </span>
                            )}
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
                            <span className="text-sm text-gray-900">
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
                        <TableCell className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditModal(association)
                              }}
                              title="Redigera"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openNotesDialog(association)
                              }}
                              title="Anteckningar"
                            >
                              <Notebook className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenContactsModal(association, association.primary_contact?.id ?? null)
                              }}
                              title="Kontakter"
                            >
                              <User className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEmailModal(association)
                              }}
                              title="Skicka e-post"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openTagDialog(association)
                              }}
                              title="Taggar"
                            >
                              <TagIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget(association)
                              }}
                              title="Ta bort"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {associations.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                          Inga föreningar matchar din filtrering.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {!loading && !error && pageCount > 1 && (
              <div className="border-t px-6 py-4">
                <Pagination
                  currentPage={filters.page}
                  totalPages={pageCount}
                  onPageChange={(page) => handleFilterChange({ page })}
                />
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

      <AddNoteModal
        open={notesOpen}
        onOpenChange={setNotesOpen}
        associationId={notesAssociation?.id ?? null}
        associationName={notesAssociation?.name ?? ""}
        onCompleted={() => loadAssociations()}
      />

      {editAssociation && (
        <EditAssociationModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          association={editAssociation}
          users={[]}
          onSubmit={handleEditSubmit}
          isSubmitting={formSubmitting}
        />
      )}

      <ContactHubModal
        association={contactsAssociation}
        open={contactsModalOpen}
        selectedContactId={contactsSelectedContactId}
        onOpenChange={(open) => {
          setContactsModalOpen(open)
          if (!open) {
            setContactsAssociation(null)
            setContactsSelectedContactId(null)
          }
        }}
        onUpdated={() => loadAssociations()}
      />

      <AssociationDetailsDialog
        associationId={detailsAssociation?.id ?? null}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onUpdated={() => loadAssociations()}
        onOpenContacts={(assoc) => handleOpenContactsModal(assoc, assoc.primary_contact?.id ?? null)}
      />

      <AddAssociationsToGroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        associationIds={Array.from(selectedAssociations)}
        onCompleted={handleGroupModalCompleted}
      />

      <SendEmailModal
        open={sendEmailModalOpen}
        onOpenChange={setSendEmailModalOpen}
        associationId={emailAssociation?.id ?? ""}
        associationName={emailAssociation?.name ?? ""}
        defaultRecipient={emailAssociation?.email}
        onCompleted={() => loadAssociations()}
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

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 10

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Calculate range to show
      let start = Math.max(2, currentPage - Math.floor(maxVisible / 2))
      let end = Math.min(totalPages - 1, start + maxVisible - 1)

      // Adjust start if we're near the end
      if (end === totalPages - 1) {
        start = Math.max(2, end - maxVisible + 1)
      }

      // Always show first page
      pages.push(1)

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3"
      >
        Föregående
      </Button>

      {pages.map((page, index) => (
        typeof page === 'number' ? (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={cn(
              "w-10",
              currentPage === page && "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            {page}
          </Button>
        ) : (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
            {page}
          </span>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        Nästa
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        Sista
      </Button>
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

