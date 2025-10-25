"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, Plus, Loader2, RefreshCcw, Mail, Pencil, Map, UserRoundPen, Home } from "lucide-react"
import { AdvancedFilterPanel, type AdvancedFilterState } from "@/components/filters/advanced-filter-panel"
import { MultiSelectOption } from "@/components/filters/multi-select-filter"
import { BulkActionsToolbar } from "@/components/filters/bulk-actions-toolbar"
import { ViewToggle, type ViewMode } from "@/components/filters/view-toggle"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { EditContactModal } from "@/components/modals/edit-contact-modal"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import { AssociationDetailsDialog } from "@/components/modals/association-details-dialog"
import { AssociationContactsModal } from "@/components/modals/association-contacts-modal"
import { api } from "@/lib/trpc/client"
import { CRM_STATUSES, PIPELINES, type AssociationUpdateInput } from "@/lib/validators/association"
import type { ContactFormValues, ContactUpdateValues } from "@/lib/validators/contact"
import type { EmailComposerValues } from "@/lib/validators/email"
import { toast } from "@/hooks/use-toast"
import type { Association, Contact, Tag, User, Activity } from "@prisma/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard } from "@/components/ui/hover-card"

type AssociationListItem = Association & {
  contacts?: Contact[]
  tags?: Tag[]
  _count?: { contacts: number; notes: number }
  assignedTo?: User | null
  activityLog?: Activity[]
}

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && "name" in item) {
          return String((item as Record<string, unknown>).name)
        }
        return typeof item === "number" ? String(item) : ""
      })
      .filter((item): item is string => Boolean(item?.length))
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return []
}

const ACTIVITY_TYPES: MultiSelectOption[] = [
  { label: "Anteckning", value: "NOTE_ADDED" },
  { label: "Mail skickat", value: "EMAIL_SENT" },
  { label: "Samtal", value: "CALL_MADE" },
  { label: "Möte", value: "MEETING_SCHEDULED" },
  { label: "Statusändring", value: "STATUS_CHANGED" },
]

const ACTIVITY_WINDOWS = [
  { label: "Senaste 7 dagarna", value: 7 },
  { label: "Senaste 30 dagarna", value: 30 },
  { label: "Senaste 90 dagarna", value: 90 },
]

const DEFAULT_FILTERS: AdvancedFilterState = {
  statuses: [],
  pipelines: [],
  types: [],
  activities: [],
  tags: [],
  assignedToId: undefined,
  hasEmail: undefined,
  hasPhone: undefined,
  isMember: undefined,
  dateRange: undefined,
  lastActivityDays: undefined,
  useSearchIndex: false,
}

