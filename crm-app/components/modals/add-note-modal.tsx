"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { api, type Note } from "@/lib/api"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Loader2, StickyNote } from "lucide-react"

interface AddNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationId: string | null
  associationName: string
  onCompleted?: () => void
}

export function AddNoteModal({
  open,
  onOpenChange,
  associationId,
  associationName,
  onCompleted,
}: AddNoteModalProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!associationId) return
    setLoading(true)
    try {
      const result = await api.getNotes(associationId)
      setNotes(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta anteckningar"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [associationId, toast])

  useEffect(() => {
    if (open && associationId) {
      void fetchNotes()
    }
  }, [open, associationId, fetchNotes])

  const handleSubmit = async () => {
    if (!associationId || !noteContent.trim()) return
    setSubmitting(true)
    try {
      await api.addNote(associationId, noteContent.trim())
      toast({ title: "Anteckning sparad" })
      setNoteContent("")
      await fetchNotes()
      onCompleted?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte spara anteckning"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Anteckningar · {associationName}
          </DialogTitle>
          <DialogDescription>
            Lägg till och visa interna anteckningar om föreningen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="note-content" className="text-sm font-medium">
              Ny anteckning
            </label>
            <Textarea
              id="note-content"
              placeholder="Skriv din anteckning här..."
              rows={4}
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !noteContent.trim()}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : (
              "Spara anteckning"
            )}
          </Button>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">
              Tidigare anteckningar ({notes.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Laddar anteckningar...
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Inga anteckningar ännu. Lägg till den första!
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border bg-card p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{note.author ?? "Okänd"}</span>
                        <span>
                          {note.created_at
                            ? format(new Date(note.created_at), "d MMM yyyy, HH:mm", {
                                locale: sv,
                              })
                            : "Datum saknas"}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
