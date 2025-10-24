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
import { Search, Filter, Plus, Loader2, RefreshCcw, Mail, UserPlus, Pencil, Map } from "lucide-react"
import { AdvancedFilterPanel, type AdvancedFilterState } from "@/components/filters/advanced-filter-panel"
import { MultiSelectOption } from "@/components/filters/multi-select-filter"
import { BulkActionsToolbar } from "@/components/filters/bulk-actions-toolbar"
import { ViewToggle, type ViewMode } from "@/components/filters/view-toggle"
import { EditAssociationModal } from "@/components/modals/edit-association-modal"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import { trpc } from "@/lib/trpc/client"
import { CRM_STATUSES, PIPELINES, type AssociationUpdateInput } from "@/lib/validators/association"
import type { ContactFormValues } from "@/lib/validators/contact"
import type { EmailComposerValues } from "@/lib/validators/email"
import { toast } from "@/hooks/use-toast"

type AssociationListItem = NonNullable<ReturnType<typeof trpc.association.list.useQuery>["data"]>["associations"][number]

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
  const utils = trpc.useUtils()
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<AdvancedFilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const limit = 10
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortBy, setSortBy] = useState<"updatedAt" | "name" | "createdAt" | "recentActivity">("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [editTarget, setEditTarget] = useState<AssociationListItem | null>(null)
  const [contactTarget, setContactTarget] = useState<AssociationListItem | null>(null)
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

  const associationsQuery = trpc.association.list.useQuery(queryInput, {
    keepPreviousData: true,
  })
  const tagsQuery = trpc.tags.list.useQuery(undefined, { staleTime: 60_000 })

  const updateAssociation = trpc.association.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.association.list.invalidate(queryInput)
      if (variables?.id) {
        utils.association.getById.invalidate({ id: variables.id })
        utils.notes.list.invalidate({ associationId: variables.id, limit: 20, cursor: null })
      }
      toast({ title: "Förening uppdaterad" })
    },
    onError: (error) => {
      toast({ title: "Misslyckades", description: error.message, variant: "destructive" })
    },
  })

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt skapad" })
      utils.association.list.invalidate(queryInput)
    },
    onError: (error) => toast({ title: "Kunde inte skapa kontakt", description: error.message, variant: "destructive" }),
  })

  const exportAssociations = trpc.export.associations.useMutation({
    onError: (error) => toast({ title: "Exporten misslyckades", description: error.message, variant: "destructive" }),
  })

  const data = associationsQuery.data
  const associations = useMemo(() => data?.associations ?? [], [data?.associations])
  const totalPages = data?.pagination.totalPages ?? 1

  const typeOptions: MultiSelectOption[] = useMemo(() => {
    const set = new Set<string>()
    associations.forEach((association) => {
      if (Array.isArray(association.types)) {
        association.types.forEach((value: string) => set.add(value))
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
    const seen = new Map<string, string>()
    associations.forEach((association) => {
      if (association.assignedTo) {
        seen.set(association.assignedTo.id, association.assignedTo.name ?? "Namnlös")
      }
    })
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }))
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
    if (!editTarget) return
    await updateAssociation.mutateAsync({
      id: editTarget.id,
      data: {
        crmStatus: values.crmStatus,
        pipeline: values.pipeline,
        isMember: values.isMember,
        memberSince: values.memberSince ? new Date(values.memberSince) : undefined,
        assignedToId: values.assignedToId ?? null,
        email: values.email ?? null,
        phone: values.phone ?? null,
        streetAddress: values.streetAddress ?? null,
        postalCode: values.postalCode ?? null,
        city: values.city ?? null,
        activities: values.activities,
        descriptionFreeText: values.descriptionFreeText ?? null,
        notes: values.notes,
      },
    })
  }

  const handleCreateContact = async (values: ContactFormValues) => {
    await createContact.mutateAsync(values)
  }

  const handleSendEmail = async (values: EmailComposerValues) => {
    toast({ title: "E-post skickad", description: `E-post skickad till ${values.to}` })
  }

  const isLoading = associationsQuery.isLoading

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
                      Förening
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Pipeline
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Kontakt
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ansvarig
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
                    return (
                      <tr key={association.id} className={isSelected ? "bg-primary/5" : undefined}>
                        <td className="px-4 py-3">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(association.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{association.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {association.municipality ?? "Okänd kommun"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{association.crmStatus}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{association.pipeline}</td>
                        <td className="px-4 py-3 text-sm">
                          {primaryContact ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{primaryContact.name}</span>
                              <span className="text-xs text-muted-foreground">{primaryContact.email ?? "Ingen e-post"}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Ingen kontakt</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {association.assignedTo?.name ?? "Obemannad"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditTarget(association)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setContactTarget(association)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEmailTarget(association)}
                            >
                              <Mail className="h-4 w-4" />
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
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{primaryContact?.name ?? "Ingen kontakt"}</div>
                        <div className="text-xs text-muted-foreground">
                          {primaryContact?.email ?? "Ingen e-post"}
                        </div>
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

      {editTarget && (
        <EditAssociationModal
          open={!!editTarget}
          onOpenChange={(open) => (!open ? setEditTarget(null) : undefined)}
          association={{
            id: editTarget.id,
            name: editTarget.name,
            crmStatus: editTarget.crmStatus,
            pipeline: editTarget.pipeline,
            isMember: editTarget.isMember,
            memberSince: editTarget.memberSince ? new Date(editTarget.memberSince).toISOString() : null,
            assignedToId: editTarget.assignedToId ?? null,
          }}
          users={userOptions.map((user) => ({ id: user.value, name: user.label }))}
          onSubmit={handleGenerateAssociationUpdate}
          isSubmitting={updateAssociation.isPending}
        />
      )}

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
    </div>
  )
}
