"use client"

import React, { useMemo, useState } from "react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Loader2, MapPin, NotepadText, Users, Pencil, Check, X } from "lucide-react"

import { api } from "@/lib/trpc/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CRM_STATUSES, PIPELINES } from "@/lib/validators/association"
import { toast } from "@/hooks/use-toast"

interface EditableFieldProps {
  label: string
  value: string | number | null
  field: string
  type?: "text" | "textarea" | "number"
  editingField: string | null
  fieldValues: Record<string, any>
  onEdit: (field: string, value: any) => void
  onSave: (field: string) => void
  onCancel: (field: string) => void
  setEditingField: (field: string | null) => void
}

const EditableField: React.FC<EditableFieldProps> = ({
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
}) => {
  const isEditing = editingField === field
  const currentValue = fieldValues[field] ?? value ?? ""

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingField(field)}
            className="h-6 w-6 p-0"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="flex items-center space-x-2">
          {type === "textarea" ? (
            <Textarea
              value={currentValue}
              onChange={(e) => onEdit(field, e.target.value)}
              className="flex-1"
            />
          ) : (
            <Input
              type={type}
              value={currentValue}
              onChange={(e) => onEdit(field, type === "number" ? Number(e.target.value) : e.target.value)}
              className="flex-1"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(field)}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(field)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{value || "Inte angivet"}</p>
      )}
    </div>
  )
}

interface AssociationDetailsDialogProps {
  associationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
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
    return values.split(",").map((value) => value.trim()).filter(Boolean)
  }

  return []
}

