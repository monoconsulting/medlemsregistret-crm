'use client'

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { emailComposerSchema, type EmailComposerValues } from '@/lib/validators/email'
import { trpc } from '@/lib/trpc/client'
import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  associationId: string
  defaultRecipient: string | null
  associationName: string
  onSubmit: (values: EmailComposerValues) => Promise<void>
  isSubmitting?: boolean
}

export function SendEmailModal({
  open,
  onOpenChange,
  associationId,
  defaultRecipient,
  associationName,
  onSubmit,
  isSubmitting,
}: SendEmailModalProps) {
  const form = useForm<EmailComposerValues>({
    resolver: zodResolver(emailComposerSchema),
    defaultValues: {
      associationId,
      to: defaultRecipient ?? '',
      subject: `Uppföljning ${associationName}`,
      body: '',
      tone: 'friendly',
    },
  })

  const aiDraft = trpc.ai.generateEmailDraft.useMutation()

  useEffect(() => {
    form.reset({
      associationId,
      to: defaultRecipient ?? '',
      subject: `Uppföljning ${associationName}`,
      body: '',
      tone: 'friendly',
    })
  }, [associationId, associationName, defaultRecipient, form])

  const handleSubmit = async (values: EmailComposerValues) => {
    await onSubmit(values)
    onOpenChange(false)
  }

  const handleGenerateDraft = async (tone: 'friendly' | 'formal' | 'followup') => {
    try {
      const result = await aiDraft.mutateAsync({ associationId, tone })
      form.setValue('tone', tone)
      form.setValue('subject', result.subject)
      form.setValue('body', result.body)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Skicka e-post</DialogTitle>
          <DialogDescription>Generera snabbt ett AI-förslag och anpassa innan utskick.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mottagare</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="namn@forening.se" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ämne</FormLabel>
                  <FormControl>
                    <Input placeholder={`Inbjudan – ${associationName}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs value={form.watch('tone')} onValueChange={(value) => handleGenerateDraft(value as EmailComposerValues['tone'])}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="friendly">Vänlig</TabsTrigger>
                <TabsTrigger value="formal">Formell</TabsTrigger>
                <TabsTrigger value="followup">Uppföljning</TabsTrigger>
              </TabsList>
              <TabsContent value="friendly" />
              <TabsContent value="formal" />
              <TabsContent value="followup" />
            </Tabs>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerateDraft(form.watch('tone'))}
                disabled={aiDraft.isLoading}
              >
                {aiDraft.isLoading ? 'Genererar utkast…' : 'Generera AI-utkast'}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meddelande</FormLabel>
                  <FormControl>
                    <Textarea rows={10} placeholder="Skriv ditt meddelande här" {...field} />
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
                {isSubmitting ? 'Skickar…' : 'Skicka e-post'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
