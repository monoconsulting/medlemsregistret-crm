"use client"
import { Loader2, Mail, Phone, User, Users } from "lucide-react"

import { api } from "@/lib/trpc/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import type { Contact } from "@prisma/client"

interface AssociationContactsModalProps {
  associationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isCreating: boolean
  onSelectContactForEdit: (contact: Contact, associationName: string) => void
  onRequestAddContact: (associationId: string, associationName: string) => void
}

export function AssociationContactsModal({
  associationId,
  open,
  onOpenChange,
  isCreating,
  onSelectContactForEdit,
  onRequestAddContact,
}: AssociationContactsModalProps) {
  const utils = api.useUtils()

  const associationQuery = api.association.getById.useQuery(
    { id: associationId ?? "" },
    {
      enabled: open && Boolean(associationId),
      refetchOnWindowFocus: false,
    },
  )

  const contacts = associationQuery.data?.contacts ?? []
  const primaryContactId = contacts.find((contact) => contact.isPrimary)?.id ?? null

  const updateContact = api.contacts.update.useMutation({
    onSuccess: async () => {
      if (associationId) {
        await utils.association.getById.invalidate({ id: associationId })
        await utils.association.list.invalidate()
      }
    },
    onError: (error) => toast({ title: "Kunde inte uppdatera kontakt", description: error.message, variant: "destructive" }),
  })

  const deleteContact = api.contacts.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Kontakt borttagen" })
      if (associationId) {
        await utils.association.getById.invalidate({ id: associationId })
        await utils.association.list.invalidate()
      }
    },
    onError: (error) => toast({ title: "Kunde inte ta bort kontakt", description: error.message, variant: "destructive" }),
  })

  const handleMarkPrimary = async (contactId: string) => {
    const contact = contacts.find((item) => item.id === contactId)
    if (!contact) return

    await updateContact.mutateAsync({
      id: contact.id,
      associationId: contact.associationId,
      name: contact.name,
      role: contact.role ?? undefined,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      mobile: contact.mobile ?? undefined,
      linkedinUrl: contact.linkedinUrl ?? undefined,
      facebookUrl: contact.facebookUrl ?? undefined,
      twitterUrl: contact.twitterUrl ?? undefined,
      instagramUrl: contact.instagramUrl ?? undefined,
      isPrimary: true,
    })
  }

  const handleDelete = async (contactId: string) => {
    await deleteContact.mutateAsync({ id: contactId })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4" /> Kontakter
          </DialogTitle>
        </DialogHeader>
        {associationQuery.isPending ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hämtar kontakter…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {contacts.length ? `${contacts.length} registrerade kontakter` : "Inga kontakter registrerade"}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!associationId || !associationQuery.data) return
                  onRequestAddContact(associationId, associationQuery.data.name)
                }}
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lägg till kontakt
              </Button>
            </div>

            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-3">
                {contacts.length ? (
                  contacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold">
                            <User className="h-4 w-4" /> {contact.name}
                            {contact.isPrimary ? <Badge variant="secondary">Primär</Badge> : null}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">{contact.role ?? "Roll saknas"}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onSelectContactForEdit(contact, associationQuery.data?.name ?? "Okänd förening")
                            }
                          >
                            Redigera
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleMarkPrimary(contact.id)} disabled={updateContact.isPending && primaryContactId !== contact.id}>
                            {primaryContactId === contact.id && updateContact.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Gör primär
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(contact.id)}
                            disabled={deleteContact.isPending && contact.id === deleteContact.variables?.id}
                          >
                            Ta bort
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.email ?? "Saknas"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.phone ?? contact.mobile ?? "Saknas"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    Lägg till den första kontakten för denna förening.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
