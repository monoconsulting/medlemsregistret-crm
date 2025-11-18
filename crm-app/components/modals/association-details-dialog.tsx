"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { api, type AssociationDetail, type Tag, type Contact } from "@/lib/api"
import { TagSelector } from "@/components/tag-selector"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { EditContactModal } from "@/components/modals/edit-contact-modal"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import {
  Loader2,
  MapPin,
  Users,
  Pencil,
  Check,
  X,
  RefreshCcw,
  NotepadText,
  Mail,
  Phone,
  ExternalLink,
  Plus,
  Send,
} from "lucide-react"

interface AssociationDetailsDialogProps {
  associationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
  onOpenContacts?: (association: AssociationDetail) => void
}

interface EditableFieldProps {
  label: string
  value: string | number | null | undefined
  field: string
  type?: "text" | "textarea" | "number" | "date"
  editingField: string | null
  fieldValues: Record<string, unknown>
  onEdit: (field: string, value: unknown) => void
  onSave: (field: string) => Promise<void>
  onCancel: (field: string) => void
  setEditingField: (field: string | null) => void
  savingField: string | null
}

const CRM_STATUSES = [
  "UNCONTACTED",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATION",
  "MEMBER",
  "LOST",
  "INACTIVE",
] as const

const PIPELINES = [
  "PROSPECT",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "FOLLOW_UP",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const

const ENCODING_REPAIR_REGEX = /[\u00C3\uFFFD]/

function fixEncoding(value: string | null | undefined): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (trimmed === "") return ""
  if (!ENCODING_REPAIR_REGEX.test(trimmed) || typeof TextDecoder === "undefined") {
    return trimmed
  }
  try {
    const bytes = Uint8Array.from(trimmed, (char) => char.charCodeAt(0))
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
    return decoded.trim() || trimmed
  } catch {
    return trimmed
  }
}

function renderList(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values
      .map((value) => {
        if (typeof value === "string") return value
        if (value && typeof value === "object" && "name" in value) {
          return String((value as Record<string, unknown>).name)
        }
        return typeof value === "number" ? String(value) : ""
      })
      .filter(Boolean)
  }

  if (typeof values === "string" && values.trim().length > 0) {
    return values
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  }

  return []
}

function EditableField({
  label,
  value,
  field,
  type = "text",
  editingField,
  fieldValues,
  onEdit,
  onSave,
  onCancel,
  setEditingField,
  savingField,
}: EditableFieldProps) {
  const isEditing = editingField === field
  const currentValue = fieldValues[field] ?? (value ?? "")
  const isSaving = savingField === field

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingField(field)}
            className="h-6 w-6 p-0"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        ) : null}
      </div>
      {isEditing ? (
        <div className="flex items-center gap-2">
          {type === "textarea" ? (
            <Textarea
              value={currentValue as string}
              onChange={(event) => onEdit(field, event.target.value)}
              className="flex-1"
              rows={4}
            />
          ) : type === "date" ? (
            <Input
              type="date"
              value={currentValue ? String(currentValue).slice(0, 10) : ""}
              onChange={(event) => onEdit(field, event.target.value || null)}
              className="flex-1"
            />
          ) : (
            <Input
              type={type === "number" ? "number" : "text"}
              value={currentValue as string | number}
              onChange={(event) =>
                onEdit(field, type === "number" ? Number(event.target.value) : event.target.value)
              }
              className="flex-1"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void onSave(field)}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCancel(field)}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{value ?? "Inte angivet"}</p>
      )}
    </div>
  )
}

function transformDetail(detail: AssociationDetail): AssociationDetail {
  return {
    ...detail,
    tags: (detail.tags ?? []).map((tag) => ({ ...tag, name: fixEncoding(tag.name) })),
    contacts: detail.contacts ?? [],
    notes: detail.notes ?? [],
    activity_log: detail.activity_log ?? [],
    group_memberships: detail.group_memberships ?? [],
  }
}

