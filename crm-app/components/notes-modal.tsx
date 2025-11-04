"use client"

import { FormEvent, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, Note } from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/use-toast'

interface NotesModalProps {
  associationId: number | null
  associationName: string | null
  open: boolean
  onClose: () => void
}

export function NotesModal({ associationId, associationName, open, onClose }: NotesModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [content, setContent] = useState('')

  const notesQuery = useQuery<Note[], Error>({
    queryKey: ['notes', associationId],
    queryFn: async () => {
      if (!associationId) return []
      return api.getNotes(associationId)
    },
    enabled: open && Boolean(associationId),
  })

  useEffect(() => {
    if (!open) {
      setContent('')
    }
  }, [open])

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!associationId || !content.trim()) {
      return
    }
    try {
      await api.addNote(associationId, content.trim())
      setContent('')
      toast({ title: 'Anteckning sparad', variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['notes', associationId] })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kunde inte spara anteckningen'
      toast({ title: 'Fel', description: message, variant: 'destructive' })
    }
  }

  return (
    <Modal
      title={`Anteckningar – ${associationName ?? ''}`}
      open={open}
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={
        <form onSubmit={handleAddNote} className="space-y-3">
          <label className="block text-sm font-medium text-slate-700" htmlFor="note-content">
            Lägg till anteckning
          </label>
          <textarea
            id="note-content"
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Skriv en kort anteckning..."
          />
          <div className="flex justify-end">
            <button type="submit" className="bg-sky-600 text-white hover:bg-sky-700" disabled={!content.trim()}>
              Spara anteckning
            </button>
          </div>
        </form>
      }
    >
      {notesQuery.isLoading ? (
        <p className="text-sm text-slate-600">Laddar anteckningar…</p>
      ) : notesQuery.error ? (
        <p className="text-sm text-rose-600">{notesQuery.error.message}</p>
      ) : notesQuery.data?.length ? (
        <ul className="space-y-3 text-sm">
          {notesQuery.data.map((note) => (
            <li key={note.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="whitespace-pre-line text-slate-800">{note.content}</p>
              <p className="mt-2 text-xs text-slate-500">{new Date(note.created_at).toLocaleString('sv-SE')}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">Inga anteckningar ännu.</p>
      )}
    </Modal>
  )
}
