"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Users, Bookmark } from "lucide-react"

import { trpc } from "@/lib/trpc/client"
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
import { toast } from "@/hooks/use-toast"

const groupFormSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  description: z.string().optional(),
  autoUpdate: z.boolean().default(false),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

export default function GroupsPage() {
  const utils = trpc.useUtils()
  const [open, setOpen] = useState(false)

  const groupsQuery = trpc.groups.list.useQuery()
  const createGroup = trpc.groups.create.useMutation({
    onSuccess: () => {
      toast({ title: "Grupp skapad" })
      utils.groups.list.invalidate()
      setOpen(false)
    },
    onError: (error) => toast({ title: "Kunde inte skapa grupp", description: error.message, variant: "destructive" }),
  })

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "", autoUpdate: false },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Grupperingar</h1>
          <p className="text-muted-foreground">
            Samla föreningar i smarta segment – manuellt eller via sparade filter.
          </p>
        </div>
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
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(async (values) => {
                  await createGroup.mutateAsync({
                    name: values.name,
                    description: values.description,
                    autoUpdate: values.autoUpdate,
                  })
                  form.reset()
                })}
              >
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
                          onChange={(event) => field.onChange(event.target.checked)}
                          aria-checked={field.value}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createGroup.isPending}>
                    {createGroup.isPending ? "Skapar…" : "Skapa"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mina grupperingar</CardTitle>
        </CardHeader>
        <CardContent>
          {groupsQuery.isLoading ? (
            <p className="py-12 text-center text-muted-foreground">Laddar grupper…</p>
          ) : groupsQuery.data?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {groupsQuery.data.map((group) => (
                <Card key={group.id} className="border shadow-sm">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-primary" />
                      {group.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Skapad av {group.createdBy.name ?? group.createdBy.email}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {group.description ? (
                      <p className="text-muted-foreground">{group.description}</p>
                    ) : (
                      <p className="text-muted-foreground">Ingen beskrivning angiven.</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {group._count.memberships} föreningar
                      </span>
                      {group.autoUpdate && <Badge variant="secondary">Auto</Badge>}
                    </div>
                    <Button asChild variant="link" className="px-0">
                      <Link href={`/groups/${group.id}`}>Öppna grupp</Link>
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
    </div>
  )
}
