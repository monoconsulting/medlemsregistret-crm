"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, type Association, type Municipality, type Tag } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface Filters {
  q: string
  municipality: string
  type: string
  status: string
  tags: string[]
  sort: "updated_desc" | "updated_asc" | "name_asc" | "name_desc"
}

const defaultFilters: Filters = {
  q: "",
  municipality: "",
  type: "",
  status: "",
  tags: [],
  sort: "updated_desc",
}

const sortOptions = [
  { value: "updated_desc", label: "Senast uppdaterad" },
  { value: "updated_asc", label: "Äldst uppdaterad" },
  { value: "name_asc", label: "Namn A–Ö" },
  { value: "name_desc", label: "Namn Ö–A" },
]

function FiltersForm({
  filters,
  onChange,
  municipalities,
  tags,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  municipalities: Municipality[]
  tags: Tag[]
}) {
  const handleInput = (key: keyof Filters) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, [key]: event.target.value })
  }

  const toggleTag = (tagId: string) => {
    const exists = filters.tags.includes(tagId)
    onChange({
      ...filters,
      tags: exists ? filters.tags.filter((t) => t !== tagId) : [...filters.tags, tagId],
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Sök</label>
            <Input value={filters.q} onChange={handleInput("q")} placeholder="Sök på namn eller beskrivning" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Kommun</label>
            <Select
              value={filters.municipality || ""}
              onValueChange={(value) => onChange({ ...filters, municipality: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alla kommuner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alla kommuner</SelectItem>
                {municipalities.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Sortering</label>
            <Select value={filters.sort} onValueChange={(value) => onChange({ ...filters, sort: value as Filters["sort"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Typ</label>
            <Input value={filters.type} onChange={handleInput("type")} placeholder="t.ex. Idrott" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Input value={filters.status} onChange={handleInput("status")} placeholder="t.ex. Aktiv" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Taggar</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = filters.tags.includes(String(tag.id))
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(String(tag.id))}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    isSelected ? "border-primary bg-primary/10" : "border-muted bg-muted/40"
                  }`}
                >
                  {tag.name}
                </button>
              )
            })}
            {tags.length === 0 && <span className="text-sm text-muted-foreground">Inga taggar skapade ännu.</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface AssociationFormState {
  id?: number
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

const emptyAssociation: AssociationFormState = {
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

function AssociationForm({
  value,
  municipalities,
  onChange,
  onSubmit,
  submitting,
}: {
  value: AssociationFormState
  municipalities: Municipality[]
  onChange: (next: AssociationFormState) => void
  onSubmit: () => void
  submitting: boolean
}) {
  const updateField = (key: keyof AssociationFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...value, [key]: event.target.value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{value.id ? "Redigera organisation" : "Ny organisation"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Namn</label>
            <Input value={value.name} onChange={updateField("name")} placeholder="Föreningens namn" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Kommun</label>
            <Select
              value={value.municipality_id}
              onValueChange={(val) => onChange({ ...value, municipality_id: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kommun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ingen kommun</SelectItem>
                {municipalities.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Typ</label>
            <Input value={value.type} onChange={updateField("type")} placeholder="Typ" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Input value={value.status} onChange={updateField("status")} placeholder="Status" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">E-post</label>
            <Input value={value.email} onChange={updateField("email")} placeholder="kontakt@forening.se" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Telefon</label>
            <Input value={value.phone} onChange={updateField("phone")} placeholder="010-123 45 67" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Adress</label>
            <Input value={value.address} onChange={updateField("address")} placeholder="Adress" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Webbplats</label>
            <Input value={value.website} onChange={updateField("website")} placeholder="https://" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Beskrivning</label>
          <Textarea value={value.description} onChange={updateField("description")} rows={4} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onChange({ ...emptyAssociation })} disabled={submitting}>
            Rensa
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !value.name.trim()}>
            {value.id ? "Spara ändringar" : "Skapa"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotesPanel({ associationId }: { associationId: number }) {
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState("")

  const loadNotes = useCallback(async () => {
    setLoading(true)
    try {
      const items = await api.getNotes(associationId)
      setNotes(items.map((item) => `${item.created_at}: ${item.content}`))
    } catch (error) {
      console.error(error)
      toast({
        title: "Kunde inte hämta anteckningar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [associationId])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  const submitNote = async () => {
    if (!noteText.trim()) return
    try {
      await api.addNote(associationId, noteText)
      setNoteText("")
      await loadNotes()
    } catch (error) {
      toast({
        title: "Kunde inte spara anteckning",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anteckningar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Lägg till en anteckning"
          />
          <Button onClick={submitNote} disabled={!noteText.trim()}>
            Spara anteckning
          </Button>
        </div>
        <div className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Laddar anteckningar…</p>}
          {!loading && notes.length === 0 && <p className="text-sm text-muted-foreground">Inga anteckningar ännu.</p>}
          {!loading &&
            notes.map((note, index) => (
              <div key={index} className="rounded-md border bg-white p-3 text-sm">
                {note}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TagsManager({ association, tags, onChange }: { association: Association; tags: Tag[]; onChange: () => void }) {
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState("")

  const toggle = async (tagId: number, hasTag: boolean) => {
    setSaving(true)
    try {
      if (hasTag) {
        await api.detachTag(association.id, tagId)
      } else {
        await api.attachTag(association.id, tagId)
      }
      onChange()
    } catch (error) {
      toast({
        title: "Kunde inte uppdatera tagg",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const createTag = async () => {
    if (!newTag.trim()) return
    setSaving(true)
    try {
      await api.createTag(newTag.trim())
      setNewTag("")
      onChange()
    } catch (error) {
      toast({
        title: "Kunde inte skapa tagg",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const tagIds = new Set(association.tags?.map((tag) => tag.id) ?? [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taggar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const hasTag = tagIds.has(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                disabled={saving}
                onClick={() => void toggle(tag.id, hasTag)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  hasTag ? "border-primary bg-primary/10" : "border-muted bg-muted/40"
                }`}
              >
                {tag.name}
              </button>
            )
          })}
          {tags.length === 0 && <span className="text-sm text-muted-foreground">Inga taggar att visa.</span>}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newTag}
            onChange={(event) => setNewTag(event.target.value)}
            placeholder="Ny tagg"
            disabled={saving}
          />
          <Button onClick={() => void createTag()} disabled={saving || !newTag.trim()}>
            Lägg till
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface AssociationWithTags extends Association {
  tags?: Tag[]
}

export default function AssociationsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [associations, setAssociations] = useState<AssociationWithTags[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [formState, setFormState] = useState<AssociationFormState>(emptyAssociation)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const loadTagList = async () => {
    try {
      const tagItems = await api.getTags()
      setTags(tagItems)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        const municipalityItems = await api.getMunicipalities()
        setMunicipalities(municipalityItems)
      } catch (error) {
        console.error(error)
      }
    }
    void loadMunicipalities()
    void loadTagList()
  }, [])

  const loadAssociations = async () => {
    setLoading(true)
    try {
      const response = await api.getAssociations({
        q: filters.q,
        municipality: filters.municipality,
        type: filters.type,
        status: filters.status,
        tags: filters.tags,
        page,
        pageSize,
        sort: filters.sort,
      })
      const enriched: AssociationWithTags[] = response.items.map((item) => ({
        ...item,
        tags: (item as AssociationWithTags).tags ?? [],
      }))
      setAssociations(enriched)
      setTotal(response.total)
    } catch (error) {
      toast({
        title: "Kunde inte hämta organisationer",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAssociations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page])

  const selectedAssociation = useMemo(() => {
    if (selectedId == null) return null
    return associations.find((association) => association.id === selectedId) ?? null
  }, [associations, selectedId])

  useEffect(() => {
    if (selectedAssociation) {
      setFormState({
        id: selectedAssociation.id,
        name: selectedAssociation.name,
        municipality_id: selectedAssociation.municipality_id ? String(selectedAssociation.municipality_id) : "",
        type: selectedAssociation.type ?? "",
        status: selectedAssociation.status ?? "",
        email: selectedAssociation.email ?? "",
        phone: selectedAssociation.phone ?? "",
        address: selectedAssociation.address ?? "",
        website: selectedAssociation.website ?? "",
        description: selectedAssociation.description ?? "",
      })
    } else {
      setFormState(emptyAssociation)
    }
  }, [selectedAssociation])

  const handleSubmitAssociation = async () => {
    setFormSubmitting(true)
    try {
      if (formState.id) {
        await api.updateAssociation(formState.id, {
          name: formState.name,
          municipality_id: formState.municipality_id ? Number(formState.municipality_id) : null,
          type: formState.type || null,
          status: formState.status || null,
          email: formState.email || null,
          phone: formState.phone || null,
          address: formState.address || null,
          website: formState.website || null,
          description: formState.description || null,
        })
        toast({ title: "Organisation uppdaterad" })
      } else {
        await api.createAssociation({
          name: formState.name,
          municipality_id: formState.municipality_id ? Number(formState.municipality_id) : null,
          type: formState.type || null,
          status: formState.status || null,
          email: formState.email || null,
          phone: formState.phone || null,
          address: formState.address || null,
          website: formState.website || null,
          description: formState.description || null,
        })
        toast({ title: "Organisation skapad" })
        setFormState(emptyAssociation)
      }
      await loadAssociations()
    } catch (error) {
      toast({
        title: "Kunde inte spara organisation",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAssociation(id)
      toast({ title: "Organisation raderad" })
      if (selectedId === id) {
        setSelectedId(null)
      }
      await loadAssociations()
    } catch (error) {
      toast({
        title: "Kunde inte radera organisation",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6 p-6">
      <FiltersForm filters={filters} onChange={(next) => setFilters(next)} municipalities={municipalities} tags={tags} />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Organisationer</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Sida {page} av {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              Föregående
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Nästa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Laddar organisationer…</p>
          ) : associations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga organisationer hittades.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Kommun</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Taggar</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associations.map((association) => (
                  <TableRow key={association.id} className={selectedId === association.id ? "bg-muted/50" : undefined}>
                    <TableCell className="font-medium">{association.name}</TableCell>
                    <TableCell>
                      {municipalities.find((m) => m.id === association.municipality_id)?.name ?? "-"}
                    </TableCell>
                    <TableCell>{association.type ?? "-"}</TableCell>
                    <TableCell>{association.status ?? "-"}</TableCell>
                    <TableCell>{association.email ?? "-"}</TableCell>
                    <TableCell>{association.phone ?? "-"}</TableCell>
                    <TableCell className="space-x-1">
                      {(association.tags ?? []).map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(association.id)}>
                        Visa
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => void handleDelete(association.id)}>
                        Radera
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AssociationForm
          value={formState}
          municipalities={municipalities}
          onChange={setFormState}
          onSubmit={() => void handleSubmitAssociation()}
          submitting={formSubmitting}
        />

        {selectedAssociation ? (
          <div className="space-y-6">
            <TagsManager
              association={selectedAssociation}
              tags={tags}
              onChange={() => {
                void loadTagList()
                void loadAssociations()
              }}
            />
            <NotesPanel associationId={selectedAssociation.id} />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Detaljer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Markera en organisation i tabellen för att se detaljer, anteckningar och taggar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
