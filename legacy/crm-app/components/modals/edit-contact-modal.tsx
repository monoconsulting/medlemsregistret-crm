'use client'

import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactUpdateSchema, type ContactUpdateValues } from '@/lib/validators/contact'

interface EditContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: {
    id: string
    associationId: string
    name: string
    role?: string | null
    email?: string | null
    phone?: string | null
    mobile?: string | null
    linkedinUrl?: string | null
    facebookUrl?: string | null
    twitterUrl?: string | null
    instagramUrl?: string | null
    isPrimary: boolean
    associationName: string
  }
  onSubmit: (values: ContactUpdateValues) => Promise<void>
  onDelete?: () => Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
}

export function EditContactModal({
  open,
  onOpenChange,
  contact,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
}: EditContactModalProps) {
  const form = useForm<ContactUpdateValues>({
    resolver: zodResolver(contactUpdateSchema),
    defaultValues: {
      id: contact.id,
      associationId: contact.associationId,
      name: contact.name,
      role: contact.role ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
      linkedinUrl: contact.linkedinUrl ?? '',
      facebookUrl: contact.facebookUrl ?? '',
      twitterUrl: contact.twitterUrl ?? '',
      instagramUrl: contact.instagramUrl ?? '',
      isPrimary: contact.isPrimary,
    },
  })

  useEffect(() => {
    form.reset({
      id: contact.id,
      associationId: contact.associationId,
      name: contact.name,
      role: contact.role ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
      linkedinUrl: contact.linkedinUrl ?? '',
      facebookUrl: contact.facebookUrl ?? '',
      twitterUrl: contact.twitterUrl ?? '',
      instagramUrl: contact.instagramUrl ?? '',
      isPrimary: contact.isPrimary,
    })
  }, [contact, form])

  const handleSubmit = async (values: ContactUpdateValues) => {
    await onSubmit(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Redigera kontakt</DialogTitle>
          <DialogDescription>Uppdatera uppgifterna för {contact.associationName}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
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
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll</FormLabel>
                    <FormControl>
                      <Input placeholder="Ordförande, kassör …" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
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
                control={form.control}
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
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
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Primär kontakt</FormLabel>
                      <p className="text-xs text-muted-foreground">Används i listor och utskick.</p>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
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
                control={form.control}
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
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
                control={form.control}
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

            <DialogFooter>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sparar…' : 'Spara kontakt'}
                  </Button>
                </div>
                {onDelete && (
                  <Button variant="destructive" type="button" onClick={() => onDelete()} disabled={isDeleting}>
                    {isDeleting ? 'Tar bort…' : 'Ta bort'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
