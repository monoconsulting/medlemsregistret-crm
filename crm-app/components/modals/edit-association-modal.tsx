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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { associationUpdateSchema, CRM_STATUSES, PIPELINES, type AssociationUpdateInput } from '@/lib/validators/association'
import { Textarea } from '@/components/ui/textarea'

interface EditAssociationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  association: {
    id: string
    name: string
    crmStatus: string
    pipeline: string
    isMember: boolean
    memberSince: string | null
    assignedToId: string | null
    email: string | null
    phone: string | null
    streetAddress: string | null
    postalCode: string | null
    city: string | null
    activities?: string[] | null
    descriptionFreeText?: string | null
  }
  users: { id: string; name: string }[]
  onSubmit: (values: AssociationUpdateInput) => Promise<void>
  isSubmitting?: boolean
}

export function EditAssociationModal({ open, onOpenChange, association, users, onSubmit, isSubmitting }: EditAssociationModalProps) {
  const form = useForm<AssociationUpdateInput>({
    resolver: zodResolver(associationUpdateSchema),
    defaultValues: {
      crmStatus: association.crmStatus as AssociationUpdateInput['crmStatus'],
      pipeline: association.pipeline as AssociationUpdateInput['pipeline'],
      isMember: association.isMember,
      memberSince: association.memberSince ?? undefined,
      assignedToId: association.assignedToId ?? undefined,
      email: association.email ?? undefined,
      phone: association.phone ?? undefined,
      streetAddress: association.streetAddress ?? undefined,
      postalCode: association.postalCode ?? undefined,
      city: association.city ?? undefined,
      activities: Array.isArray(association.activities)
        ? (association.activities as string[])
        : [],
      descriptionFreeText: association.descriptionFreeText ?? undefined,
      notes: '',
    },
  })

  useEffect(() => {
    form.reset({
      crmStatus: association.crmStatus as AssociationUpdateInput['crmStatus'],
      pipeline: association.pipeline as AssociationUpdateInput['pipeline'],
      isMember: association.isMember,
      memberSince: association.memberSince ?? undefined,
      assignedToId: association.assignedToId ?? undefined,
      email: association.email ?? undefined,
      phone: association.phone ?? undefined,
      streetAddress: association.streetAddress ?? undefined,
      postalCode: association.postalCode ?? undefined,
      city: association.city ?? undefined,
      activities: Array.isArray(association.activities)
        ? (association.activities as string[])
        : [],
      descriptionFreeText: association.descriptionFreeText ?? undefined,
      notes: '',
    })
  }, [association, form])

  const handleSubmit = async (values: AssociationUpdateInput) => {
    await onSubmit({
      ...values,
      email: values.email?.trim() ? values.email.trim() : undefined,
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
      streetAddress: values.streetAddress?.trim() ? values.streetAddress.trim() : undefined,
      postalCode: values.postalCode?.trim() ? values.postalCode.trim() : undefined,
      city: values.city?.trim() ? values.city.trim() : undefined,
      activities: values.activities?.map((activity) => activity.trim()).filter(Boolean),
      descriptionFreeText: values.descriptionFreeText?.trim() ? values.descriptionFreeText.trim() : undefined,
      notes: values.notes?.trim() ?? '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Redigera {association.name}</DialogTitle>
          <DialogDescription>Uppdatera status, pipeline och ansvarig handläggare.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="crmStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRM_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pipeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipeline</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj pipeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PIPELINES.map((pipeline) => (
                          <SelectItem key={pipeline} value={pipeline}>
                            {pipeline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isMember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Medlem</FormLabel>
                      <p className="text-xs text-muted-foreground">Markera om föreningen är aktiv medlem.</p>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memberSince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medlem sedan</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? field.value.slice(0, 10) : ''}
                        onChange={(event) => field.onChange(event.target.value || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ansvarig handläggare</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj handläggare" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Ingen</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intern notering</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Syns inte för kund" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="info@foreningen.se"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
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
                      <Input placeholder="08-123 45 67" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="streetAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adress</FormLabel>
                  <FormControl>
                    <Input placeholder="Exempelgatan 1" value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="123 45" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ort</FormLabel>
                    <FormControl>
                      <Input placeholder="Stockholm" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verksamheter</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Ange en aktivitet per rad"
                      value={(field.value ?? []).join('\n')}
                      onChange={(event) => {
                        const entries = event.target.value
                          .split('\n')
                          .map((entry) => entry.trim())
                          .filter(Boolean)
                        field.onChange(entries)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Lägg till aktiviteter eller verksamhetsområden för att underlätta filtrering och uppföljning.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionFreeText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Övrig information</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Intern beskrivning eller extra information om föreningen"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sparar…' : 'Spara förändringar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
