'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ContactTable, ContactTableSortKey } from "@/components/contacts/contact-table"
import { Contact, ContactNote, api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddContactModal } from "@/components/modals/add-contact-modal"
import { EditContactModal } from "@/components/modals/edit-contact-modal"
import { SendEmailModal } from "@/components/modals/send-email-modal"
import { Loader2, Mail, PenSquare, Phone, RefreshCcw, Sparkles, Trash2, User } from "lucide-react"

export interface ContactHubAssociationSummary {
  id: string
  name: string
  municipalityName?: string | null
  streetAddress?: string | null
  postalCode?: string | null
  city?: string | null
}

interface ContactHubModalProps {
  association: ContactHubAssociationSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedContactId?: string | null
  onUpdated?: () => void
}

export function ContactHubModal({
  association,
  open,
  onOpenChange,
  selectedContactId,
  onUpdated,
}: ContactHubModalProps) {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState("name_asc")
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [notes, setNotes] = useState<ContactNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [sendEmailContact, setSendEmailContact] = useState<Contact | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadContacts = useCallback(async () => {
    if (!association) return
    setLoading(true)
    setError(null)
    try {
      const raw = await api.getContacts(association.id)
      const enriched: Contact[] = raw.map((item) => ({
        ...item,
        association_name: association.name,
        association_street_address: association.streetAddress ?? item.association_street_address ?? null,
        association_postal_code: association.postalCode ?? item.association_postal_code ?? null,
        association_city: association.city ?? item.association_city ?? null,
        association_address: buildFullAddress(
          association.streetAddress ?? item.association_street_address ?? null,
          association.postalCode ?? item.association_postal_code ?? null,
          association.city ?? item.association_city ?? null,
        ),
        municipality_name: association.municipalityName ?? item.municipality_name ?? null,
      }))
      setContacts(enriched)
      if (enriched.length) {
        setActiveContactId((prev) => prev ?? enriched[0].id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta kontakter"
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [association, toast])

  const sortedContacts = useMemo(() => {
    if (!contacts.length) return []
    const items = [...contacts]
    items.sort((a, b) => compareContacts(a, b, sort))
    return items
  }, [contacts, sort])

  const activeContact = useMemo(() => {
    if (!sortedContacts.length) return null
    if (activeContactId) {
      return sortedContacts.find((contact) => contact.id === activeContactId) ?? sortedContacts[0]
    }
    return sortedContacts[0]
  }, [sortedContacts, activeContactId])

  useEffect(() => {
    if (open && association) {
      void loadContacts()
    }
  }, [open, association, loadContacts])

  useEffect(() => {
    if (!open) {
      setNoteContent("")
      setNotes([])
      setActiveContactId(selectedContactId ?? null)
    }
  }, [open, selectedContactId])

  useEffect(() => {
    if (selectedContactId) {
      setActiveContactId(selectedContactId)
    }
  }, [selectedContactId])

  const loadNotes = useCallback(
    async (contactId: string) => {
      setNotesLoading(true)
      try {
        const items = await api.getContactNotes(contactId)
        setNotes(items)
      } catch (err) {
        toast({
          title: "Fel",
          description: err instanceof Error ? err.message : "Kunde inte hämta anteckningar",
          variant: "destructive",
        })
      } finally {
        setNotesLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    if (activeContact && open) {
      void loadNotes(activeContact.id)
    }
  }, [activeContact, open, loadNotes])

  const handleSortChange = (column: ContactTableSortKey) => {
    const current = sort
    let next = `${column}_asc`
    if (current === `${column}_asc`) next = `${column}_desc`
    else if (current === `${column}_desc`) next = `${column}_asc`
    setSort(next)
  }

  const handleAddNote = async () => {
    if (!activeContact) return
    if (!noteContent.trim()) {
      toast({ title: "Fyll i anteckning", description: "Skriv något innan du sparar.", variant: "destructive" })
      return
    }
    setNoteSubmitting(true)
    try {
      await api.createContactNote(activeContact.id, noteContent.trim())
      setNoteContent("")
      await loadNotes(activeContact.id)
      onUpdated?.()
      toast({ title: "Anteckning sparad" })
    } catch (err) {
      toast({
        title: "Fel",
        description: err instanceof Error ? err.message : "Kunde inte spara anteckning",
        variant: "destructive",
      })
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleAIScan = async () => {
    if (!activeContact) return
    setAiLoading(true)
    try {
      const res = await api.requestContactSocialLookup(activeContact.id)
      toast({ title: "AI-sökning", description: res.message })
    } catch (err) {
      toast({
        title: "Fel",
        description: err instanceof Error ? err.message : "Kunde inte starta AI-sökningen",
        variant: "destructive",
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleDeleteContact = async (id: string) => {
    setDeletingId(id)
    try {
      await api.deleteContact(id)
      toast({ title: "Kontakt borttagen (soft delete)" })
      await loadContacts()
      onUpdated?.()
    } catch (err) {
      toast({
        title: "Fel",
        description: err instanceof Error ? err.message : "Kunde inte ta bort kontakt",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkPrimary = async (id: string) => {
    try {
      await api.updateContact({ id, is_primary: true })
      toast({ title: "Kontakt markerad som primär" })
      await loadContacts()
      onUpdated?.()
    } catch (err) {
      toast({
        title: "Fel",
        description: err instanceof Error ? err.message : "Kunde inte uppdatera kontakt",
        variant: "destructive",
      })
    }
  }

  const handleContactUpdated = async () => {
    await loadContacts()
    onUpdated?.()
  }

  const detailAddress = buildFullAddress(
    association?.streetAddress ?? activeContact?.association_street_address ?? null,
    association?.postalCode ?? activeContact?.association_postal_code ?? null,
    association?.city ?? activeContact?.association_city ?? null,
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setActiveContactId(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="h-[85vh] w-[90vw] max-w-[1200px] flex flex-col gap-4 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Kontakter · {association?.name ?? "Ingen förening vald"}</DialogTitle>
          <DialogDescription>
            Hantera och berika kontaktpersoner kopplade till {association?.name ?? "vald förening"}.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {association ? (
          <div className="flex flex-1 flex-col gap-4 px-6 pb-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {sortedContacts.length
                  ? `${sortedContacts.length} kontakter listade`
                  : "Inga kontakter registrerade ännu"}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setAddModalOpen(true)}>
                  Lägg till kontakt
                </Button>
                <Button variant="outline" size="sm" onClick={() => void loadContacts()} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl border bg-white shadow-sm">
              {error ? (
                <div className="flex h-full items-center justify-center text-sm text-destructive px-4">{error}</div>
              ) : loading ? (
                <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Hämtar kontakter…
                </div>
              ) : (
                <ScrollArea className="h-[40vh]">
                  <ContactTable
                    contacts={sortedContacts}
                    sort={sort}
                    onSortChange={handleSortChange}
                    onRowClick={(contact) => setActiveContactId(contact.id)}
                    actionsRenderer={(contact) => (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Öppna kontakt"
                          onClick={() => setActiveContactId(contact.id)}
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ta bort"
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={deletingId === contact.id}
                        >
                          {deletingId === contact.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </>
                    )}
                  />
                </ScrollArea>
              )}
            </div>
            <div className="grid flex-1 gap-4 lg:grid-cols-3 overflow-hidden">
              <Card className="lg:col-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle>Kontaktinformation</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {activeContact ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">{activeContact.name ?? "Namnlös kontakt"}</p>
                          <p className="text-sm text-muted-foreground">{activeContact.role ?? "Roll saknas"}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {activeContact.is_primary ? (
                            <Badge variant="secondary">Primär kontakt</Badge>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleMarkPrimary(activeContact.id)}>
                              Gör primär
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setEditContact(activeContact)}>
                            Redigera
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <InfoField label="Telefon" value={activeContact.phone || activeContact.mobile || "-"} icon={<Phone className="h-4 w-4" />} />
                        <InfoField label="E-post" value={activeContact.email || "-"} icon={<Mail className="h-4 w-4" />} />
                        <InfoField label="Förening" value={association.name} icon={<User className="h-4 w-4" />} />
                        <InfoField
                          label="Adress"
                          value={detailAddress || "-"}
                          icon={<User className="h-4 w-4" />}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleAIScan}
                          disabled={aiLoading}
                          className="gap-2"
                        >
                          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          AI-sök sociala medier
                        </Button>
                        {activeContact.email ? (
                          <Button variant="outline" size="sm" onClick={() => setSendEmailContact(activeContact)}>
                            Skicka e-post
                          </Button>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Ny anteckning</label>
                        <Textarea
                          rows={4}
                          value={noteContent}
                          onChange={(event) => setNoteContent(event.target.value)}
                          placeholder="Skriv dina anteckningar om kontakten här…"
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => void handleAddNote()} disabled={noteSubmitting}>
                            {noteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Spara anteckning"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Välj en kontakt i listan ovan.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="flex flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle>Anteckningar</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  {notesLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground px-4 text-center">
                      Inga anteckningar registrerade.
                    </div>
                  ) : (
                    <ScrollArea className="h-full px-4 py-2">
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div key={note.id} className="rounded-lg border bg-white/80 p-3 shadow-sm">
                            <p className="text-sm text-muted-foreground mb-2">{note.author ?? "Okänd"}</p>
                            <p className="text-sm whitespace-pre-line">{note.content}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString("sv-SE")}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 pb-6 text-sm text-muted-foreground">
            Ingen förening vald.
          </div>
        )}
        {association ? (
          <AddContactModal
            open={addModalOpen}
            onOpenChange={setAddModalOpen}
            associationId={association.id}
            associationName={association.name}
            onCompleted={async () => {
              await handleContactUpdated()
              setAddModalOpen(false)
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
            await handleContactUpdated()
            setEditContact(null)
          }}
        />
        {association && sendEmailContact ? (
          <SendEmailModal
            open={Boolean(sendEmailContact)}
            onOpenChange={(next) => {
              if (!next) setSendEmailContact(null)
            }}
            associationId={association.id}
            associationName={association.name}
            defaultRecipient={sendEmailContact.email}
            onCompleted={async () => {
              await handleContactUpdated()
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function buildFullAddress(street?: string | null, postal?: string | null, city?: string | null): string | null {
  const parts: string[] = []
  if (street && street.trim() !== "") parts.push(street.trim())
  const postalCity = [postal?.trim(), city?.trim()].filter(Boolean).join(" ")
  if (postalCity) parts.push(postalCity)
  if (!parts.length) return null
  return parts.join(", ")
}

function compareContacts(a: Contact, b: Contact, sort: string): number {
  const [column, direction] = sort.split("_")
  const multiplier = direction === "desc" ? -1 : 1
  const getValue = (contact: Contact) => {
    switch (column) {
      case "name":
        return contact.name ?? ""
      case "association":
        return contact.association_name ?? ""
      case "municipality":
        return contact.municipality_name ?? ""
      case "primary":
        return contact.is_primary ? 1 : 0
      case "address":
        return (
          
          contact.association_street_address ||
          contact.association_city ||
          contact.association_postal_code ||
          ""
        )
      case "phone":
        return contact.phone || contact.mobile || ""
      case "email":
        return contact.email ?? ""
      case "facebook":
        return contact.facebook_url ?? ""
      case "instagram":
        return contact.instagram_url ?? ""
      case "twitter":
        return contact.twitter_url ?? ""
      default:
        return ""
    }
  }
  const av = getValue(a)
  const bv = getValue(b)
  if (typeof av === "number" && typeof bv === "number") {
    if (av === bv) return 0
    return av > bv ? multiplier : -multiplier
  }
  return String(av).localeCompare(String(bv)) * multiplier
}

function InfoField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm text-foreground">{value || "-"}</p>
    </div>
  )
}