export default function AssociationsPage() {
  const utils = api.useUtils()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<AdvancedFilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const limit = 10
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortBy, setSortBy] = useState<"updatedAt" | "name" | "createdAt" | "recentActivity">("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [contactTarget, setContactTarget] = useState<{ id: string; name: string } | null>(null)
  const [contactEditTarget, setContactEditTarget] = useState<
    | {
        associationName: string
        contact: Contact
      }
    | null
  >(null)
  const [emailTarget, setEmailTarget] = useState<AssociationListItem | null>(null)
  const [detailsAssociationId, setDetailsAssociationId] = useState<string | null>(null)
  const [contactsPanelAssociationId, setContactsPanelAssociationId] = useState<string | null>(null)

  const queryInput = useMemo(() => {
    return {
      page,
      limit,
      search: searchTerm.trim() || undefined,
      crmStatuses: filters.statuses.length ? filters.statuses : undefined,
      pipelines: filters.pipelines.length ? filters.pipelines : undefined,
      types: filters.types.length ? filters.types : undefined,
      activities: filters.activities.length ? filters.activities : undefined,
      tags: filters.tags.length ? filters.tags : undefined,
      hasEmail: typeof filters.hasEmail === "boolean" ? filters.hasEmail : undefined,
      hasPhone: typeof filters.hasPhone === "boolean" ? filters.hasPhone : undefined,
      isMember: typeof filters.isMember === "boolean" ? filters.isMember : undefined,
      assignedToId: filters.assignedToId || undefined,
      dateRange: filters.dateRange?.from
        ? {
            from: filters.dateRange.from,
            to: filters.dateRange.to,
          }
        : undefined,
      lastActivityDays: filters.lastActivityDays,
      sortBy,
      sortDirection,
    }
  }, [page, limit, searchTerm, filters, sortBy, sortDirection])

  const associationsQuery = api.association.list.useQuery(queryInput, {
    placeholderData: (previousData) => previousData,
  })
  const tagsQuery = api.tags.list.useQuery(undefined, { staleTime: 60_000 })

  const updateAssociation = api.association.update.useMutation({
    onSuccess: () => {
      utils.association.list.invalidate(queryInput)
      toast({ title: "Förening uppdaterad" })
    },
    onError: (error) => {
      toast({ title: "Misslyckades", description: error.message, variant: "destructive" })
    },
  })

  const createContact = api.contacts.create.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt skapad" })
      utils.association.list.invalidate(queryInput)
    },
    onError: (error) => toast({ title: "Kunde inte skapa kontakt", description: error.message, variant: "destructive" }),
  })

  const updateContact = api.contacts.update.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt uppdaterad" })
      utils.association.list.invalidate(queryInput)
    },
    onError: (error) => toast({ title: "Kunde inte uppdatera kontakt", description: error.message, variant: "destructive" }),
  })

  const deleteContactMutation = api.contacts.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt borttagen" })
      utils.association.list.invalidate(queryInput)
    },
    onError: (error) => toast({ title: "Kunde inte ta bort kontakt", description: error.message, variant: "destructive" }),
  })

  const exportAssociations = api.export.associations.useMutation({
    onError: (error) => toast({ title: "Exporten misslyckades", description: error.message, variant: "destructive" }),
  })

  const data = associationsQuery.data
  const associations = useMemo(() => (data?.associations ?? []) as AssociationListItem[], [data?.associations])
  const totalPages = data?.pagination.totalPages ?? 1

  const typeOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>()
    associations.forEach((association) => {
      if (Array.isArray(association.types)) {
        association.types.forEach((value) => {
          if (typeof value === 'string') {
            set.add(value)
          }
        })
      }
    })
    return Array.from(set).sort().map((value) => ({ label: value, value }))
  }, [associations])

  const tagOptions: MultiSelectOption[] = (tagsQuery.data ?? []).map((tag) => ({
    label: tag.name,
    value: tag.id,
    count: undefined,
  }))

  const userOptions: MultiSelectOption[] = useMemo(() => {
    const seen: Record<string, string> = {}
    associations.forEach((association: any) => {
      if (association.assignedTo) {
        seen[association.assignedTo.id] = association.assignedTo.name ?? "Namnlös"
      }
    })
    return Object.entries(seen).map(([value, label]) => ({ value, label }))
  }, [associations])

  const statusOptions: MultiSelectOption[] = CRM_STATUSES.map((status) => ({ label: status, value: status }))
  const pipelineOptions: MultiSelectOption[] = PIPELINES.map((pipeline) => ({ label: pipeline, value: pipeline }))

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleExport = async (format: "csv" | "json" | "xlsx") => {
    const result = await exportAssociations.mutateAsync({ format, search: searchTerm.trim() || undefined })
    const binary = atob(result.data)
    const buffer = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([buffer], { type: result.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({ title: "Export skapad", description: `Fil: ${result.filename}` })
  }

  const handleBulkAssign = async (ownerId: string | null) => {
    if (selectedIds.size === 0) return
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        updateAssociation.mutateAsync({
          id,
          data: {
            assignedToId: ownerId,
          },
        })
      )
    )
    clearSelection()
  }

  const handleFilterChange = (patch: Partial<AdvancedFilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
    }))
    setPage(1)
  }

  const handleStatusChange = async (
    association: AssociationListItem,
    status: AssociationUpdateInput["crmStatus"],
  ) => {
    if (status === association.crmStatus) return
    await updateAssociation.mutateAsync({
      id: association.id,
      data: { crmStatus: status },
    })
  }

  const handlePipelineChange = async (
    association: AssociationListItem,
    pipeline: AssociationUpdateInput["pipeline"],
  ) => {
    if (pipeline === association.pipeline) return
    await updateAssociation.mutateAsync({
      id: association.id,
      data: { pipeline },
    })
  }

  const handleCreateContact = async (values: ContactFormValues) => {
    await createContact.mutateAsync(values)
    setContactTarget(null)
    if (contactsPanelAssociationId) {
      await utils.association.getById.invalidate({ id: contactsPanelAssociationId })
    }
  }

  const handleUpdateContact = async (values: ContactUpdateValues) => {
    await updateContact.mutateAsync(values)
    setContactEditTarget(null)
    if (contactsPanelAssociationId) {
      await utils.association.getById.invalidate({ id: contactsPanelAssociationId })
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    await deleteContactMutation.mutateAsync({ id: contactId })
    setContactEditTarget(null)
    if (contactsPanelAssociationId) {
      await utils.association.getById.invalidate({ id: contactsPanelAssociationId })
    }
  }

  const handleSendEmail = async (values: EmailComposerValues) => {
    toast({ title: "E-post skickad", description: `E-post skickad till ${values.to}` })
  }

  const isLoading = associationsQuery.isPending

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Föreningar</h1>
          <p className="text-muted-foreground">Hantera föreningar, kontakter och kommunikation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => associationsQuery.refetch()} disabled={associationsQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Uppdatera
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Ny förening
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök föreningar, aktiviteter, kontakter..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Sortera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Senast uppdaterad</SelectItem>
                  <SelectItem value="name">Namn</SelectItem>
                  <SelectItem value="createdAt">Skapad</SelectItem>
                  <SelectItem value="recentActivity">Senaste aktivitet</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as typeof sortDirection)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Riktning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Fallande</SelectItem>
                  <SelectItem value="asc">Stigande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AdvancedFilterPanel
            state={filters}
            onChange={handleFilterChange}
            options={{
              statuses: statusOptions,
              pipelines: pipelineOptions,
              types: typeOptions,
              activities: ACTIVITY_TYPES,
              tags: tagOptions,
              users: userOptions,
              activityWindows: ACTIVITY_WINDOWS,
            }}
          />
          {filters.useSearchIndex && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Meilisearch</Badge>
              Avancerad sökning med extern indexering är aktiverad.
            </div>
          )}
        </CardContent>
      </Card>

      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onExport={handleExport}
        onAssignOwner={handleBulkAssign}
        owners={userOptions.map((user) => ({ id: user.value, name: user.label }))}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Alla föreningar</CardTitle>
            <p className="text-sm text-muted-foreground">
              {associationsQuery.data?.pagination.total ?? 0} resultat – sida {page} av {totalPages}
            </p>
          </div>
          {associationsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Laddar föreningar…
            </div>
          ) : associations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Filter className="h-8 w-8" />
              <p>Inga föreningar matchade dina filter.</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Val
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Kommun
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Förening
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Pipeline
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Kontaktinfo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Föreningstyp
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Taggar
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {associations.map((association) => {
                    const primaryContact = association.contacts?.[0]
                    const isSelected = selectedIds.has(association.id)
                    const typeValues = parseStringArray(association.types)
                    const activityValues = parseStringArray(association.activities)

                    return (
                      <tr key={association.id} className={isSelected ? "bg-primary/5" : undefined}>
                        <td className="px-4 py-3">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(association.id)} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{association.municipality ?? "Okänd"}</div>
                          <div className="text-xs text-muted-foreground">{association.city ?? "Stad saknas"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setDetailsAssociationId(association.id)}
                            className="font-semibold text-left text-primary hover:underline"
                          >
                            {association.name}
                          </button>
                          <div className="text-xs text-muted-foreground">
                            {association.orgNumber ? `Org.nr ${association.orgNumber}` : "Organisationsnummer saknas"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 rounded-full px-3 text-xs"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {association.crmStatus}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              {CRM_STATUSES.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onSelect={() => handleStatusChange(association, status as AssociationUpdateInput["crmStatus"])}
                                  className={status === association.crmStatus ? "bg-muted" : undefined}
                                >
                                  {status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 rounded-full px-3 text-xs"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {association.pipeline}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                              {PIPELINES.map((pipeline) => (
                                <DropdownMenuItem
                                  key={pipeline}
                                  onSelect={() =>
                                    handlePipelineChange(association, pipeline as AssociationUpdateInput["pipeline"])
                                  }
                                  className={pipeline === association.pipeline ? "bg-muted" : undefined}
                                >
                                  {pipeline}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setContactsPanelAssociationId(association.id)
                            }}
                            className="w-full rounded-md border border-dashed border-transparent text-left hover:border-border"
                          >
                            <div className="space-y-1 p-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-xs">
                                  {primaryContact?.name ?? "Ingen primär kontakt"}
                                </span>
                                {primaryContact?.isPrimary ? <Badge variant="outline">Primär</Badge> : null}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(association.email ?? primaryContact?.email) || "Ingen e-post registrerad"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(association.phone ?? primaryContact?.phone ?? primaryContact?.mobile) ||
                                  "Ingen telefon registrerad"}
                              </div>
                              <div className="text-[10px] text-muted-foreground">Klicka för att hantera kontakter</div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {typeValues.length ? (
                            <div className="flex flex-wrap gap-1">
                              {typeValues.slice(0, 3).map((type) => (
                                <Badge key={type} variant="outline" className="text-xs font-medium">
                                  {type}
                                </Badge>
                              ))}
                              {typeValues.length > 3 ? (
                                <Badge variant="secondary" className="text-xs">+{typeValues.length - 3}</Badge>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Ej klassificerad</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {activityValues.length ? (
                            <div className="flex flex-wrap gap-1">
                              {activityValues.slice(0, 3).map((activity) => (
                                <Badge key={activity} variant="outline" className="text-xs">
                                  {activity}
                                </Badge>
                              ))}
                              {activityValues.length > 3 ? (
                                <Badge variant="secondary" className="text-xs">+{activityValues.length - 3}</Badge>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Inga taggar</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <HoverCard
                              trigger={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setDetailsAssociationId(association.id)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <div className="space-y-1">
                                <p className="text-xs font-semibold">Redigera förening</p>
                                <p className="text-xs text-muted-foreground">
                                  Öppna detaljerad vy för {association.name}.
                                </p>
                              </div>
                            </HoverCard>
                            <HoverCard
                              trigger={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setContactsPanelAssociationId(association.id)
                                  }}
                                >
                                  <UserRoundPen className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Kontakter</p>
                                <p className="text-muted-foreground">
                                  Org.nr: {association.orgNumber ?? "Saknas"}
                                </p>
                                <p className="text-muted-foreground">
                                  E-post: {association.email ?? primaryContact?.email ?? "Inte angivet"}
                                </p>
                                <p className="text-muted-foreground">
                                  Telefon: {association.phone ?? primaryContact?.phone ?? primaryContact?.mobile ?? "Saknas"}
                                </p>
                                <p className="text-muted-foreground">
                                  Primär kontakt: {primaryContact?.name ?? "Ej definierad"}
                                </p>
                              </div>
                            </HoverCard>
                            <HoverCard
                              trigger={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setEmailTarget(association)
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Skicka e-post</p>
                                <p className="text-muted-foreground">
                                  Tillgängliga mottagare: {[association.email, primaryContact?.email]
                                    .filter(Boolean)
                                    .join(", ") || "Inga e-postadresser"}
                                </p>
                              </div>
                            </HoverCard>
                            <HoverCard
                              trigger={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={!association.homepageUrl}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    if (association.homepageUrl) {
                                      window.open(association.homepageUrl, "_blank", "noopener,noreferrer")
                                    }
                                  }}
                                >
                                  <Home className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Besök hemsida</p>
                                <p className="text-muted-foreground">
                                  {association.homepageUrl ?? "Ingen hemsida registrerad"}
                                </p>
                              </div>
                            </HoverCard>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {associations.map((association) => {
                const isSelected = selectedIds.has(association.id)
                const primaryContact = association.contacts?.[0]
                return (
                  <Card key={association.id} className={isSelected ? "border-primary" : undefined}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg">{association.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{association.municipality ?? "Okänd kommun"}</p>
                      </div>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(association.id)} />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">{association.crmStatus}</Badge>
                        <Badge variant="outline">{association.pipeline}</Badge>
                        {association.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="space-y-2 text-sm">
                        {association.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{association.email}</span>
                          </div>
                        )}
                        {association.phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">📞</span>
                            <span>{association.phone}</span>
                          </div>
                        )}
                        {association.streetAddress && (
                          <div className="text-xs text-muted-foreground">
                            {association.streetAddress}, {association.postalCode} {association.city}
                          </div>
                        )}
                        {association.activities && Array.isArray(association.activities) && association.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(association.activities as string[]).slice(0, 2).map((activity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {activity}
                              </Badge>
                            ))}
                            {(association.activities as string[]).length > 2 && (
                              <Badge variant="outline" className="text-xs">+{(association.activities as string[]).length - 2}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Ansvarig: {association.assignedTo?.name ?? "Obemannad"}</span>
                        <span>Uppdaterad {new Date(association.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => setDetailsAssociationId(association.id)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Redigera
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => setEmailTarget(association)}>
                          <Mail className="mr-2 h-4 w-4" /> Maila
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-12 text-center text-muted-foreground">
              <Map className="h-8 w-8" />
              <p>Kartvy kommer snart. Under tiden visas föreningarna i tabell eller kortvy.</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Föregående
            </Button>
            <span className="text-sm text-muted-foreground">
              Sida {page} av {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Nästa
            </Button>
          </div>
        </CardContent>
      </Card>

      {contactTarget && (
        <AddContactModal
          open={!!contactTarget}
          onOpenChange={(open) => (!open ? setContactTarget(null) : undefined)}
          associationId={contactTarget.id}
          associationName={contactTarget.name}
          onSubmit={async (values) => handleCreateContact(values)}
          isSubmitting={createContact.isPending}
        />
      )}

      {contactEditTarget && (
        <EditContactModal
          open={!!contactEditTarget}
          onOpenChange={(open) => (!open ? setContactEditTarget(null) : undefined)}
          contact={{
            id: contactEditTarget.contact.id,
            associationId: contactEditTarget.contact.associationId,
            name: contactEditTarget.contact.name,
            role: contactEditTarget.contact.role,
            email: contactEditTarget.contact.email,
            phone: contactEditTarget.contact.phone,
            mobile: contactEditTarget.contact.mobile,
            linkedinUrl: contactEditTarget.contact.linkedinUrl,
            facebookUrl: contactEditTarget.contact.facebookUrl,
            twitterUrl: contactEditTarget.contact.twitterUrl,
            instagramUrl: contactEditTarget.contact.instagramUrl,
            isPrimary: contactEditTarget.contact.isPrimary,
            associationName: contactEditTarget.associationName,
          }}
          onSubmit={handleUpdateContact}
          onDelete={() => handleDeleteContact(contactEditTarget.contact.id)}
          isSubmitting={updateContact.isPending}
          isDeleting={deleteContactMutation.isPending}
        />
      )}

      {emailTarget && (
        <SendEmailModal
          open={!!emailTarget}
          onOpenChange={(open) => (!open ? setEmailTarget(null) : undefined)}
          associationId={emailTarget.id}
          associationName={emailTarget.name}
          defaultRecipient={emailTarget.email ?? emailTarget.contacts?.[0]?.email ?? null}
          onSubmit={handleSendEmail}
          isSubmitting={false}
        />
      )}

      <AssociationDetailsDialog
        associationId={detailsAssociationId}
        open={Boolean(detailsAssociationId)}
        onOpenChange={(open) => (!open ? setDetailsAssociationId(null) : undefined)}
      />

      <AssociationContactsModal
        associationId={contactsPanelAssociationId}
        open={Boolean(contactsPanelAssociationId)}
        onOpenChange={(open) => (!open ? setContactsPanelAssociationId(null) : undefined)}
        isCreating={createContact.isPending}
        onSelectContactForEdit={(contact, associationName) =>
          setContactEditTarget({ associationName, contact })
        }
        onRequestAddContact={(associationId, associationName) =>
          setContactTarget({ id: associationId, name: associationName })
        }
      />
    </div>
  )
}
