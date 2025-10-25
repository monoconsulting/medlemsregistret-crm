"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Plus, Save, Pencil, Trash2, Star } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import {
  contactFormSchema,
  contactUpdateSchema,
  type ContactFormValues,
  type ContactUpdateValues,
} from "@/lib/validators/contact"

interface ManageContactsModalProps {
  open: boolean
  associationId: string | null
  associationName: string | null
  onOpenChange: (open: boolean) => void
}

export function ManageContactsModal({ open, associationId, associationName, onOpenChange }: ManageContactsModalProps) {
  const utils = api.useUtils()
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

  const associationQuery = api.association.getById.useQuery(
    { id: associationId ?? "" },
    { enabled: open && Boolean(associationId) }
  )

  const createContact = api.contacts.create.useMutation({
    onSuccess: async () => {
      toast({ title: "Kontakt skapad" })
      await Promise.all([
        utils.association.list.invalidate(),
        associationQuery.refetch(),
      ])
      createForm.reset({
        associationId: associationId ?? "",
        name: "",
        role: "",
        email: "",
        phone: "",
        mobile: "",
        linkedinUrl: "",
        facebookUrl: "",
        twitterUrl: "",
        instagramUrl: "",
        isPrimary: false,
        notes: "",
      })
    },
    onError: (error) => toast({ title: "Kunde inte skapa kontakt", description: error.message, variant: "destructive" }),
  })

  const updateContact = api.contacts.update.useMutation({
    onSuccess: async () => {
      toast({ title: "Kontakt uppdaterad" })
      await Promise.all([
        utils.association.list.invalidate(),
        associationQuery.refetch(),
      ])
      setEditingContactId(null)
    },
    onError: (error) => toast({ title: "Kunde inte uppdatera kontakt", description: error.message, variant: "destructive" }),
  })

  const deleteContact = api.contacts.delete.useMutation({
    onSuccess: async () => {
      toast({ title: "Kontakt borttagen" })
      await Promise.all([
        utils.association.list.invalidate(),
        associationQuery.refetch(),
      ])
    },
    onError: (error) => toast({ title: "Kunde inte ta bort kontakt", description: error.message, variant: "destructive" }),
  })

  const createForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      associationId: associationId ?? "",
      name: "",
      role: "",
      email: "",
      phone: "",
      mobile: "",
      linkedinUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      isPrimary: false,
    },
  })

  const editForm = useForm<ContactUpdateValues>({
    resolver: zodResolver(contactUpdateSchema),
    defaultValues: {
      id: "",
      associationId: associationId ?? "",
      name: "",
      role: "",
      email: "",
      phone: "",
      mobile: "",
      linkedinUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      isPrimary: false,
    },
  })

  useEffect(() => {
    createForm.reset({
      associationId: associationId ?? "",
      name: "",
      role: "",
      email: "",
      phone: "",
      mobile: "",
      linkedinUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      isPrimary: false,
    })
    editForm.reset({
      id: "",
      associationId: associationId ?? "",
      name: "",
      role: "",
      email: "",
      phone: "",
      mobile: "",
      linkedinUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      isPrimary: false,
    })
    setEditingContactId(null)
  }, [associationId, createForm, editForm, open])

  useEffect(() => {
    if (!editingContactId) return
    const contact = associationQuery.data?.contacts.find((item) => item.id === editingContactId)
    if (!contact) return

    editForm.reset({
      id: contact.id,
      associationId: contact.associationId,
      name: contact.name,
      role: contact.role ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      mobile: contact.mobile ?? "",
      linkedinUrl: contact.linkedinUrl ?? "",
      facebookUrl: contact.facebookUrl ?? "",
      twitterUrl: contact.twitterUrl ?? "",
      instagramUrl: contact.instagramUrl ?? "",
      isPrimary: contact.isPrimary,
    })
  }, [associationQuery.data?.contacts, editForm, editingContactId])

  const contacts = useMemo(() => associationQuery.data?.contacts ?? [], [associationQuery.data?.contacts])

  const handleCreate = async (values: ContactFormValues) => {
    if (!associationId) return
    await createContact.mutateAsync({
      associationId,
      name: values.name,
      role: values.role ?? undefined,
      email: values.email ? values.email : undefined,
      phone: values.phone ?? undefined,
      mobile: values.mobile ?? undefined,
      linkedinUrl: values.linkedinUrl ?? undefined,
      facebookUrl: values.facebookUrl ?? undefined,
      twitterUrl: values.twitterUrl ?? undefined,
      instagramUrl: values.instagramUrl ?? undefined,
      isPrimary: values.isPrimary,
    })
  }

  const handleUpdate = async (values: ContactUpdateValues) => {
    await updateContact.mutateAsync({
      ...values,
      role: values.role || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      mobile: values.mobile || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      facebookUrl: values.facebookUrl || undefined,
      twitterUrl: values.twitterUrl || undefined,
      instagramUrl: values.instagramUrl || undefined,
      associationId: values.associationId,
    })
  }

  const handleSetPrimary = async (contactId: string) => {
    const target = contacts.find((item) => item.id === contactId)
    if (!target) return
    await handleUpdate({
      id: target.id,
      associationId: target.associationId,
      name: target.name,
      role: target.role ?? undefined,
      email: target.email ?? undefined,
      phone: target.phone ?? undefined,
      mobile: target.mobile ?? undefined,
      linkedinUrl: target.linkedinUrl ?? undefined,
      facebookUrl: target.facebookUrl ?? undefined,
      twitterUrl: target.twitterUrl ?? undefined,
      instagramUrl: target.instagramUrl ?? undefined,
      isPrimary: true,
    })
  }

  const handleDelete = async (contactId: string) => {
    await deleteContact.mutateAsync({ id: contactId })
  }

  const isLoading = associationQuery.isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Kontakter för {associationName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Laddar kontakter…
          </div>
        ) : !associationId ? (
          <div className="py-6 text-sm text-muted-foreground">Ingen förening vald.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ny kontakt</h3>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-3">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Namn</FormLabel>
                        <FormControl>
                          <Input placeholder="För- och efternamn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll</FormLabel>
                        <FormControl>
                          <Input placeholder="Roll i föreningen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-post</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="namn@forening.se" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input placeholder="08-123 45 67" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobil</FormLabel>
                          <FormControl>
                            <Input placeholder="070-123 45 67" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="isPrimary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Primär kontakt</FormLabel>
                            <p className="text-xs text-muted-foreground">Visas först i listor och utskick.</p>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(value) => field.onChange(Boolean(value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="facebookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="twitterUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>X/Twitter</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="instagramUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="https://instagram.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createContact.isPending}>
                    {createContact.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Lägg till kontakt
                  </Button>
                </form>
              </Form>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Befintliga kontakter</h3>
                <div className="text-xs text-muted-foreground">
                  {contacts.length} kontakt{contacts.length === 1 ? "" : "er"}
                </div>
              </div>
              <ScrollArea className="h-[420px] rounded-md border">
                <div className="divide-y">
                  {contacts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Inga kontakter registrerade ännu.
                    </div>
                  ) : (
                    contacts.map((contact) => {
                      const isEditing = editingContactId === contact.id
                      return (
                        <div key={contact.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold">
                                {contact.name}
                                {contact.isPrimary && (
                                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                                    <Star className="h-3 w-3" /> Primär
                                  </span>
                                )}
                              </div>
                              {contact.role && (
                                <div className="text-xs text-muted-foreground">{contact.role}</div>
                              )}
                              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {contact.email && <div>E-post: {contact.email}</div>}
                                {contact.phone && <div>Telefon: {contact.phone}</div>}
                                {contact.mobile && <div>Mobil: {contact.mobile}</div>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => setEditingContactId(isEditing ? null : contact.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSetPrimary(contact.id)}
                                disabled={contact.isPrimary || updateContact.isPending}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(contact.id)}
                                disabled={deleteContact.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {isEditing && (
                            <div className="mt-4 rounded-md border bg-muted/40 p-4">
                              <Form {...editForm}>
                                <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-3">
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <FormField
                                      control={editForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Namn</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="role"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Roll</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <FormField
                                      control={editForm.control}
                                      name="email"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>E-post</FormLabel>
                                          <FormControl>
                                            <Input type="email" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="phone"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Telefon</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <FormField
                                      control={editForm.control}
                                      name="mobile"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Mobil</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="isPrimary"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                                          <div className="space-y-0.5">
                                            <FormLabel>Primär kontakt</FormLabel>
                                            <p className="text-xs text-muted-foreground">Endast en kontakt kan vara primär.</p>
                                          </div>
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value}
                                              onCheckedChange={(value) => field.onChange(Boolean(value))}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <FormField
                                      control={editForm.control}
                                      name="linkedinUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>LinkedIn</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="facebookUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Facebook</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <FormField
                                      control={editForm.control}
                                      name="twitterUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>X/Twitter</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="instagramUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Instagram</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setEditingContactId(null)}>
                                      Avbryt
                                    </Button>
                                    <Button type="submit" disabled={updateContact.isPending}>
                                      {updateContact.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                      )}
                                      Spara
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
