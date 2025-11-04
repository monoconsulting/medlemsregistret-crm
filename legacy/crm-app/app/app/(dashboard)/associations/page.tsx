"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Download,
  RefreshCcw,
  Mail,
  Pencil,
  Map as MapIcon,
  UserRoundPen,
  Home,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users2,
  Trash2,
} from "lucide-react"
import { AdvancedFilterPanel, type AdvancedFilterState } from "@/components/filters/advanced-filter-panel"
import { MultiSelectFilter, MultiSelectOption } from "@/components/filters/multi-select-filter"
import { BulkActionsToolbar } from "@/components/filters/bulk-actions-toolbar"
import { ViewToggle, type ViewMode } from "@/components/filters/view-toggle"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { EditContactModal } from "@/components/modals/edit-contact-modal"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import { AssociationDetailsDialog } from "@/components/modals/association-details-dialog"
import { AssociationContactsModal } from "@/components/modals/association-contacts-modal"
import { AddAssociationsToGroupModal } from "@/components/modals/add-associations-to-group-modal"
import { api } from "@/lib/trpc/client"
import { CRM_STATUSES, PIPELINES, type AssociationUpdateInput } from "@/lib/validators/association"
import type { ContactFormValues, ContactUpdateValues } from "@/lib/validators/contact"
import type { EmailComposerValues } from "@/lib/validators/email"
import { toast } from "@/hooks/use-toast"
import type { Association, Contact, Tag, User, Activity } from "@prisma/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard } from "@/components/ui/hover-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

const ACTIVITY_WINDOWS = [
  { label: "Senaste 7 dagarna", value: 7 },
  { label: "Senaste 30 dagarna", value: 30 },
  { label: "Senaste 90 dagarna", value: 90 },
]

const DEFAULT_FILTERS: AdvancedFilterState = {
  statuses: [],
  pipelines: [],
  types: [],
  tags: [],
  lastActivityDays: undefined,
}

const CRM_STATUS_VALUES = new Set<string>(CRM_STATUSES)
const PIPELINE_VALUES = new Set<string>(PIPELINES)

const normalizeStatuses = (values: string[]): (typeof CRM_STATUSES)[number][] =>
  values.filter((value): value is (typeof CRM_STATUSES)[number] => CRM_STATUS_VALUES.has(value))

const normalizePipelines = (values: string[]): (typeof PIPELINES)[number][] =>
  values.filter((value): value is (typeof PIPELINES)[number] => PIPELINE_VALUES.has(value))

type SortKey = "updatedAt" | "name" | "createdAt" | "recentActivity" | "crmStatus" | "pipeline"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updatedAt", label: "Senast uppdaterad" },
  { value: "name", label: "Namn" },
  { value: "createdAt", label: "Skapad" },
  { value: "recentActivity", label: "Senaste aktivitet" },
  { value: "crmStatus", label: "Status" },
  { value: "pipeline", label: "Pipeline" },
]

