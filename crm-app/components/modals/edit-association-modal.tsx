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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { associationUpdateSchema, CRM_STATUSES, PIPELINES, type AssociationUpdateInput } from '@/lib/validators/association'

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
    streetAddress?: string | null
    postalCode?: string | null
    city?: string | null
    email?: string | null
    phone?: string | null
    homepageUrl?: string | null
    activities?: string[] | null
    otherInformation?: string | null
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
      streetAddress: association.streetAddress ?? null,
      postalCode: association.postalCode ?? null,
      city: association.city ?? null,
      email: association.email ?? null,
      phone: association.phone ?? null,
      homepageUrl: association.homepageUrl ?? null,
      activities: association.activities ?? [],
      otherInformation: association.otherInformation ?? '',
      descriptionFreeText: association.descriptionFreeText ?? '',
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
      streetAddress: association.streetAddress ?? null,
      postalCode: association.postalCode ?? null,
      city: association.city ?? null,
      email: association.email ?? null,
      phone: association.phone ?? null,
      homepageUrl: association.homepageUrl ?? null,
      activities: association.activities ?? [],
      otherInformation: association.otherInformation ?? '',
      descriptionFreeText: association.descriptionFreeText ?? '',
      notes: '',
    })
  }, [association, form])

  const handleSubmit = async (values: AssociationUpdateInput) => {
    const normalize = (value?: string | null) => {
      if (value === undefined) return undefined
      const trimmed = value?.trim()
      return trimmed && trimmed.length ? trimmed : null
    }

    const cleaned: AssociationUpdateInput = {
      ...values,
      assignedToId: values.assignedToId ?? null,
      memberSince: values.memberSince ?? undefined,
      streetAddress: normalize(values.streetAddress ?? null),
      postalCode: normalize(values.postalCode ?? null),
      city: normalize(values.city ?? null),
      email: normalize(values.email ?? null),
      phone: normalize(values.phone ?? null),
      homepageUrl: normalize(values.homepageUrl ?? null),
      activities: values.activities?.map((activity) => activity.trim()).filter(Boolean),
      otherInformation: values.otherInformation?.trim() ?? '',
      descriptionFreeText: values.descriptionFreeText?.trim() ?? '',
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
    }

    await onSubmit(cleaned)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Redigera {association.name}</DialogTitle>
          <DialogDescription>Uppdatera status, pipeline och nyckelfält i CRM-panelen.</DialogDescription>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adress</FormLabel>
                    <FormControl>
                      <Input placeholder="Gatuadress" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="123 45" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ort</FormLabel>
                    <FormControl>
                      <Input placeholder="Stad" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="homepageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webbplats</FormLabel>
                    <FormControl>
                      <Input placeholder="https://forening.se" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
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
                      <Input type="email" placeholder="kontakt@forening.se" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
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
                      <Input placeholder="08-123 45 67" value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)} />
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
                      placeholder="En aktivitet per rad"
                      rows={3}
                      value={field.value?.join('\n') ?? ''}
                      onChange={(event) => {
                        const entries = event.target.value
                          .split(/\n|,/)
                          .map((entry) => entry.trim())
                          .filter(Boolean)
                        field.onChange(entries)
                      }}
                    />
                  </FormControl>
                  <FormDescription>Aktiviteter används för filtrering och utskick. Separera med radbrytning eller kommatecken.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Övrig information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex. kontaktvägar, samarbeten eller särskilda önskemål"
                      rows={4}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriptionFreeText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivning (fri text)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kort sammanfattning eller anteckning om föreningen"
                      rows={4}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
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
