"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationId: string
  associationName: string
  defaultRecipient?: string | null
  onCompleted?: () => void
}

export function SendEmailModal({
  open,
  onOpenChange,
  associationId,
  associationName,
  defaultRecipient,
  onCompleted,
}: SendEmailModalProps) {
  const { toast } = useToast()
  const [formState, setFormState] = useState({
    to: "",
    subject: "",
    body: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setFormState({
        to: defaultRecipient ?? "",
        subject: `Uppföljning ${associationName}`,
        body: "",
      })
    }
  }, [associationName, defaultRecipient, open])

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormState({
      to: "",
      subject: "",
      body: "",
    })
  }

  const handleSubmit = async () => {
    if (!formState.to || !formState.subject || !formState.body) {
      toast({
        title: "Fel",
        description: "Alla fält måste fyllas i",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      // Create a mailto link that opens the user's default email client
      const mailtoLink = `mailto:${formState.to}?subject=${encodeURIComponent(formState.subject)}&body=${encodeURIComponent(formState.body)}`
      window.location.href = mailtoLink

      toast({
        title: "E-postklient öppnad",
        description: "E-postmeddelandet öppnades i din standard e-postklient",
      })
      resetForm()
      onOpenChange(false)
      onCompleted?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte öppna e-postklient"
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Skicka e-post</DialogTitle>
          <DialogDescription>
            Skicka ett e-postmeddelande till {associationName}. Din standard e-postklient kommer att öppnas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email-to">Mottagare</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="namn@forening.se"
              value={formState.to}
              onChange={(event) => handleChange("to", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-subject">Ämne</Label>
            <Input
              id="email-subject"
              placeholder={`Inbjudan – ${associationName}`}
              value={formState.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-body">Meddelande</Label>
            <Textarea
              id="email-body"
              rows={10}
              placeholder="Skriv ditt meddelande här..."
              value={formState.body}
              onChange={(event) => handleChange("body", event.target.value)}
            />
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
                Öppnar...
              </>
            ) : (
              "Öppna i e-postklient"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
