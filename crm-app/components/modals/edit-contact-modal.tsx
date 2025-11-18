"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { api, type Contact } from "@/lib/api"
import { Loader2, Trash2 } from "lucide-react"

interface EditContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  onUpdated?: () => void
}

export function EditContactModal({ open, onOpenChange, contact, onUpdated }: EditContactModalProps) {
  const { toast } = useToast()
  const [formState, setFormState] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    mobile: "",
    linkedin_url: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    is_primary: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (contact) {
      setFormState({
        name: contact.name ?? "",
        role: contact.role ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        mobile: contact.mobile ?? "",
        linkedin_url: contact.linkedin_url ?? "",
        facebook_url: contact.facebook_url ?? "",
        twitter_url: contact.twitter_url ?? "",
        instagram_url: contact.instagram_url ?? "",
        is_primary: contact.is_primary,
      })
    }
  }, [contact, open])

  const handleChange = (field: string, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!contact) return
    setSubmitting(true)
    try {
      await api.updateContact({
        id: contact.id,
        name: formState.name.trim() || null,
        role: formState.role.trim() || null,
        email: formState.email.trim() || null,
        phone: formState.phone.trim() || null,
        mobile: formState.mobile.trim() || null,
        linkedin_url: formState.linkedin_url.trim() || null,
        facebook_url: formState.facebook_url.trim() || null,
        twitter_url: formState.twitter_url.trim() || null,
        instagram_url: formState.instagram_url.trim() || null,
        is_primary: formState.is_primary,
      })
      toast({ title: "Kontakt uppdaterad" })
      onOpenChange(false)
      onUpdated?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera kontakt"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return
    setDeleting(true)
    try {
      await api.deleteContact(contact.id)
      toast({ title: "Kontakt borttagen" })
      onOpenChange(false)
      onUpdated?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte ta bort kontakt"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redigera kontakt</DialogTitle>
          <DialogDescription>Uppdatera kontaktuppgifter eller ta bort kontakten.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-contact-name">Namn</Label>
            <Input
              id="edit-contact-name"
              value={formState.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-contact-role">Roll</Label>
            <Input
              id="edit-contact-role"
              value={formState.role}
              onChange={(event) => handleChange("role", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-contact-email">E-post</Label>
            <Input
              id="edit-contact-email"
              type="email"
              value={formState.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div>
              <Label htmlFor="edit-contact-phone">Telefon</Label>
              <Input
                id="edit-contact-phone"
                value={formState.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-contact-mobile">Mobil</Label>
              <Input
                id="edit-contact-mobile"
                value={formState.mobile}
                onChange={(event) => handleChange("mobile", event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Sociala länkar</Label>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <Input
                placeholder="LinkedIn URL"
                value={formState.linkedin_url}
                onChange={(event) => handleChange("linkedin_url", event.target.value)}
              />
              <Input
                placeholder="Facebook URL"
                value={formState.facebook_url}
                onChange={(event) => handleChange("facebook_url", event.target.value)}
              />
              <Input
                placeholder="Twitter URL"
                value={formState.twitter_url}
                onChange={(event) => handleChange("twitter_url", event.target.value)}
              />
              <Input
                placeholder="Instagram URL"
                value={formState.instagram_url}
                onChange={(event) => handleChange("instagram_url", event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-contact-primary"
              checked={formState.is_primary}
              onCheckedChange={(checked) => handleChange("is_primary", Boolean(checked))}
            />
            <Label htmlFor="edit-contact-primary" className="text-sm text-muted-foreground">
              Primär kontakt
            </Label>
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || submitting}>
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tar bort...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Ta bort
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || deleting}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || deleting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara ändringar"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
