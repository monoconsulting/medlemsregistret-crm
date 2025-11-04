"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { api, Association, Municipality, Note, Tag } from "@/lib/api"

const sortOptions = [
  { value: "updated_desc", label: "Senast uppdaterad" },
  { value: "updated_asc", label: "Äldst uppdaterad" },
  { value: "name_asc", label: "Namn A–Ö" },
  { value: "name_desc", label: "Namn Ö–A" },
]

const pageSizes = [10, 25, 50, 100]

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

const numericOrNull = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

type FilterState = {
  q: string
  municipality: string
  type: string
  status: string
  tags: string[]
  page: number
  pageSize: number
  sort: "updated_desc" | "updated_asc" | "name_asc" | "name_desc"
}

const defaultFilters: FilterState = {
  q: "",
  municipality: "",
  type: "",
  status: "",
  tags: [],
  page: 1,
  pageSize: 25,
  sort: "updated_desc",
}

type AssociationFormState = {
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

const emptyForm: AssociationFormState = {
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

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function AssociationsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [associations, setAssociations] = useState<Association[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selected, setSelected] = useState<Association | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [creatingAssociation, setCreatingAssociation] = useState(false)
  const [savingAssociation, setSavingAssociation] = useState(false)
  const [deletingAssociation, setDeletingAssociation] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newAssociationForm, setNewAssociationForm] = useState<AssociationFormState>(emptyForm)
  const [editAssociationForm, setEditAssociationForm] = useState<AssociationFormState | null>(null)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / filters.pageSize))
  }, [total, filters.pageSize])

  const handleAuthError = useCallback(
    (message: string) => {
      if (message.toLowerCase().includes("not authenticated") || message.includes("401")) {
        router.push("/login")
        return true
      }
      return false
    },
    [router],
  )

  const handleError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : "Ett oväntat fel inträffade"
      if (handleAuthError(message)) {
        return
      }
      setError(message)
    },
    [handleAuthError],
  )

  const fetchAssociations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getAssociations({
        q: filters.q.trim() || undefined,
        municipality: filters.municipality.trim() || undefined,
        type: filters.type.trim() || undefined,
        status: filters.status.trim() || undefined,
        tags: filters.tags,
        page: filters.page,
        pageSize: filters.pageSize,
        sort: filters.sort,
      })
      setAssociations(res.items)
      setTotal(res.total)
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [filters, handleError])

  const fetchMunicipalities = useCallback(async () => {
    try {
      const items = await api.getMunicipalities()
      setMunicipalities(items)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const fetchTags = useCallback(async () => {
    try {
      const items = await api.getTags()
      setTags(items)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  const fetchNotes = useCallback(
    async (associationId: number) => {
      try {
        const items = await api.getNotes(associationId)
        setNotes(items)
      } catch (err) {
        handleError(err)
      }
    },
    [handleError],
  )

  const fetchSelectedTags = useCallback(
    async (associationId: number) => {
      try {
        const items = await api.getAssociationTags(associationId)
        setSelectedTags(items)
      } catch (err) {
        handleError(err)
      }
    },
    [handleError],
  )

  useEffect(() => {
    void fetchMunicipalities()
    void fetchTags()
  }, [fetchMunicipalities, fetchTags])

  useEffect(() => {
    void fetchAssociations()
  }, [fetchAssociations])

  useEffect(() => {
    if (!selected) return
    const match = associations.find((item) => item.id === selected.id)
    if (!match) {
      setSelected(null)
      setEditAssociationForm(null)
      setNotes([])
      setSelectedTags([])
      return
    }
    const shouldUpdate =
      match.name !== selected.name ||
      match.municipality_id !== selected.municipality_id ||
      match.type !== selected.type ||
      match.status !== selected.status ||
      match.email !== selected.email ||
      match.phone !== selected.phone ||
      match.address !== selected.address ||
      match.website !== selected.website ||
      match.description !== selected.description ||
      match.updated_at !== selected.updated_at
    if (shouldUpdate) {
      setSelected(match)
      setEditAssociationForm({
        name: match.name ?? "",
        municipality_id: match.municipality_id ? String(match.municipality_id) : "",
        type: match.type ?? "",
        status: match.status ?? "",
        email: match.email ?? "",
        phone: match.phone ?? "",
        address: match.address ?? "",
        website: match.website ?? "",
        description: match.description ?? "",
      })
      void fetchNotes(match.id)
      void fetchSelectedTags(match.id)
    }
  }, [associations, fetchNotes, fetchSelectedTags, selected])

  const selectAssociation = (association: Association) => {
    setSelected(association)
    setEditAssociationForm({
      name: association.name ?? "",
      municipality_id: association.municipality_id ? String(association.municipality_id) : "",
      type: association.type ?? "",
      status: association.status ?? "",
      email: association.email ?? "",
      phone: association.phone ?? "",
      address: association.address ?? "",
      website: association.website ?? "",
      description: association.description ?? "",
    })
    void fetchNotes(association.id)
    void fetchSelectedTags(association.id)
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      const next: FilterState = { ...prev, [key]: value } as FilterState
      if (key !== "page") {
        next.page = 1
      }
      return next
    })
  }

  const handleCreateAssociation = async () => {
    if (!newAssociationForm.name.trim()) {
      setError("Namn krävs för att skapa en förening")
      return
    }
    setCreatingAssociation(true)
    setError(null)
    try {
      await api.createAssociation({
        name: newAssociationForm.name.trim(),
        municipality_id: numericOrNull(newAssociationForm.municipality_id),
        type: blankToNull(newAssociationForm.type),
        status: blankToNull(newAssociationForm.status),
        email: blankToNull(newAssociationForm.email),
        phone: blankToNull(newAssociationForm.phone),
        address: blankToNull(newAssociationForm.address),
        website: blankToNull(newAssociationForm.website),
        description: blankToNull(newAssociationForm.description),
      })
      setNewAssociationForm(emptyForm)
      await fetchAssociations()
    } catch (err) {
      handleError(err)
    } finally {
      setCreatingAssociation(false)
    }
  }

  const handleUpdateAssociation = async () => {
    if (!selected || !editAssociationForm) return
    if (!editAssociationForm.name.trim()) {
      setError("Namn får inte vara tomt")
      return
    }
    setSavingAssociation(true)
    setError(null)
    try {
      await api.updateAssociation(selected.id, {
        name: editAssociationForm.name.trim(),
        municipality_id: numericOrNull(editAssociationForm.municipality_id),
        type: blankToNull(editAssociationForm.type),
        status: blankToNull(editAssociationForm.status),
        email: blankToNull(editAssociationForm.email),
        phone: blankToNull(editAssociationForm.phone),
        address: blankToNull(editAssociationForm.address),
        website: blankToNull(editAssociationForm.website),
        description: blankToNull(editAssociationForm.description),
      })
      await fetchAssociations()
    } catch (err) {
      handleError(err)
    } finally {
      setSavingAssociation(false)
    }
  }

  const handleDeleteAssociation = async () => {
    if (!selected) return
    if (!window.confirm(`Vill du mjuk-radera ${selected.name}?`)) {
      return
    }
    setDeletingAssociation(true)
    setError(null)
    try {
      await api.deleteAssociation(selected.id)
      setSelected(null)
      setEditAssociationForm(null)
      setNotes([])
      setSelectedTags([])
      await fetchAssociations()
    } catch (err) {
      handleError(err)
    } finally {
      setDeletingAssociation(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setError("Taggnamn krävs")
      return
    }
    setCreatingTag(true)
    setError(null)
    try {
      await api.createTag(newTagName.trim())
      setNewTagName("")
      await fetchTags()
      if (selected) {
        await fetchSelectedTags(selected.id)
      }
    } catch (err) {
      handleError(err)
    } finally {
      setCreatingTag(false)
    }
  }

  const toggleTagForSelected = async (tag: Tag) => {
    if (!selected) return
    setError(null)
    try {
      const hasTag = selectedTags.some((t) => t.id === tag.id)
      if (hasTag) {
        await api.detachTag(selected.id, tag.id)
        setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))
      } else {
        await api.attachTag(selected.id, tag.id)
        setSelectedTags((prev) => [...prev, tag])
      }
    } catch (err) {
      handleError(err)
    }
  }

  const handleCreateNote = async () => {
    if (!selected) return
    if (!newNote.trim()) {
      setError("Anteckningen kan inte vara tom")
      return
    }
    setError(null)
    try {
      await api.addNote(selected.id, newNote.trim())
      setNewNote("")
      await fetchNotes(selected.id)
    } catch (err) {
      handleError(err)
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (err) {
      // ignore logout errors, user is leaving anyway
    } finally {
      router.push("/login")
    }
  }

  const tagFilterSelected = (tagId: string) => filters.tags.includes(tagId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Föreningar</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchAssociations()}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Uppdatera
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Logga ut
          </button>
        </div>
      </div>

      {error ? <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-medium">Filtrera</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Sök
            <input
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={filters.q}
              onChange={(e) => updateFilter("q", e.target.value)}
              placeholder="Namn eller beskrivning"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Kommun
            <select
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={filters.municipality}
              onChange={(e) => updateFilter("municipality", e.target.value)}
            >
              <option value="">Alla</option>
              {municipalities.map((municipality) => (
                <option key={municipality.id} value={String(municipality.id)}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <input
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              placeholder="Ex. aktiv"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Typ
            <input
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
              placeholder="Ex. idrott"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Sortering
            <select
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={filters.sort}
              onChange={(e) => updateFilter("sort", e.target.value as FilterState["sort"])}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Poster per sida
            <select
              className="mt-1 w-full rounded border border-slate-300 p-2"
              value={filters.pageSize}
              onChange={(e) => updateFilter("pageSize", Math.min(Number(e.target.value), 100))}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4">
          <span className="text-sm font-medium text-slate-700">Taggar</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tagFilterSelected(String(tag.id))}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setFilters((prev) => ({
                      ...prev,
                      tags: checked
                        ? [...prev.tags, String(tag.id)]
                        : prev.tags.filter((value) => value !== String(tag.id)),
                      page: 1,
                    }))
                  }}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          >
            Rensa filter
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Resultat ({total})</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm"
              disabled={filters.page <= 1}
              onClick={() => updateFilter("page", Math.max(1, filters.page - 1))}
            >
              Föregående
            </button>
            <span className="text-sm text-slate-600">
              Sida {filters.page} av {totalPages}
            </span>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm"
              disabled={filters.page >= totalPages}
              onClick={() => updateFilter("page", Math.min(totalPages, filters.page + 1))}
            >
              Nästa
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Namn</th>
                <th className="px-3 py-2 text-left font-semibold">Kommun</th>
                <th className="px-3 py-2 text-left font-semibold">Typ</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Uppdaterad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Hämtar data…
                  </td>
                </tr>
              ) : associations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Inga föreningar matchar filtret.
                  </td>
                </tr>
              ) : (
                associations.map((association) => (
                  <tr
                    key={association.id}
                    className={
                      selected && selected.id === association.id ? "bg-blue-50" : "hover:bg-slate-50"
                    }
                    onClick={() => selectAssociation(association)}
                  >
                    <td className="px-3 py-2 font-medium text-blue-700 underline-offset-2 hover:underline">
                      {association.name}
                    </td>
                    <td className="px-3 py-2">
                      {municipalities.find((m) => m.id === association.municipality_id)?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">{association.type ?? "—"}</td>
                    <td className="px-3 py-2">{association.status ?? "—"}</td>
                    <td className="px-3 py-2">{formatDate(association.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium">Skapa ny förening</h3>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-medium text-slate-700">
              Namn*
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.name}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Kommun
              <select
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.municipality_id}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, municipality_id: e.target.value }))}
              >
                <option value="">Ingen</option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={String(municipality.id)}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Typ
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.type}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, type: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.status}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, status: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              E-post
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.email}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Telefon
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.phone}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Adress
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.address}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Webbplats
              <input
                className="mt-1 w-full rounded border border-slate-300 p-2"
                value={newAssociationForm.website}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, website: e.target.value }))}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Beskrivning
              <textarea
                className="mt-1 w-full rounded border border-slate-300 p-2"
                rows={3}
                value={newAssociationForm.description}
                onChange={(e) => setNewAssociationForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateAssociation()}
            className="mt-4 w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            disabled={creatingAssociation}
          >
            {creatingAssociation ? "Skapar…" : "Skapa"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium">Detaljer</h3>
          {!selected || !editAssociationForm ? (
            <p className="mt-4 text-sm text-slate-600">
              Välj en förening i listan för att visa detaljer, uppdatera information, hantera taggar och skriva anteckningar.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-700">
                  Namn*
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.name}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Kommun
                  <select
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.municipality_id}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, municipality_id: e.target.value } : prev,
                      )
                    }
                  >
                    <option value="">Ingen</option>
                    {municipalities.map((municipality) => (
                      <option key={municipality.id} value={String(municipality.id)}>
                        {municipality.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Typ
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.type}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, type: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Status
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.status}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, status: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  E-post
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.email}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Telefon
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.phone}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Adress
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.address}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, address: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Webbplats
                  <input
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    value={editAssociationForm.website}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, website: e.target.value } : prev,
                      )
                    }
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Beskrivning
                  <textarea
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    rows={3}
                    value={editAssociationForm.description}
                    onChange={(e) =>
                      setEditAssociationForm((prev) =>
                        prev ? { ...prev, description: e.target.value } : prev,
                      )
                    }
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleUpdateAssociation()}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  disabled={savingAssociation}
                >
                  {savingAssociation ? "Sparar…" : "Spara ändringar"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAssociation()}
                  className="rounded border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  disabled={deletingAssociation}
                >
                  {deletingAssociation ? "Tar bort…" : "Mjuk-radera"}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">Taggar</h4>
                  <div className="flex gap-2">
                    <input
                      className="rounded border border-slate-300 p-2 text-sm"
                      placeholder="Ny tagg"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateTag()}
                      className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      disabled={creatingTag}
                    >
                      {creatingTag ? "Skapar…" : "Lägg till"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = selectedTags.some((t) => t.id === tag.id)
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        className={`rounded px-3 py-1 text-sm ${
                          active ? "bg-blue-600 text-white" : "border border-slate-300"
                        }`}
                        onClick={() => void toggleTagForSelected(tag)}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-semibold">Anteckningar</h4>
                <div className="space-y-2">
                  {notes.length === 0 ? (
                    <p className="text-sm text-slate-600">Inga anteckningar ännu.</p>
                  ) : (
                    notes.map((note) => (
                      <article key={note.id} className="rounded border border-slate-200 p-3">
                        <header className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{note.author ?? "Okänd"}</span>
                          <span className="text-xs text-slate-500">{formatDate(note.created_at)}</span>
                        </header>
                        <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      </article>
                    ))
                  )}
                </div>
                <textarea
                  className="w-full rounded border border-slate-300 p-2"
                  rows={3}
                  placeholder="Lägg till en anteckning"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void handleCreateNote()}
                  className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Spara anteckning
                </button>
              </div>

              <div className="text-xs text-slate-500">
                <p>Skapad: {formatDate(selected.created_at)}</p>
                <p>Senast uppdaterad: {formatDate(selected.updated_at)}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
