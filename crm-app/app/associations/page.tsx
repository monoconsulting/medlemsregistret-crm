"use client"

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api, Association, AssocFilters, Municipality, Tag } from '@/lib/api'
import { AssociationForm, AssociationFormValues } from '@/components/association-form'
import { Modal } from '@/components/ui/modal'
import { NotesModal } from '@/components/notes-modal'
import { TagsModal } from '@/components/tags-modal'
import { useToast } from '@/components/ui/use-toast'
import { LogOut, Plus, RefreshCw, Search, SortAsc, SortDesc } from 'lucide-react'

interface FilterState {
  q: string
  municipality: string
  type: string
  status: string
  tags: string[]
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function AssociationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [filters, setFilters] = useState<FilterState>({ q: '', municipality: '', type: '', status: '', tags: [] })
  const [sort, setSort] = useState<AssocFilters['sort']>('updated_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Association | null>(null)
  const [notesTarget, setNotesTarget] = useState<Association | null>(null)
  const [tagsTarget, setTagsTarget] = useState<Association | null>(null)

  const municipalitiesQuery = useQuery<Municipality[], Error>({
    queryKey: ['municipalities'],
    queryFn: api.getMunicipalities,
  })

  const tagsQuery = useQuery<Tag[], Error>({ queryKey: ['all-tags'], queryFn: api.getTags })

  const associationsQuery = useQuery({
    queryKey: ['associations', filters, page, pageSize, sort],
    queryFn: () => api.getAssociations({ ...filters, page, pageSize, sort }),
    retry: (failureCount, error) => {
      if (error instanceof Error && (error as any).status === 401) {
        return false
      }
      return failureCount < 2
    },
  })

  useEffect(() => {
    if (associationsQuery.error instanceof Error && (associationsQuery.error as any).status === 401) {
      toast({ title: 'Sessionen har upphört', description: 'Logga in igen.', variant: 'destructive' })
      router.push('/login')
    }
  }, [associationsQuery.error, router, toast])

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      toast({ title: 'Utloggad', description: 'Du har loggats ut.' })
      queryClient.clear()
      router.push('/login')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Kunde inte logga ut'
      toast({ title: 'Fel vid utloggning', description: message, variant: 'destructive' })
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: AssociationFormValues) => api.createAssociation(values),
    onSuccess: async () => {
      toast({ title: 'Förening skapad', variant: 'success' })
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['associations'] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Kunde inte skapa föreningen'
      toast({ title: 'Fel', description: message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: AssociationFormValues }) => api.updateAssociation(id, values),
    onSuccess: async (_, variables) => {
      toast({ title: 'Förening uppdaterad', variant: 'success' })
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['associations'] })
      await queryClient.invalidateQueries({ queryKey: ['notes', variables.id] })
      await queryClient.invalidateQueries({ queryKey: ['tags', variables.id] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Kunde inte spara ändringarna'
      toast({ title: 'Fel', description: message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAssociation(id),
    onSuccess: async () => {
      toast({ title: 'Förening arkiverad', variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['associations'] })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Kunde inte radera föreningen'
      toast({ title: 'Fel', description: message, variant: 'destructive' })
    },
  })

  const totalPages = useMemo(() => {
    if (!associationsQuery.data) return 1
    return Math.max(1, Math.ceil(associationsQuery.data.total / pageSize))
  }, [associationsQuery.data, pageSize])

  function handleFilterChange(partial: Partial<FilterState>) {
    setFilters((current) => ({ ...current, ...partial }))
    setPage(1)
  }

  function toggleTagFilter(tagId: string) {
    setFilters((current) => {
      const exists = current.tags.includes(tagId)
      return {
        ...current,
        tags: exists ? current.tags.filter((id) => id !== tagId) : [...current.tags, tagId],
      }
    })
    setPage(1)
  }

  function handleSort(column: 'name' | 'updated_at') {
    if (column === 'name') {
      setSort((current) => (current === 'name_asc' ? 'name_desc' : 'name_asc'))
    } else {
      setSort((current) => (current === 'updated_asc' ? 'updated_desc' : 'updated_asc'))
    }
  }

  function sortIcon(column: 'name' | 'updated_at') {
    if (column === 'name') {
      if (sort === 'name_asc') return <SortAsc className="h-4 w-4" />
      if (sort === 'name_desc') return <SortDesc className="h-4 w-4" />
    } else {
      if (sort === 'updated_asc') return <SortAsc className="h-4 w-4" />
      if (sort === 'updated_desc') return <SortDesc className="h-4 w-4" />
    }
    return null
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Föreningar</h1>
            <p className="text-sm text-slate-600">Sök, filtrera och hantera medlemsföreningar.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 bg-sky-600 text-white hover:bg-sky-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> Ny förening
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              onClick={() => associationsQuery.refetch()}
              disabled={associationsQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" /> Uppdatera
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" /> Logga ut
            </button>
          </div>
        </div>
        <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="search">
              <Search className="h-4 w-4" /> Sök
            </label>
            <input
              id="search"
              placeholder="Sök på namn eller beskrivning"
              value={filters.q}
              onChange={(event) => handleFilterChange({ q: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="municipality">
              Kommun
            </label>
            <select
              id="municipality"
              value={filters.municipality}
              onChange={(event) => handleFilterChange({ municipality: event.target.value })}
            >
              <option value="">Alla kommuner</option>
              {municipalitiesQuery.data?.map((municipality) => (
                <option key={municipality.id} value={String(municipality.id)}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="type-filter">
              Typ
            </label>
            <input
              id="type-filter"
              value={filters.type}
              onChange={(event) => handleFilterChange({ type: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="status-filter">
              Status
            </label>
            <input
              id="status-filter"
              value={filters.status}
              onChange={(event) => handleFilterChange({ status: event.target.value })}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <p className="text-sm font-medium text-slate-700">Taggar</p>
            {tagsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Laddar taggar…</p>
            ) : tagsQuery.error ? (
              <p className="text-sm text-rose-600">{tagsQuery.error.message}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagsQuery.data?.map((tag) => {
                  const active = filters.tags.includes(String(tag.id))
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-sky-600 bg-sky-100 text-sky-900' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
                      onClick={() => toggleTagFilter(String(tag.id))}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="rounded-lg bg-white shadow">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-600">
              {(() => {
                const total = associationsQuery.data?.total ?? 0
                if (total === 0) {
                  return 'Inga föreningar att visa'
                }
                const start = (page - 1) * pageSize + 1
                const end = Math.min(page * pageSize, total)
                return `Visar ${start}–${end} av ${total} föreningar`
              })()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600" htmlFor="page-size">
              Rader per sida
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-6 py-3">
                  <button type="button" className="flex items-center gap-1" onClick={() => handleSort('name')}>
                    Namn {sortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3">Kommun</th>
                <th className="px-6 py-3">Typ</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">
                  <button type="button" className="flex items-center gap-1" onClick={() => handleSort('updated_at')}>
                    Senast ändrad {sortIcon('updated_at')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {associationsQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Laddar föreningar…
                  </td>
                </tr>
              ) : associationsQuery.error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-rose-600">
                    {(associationsQuery.error as Error).message}
                  </td>
                </tr>
              ) : associationsQuery.data?.items.length ? (
                associationsQuery.data.items.map((association) => (
                  <tr key={association.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{association.name}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {municipalitiesQuery.data?.find((m) => m.id === association.municipality_id)?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{association.type ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-700">{association.status ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {association.updated_at ? new Date(association.updated_at).toLocaleString('sv-SE') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
                          onClick={() => setEditing(association)}
                        >
                          Redigera
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
                          onClick={() => setNotesTarget(association)}
                        >
                          Anteckningar
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
                          onClick={() => setTagsTarget(association)}
                        >
                          Taggar
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-400 px-3 py-1 text-xs text-rose-600 hover:border-rose-500"
                          onClick={() => {
                            if (window.confirm('Vill du mjuk-radera denna förening?')) {
                              deleteMutation.mutate(association.id)
                            }
                          }}
                        >
                          Radera
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Inga föreningar matchar dina filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Föregående
          </button>
          <p className="text-sm text-slate-600">
            Sida {page} av {totalPages}
          </p>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Nästa
          </button>
        </div>
      </section>

      <Modal
        title="Ny förening"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        widthClass="max-w-3xl"
      >
        <AssociationForm
          municipalities={municipalitiesQuery.data ?? []}
          submitLabel="Skapa"
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (values) => createMutation.mutateAsync(values)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      <Modal
        title={editing ? `Redigera ${editing.name}` : 'Redigera förening'}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        widthClass="max-w-3xl"
      >
        {editing && (
          <AssociationForm
            municipalities={municipalitiesQuery.data ?? []}
            initial={editing}
            submitLabel="Spara"
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => updateMutation.mutateAsync({ id: editing.id, values })}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      <NotesModal
        associationId={notesTarget?.id ?? null}
        associationName={notesTarget?.name ?? null}
        open={Boolean(notesTarget)}
        onClose={() => setNotesTarget(null)}
      />

      <TagsModal
        associationId={tagsTarget?.id ?? null}
        associationName={tagsTarget?.name ?? null}
        open={Boolean(tagsTarget)}
        onClose={() => setTagsTarget(null)}
      />
    </div>
  )
}