export function AssociationDetailsDialog({
  associationId,
  open,
  onOpenChange,
  onUpdated,
  onOpenContacts,
}: AssociationDetailsDialogProps) {
  const { toast } = useToast()
  const [detail, setDetail] = useState<AssociationDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({})
  const [savingField, setSavingField] = useState<string | null>(null)
  const [savingNote, setSavingNote] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [savingTags, setSavingTags] = useState(false)
  const [addContactModalOpen, setAddContactModalOpen] = useState(false)
  const [editContactModalOpen, setEditContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    if (!associationId) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.getAssociationDetail(associationId)
      setDetail(transformDetail(result))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta föreningens detaljer"
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [associationId, toast])

  useEffect(() => {
    if (open && associationId) {
      void loadDetail()
      // Load all tags
      void api.getTags().then((tags) => setAllTags(tags)).catch(() => {
        toast({ title: "Fel", description: "Kunde inte hämta taggar", variant: "destructive" })
      })
    }
  }, [open, associationId, loadDetail, toast])

  useEffect(() => {
    if (!open) {
      setDetail(null)
      setError(null)
      setNote("")
      setEditingField(null)
      setFieldValues({})
      setSavingField(null)
      setSavingNote(false)
      setRefreshing(false)
      setAllTags([])
      setSavingTags(false)
    }
  }, [open])

  const handleFieldEdit = (field: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleFieldCancel = (field: string) => {
    setFieldValues((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setEditingField((current) => (current === field ? null : current))
  }

  const handleFieldSave = useCallback(
    async (field: string) => {
      if (!detail) return
      const value = fieldValues[field] ?? detail[field as keyof AssociationDetail]
      setSavingField(field)
      try {
        const payload: Record<string, unknown> = {}
        payload[field] =
          typeof value === "string" && value.trim() === "" ? null : value
        await api.updateAssociation(detail.id, payload)
        setDetail((prev) => (prev ? ({ ...prev, [field]: payload[field] ?? null } as AssociationDetail) : prev))
        handleFieldCancel(field)
        toast({ title: "Fält uppdaterat" })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Kunde inte spara ändringen"
        toast({ title: "Fel", description: message, variant: "destructive" })
      } finally {
        setSavingField((current) => (current === field ? null : current))
      }
    },
    [detail, fieldValues, toast],
  )

  const handleStatusChange = async (status: string) => {
    if (!detail || detail.status === status) return
    setSavingField("status")
    try {
      await api.updateAssociation(detail.id, { status })
      setDetail((prev) => (prev ? ({ ...prev, status } as AssociationDetail) : prev))
      toast({ title: "Status uppdaterad" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera status"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSavingField((current) => (current === "status" ? null : current))
    }
  }

  const handlePipelineChange = async (pipeline: string) => {
    if (!detail || detail.pipeline === pipeline) return
    setSavingField("pipeline")
    try {
      await api.updateAssociation(detail.id, { pipeline })
      setDetail((prev) => (prev ? ({ ...prev, pipeline } as AssociationDetail) : prev))
      toast({ title: "Pipeline uppdaterad" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera pipeline"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSavingField((current) => (current === "pipeline" ? null : current))
    }
  }

  const handleToggleMember = async () => {
    if (!detail) return
    const nextValue = !detail.is_member
    setSavingField("is_member")
    try {
      await api.updateAssociation(detail.id, { is_member: nextValue })
      setDetail((prev) => (prev ? ({ ...prev, is_member: nextValue } as AssociationDetail) : prev))
      toast({ title: nextValue ? "Markerad som medlem" : "Markerad som icke-medlem" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera medlemsstatus"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSavingField((current) => (current === "is_member" ? null : current))
    }
  }

  const handleSaveNote = async () => {
    if (!detail || note.trim() === "") return
    setSavingNote(true)
    try {
      await api.addNote(detail.id, note.trim())
      const refreshed = await api.getAssociationDetail(detail.id)
      setDetail(transformDetail(refreshed))
      setNote("")
      toast({ title: "Anteckning sparad" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte spara anteckning"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSavingNote(false)
    }
  }

  const handleRefresh = async () => {
    if (!associationId) return
    setRefreshing(true)
    await loadDetail()
    setRefreshing(false)
  }

  const handleTagsChange = async (newTags: Tag[]) => {
    if (!detail) return

    setSavingTags(true)
    try {
      const currentTagIds = new Set(tags.map((t) => t.id))
      const newTagIds = new Set(newTags.map((t) => t.id))

      // Find tags to attach
      const toAttach = newTags.filter((t) => !currentTagIds.has(t.id))
      // Find tags to detach
      const toDetach = tags.filter((t) => !newTagIds.has(t.id))

      // Attach new tags
      for (const tag of toAttach) {
        await api.attachTag(detail.id, tag.id)
      }

      // Detach removed tags
      for (const tag of toDetach) {
        await api.detachTag(detail.id, tag.id)
      }

      // Update detail state
      setDetail((prev) => (prev ? ({ ...prev, tags: newTags } as AssociationDetail) : prev))

      // Notify parent if callback provided
      if (onUpdated) {
        onUpdated()
      }

      toast({ title: "Taggar uppdaterade" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera taggar"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSavingTags(false)
    }
  }

  const handleTagCreated = (newTag: Tag) => {
    setAllTags((prev) => [...prev, newTag])
  }

  const typesList = useMemo(() => renderList(detail?.types), [detail?.types])
  const activitiesList = useMemo(() => renderList(detail?.activities), [detail?.activities])
  const categoriesList = useMemo(() => renderList(detail?.categories), [detail?.categories])
  const tags = detail?.tags ?? []
  const contacts = detail?.contacts ?? []
  const notes = detail?.notes ?? []
  const activityLog = detail?.activity_log ?? []
  const groupMemberships = detail?.group_memberships ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[90vw] max-w-7xl p-0 flex flex-col">
        {loading && !detail ? (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Hämtar förening.
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">{error}</div>
        ) : detail ? (
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogDescription className="sr-only">Föreningens detaljinformation och CRM-fält</DialogDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {editingField === "name" ? (
                      <>
                        <Input
                          value={(fieldValues.name ?? detail.name) as string}
                          onChange={(e) => handleFieldEdit("name", e.target.value)}
                          className="text-2xl font-semibold h-auto py-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleFieldSave("name")}
                          disabled={savingField === "name"}
                          className="h-8 w-8 p-0"
                        >
                          {savingField === "name" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFieldCancel("name")}
                          disabled={savingField === "name"}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <DialogTitle className="text-2xl font-semibold">{detail.name}</DialogTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingField("name")}
                          className="h-8 w-8 p-0"
                          title="Redigera föreningsnamn"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {detail.municipality_name ?? detail.city ?? "Kommun saknas"}
                    </span>
                    <Separator orientation="vertical" className="hidden h-4 md:block" />
                    <button
                      onClick={() => {
                        if (detail && onOpenContacts) {
                          onOpenContacts(detail)
                          return
                        }
                        const contactsSection = document.querySelector('[data-section="contacts"]')
                        contactsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="flex items-center gap-1 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      <Users className="h-4 w-4" /> {contacts.length} kontakter
                    </button>
                    <Separator orientation="vertical" className="hidden h-4 md:block" />
                    <span>
                      Senast uppdaterad{" "}
                      {detail.updated_at ? format(new Date(detail.updated_at), "PPP", { locale: sv }) : "okänt"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="gap-2">
                          Status: {detail.status ?? "Saknas"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {CRM_STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onSelect={() => handleStatusChange(status)}
                            className={detail.status === status ? "bg-muted" : undefined}
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="gap-2">
                          Pipeline: {detail.pipeline ?? "Saknas"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {PIPELINES.map((pipeline) => (
                          <DropdownMenuItem
                            key={pipeline}
                            onSelect={() => handlePipelineChange(pipeline)}
                            className={detail.pipeline === pipeline ? "bg-muted" : undefined}
                          >
                            {pipeline}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant={detail.is_member ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleMember}
                      disabled={savingField === "is_member"}
                      className="gap-2"
                    >
                      {savingField === "is_member" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      {detail.is_member ? "Medlem" : "Inte medlem"}
                    </Button>
                    {detail.member_since ? (
                      <Badge variant="outline">
                        Medlem sedan {format(new Date(detail.member_since), "PPP", { locale: sv })}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailRecipient(detail.email)
                      setSendEmailModalOpen(true)
                    }}
                    className="gap-2"
                    disabled={!detail.email}
                    title={detail.email ? "Skicka e-post" : "Ingen e-postadress"}
                  >
                    <Send className="h-4 w-4" />
                    E-post
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRefresh()}
                    disabled={refreshing || loading}
                    className="gap-2"
                  >
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Uppdatera
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-4 lg:flex-row">
              <ScrollArea className="h-full flex-1 pr-4">
                <div className="space-y-6 pb-8">
                  <section className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Grunduppgifter
                    </h3>
                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                      <EditableField
                        label="Organisationsnummer"
                        value={detail.org_number}
                        field="org_number"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                      <EditableField
                        label="E-post"
                        value={detail.email}
                        field="email"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                      <EditableField
                        label="Telefon"
                        value={detail.phone}
                        field="phone"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hemsida</label>
                          {detail.website && (
                            <a
                              href={detail.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              Öppna <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <EditableField
                          label=""
                          value={detail.website}
                          field="website"
                          editingField={editingField}
                          fieldValues={fieldValues}
                          onEdit={handleFieldEdit}
                          onSave={handleFieldSave}
                          onCancel={handleFieldCancel}
                          setEditingField={setEditingField}
                          savingField={savingField}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalj-URL</label>
                          {detail.detail_url && (
                            <a
                              href={detail.detail_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              Öppna <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <EditableField
                          label=""
                          value={detail.detail_url}
                          field="detail_url"
                          editingField={editingField}
                          fieldValues={fieldValues}
                          onEdit={handleFieldEdit}
                          onSave={handleFieldSave}
                          onCancel={handleFieldCancel}
                          setEditingField={setEditingField}
                          savingField={savingField}
                        />
                      </div>
                      <EditableField
                        label="Medlem sedan"
                        value={detail.member_since}
                        field="member_since"
                        type="date"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                    </div>
                  </section>

                  <section className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Adress</h3>
                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                      <EditableField
                        label="Gatuadress"
                        value={detail.street_address}
                        field="street_address"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                      <EditableField
                        label="Postnummer"
                        value={detail.postal_code}
                        field="postal_code"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                      <EditableField
                        label="Stad"
                        value={detail.city}
                        field="city"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                    </div>
                  </section>

                  <section className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Klassificering
                    </h3>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Typer</p>
                        <p>{typesList.length ? typesList.join(", ") : "Saknas"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Kategorier</p>
                        <p>{categoriesList.length ? categoriesList.join(", ") : "Saknas"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Aktiviteter</p>
                        <p>{activitiesList.length ? activitiesList.join(", ") : "Saknas"}</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Taggar</h3>
                    <div className="mt-4">
                      {savingTags ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sparar taggar...</span>
                        </div>
                      ) : (
                        <TagSelector
                          selectedTags={tags}
                          allTags={allTags}
                          onTagsChange={handleTagsChange}
                          onTagCreated={handleTagCreated}
                        />
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Beskrivning</h3>
                    <div className="mt-4 space-y-4">
                      <EditableField
                        label="Fri beskrivning"
                        value={detail.description_free_text}
                        field="description_free_text"
                        type="textarea"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                        savingField={savingField}
                      />
                      {typeof detail.description === "string" && detail.description.trim() ? (
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Systembeskrivning</p>
                          <p className="mt-2 whitespace-pre-line text-sm">{detail.description}</p>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="flex w-full flex-col gap-4 lg:w-[360px] lg:pr-2">
                <section data-section="contacts" className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kontakter</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddContactModalOpen(true)}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Lägg till
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {contacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Inga kontakter registrerade.</p>
                    ) : (
                        contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="rounded-md border border-border/60 bg-background p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>{contact.name ?? "Namnlös kontakt"}</span>
                              <div className="flex items-center gap-1">
                                {contact.is_primary ? <Badge variant="secondary">Primär</Badge> : null}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContact(contact)
                                    setEditContactModalOpen(true)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              {contact.role ? <p>Roll: {contact.role}</p> : null}
                              {contact.email ? (
                                <div className="flex items-center justify-between">
                                  <p className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {contact.email}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEmailRecipient(contact.email)
                                      setSendEmailModalOpen(true)
                                    }}
                                    className="h-6 px-2"
                                  >
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : null}
                              {contact.phone || contact.mobile ? (
                                <p className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {contact.phone ?? contact.mobile}
                                </p>
                              ) : null}
                              {contact.linkedin_url ? (
                                <p className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> {contact.linkedin_url}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                  </div>
                </section>
                <section className="rounded-lg border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Senaste aktiviteter
                  </h3>
                  <div className="mt-4 space-y-3 text-sm">
                    {activityLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ingen aktivitet registrerad.</p>
                    ) : (
                      <ScrollArea className="max-h-56 pr-2">
                        <div className="space-y-3">
                          {activityLog.map((item) => (
                            <div key={item.id} className="rounded-md border border-border/60 bg-background p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">{item.type}</p>
                              {item.description ? (
                                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{item.description}</p>
                              ) : null}
                              <p className="mt-2 text-xs text-muted-foreground">
                                {format(new Date(item.created_at), "PPP HH:mm", { locale: sv })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </section>
                <section className="rounded-lg border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Gruppmedlemskap
                  </h3>
                  <div className="mt-4 space-y-2 text-sm">
                    {groupMemberships.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Inga grupper kopplade.</p>
                    ) : (
                      groupMemberships.map((group) => (
                        <div
                          key={group.membership_id}
                          className="flex items-center justify-between rounded border bg-background/60 px-3 py-2"
                        >
                          <span>{group.name ?? "Namnlös grupp"}</span>
                          <Badge variant="secondary">ID: {group.id}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {detail.extras && typeof detail.extras === "object" && Object.keys(detail.extras).length > 0 ? (
                  <section className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Extra data</h3>
                    <div className="mt-4 space-y-4 text-sm">
                      {Object.entries(detail.extras as Record<string, unknown>).map(([key, value]) => (
                        <EditableField
                          key={key}
                          label={key}
                          value={typeof value === "string" ? value : JSON.stringify(value)}
                          field={`extras.${key}`}
                          type={typeof value === "number" ? "number" : "text"}
                          editingField={editingField}
                          fieldValues={fieldValues}
                          onEdit={handleFieldEdit}
                          onSave={async (field) => {
                            if (!detail) return
                            const extrasKey = field.replace("extras.", "")
                            const newValue = fieldValues[field] ?? value
                            setSavingField(field)
                            try {
                              const updatedExtras = {
                                ...detail.extras,
                                [extrasKey]: newValue,
                              }
                              await api.updateAssociation(detail.id, {
                                extras: updatedExtras,
                              } as any)
                              setDetail((prev) => (prev ? ({ ...prev, extras: updatedExtras } as AssociationDetail) : prev))
                              handleFieldCancel(field)
                              toast({ title: "Extra data uppdaterat" })
                            } catch (err) {
                              const message = err instanceof Error ? err.message : "Kunde inte spara extra data"
                              toast({ title: "Fel", description: message, variant: "destructive" })
                            } finally {
                              setSavingField((current) => (current === field ? null : current))
                            }
                          }}
                          onCancel={handleFieldCancel}
                          setEditingField={setEditingField}
                          savingField={savingField}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <NotepadText className="h-4 w-4" />
                    Anteckningar
                  </div>
                  <div className="mt-4 space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Inga anteckningar ännu.</p>
                    ) : (
                      <ScrollArea className="max-h-64 pr-2">
                        <div className="space-y-3">
                          {notes.map((item) => (
                            <div key={item.id} className="rounded-md border border-border/60 bg-background p-3 text-sm">
                              <p className="whitespace-pre-line">{item.content}</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {item.author ?? "Okänd"} • {format(new Date(item.created_at), "PPP HH:mm", { locale: sv })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Lägg till en anteckning"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                      />
                      <Button onClick={handleSaveNote} disabled={savingNote || note.trim() === ""} className="w-full">
                        {savingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Spara anteckning
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Ingen förening vald.
          </div>
        )}
      </DialogContent>

      {detail && (
        <>
          <AddContactModal
            open={addContactModalOpen}
            onOpenChange={setAddContactModalOpen}
            associationId={detail.id}
            associationName={detail.name}
            onCompleted={() => {
              void loadDetail()
              if (onUpdated) onUpdated()
            }}
          />

          <EditContactModal
            open={editContactModalOpen}
            onOpenChange={setEditContactModalOpen}
            contact={selectedContact}
            onUpdated={() => {
              void loadDetail()
              if (onUpdated) onUpdated()
            }}
          />

          <SendEmailModal
            open={sendEmailModalOpen}
            onOpenChange={setSendEmailModalOpen}
            associationId={detail.id}
            associationName={detail.name}
            defaultRecipient={emailRecipient}
            onCompleted={() => {
              void loadDetail()
              if (onUpdated) onUpdated()
            }}
          />
        </>
      )}
    </Dialog>
  )
}
