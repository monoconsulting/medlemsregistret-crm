"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { api, type Contact } from "@/lib/api"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { EditContactModal } from "@/components/modals/edit-contact-modal"
import { Loader2, Mail, Phone, UserPlus } from "lucide-react"

interface AssociationContactsModalProps {
  associationId: string | null
  associationName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function AssociationContactsModal({
  associationId,
  associationName,
  open,
  onOpenChange,
  onUpdated,
}: AssociationContactsModalProps) {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const fetchContacts = useCallback(async () => {
    if (!associationId) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.getContacts(associationId)
      setContacts(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta kontakter"
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [associationId, toast])

  useEffect(() => {
    if (open && associationId) {
      void fetchContacts()
    }
  }, [open, associationId, fetchContacts])

  const primaryContact = useMemo(() => contacts.find((contact) => contact.is_primary) ?? null, [contacts])

  const handleRefresh = async () => {
    await fetchContacts()
    onUpdated?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setShowCreateModal(false)
          setEditContact(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Kontakter · {associationName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Ny kontakt
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Uppdatera"}
            </Button>
          </div>
          {primaryContact ? (
            <Badge variant="secondary">Primär: {primaryContact.name ?? "Okänd"}</Badge>
          ) : (
            <Badge variant="outline">Ingen primär kontakt</Badge>
          )}
        </div>
        <Separator />
        <div className="h-[360px]">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="grid gap-2 rounded-md border p-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-64 animate-pulse rounded bg-muted/80" />
                  <div className="h-3 w-52 animate-pulse rounded bg-muted/80" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Inga kontakter registrerade ännu.
            </div>
          ) : (
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-2 rounded-md border border-border/70 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{contact.name ?? "Namnlös kontakt"}</p>
                        {contact.is_primary ? <Badge variant="default">Primär</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{contact.role ?? "Ingen roll"}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {contact.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {contact.email}
                          </span>
                        ) : null}
                        {contact.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </span>
                        ) : null}
                        {contact.mobile ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {contact.mobile}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditContact(contact)}>
                        Redigera
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
      {associationId ? (
        <AddContactModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          associationId={associationId}
          associationName={associationName}
          onCompleted={async () => {
            await handleRefresh()
            setShowCreateModal(false)
          }}
        />
      ) : null}
      <EditContactModal
        open={Boolean(editContact)}
        onOpenChange={(next) => {
          if (!next) setEditContact(null)
        }}
        contact={editContact}
        onUpdated={async () => {
          await handleRefresh()
          setEditContact(null)
        }}
      />
    </Dialog>
  )
}
