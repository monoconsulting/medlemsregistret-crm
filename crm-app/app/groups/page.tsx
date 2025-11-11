"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Users, Bookmark, Loader2 } from "lucide-react"

import { api, type Group } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/layout/app-layout"

const groupFormSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  description: z.string().optional(),
  autoUpdate: z.boolean().default(false),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

export default function GroupsPage() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "", autoUpdate: false },
  })

  const loadGroups = async () => {
    setLoading(true)
    try {
      const data = await api.getGroups()
      setGroups(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte hämta grupper"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (values: GroupFormValues) => {
    setSubmitting(true)
    try {
      await api.createGroup({
        name: values.name,
        description: values.description,
        autoUpdate: values.autoUpdate,
      })
      toast({ title: "Grupp skapad" })
      form.reset()
      setOpen(false)
      await loadGroups()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte skapa grupp"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout
      title="Grupperingar"
      description="Samla föreningar i smarta segment – manuellt eller via sparade filter."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ny grupp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa ny gruppering</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namn</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. Största idrottskommuner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beskrivning</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Vad kännetecknar denna grupp?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoUpdate"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <FormLabel>Automatisk uppdatering</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Uppdatera gruppen automatiskt baserat på sparade filter.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Skapar…" : "Skapa"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Mina grupperingar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">
              <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
              Laddar grupper…
            </p>
          ) : groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Card key={group.id} className="border shadow-sm">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-primary" />
                      {group.name}
                    </CardTitle>
                    {group.createdBy && (
                      <p className="text-xs text-muted-foreground">
                        Skapad av {group.createdBy.name ?? group.createdBy.email}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {group.description ? (
                      <p className="text-muted-foreground">{group.description}</p>
                    ) : (
                      <p className="text-muted-foreground">Ingen beskrivning angiven.</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {group._count?.memberships ?? 0} föreningar
                      </span>
                      {group.autoUpdate && <Badge variant="secondary">Auto</Badge>}
                    </div>
                    <Button asChild variant="link" className="px-0">
                      <Link href={`/groups/detail?id=${group.id}`}>Öppna grupp</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              Du har inte skapat några grupper ännu.
            </p>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