export function AssociationDetailsDialog({ associationId, open, onOpenChange }: AssociationDetailsDialogProps) {
  const utils = api.useUtils()
  const [note, setNote] = useState("")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [showEventsModal, setShowEventsModal] = useState(false)

  const detailsQuery = api.association.getById.useQuery(
    { id: associationId ?? "" },
    {
      enabled: open && Boolean(associationId),
      staleTime: 10_000,
    },
  )

  const tasksQuery = api.tasks.list.useQuery(
    { associationId: associationId ?? "" },
    {
      enabled: open && Boolean(associationId),
    },
  )

  const groupsQuery = api.groups.list.useQuery(
    {},
    {
      enabled: open && Boolean(associationId),
    },
  )

  const createNote = api.notes.create.useMutation({
    onSuccess: async () => {
      await utils.association.getById.invalidate({ id: associationId! })
      setNote("")
      toast({ title: "Anteckning sparad" })
    },
    onError: (error) => {
      toast({ title: "Kunde inte spara anteckning", description: error.message, variant: "destructive" })
    },
  })

  const updateContact = api.contacts.update.useMutation({
    onSuccess: () => {
      utils.association.getById.invalidate({ id: associationId! })
      toast({ title: "Kontakt uppdaterad" })
    },
    onError: (error) => toast({ title: "Kunde inte uppdatera kontakt", description: error.message, variant: "destructive" }),
  })

  const updateAssociation = api.association.update.useMutation({
    onSuccess: () => {
      utils.association.getById.invalidate({ id: associationId! })
      toast({ title: "Förening uppdaterad" })
    },
    onError: (error) => {
      toast({ title: "Kunde inte uppdatera förening", description: error.message, variant: "destructive" })
    },
  })

  const handleFieldEdit = (field: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [field]: value }))
  }

  const handleFieldSave = async (field: string) => {
    if (!association) return

    const value = fieldValues[field] ?? association[field as keyof typeof association]
    try {
      await updateAssociation.mutateAsync({
        id: association.id,
        data: {
          [field]: value,
        },
      })
      setEditingField(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleFieldCancel = (field: string) => {
    setFieldValues(prev => {
      const newValues = { ...prev }
      delete newValues[field]
      return newValues
    })
    setEditingField(null)
  }

  const association = detailsQuery.data

  const types = useMemo(() => renderList(association?.types), [association?.types])
  const activities = useMemo(() => renderList(association?.activities), [association?.activities])
  const categories = useMemo(() => renderList(association?.categories), [association?.categories])

  const handleStatusChange = async (status: string) => {
    if (!association || status === association.crmStatus) return
    await updateAssociation.mutateAsync({
      id: association.id,
      data: { crmStatus: status as any },
    })
  }

  const handlePipelineChange = async (pipeline: string) => {
    if (!association || pipeline === association.pipeline) return
    await updateAssociation.mutateAsync({
      id: association.id,
      data: { pipeline: pipeline as any },
    })
  }

  const handleSaveNote = async () => {
    if (!associationId || note.trim().length === 0) return
    await createNote.mutateAsync({ associationId, content: note.trim(), tags: [] })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-[90vw] max-w-7xl p-0">
        {detailsQuery.isPending ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Hämtar förening…
          </div>
        ) : !association ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Föreningen kunde inte laddas.</p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-semibold">{association.name}</DialogTitle>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {association.municipality ?? "Okänd kommun"}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {association.contacts.length} kontakter
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs uppercase tracking-wide">
                  Status:{" "}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="link" className="h-auto p-0 text-xs font-medium underline">
                        {association.crmStatus}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      {CRM_STATUSES.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onSelect={() => handleStatusChange(status)}
                          className={status === association.crmStatus ? "bg-muted" : undefined}
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
                <span className="text-xs uppercase tracking-wide">
                  Pipeline:{" "}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="link" className="h-auto p-0 text-xs font-medium underline">
                        {association.pipeline}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {PIPELINES.map((pipeline) => (
                        <DropdownMenuItem
                          key={pipeline}
                          onSelect={() => handlePipelineChange(pipeline)}
                          className={pipeline === association.pipeline ? "bg-muted" : undefined}
                        >
                          {pipeline}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </div>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-4 lg:flex-row">
              <ScrollArea className="h-full flex-1 pr-4">
                <div className="space-y-6 pb-8">
                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grunduppgifter</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <EditableField
                        label="Organisationsnummer"
                        value={association.orgNumber}
                        field="orgNumber"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                      />
                      <EditableField
                        label="Email"
                        value={association.email}
                        field="email"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                      />
                      <EditableField
                        label="Telefon"
                        value={association.phone}
                        field="phone"
                        editingField={editingField}
                        fieldValues={fieldValues}
                        onEdit={handleFieldEdit}
                        onSave={handleFieldSave}
                        onCancel={handleFieldCancel}
                        setEditingField={setEditingField}
                      />
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Medlemsstatus</dt>
                        <dd className="text-sm text-muted-foreground mt-2">{association.isMember ? "Aktiv medlem" : "Inte medlem"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Medlem sedan</dt>
                        <dd className="text-sm text-muted-foreground mt-2">
                          {association.memberSince
                            ? format(new Date(association.memberSince), "PPP", { locale: sv })
                            : "Saknas"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Hemsida</dt>
                        <dd className="text-sm text-muted-foreground mt-2">
                          {association.homepageUrl ? (
                            <a
                              href={association.homepageUrl}
                              className="text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {association.homepageUrl}
                            </a>
                          ) : (
                            "Saknas"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Primär kontakt</dt>
                        <dd className="text-sm text-muted-foreground mt-2">
                          {association.contacts.find((contact) => contact.isPrimary)?.name ?? "Ej angiven"}
                        </dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground">Adress</dt>
                        <dd className="text-sm text-muted-foreground mt-2 space-y-1">
                          {association.streetAddress ? <div>{association.streetAddress}</div> : null}
                          {association.postalCode || association.city ? (
                            <div>
                              {[association.postalCode, association.city].filter(Boolean).join(" ")}
                            </div>
                          ) : null}
                          {!association.streetAddress && !association.postalCode && !association.city ? (
                            <div>Saknas</div>
                          ) : null}
                        </dd>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Klassificeringar</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Typer</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {types.length ? types.map((type) => <li key={type}>{type}</li>) : <li>Ingen data</li>}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Taggar & Aktiviteter</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {association.tags.length ? (
                            association.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm">Inga taggar</span>
                          )}
                          {activities.length ? activities.map((activity) => (
                            <Badge key={activity} variant="secondary">
                              {activity}
                            </Badge>
                          )) : null}
                        </div>
                      </div>
                    </div>

                    {categories.length ? (
                      <div className="mt-6">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Kategorier</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {categories.map((category) => (
                            <li key={category}>{category}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Beskrivning från källa</h3>
                    <div className="mt-4">
                      {association.description ? (
                        <div className="text-sm whitespace-pre-line">{String(association.description)}</div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen beskrivning från källa.</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Övrig information</h3>
                    <div className="mt-4">
                      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Källsystem</dt>
                          <dd>{association.sourceSystem ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Bildad år</dt>
                          <dd>{(association.extras as any)?.founded_year ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Taggar</dt>
                          <dd>{(association.extras as any)?.verksamhet_raw ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Kort beskrivning</dt>
                          <dd>{(association.extras as any)?.short_description ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">År startar</dt>
                          <dd>{(association.extras as any)?.fiscal_year_starts ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Fritext</dt>
                          <dd>{(association.extras as any)?.free_text ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Mobiltelefon</dt>
                          <dd>{(association.extras as any)?.mobile ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Distrikt</dt>
                          <dd>{(association.extras as any)?.district_names ?? "Saknas"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Riksorganisation</dt>
                          <dd>{(association.extras as any)?.national_affiliation ?? "Saknas"}</dd>
                        </div>
                      </dl>
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="flex w-full max-w-md flex-col gap-4">
                <section className="rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Tasks
                  </div>
                  <ScrollArea className="h-full max-h-[20vh]">
                    <div className="space-y-4 px-4 py-4">
                      {tasksQuery.data?.length ? (
                        tasksQuery.data.map((task) => (
                          <div key={task.id} className="rounded-md border bg-muted/40 p-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <Badge variant={task.status === "COMPLETED" ? "secondary" : "default"}>
                                {task.status}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                            )}
                            {task.dueDate && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Förfaller: {format(new Date(task.dueDate), "yyyy-MM-dd", { locale: sv })}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Inga tasks ännu.</p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t px-4 py-3">
                    <Button variant="outline" size="sm" className="w-full">
                      Skapa ny task
                    </Button>
                  </div>
                </section>

                <section className="flex-1 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <NotepadText className="h-4 w-4" /> Anteckningar
                  </div>
                  <ScrollArea className="h-full max-h-[40vh]">
                    <div className="space-y-4 px-4 py-4">
                      {association.notes.length ? (
                        association.notes.map((noteItem) => (
                          <div key={noteItem.id} className="rounded-md border bg-muted/40 p-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{noteItem.authorName}</span>
                              <span>
                                {format(new Date(noteItem.createdAt), "yyyy-MM-dd HH:mm", {
                                  locale: sv,
                                })}
                              </span>
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-line">{noteItem.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Inga anteckningar ännu.</p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t px-4 py-3">
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Lägg till anteckning..."
                      rows={4}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button onClick={handleSaveNote} size="sm" disabled={createNote.isPending || note.trim().length === 0}>
                        {createNote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Spara anteckning
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Grupper
                  </div>
                  <ScrollArea className="h-full max-h-[20vh]">
                    <div className="space-y-4 px-4 py-4">
                      {groupsQuery.data?.length ? (
                        groupsQuery.data.map((group) => (
                          <div key={group.id} className="rounded-md border bg-muted/40 p-3">
                            <h4 className="font-medium text-sm">{group.name}</h4>
                            {group.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Inga grupper ännu.</p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t px-4 py-3">
                    <Button variant="outline" size="sm" className="w-full">
                      Lägg till i grupp
                    </Button>
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-4 text-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Senaste aktivitet</h3>
                  <dl className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Senaste aktivitet</dt>
                      <dd>{association.activityLog[0]?.type ?? "Saknas"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ansvarig</dt>
                      <dd>{association.assignedTo?.name ?? "Ej tilldelad"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowEventsModal(true)}>
                      Visa alla händelser
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={showEventsModal} onOpenChange={setShowEventsModal}>
        <DialogContent className="h-[80vh] w-[80vw] max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Händelser för {association?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="space-y-4">
              {association?.activityLog.length ? (
                association.activityLog.map((activity) => (
                  <div key={activity.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{activity.type}</Badge>
                        <span className="text-sm text-muted-foreground">{activity.userName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(activity.createdAt), "yyyy-MM-dd HH:mm", { locale: sv })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{activity.description}</p>
                    {activity.metadata && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">Visa metadata</summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Inga händelser ännu.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}