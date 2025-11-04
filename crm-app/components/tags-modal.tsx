"use client"

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, Tag } from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/use-toast'

interface TagsModalProps {
  associationId: number | null
  associationName: string | null
  open: boolean
  onClose: () => void
}

export function TagsModal({ associationId, associationName, open, onClose }: TagsModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [assigned, setAssigned] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')

  const tagsQuery = useQuery<{ items: Tag[]; assigned: number[] }, Error>({
    queryKey: ['tags', associationId],
    queryFn: async () => {
      if (!associationId) {
        return { items: await api.getTags(), assigned: [] }
      }
      return api.getTagsForAssociation(associationId)
    },
    enabled: open,
  })

  useEffect(() => {
    if (tagsQuery.data?.assigned) {
      setAssigned(tagsQuery.data.assigned)
    } else if (!associationId) {
      setAssigned([])
    }
  }, [tagsQuery.data, associationId])

  useEffect(() => {
    if (!open) {
      setNewTagName('')
    }
  }, [open])

  const attachMutation = useMutation({
    mutationFn: (tagId: number) => {
      if (!associationId) throw new Error('associationId saknas')
      return api.attachTag(associationId, tagId)
    },
    onSuccess: async (_, tagId) => {
      setAssigned((current) => Array.from(new Set([...current, tagId])))
      await queryClient.invalidateQueries({ queryKey: ['tags', associationId] })
    },
  })

  const detachMutation = useMutation({
    mutationFn: (tagId: number) => {
      if (!associationId) throw new Error('associationId saknas')
      return api.detachTag(associationId, tagId)
    },
    onSuccess: async (_, tagId) => {
      setAssigned((current) => current.filter((id) => id !== tagId))
      await queryClient.invalidateQueries({ queryKey: ['tags', associationId] })
    },
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.createTag(name),
    onSuccess: async () => {
      setNewTagName('')
      await queryClient.invalidateQueries({ queryKey: ['tags', associationId] })
      await queryClient.invalidateQueries({ queryKey: ['all-tags'] })
      toast({ title: 'Tagg skapad', variant: 'success' })
    },
  })

  const isProcessing = attachMutation.isPending || detachMutation.isPending || createMutation.isPending
  const tags = useMemo(() => tagsQuery.data?.items ?? [], [tagsQuery.data?.items])

  function toggleTag(tagId: number) {
    if (!associationId) return
    if (assigned.includes(tagId)) {
      detachMutation.mutate(tagId, {
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Kunde inte ta bort taggen'
          toast({ title: 'Fel', description: message, variant: 'destructive' })
        },
      })
    } else {
      attachMutation.mutate(tagId, {
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Kunde inte koppla taggen'
          toast({ title: 'Fel', description: message, variant: 'destructive' })
        },
      })
    }
  }

  function handleCreateTag() {
    const name = newTagName.trim()
    if (!name) return
    createMutation.mutate(name, {
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Kunde inte skapa taggen'
        toast({ title: 'Fel', description: message, variant: 'destructive' })
      },
      onSuccess: () => {
        toast({ title: 'Tagg skapad', description: `"${name}" lades till.`, variant: 'success' })
      },
    })
  }

  return (
    <Modal
      title={`Taggar – ${associationName ?? ''}`}
      open={open}
      onClose={onClose}
      widthClass="max-w-xl"
      footer={
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ny tagg"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
            />
            <button type="button" className="bg-sky-600 text-white hover:bg-sky-700" onClick={handleCreateTag} disabled={!newTagName.trim() || createMutation.isPending}>
              Skapa
            </button>
          </div>
          <p className="text-xs text-slate-500">Nya taggar blir direkt tillgängliga i filtren.</p>
        </div>
      }
    >
      {tagsQuery.isLoading ? (
        <p className="text-sm text-slate-600">Laddar taggar…</p>
      ) : tagsQuery.error ? (
        <p className="text-sm text-rose-600">{tagsQuery.error.message}</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-slate-600">Inga taggar skapade ännu.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 text-sm">
          {tags.map((tag) => {
            const active = assigned.includes(tag.id)
            return (
              <li key={tag.id}>
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  disabled={isProcessing}
                  className={`w-full rounded-md border px-3 py-2 text-left ${active ? 'border-sky-500 bg-sky-100 text-sky-900' : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'}`}
                >
                  {tag.name}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
