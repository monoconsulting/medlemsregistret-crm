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
import {
  Search,
  Filter,
  Plus,
  Loader2,
  RefreshCcw,
  Mail,
  Pencil,
  Map,
  Home,
  UserRound,
} from "lucide-react"
import { AdvancedFilterPanel, type AdvancedFilterState } from "@/components/filters/advanced-filter-panel"
import { MultiSelectOption } from "@/components/filters/multi-select-filter"
import { BulkActionsToolbar } from "@/components/filters/bulk-actions-toolbar"
import { ViewToggle, type ViewMode } from "@/components/filters/view-toggle"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import { AssociationDetailModal } from "@/components/modals/association-detail-modal"
import { ManageContactsModal } from "@/components/modals/manage-contacts-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { api } from "@/lib/trpc/client"
import { CRM_STATUSES, PIPELINES, type AssociationUpdateInput } from "@/lib/validators/association"
import type { EmailComposerValues } from "@/lib/validators/email"
import { toast } from "@/hooks/use-toast"
import type { Association, Contact, Tag, User, Activity } from "@prisma/client"

type AssociationListItem = Association & {
  contacts?: Contact[]
  tags?: Tag[]
  _count?: { contacts: number; notes: number }
  assignedTo?: User | null
  activityLog?: Activity[]
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

  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)
  const [contactManagerTarget, setContactManagerTarget] = useState<AssociationListItem | null>(null)
  const [contactPopoverId, setContactPopoverId] = useState<string | null>(null)
  const [emailTarget, setEmailTarget] = useState<AssociationListItem | null>(null)

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

  const exportAssociations = api.export.associations.useMutation({
    onError: (error) => toast({ title: "Exporten misslyckades", description: error.message, variant: "destructive" }),
  })

  const data = associationsQuery.data
  const associations = useMemo(() => (data?.associations ?? []) as AssociationListItem[], [data?.associations])
  const totalPages = data?.pagination.totalPages ?? 1

  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return (value as unknown[])
        .map((item) => {
          if (typeof item === "string") return item
          if (item === null || item === undefined) return ""
          if (typeof item === "object") return JSON.stringify(item)
          return String(item)
        })
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }
    if (typeof value === "string") {
      return value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }
    return []
  }

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

  const handleGenerateAssociationUpdate = async (values: AssociationUpdateInput) => {
    if (!detailTargetId) return
    await updateAssociation.mutateAsync({
      id: detailTargetId,
      data: {
        crmStatus: values.crmStatus,
        pipeline: values.pipeline,
        isMember: values.isMember,
        memberSince: values.memberSince ? new Date(values.memberSince) : undefined,
        assignedToId: values.assignedToId ?? null,
        streetAddress: values.streetAddress ?? null,
        postalCode: values.postalCode ?? null,
        city: values.city ?? null,
        email: values.email ?? null,
        phone: values.phone ?? null,
        homepageUrl: values.homepageUrl ?? null,
        activities: values.activities ?? [],
        otherInformation: values.otherInformation ?? '',
        descriptionFreeText: values.descriptionFreeText ?? '',
        notes: values.notes,
      },
    })
  }

  const handleStatusChange = async (associationId: string, status: AssociationUpdateInput["crmStatus"]) => {
    await updateAssociation.mutateAsync({ id: associationId, data: { crmStatus: status } })
  }

  const handlePipelineChange = async (associationId: string, pipeline: AssociationUpdateInput["pipeline"]) => {
    await updateAssociation.mutateAsync({ id: associationId, data: { pipeline } })
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
                      Kontakter
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
                    const isSelected = selectedIds.has(association.id)
                    const municipalityLabel = association.municipality ?? "Okänd kommun"
                    const contacts = association.contacts ?? []
                    const primaryContact = contacts.find((contact) => contact.isPrimary) ?? contacts[0]
                    const typeValues = parseStringArray(association.types)
                    const activityValues = parseStringArray(association.activities)
                    return (
                      <tr key={association.id} className={isSelected ? "bg-primary/5" : undefined}>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(association.id)}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <div>
                              <div className="font-medium">{municipalityLabel}</div>
                              <div className="text-xs text-muted-foreground">
                                {typeof association._count?.contacts === "number"
                                  ? `${association._count.contacts} kontakter`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <button
                            type="button"
                            className="text-left font-semibold text-primary hover:underline"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDetailTargetId(association.id)
                            }}
                          >
                            {association.name}
                          </button>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Organisationsnummer: {association.orgNumber ?? "Saknas"}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {association.crmStatus}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {CRM_STATUSES.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onSelect={() => handleStatusChange(association.id, status as AssociationUpdateInput["crmStatus"])}
                                >
                                  {status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {association.pipeline}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {PIPELINES.map((pipeline) => (
                                <DropdownMenuItem
                                  key={pipeline}
                                  onSelect={() => handlePipelineChange(association.id, pipeline as AssociationUpdateInput["pipeline"])}
                                >
                                  {pipeline}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Popover
                            open={contactPopoverId === association.id}
                            onOpenChange={(open) => setContactPopoverId(open ? association.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="w-full text-left"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setContactManagerTarget(association)
                                }}
                                onMouseEnter={() => setContactPopoverId(association.id)}
                                onMouseLeave={() => setContactPopoverId(null)}
                              >
                                {primaryContact ? (
                                  <div className="space-y-1 text-sm">
                                    <div className="font-medium">{primaryContact.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {primaryContact.email ?? primaryContact.phone ?? "Ingen kontaktinfo"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">Klicka för att lägga till kontakt</div>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              side="top"
                              className="w-80 text-left"
                              onMouseEnter={() => setContactPopoverId(association.id)}
                              onMouseLeave={() => setContactPopoverId(null)}
                            >
                              <div className="space-y-3">
                                <div className="text-sm font-semibold">Kontaktuppgifter</div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  {association.streetAddress && <div>{association.streetAddress}</div>}
                                  {(association.postalCode || association.city) && (
                                    <div>
                                      {association.postalCode} {association.city}
                                    </div>
                                  )}
                                  {association.email && <div>E-post: {association.email}</div>}
                                  {association.phone && <div>Telefon: {association.phone}</div>}
                                  {!association.streetAddress && !association.email && !association.phone && (
                                    <div>Ingen adress registrerad</div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {contacts.length ? (
                                    contacts.map((contact) => (
                                      <div key={contact.id} className="rounded-md border p-2 text-xs">
                                        <div className="flex items-center justify-between font-medium">
                                          <span>{contact.name}</span>
                                          {contact.isPrimary && <Badge variant="secondary">Primär</Badge>}
                                        </div>
                                        {contact.role && <div className="text-muted-foreground">{contact.role}</div>}
                                        {contact.email && <div>E-post: {contact.email}</div>}
                                        {contact.phone && <div>Telefon: {contact.phone}</div>}
                                        {contact.mobile && <div>Mobil: {contact.mobile}</div>}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-muted-foreground">Inga kontakter registrerade.</div>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {typeValues.length ? (
                              typeValues.map((value) => (
                                <Badge key={value} variant="outline">
                                  {value}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Saknas</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {activityValues.length ? (
                              activityValues.map((value) => (
                                <Badge key={value} variant="secondary">
                                  {value}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Saknas</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Redigera förening"
                              onClick={(event) => {
                                event.stopPropagation()
                                setDetailTargetId(association.id)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Popover
                              open={contactPopoverId === `${association.id}-action`}
                              onOpenChange={(open) => setContactPopoverId(open ? `${association.id}-action` : null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Visa kontakter"
                                  onMouseEnter={() => setContactPopoverId(`${association.id}-action`)}
                                  onMouseLeave={() => setContactPopoverId(null)}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setContactManagerTarget(association)
                                  }}
                                >
                                  <UserRound className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                side="top"
                                align="end"
                                className="w-72 text-left"
                                onMouseEnter={() => setContactPopoverId(`${association.id}-action`)}
                                onMouseLeave={() => setContactPopoverId(null)}
                              >
                                <div className="text-xs font-semibold">Kontakter</div>
                                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                                  {contacts.length ? (
                                    contacts.map((contact) => (
                                      <div key={contact.id}>
                                        <div className="font-medium text-foreground">
                                          {contact.name} {contact.isPrimary ? "(Primär)" : ""}
                                        </div>
                                        {contact.email && <div>E-post: {contact.email}</div>}
                                        {contact.phone && <div>Telefon: {contact.phone}</div>}
                                        {contact.mobile && <div>Mobil: {contact.mobile}</div>}
                                      </div>
                                    ))
                                  ) : (
                                    <div>Inga kontakter registrerade.</div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Skicka e-post"
                              onClick={(event) => {
                                event.stopPropagation()
                                setEmailTarget(association)
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title={association.homepageUrl ? "Besök hemsida" : "Ingen hemsida"}
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
                        <Button className="flex-1" variant="outline" onClick={() => setEditTarget(association)}>
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

      {detailTargetId && (
        <AssociationDetailModal
          open={!!detailTargetId}
          onOpenChange={(open) => (!open ? setDetailTargetId(null) : undefined)}
          associationId={detailTargetId}
          onSubmit={handleGenerateAssociationUpdate}
          isSubmitting={updateAssociation.isPending}
          users={userOptions.map((user) => ({ id: user.value, name: user.label }))}
        />
      )}

      <ManageContactsModal
        open={!!contactManagerTarget}
        associationId={contactManagerTarget?.id ?? null}
        associationName={contactManagerTarget?.name ?? null}
        onOpenChange={(open) => {
          if (!open) {
            setContactManagerTarget(null)
            setContactPopoverId(null)
          }
        }}
      />

      {emailTarget && (
        <SendEmailModal
          open={!!emailTarget}
          onOpenChange={(open) => (!open ? setEmailTarget(null) : undefined)}
          associationId={emailTarget.id}
          associationName={emailTarget.name}
          defaultRecipient={
            emailTarget.email ??
              emailTarget.contacts?.find((contact) => contact.isPrimary)?.email ??
              emailTarget.contacts?.[0]?.email ??
              null
          }
          onSubmit={handleSendEmail}
          isSubmitting={false}
        />
      )}
    </div>
  )
}