export default function AssociationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const municipalityIdFilter = searchParams.get("municipalityId")
  const municipalityNameFilter = searchParams.get("municipality")
  const utils = api.useUtils()
  const municipalityDetailsQuery = api.municipality.getById.useQuery(
    { id: municipalityIdFilter ?? "" },
    { enabled: Boolean(municipalityIdFilter) }
  )
  const activeMunicipalityName = municipalityDetailsQuery.data?.name ?? municipalityNameFilter
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [filters, setFilters] = useState<AdvancedFilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortBy, setSortBy] = useState<SortKey>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedMunicipalityIds, setSelectedMunicipalityIds] = useState<string[]>(() =>
    municipalityIdFilter ? [municipalityIdFilter] : []
  )
  const municipalitySelectionTouched = useRef(false)
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false)
  const groupsQuery = api.groups.list.useQuery(undefined, { staleTime: 300_000 })
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const groupDetailsQuery = api.groups.getById.useQuery(
    { id: activeGroupId ?? "" },
    { enabled: Boolean(activeGroupId) },
  )
  const addGroupMember = api.groups.addMember.useMutation()
  const removeGroupMember = api.groups.removeMember.useMutation()
  const exportGroupMembers = api.groups.exportMembers.useMutation()
  const softDeleteGroup = api.groups.softDelete.useMutation()
  const [groupMemberIds, setGroupMemberIds] = useState<Set<string>>(new Set())
  const [pendingMembershipIds, setPendingMembershipIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (selectedIds.size === 0 && showAddToGroupModal) {
      setShowAddToGroupModal(false)
    }
  }, [selectedIds, showAddToGroupModal])

  useEffect(() => {
    if (activeGroupId) {
      setShowAddToGroupModal(false)
    }
  }, [activeGroupId])

  useEffect(() => {
    if (groupDetailsQuery.error) {
      toast({
        title: "Grupp saknas",
        description: "Den valda gruppen kunde inte hittas eller är raderad.",
        variant: "destructive",
      })
      setActiveGroupId(null)
    }
  }, [groupDetailsQuery.error])

  useEffect(() => {
    if (municipalitySelectionTouched.current) {
      return
    }
    if (municipalityIdFilter) {
      setSelectedMunicipalityIds([municipalityIdFilter])
    } else {
      setSelectedMunicipalityIds([])
    }
  }, [municipalityIdFilter])

  const defaultSortDirectionFor = (field: SortKey): "asc" | "desc" =>
    field === "updatedAt" || field === "createdAt" || field === "recentActivity" ? "desc" : "asc"

  const handleColumnSort = (field: SortKey) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      setPage(1)
      return
    }
    setSortBy(field)
    setSortDirection(defaultSortDirectionFor(field))
    setPage(1)
  }

  const renderSortIcon = (field: SortKey) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    )
  }

  const [editTarget, setEditTarget] = useState<AssociationListItem | null>(null)
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

  const effectiveMunicipalityIds = useMemo(() => {
    if (selectedMunicipalityIds.length) {
      return selectedMunicipalityIds
    }
    if (municipalityIdFilter) {
      return [municipalityIdFilter]
    }
    return []
  }, [selectedMunicipalityIds, municipalityIdFilter])

  const queryInput = useMemo(() => {
    const crmStatuses = filters.statuses.length ? normalizeStatuses(filters.statuses) : undefined
    const pipelines = filters.pipelines.length ? normalizePipelines(filters.pipelines) : undefined

    return {
      page,
      limit,
      search: deferredSearchTerm.trim() || undefined,
      crmStatuses,
      pipelines,
      types: filters.types.length ? filters.types : undefined,
      tags: filters.tags.length ? filters.tags : undefined,
      municipalityIds: effectiveMunicipalityIds.length ? effectiveMunicipalityIds : undefined,
      lastActivityDays: filters.lastActivityDays,
      sortBy,
      sortDirection,
    }
  }, [
    page,
    limit,
    deferredSearchTerm,
    filters,
    sortBy,
    sortDirection,
    effectiveMunicipalityIds,
  ])

  const associationsQuery = api.association.list.useQuery(queryInput, {
    placeholderData: (previousData) => previousData,
  })
  const tagsQuery = api.tags.list.useQuery(undefined, { staleTime: 60_000 })
  const municipalitiesQuery = api.municipality.list.useQuery(
    { limit: 400, sortBy: "name", sortOrder: "asc" },
    { staleTime: 300_000 }
  )

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

  const statusOptions: MultiSelectOption[] = CRM_STATUSES.map((status) => ({ label: status, value: status }))
  const pipelineOptions: MultiSelectOption[] = PIPELINES.map((pipeline) => ({ label: pipeline, value: pipeline }))
  const municipalityOptions = useMemo(() => {
    const baseOptions = (municipalitiesQuery.data ?? [])
      .filter((municipality) => municipality.name && municipality.name.trim().length > 0)
      .map((municipality) => ({
        id: municipality.id,
        name: municipality.name.trim(),
      }))

    if (municipalityDetailsQuery.data) {
      const exists = baseOptions.some((option) => option.id === municipalityDetailsQuery.data?.id)
      if (!exists && municipalityDetailsQuery.data.id) {
        baseOptions.push({
          id: municipalityDetailsQuery.data.id,
          name: municipalityDetailsQuery.data.name ?? municipalityNameFilter ?? "Okänd kommun",
        })
      }
    } else if (municipalityIdFilter && municipalityNameFilter) {
      const exists = baseOptions.some((option) => option.id === municipalityIdFilter)
      if (!exists) {
        baseOptions.push({ id: municipalityIdFilter, name: municipalityNameFilter })
      }
    }

    return baseOptions.sort((a, b) => a.name.localeCompare(b.name, "sv"))
  }, [
    municipalitiesQuery.data,
    municipalityDetailsQuery.data,
    municipalityIdFilter,
    municipalityNameFilter,
  ])

  const municipalityFilterOptions: MultiSelectOption[] = useMemo(
    () => municipalityOptions.map((option) => ({ label: option.name, value: option.id })),
    [municipalityOptions],
  )

  const selectedMunicipalities = useMemo(() => {
    if (selectedMunicipalityIds.length === 0) {
      return []
    }
    const lookup = new Map(municipalityOptions.map((option) => [option.id, option.name]))
    return selectedMunicipalityIds.map((id) => ({
      id,
      name:
        lookup.get(id) ??
        (id === municipalityDetailsQuery.data?.id
          ? municipalityDetailsQuery.data?.name ?? municipalityNameFilter ?? "Okänd kommun"
          : id === municipalityIdFilter
            ? municipalityNameFilter ?? "Okänd kommun"
            : "Okänd kommun"),
    }))
  }, [
    selectedMunicipalityIds,
    municipalityOptions,
    municipalityDetailsQuery.data?.id,
    municipalityDetailsQuery.data?.name,
    municipalityNameFilter,
    municipalityIdFilter,
  ])

  const associationsTitle = useMemo(() => {
    if (selectedMunicipalities.length === 1) {
      return `Föreningar i ${selectedMunicipalities[0].name}`
    }
    if (selectedMunicipalities.length > 1) {
      return `Föreningar i ${selectedMunicipalities.length} kommuner`
    }
    if (activeMunicipalityName) {
      return `Föreningar i ${activeMunicipalityName}`
    }
    return "Alla föreningar"
  }, [selectedMunicipalities, activeMunicipalityName])

  useEffect(() => {
    if (!activeGroupId) {
      setGroupMemberIds(new Set())
      return
    }

    if (groupDetailsQuery.data) {
      const memberIds = groupDetailsQuery.data.memberships
        .map((membership) => membership.association?.id)
        .filter((id): id is string => Boolean(id))

      setGroupMemberIds(new Set(memberIds))
    } else {
      setGroupMemberIds(new Set())
    }
  }, [activeGroupId, groupDetailsQuery.data])

  useEffect(() => {
    if (activeGroupId) {
      setSelectedIds(new Set())
    }
  }, [activeGroupId])

  const isGroupMode = Boolean(activeGroupId)

  const clearSelection = () => {
    if (isGroupMode) {
      setGroupMemberIds(new Set())
    } else {
      setSelectedIds(new Set())
    }
  }

  const visibleAssociationIds = useMemo(() => associations.map((association) => association.id), [associations])

  const handleGroupMembershipToggle = async (associationId: string, shouldBeMember: boolean) => {
    if (!activeGroupId) return

    const previous = new Set(groupMemberIds)
    setPendingMembershipIds((prev) => {
      const next = new Set(prev)
      next.add(associationId)
      return next
    })

    setGroupMemberIds((prev) => {
      const next = new Set(prev)
      if (shouldBeMember) {
        next.add(associationId)
      } else {
        next.delete(associationId)
      }
      return next
    })

    try {
      if (shouldBeMember) {
        await addGroupMember.mutateAsync({ groupId: activeGroupId, associationId })
      } else {
        await removeGroupMember.mutateAsync({ groupId: activeGroupId, associationId })
      }
      await utils.groups.list.invalidate()
      await utils.groups.list.invalidate()
      await utils.groups.getById.invalidate({ id: activeGroupId })
    } catch (error) {
      setGroupMemberIds(previous)
      const message = error instanceof Error ? error.message : "Kunde inte uppdatera gruppen"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setPendingMembershipIds((prev) => {
        const next = new Set(prev)
        next.delete(associationId)
        return next
      })
    }
  }

  const handleGroupToggleAll = async (shouldSelectAll: boolean) => {
    if (!activeGroupId) return
    const previous = new Set(groupMemberIds)
    const targetIds = shouldSelectAll
      ? visibleAssociationIds.filter((id) => !groupMemberIds.has(id))
      : visibleAssociationIds.filter((id) => groupMemberIds.has(id))

    if (targetIds.length === 0) {
      return
    }

    setPendingMembershipIds((prev) => {
      const next = new Set(prev)
      targetIds.forEach((id) => next.add(id))
      return next
    })

    setGroupMemberIds((prev) => {
      const next = new Set(prev)
      targetIds.forEach((id) => {
        if (shouldSelectAll) {
          next.add(id)
        } else {
          next.delete(id)
        }
      })
      return next
    })

    try {
      if (shouldSelectAll) {
        await Promise.all(
          targetIds.map((associationId) => addGroupMember.mutateAsync({ groupId: activeGroupId, associationId })),
        )
      } else {
        await Promise.all(
          targetIds.map((associationId) =>
            removeGroupMember.mutateAsync({ groupId: activeGroupId, associationId }),
          ),
        )
      }
      await utils.groups.getById.invalidate({ id: activeGroupId })
      toast({
        title: "Grupp uppdaterad",
        description: shouldSelectAll
          ? `Lade till ${targetIds.length} föreningar i gruppen.`
          : `Tog bort ${targetIds.length} föreningar från gruppen.`,
      })
    } catch (error) {
      setGroupMemberIds(previous)
      const message = error instanceof Error ? error.message : "Kunde inte uppdatera gruppen"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setPendingMembershipIds((prev) => {
        const next = new Set(prev)
        targetIds.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const handleAssociationSelection = (associationId: string, nextChecked: boolean) => {
    if (isGroupMode) {
      void handleGroupMembershipToggle(associationId, nextChecked)
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (nextChecked) {
        next.add(associationId)
      } else {
        next.delete(associationId)
      }
      return next
    })
  }

  const allVisibleSelected = isGroupMode
    ? visibleAssociationIds.length > 0 && visibleAssociationIds.every((id) => groupMemberIds.has(id))
    : visibleAssociationIds.length > 0 && visibleAssociationIds.every((id) => selectedIds.has(id))

  const someVisibleSelected = isGroupMode
    ? visibleAssociationIds.some((id) => groupMemberIds.has(id))
    : visibleAssociationIds.some((id) => selectedIds.has(id))

  const handleToggleAllVisible = (checked: boolean | "indeterminate") => {
    if (isGroupMode) {
      void handleGroupToggleAll(checked === true)
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleAssociationIds.forEach((id) => next.delete(id))
      } else {
        visibleAssociationIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleMunicipalityFilterChange = (values: string[]) => {
    municipalitySelectionTouched.current = true
    setSelectedMunicipalityIds(values)
    setPage(1)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("municipality")
    params.delete("municipalityId")
    const next = params.toString()
    router.replace(`/associations${next ? `?${next}` : ""}`)
  }

  const handleClearMunicipalityFilters = () => {
    handleMunicipalityFilterChange([])
  }

  const downloadBase64File = (payload: { data: string; mimeType: string; filename: string }) => {
    const binary = atob(payload.data)
    const buffer = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([buffer], { type: payload.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = payload.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleGroupExport = async () => {
    if (!activeGroupId) return
    try {
      const result = await exportGroupMembers.mutateAsync({ groupId: activeGroupId })
      downloadBase64File({
        ...result,
        mimeType: `${result.mimeType};charset=windows-1252`,
      })
      toast({ title: "Export skapad", description: `Fil: ${result.filename}` })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte exportera gruppen"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    }
  }

  const handleSoftDeleteGroup = async () => {
    if (!activeGroupId) return
    try {
      await softDeleteGroup.mutateAsync({ id: activeGroupId })
      await groupsQuery.refetch()
      setActiveGroupId(null)
      toast({ title: "Gruppen raderad", description: "Gruppen har markerats som raderad." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte radera gruppen"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    }
  }

  const handleExport = async (format: "csv" | "json" | "xlsx") => {
    const result = await exportAssociations.mutateAsync({
      format,
      search: searchTerm.trim() || undefined,
      municipalityIds: effectiveMunicipalityIds.length ? effectiveMunicipalityIds : undefined,
    })
    downloadBase64File(result)
    toast({ title: "Export skapad", description: `Fil: ${result.filename}` })
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
              <MultiSelectFilter
                label="Kommuner"
                placeholder="Alla kommuner"
                options={municipalityFilterOptions}
                values={selectedMunicipalityIds}
                onChange={handleMunicipalityFilterChange}
              />
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <Select value={limit.toString()} onValueChange={(value) => { setLimit(parseInt(value)); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Per sida" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per sida</SelectItem>
                  <SelectItem value="25">25 per sida</SelectItem>
                  <SelectItem value="50">50 per sida</SelectItem>
                  <SelectItem value="100">100 per sida</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  const field = value as SortKey
                  setSortBy(field)
                  if (field !== sortBy) {
                    setSortDirection(defaultSortDirectionFor(field))
                  }
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Sortera" />
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
                value={sortDirection}
                onValueChange={(value) => {
                  setSortDirection(value as typeof sortDirection)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Riktning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Fallande</SelectItem>
                  <SelectItem value="asc">Stigande</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={activeGroupId ?? "__none"}
                onValueChange={(value) => {
                  if (value === "__none") {
                    setActiveGroupId(null)
                  } else {
                    setActiveGroupId(value)
                  }
                }}
                disabled={groupsQuery.isLoading}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue
                    placeholder={
                      groupsQuery.isLoading
                        ? "Laddar grupper..."
                        : (groupsQuery.data?.length ?? 0) > 0
                          ? "Välj grupp"
                          : "Inga grupper tillgängliga"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Ingen grupp</SelectItem>
                  {(groupsQuery.data ?? []).map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group._count?.memberships ?? 0})
                    </SelectItem>
                  ))}
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
              tags: tagOptions,
              activityWindows: ACTIVITY_WINDOWS,
            }}
          />
        </CardContent>
      </Card>

      {isGroupMode && (
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {groupDetailsQuery.data?.name ?? "Vald grupp"}
              </h2>
              <Badge variant="secondary" className="gap-1">
                <Users2 className="h-4 w-4" />
                {groupDetailsQuery.data?._count?.memberships ?? groupMemberIds.size}
              </Badge>
              {groupDetailsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
            {groupDetailsQuery.data?.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {groupDetailsQuery.data.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGroupExport}
              disabled={exportGroupMembers.isPending || softDeleteGroup.isPending}
            >
              {exportGroupMembers.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportera CSV
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={softDeleteGroup.isPending}>
                  {softDeleteGroup.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Radera grupp
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Radera grupp</AlertDialogTitle>
                  <AlertDialogDescription>
                    Gruppen markeras som raderad men tas inte bort permanent. Vill du fortsätta?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSoftDeleteGroup()} disabled={softDeleteGroup.isPending}>
                    Ja, radera
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={() => setActiveGroupId(null)}>
              Rensa grupp
            </Button>
          </div>
        </div>
      )}

      <BulkActionsToolbar
        selectedCount={isGroupMode ? 0 : selectedIds.size}
        onClear={clearSelection}
        onExport={handleExport}
        onAddToGroup={() => setShowAddToGroupModal(true)}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <div>
              <CardTitle>{associationsTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {associationsQuery.data?.pagination.total ?? 0} resultat – sida {page} av {totalPages}
              </p>
            </div>
            {selectedMunicipalities.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">Filtrerat på kommun</Badge>
                <span className="text-xs font-medium text-foreground">
                  {selectedMunicipalities.map((item) => item.name).join(", ")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={handleClearMunicipalityFilters}
                >
                  Rensa
                </Button>
              </div>
            )}
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
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Checkbox
                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                        onCheckedChange={handleToggleAllVisible}
                        aria-label="Välj alla synliga föreningar"
                        disabled={
                          isGroupMode &&
                          (pendingMembershipIds.size > 0 ||
                            softDeleteGroup.isPending ||
                            addGroupMember.isPending ||
                            removeGroupMember.isPending)
                        }
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Kommun
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Förening
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      aria-sort={sortBy === "crmStatus" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button
                        type="button"
                        onClick={() => handleColumnSort("crmStatus")}
                        className="flex items-center gap-1 uppercase"
                      >
                        Status
                        {renderSortIcon("crmStatus")}
                      </button>
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      aria-sort={sortBy === "pipeline" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button
                        type="button"
                        onClick={() => handleColumnSort("pipeline")}
                        className="flex items-center gap-1 uppercase"
                      >
                        Pipeline
                        {renderSortIcon("pipeline")}
                      </button>
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
                  {associations.map((association, index) => {
                    const primaryContact = association.contacts?.[0]
                    const isMember = groupMemberIds.has(association.id)
                    const isSelected = isGroupMode ? isMember : selectedIds.has(association.id)
                    const isMembershipPending = pendingMembershipIds.has(association.id)
                    const typeValues = parseStringArray(association.types)
                    const activityValues = parseStringArray(association.activities)
                    const rowIndex = (page - 1) * limit + index + 1

                    return (
                      <tr key={association.id} className={isSelected ? "bg-primary/5" : undefined}>
                        <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
                          {rowIndex}
                        </td>
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            disabled={isGroupMode && (isMembershipPending || softDeleteGroup.isPending || addGroupMember.isPending || removeGroupMember.isPending)}
                            onCheckedChange={(value) => handleAssociationSelection(association.id, value === true)}
                          />
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
                          {association.tags?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {association.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs" style={{ backgroundColor: tag.color }}>
                                  {tag.name}
                                </Badge>
                              ))}
                              {association.tags.length > 3 ? (
                                <Badge variant="secondary" className="text-xs">+{association.tags.length - 3}</Badge>
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
                const isMember = groupMemberIds.has(association.id)
                const isSelected = isGroupMode ? isMember : selectedIds.has(association.id)
                const isMembershipPending = pendingMembershipIds.has(association.id)
                const primaryContact = association.contacts?.[0]
                return (
                  <Card key={association.id} className={isSelected ? "border-primary" : undefined}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg">{association.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{association.municipality ?? "Okänd kommun"}</p>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        disabled={isGroupMode && (isMembershipPending || softDeleteGroup.isPending || addGroupMember.isPending || removeGroupMember.isPending)}
                        onCheckedChange={(value) => handleAssociationSelection(association.id, value === true)}
                      />
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
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">{primaryContact?.name ?? "Ingen kontakt"}</div>
                          <div className="text-xs text-muted-foreground">
                            {primaryContact?.email ?? "Ingen e-post"}
                          </div>
                        </div>
                        {primaryContact && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setContactEditTarget({ associationName: association.name, contact: primaryContact })}
                          >
                            <UserRoundPen className="h-4 w-4" />
                          </Button>
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
              <MapIcon className="h-8 w-8" />
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
          onSubmit={handleCreateContact}
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
            name: contactEditTarget.contact.name ?? "",
            role: contactEditTarget.contact.role ?? undefined,
            email: contactEditTarget.contact.email ?? undefined,
            phone: contactEditTarget.contact.phone ?? undefined,
            mobile: contactEditTarget.contact.mobile ?? undefined,
            linkedinUrl: contactEditTarget.contact.linkedinUrl ?? undefined,
            facebookUrl: contactEditTarget.contact.facebookUrl ?? undefined,
            twitterUrl: contactEditTarget.contact.twitterUrl ?? undefined,
            instagramUrl: contactEditTarget.contact.instagramUrl ?? undefined,
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

      <AddAssociationsToGroupModal
        open={showAddToGroupModal}
        onOpenChange={setShowAddToGroupModal}
        associationIds={Array.from(selectedIds)}
        onCompleted={() => {
          clearSelection()
          setShowAddToGroupModal(false)
        }}
      />
    </div>
  )
}




