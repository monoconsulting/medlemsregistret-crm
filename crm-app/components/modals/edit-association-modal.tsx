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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
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
      notes: '',
    })
  }, [association, form])

  const handleSubmit = async (values: AssociationUpdateInput) => {
    await onSubmit(values)
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
                    <Input placeholder="Syns inte för kund" {...field} />
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
