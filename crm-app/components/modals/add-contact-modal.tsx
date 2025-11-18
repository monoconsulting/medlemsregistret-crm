"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface AddContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationId: string
  associationName: string
  onCompleted?: () => void
}

export function AddContactModal({
  open,
  onOpenChange,
  associationId,
  associationName,
  onCompleted,
}: AddContactModalProps) {
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

  const handleChange = (field: string, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormState({
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
  }

  const handleSubmit = async () => {
    if (!associationId) return
    setSubmitting(true)
    try {
      await api.createContact({
        associationId,
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
      toast({ title: "Kontakt skapad", description: `${formState.name || "Kontakt"} lades till` })
      resetForm()
      onOpenChange(false)
      onCompleted?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte skapa kontakt"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetForm()
        }
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till kontakt · {associationName}</DialogTitle>
          <DialogDescription>Fyll i kontaktuppgifter för en ny kontaktperson.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">Namn</Label>
            <Input
              id="contact-name"
              placeholder="Namn"
              value={formState.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-role">Roll</Label>
            <Input
              id="contact-role"
              placeholder="Roll"
              value={formState.role}
              onChange={(event) => handleChange("role", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-email">E-post</Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="namn@example.se"
              value={formState.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
            <div>
              <Label htmlFor="contact-phone">Telefon</Label>
              <Input
                id="contact-phone"
                placeholder="010-123456"
                value={formState.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contact-mobile">Mobil</Label>
              <Input
                id="contact-mobile"
                placeholder="070-1234567"
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
              id="contact-primary"
              checked={formState.is_primary}
              onCheckedChange={(checked) => handleChange("is_primary", Boolean(checked))}
            />
            <Label htmlFor="contact-primary" className="text-sm text-muted-foreground">
              Primär kontakt
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sparar...
              </>
            ) : (
              "Spara kontakt"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
