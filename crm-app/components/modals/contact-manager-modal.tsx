"use client"

import { useMemo, useState } from "react"
import type { Contact } from "@prisma/client"
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { EditContactModal } from "@/components/modals/edit-contact-modal"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import type { ContactFormValues, ContactUpdateValues } from "@/lib/validators/contact"

interface ContactManagerModalProps {
  associationId: string
  associationName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactManagerModal({ associationId, associationName, open, onOpenChange }: ContactManagerModalProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)

  const contactsQuery = api.contacts.list.useQuery(
    { associationId, limit: 100 },
    { enabled: open }
  )

  const createContact = api.contacts.create.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt skapad" })
      contactsQuery.refetch()
    },
    onError: (error) => toast({ title: "Kunde inte skapa kontakt", description: error.message, variant: "destructive" }),
  })

  const updateContact = api.contacts.update.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt uppdaterad" })
      contactsQuery.refetch()
    },
    onError: (error) => toast({ title: "Kunde inte uppdatera kontakt", description: error.message, variant: "destructive" }),
  })

  const deleteContact = api.contacts.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Kontakt borttagen" })
      contactsQuery.refetch()
    },
    onError: (error) => toast({ title: "Kunde inte ta bort kontakt", description: error.message, variant: "destructive" }),
  })

  const contacts = useMemo(() => contactsQuery.data?.contacts ?? [], [contactsQuery.data?.contacts])
  const primaryContact = contacts.find((contact) => contact.isPrimary)

  const handleCreate = async (values: ContactFormValues) => {
    await createContact.mutateAsync(values)
    setIsAddOpen(false)
  }

  const handleUpdate = async (values: ContactUpdateValues) => {
    await updateContact.mutateAsync(values)
    setEditContact(null)
  }

  const handleDelete = async (contactId: string) => {
    await deleteContact.mutateAsync({ id: contactId })
    setEditContact(null)
  }

  const handleMarkPrimary = async (contact: Contact) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Kontakter för {associationName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {primaryContact ? `Primär kontakt: ${primaryContact.name}` : "Ingen primär kontakt vald"}
            </div>
            <Button size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Ny kontakt
            </Button>
          </div>
          <ScrollArea className="h-80 rounded border">
            {contactsQuery.isPending ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Laddar kontakter…
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <p>Inga kontakter registrerade än.</p>
                <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
                  Lägg till första kontakten
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {contacts.map((contact) => (
                  <li key={contact.id} className="flex items-start justify-between gap-4 p-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{contact.name}</span>
                        {contact.isPrimary && <Badge variant="secondary">Primär</Badge>}
                      </div>
                      {contact.role && <div className="text-xs text-muted-foreground">{contact.role}</div>}
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        {contact.email && <span>E-post: {contact.email}</span>}
                        {contact.phone && <span>Telefon: {contact.phone}</span>}
                        {contact.mobile && <span>Mobil: {contact.mobile}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!contact.isPrimary && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMarkPrimary(contact)}
                          disabled={updateContact.isPending}
                          title="Gör till primär kontakt"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditContact(contact)}
                        title="Redigera kontakt"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(contact.id)}
                        disabled={deleteContact.isPending}
                        title="Ta bort kontakt"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        <AddContactModal
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          associationId={associationId}
          associationName={associationName}
          onSubmit={handleCreate}
          isSubmitting={createContact.isPending}
        />

        {editContact && (
          <EditContactModal
            open={!!editContact}
            onOpenChange={(open) => (!open ? setEditContact(null) : undefined)}
            contact={{
              id: editContact.id,
              associationId: editContact.associationId,
              associationName,
              name: editContact.name,
              role: editContact.role,
              email: editContact.email,
              phone: editContact.phone,
              mobile: editContact.mobile,
              linkedinUrl: editContact.linkedinUrl,
              facebookUrl: editContact.facebookUrl,
              twitterUrl: editContact.twitterUrl,
              instagramUrl: editContact.instagramUrl,
              isPrimary: editContact.isPrimary,
            }}
            onSubmit={handleUpdate}
            onDelete={() => handleDelete(editContact.id)}
            isSubmitting={updateContact.isPending}
            isDeleting={deleteContact.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
