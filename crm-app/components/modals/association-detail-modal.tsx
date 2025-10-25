"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, ExternalLink } from "lucide-react"

import { api } from "@/lib/trpc/client"
import {
  associationUpdateSchema,
  CRM_STATUSES,
  PIPELINES,
  type AssociationUpdateInput,
} from "@/lib/validators/association"

interface AssociationDetailModalProps {
  open: boolean
  associationId: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AssociationUpdateInput) => Promise<void>
  isSubmitting?: boolean
  users: { id: string; name: string }[]
}

export function AssociationDetailModal({
  open,
  associationId,
  onOpenChange,
  onSubmit,
  isSubmitting,
  users,
}: AssociationDetailModalProps) {
  const associationQuery = api.association.getById.useQuery(
    { id: associationId ?? "" },
    { enabled: open && Boolean(associationId) }
  )
  const utils = api.useUtils()

  const form = useForm<AssociationUpdateInput>({
    resolver: zodResolver(associationUpdateSchema),
    defaultValues: {
      crmStatus: "UNCONTACTED",
      pipeline: "PROSPECT",
      isMember: false,
      memberSince: undefined,
      assignedToId: undefined,
      streetAddress: null,
      postalCode: null,
      city: null,
      email: null,
      phone: null,
      homepageUrl: null,
      activities: [],
      otherInformation: "",
      descriptionFreeText: "",
      notes: "",
    },
  })

  const association = associationQuery.data

  useEffect(() => {
    if (!association) return

    form.reset({
      crmStatus: association.crmStatus as AssociationUpdateInput["crmStatus"],
      pipeline: association.pipeline as AssociationUpdateInput["pipeline"],
      isMember: association.isMember,
      memberSince: association.memberSince ? association.memberSince.toISOString() : undefined,
      assignedToId: association.assignedToId ?? undefined,
      streetAddress: association.streetAddress ?? null,
      postalCode: association.postalCode ?? null,
      city: association.city ?? null,
      email: association.email ?? null,
      phone: association.phone ?? null,
      homepageUrl: association.homepageUrl ?? null,
      activities: Array.isArray(association.activities)
        ? (association.activities as unknown[])
            .map((item) => (typeof item === "string" ? item : ""))
            .filter((item) => item.length > 0)
        : [],
      otherInformation:
        association.extras && typeof association.extras === "object"
          ? (association.extras as Record<string, unknown>).otherInformation?.toString() ?? ""
          : "",
      descriptionFreeText: association.descriptionFreeText ?? "",
      notes: "",
    })
  }, [association, form])

  const handleSubmit = async (values: AssociationUpdateInput) => {
    await onSubmit({
      ...values,
      activities: values.activities?.map((activity) => activity.trim()).filter(Boolean) ?? [],
    })
    await Promise.all([
      utils.association.list.invalidate(),
      associationQuery.refetch(),
    ])
    form.setValue("notes", "")
  }

  const formattedTypes = useMemo(() => {
    if (!association) return []
    if (Array.isArray(association.types)) {
      return (association.types as unknown[])
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .filter(Boolean)
    }
    if (typeof association.types === "string") {
      return association.types.split(",").map((item) => item.trim()).filter(Boolean)
    }
    return []
  }, [association])

  const formattedActivities = useMemo(() => {
    if (!association) return []
    if (Array.isArray(association.activities)) {
      return (association.activities as unknown[])
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .filter(Boolean)
    }
    return []
  }, [association])

  const formattedCategories = useMemo(() => {
    if (!association) return []
    if (Array.isArray(association.categories)) {
      return (association.categories as unknown[])
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .filter(Boolean)
    }
    return []
  }, [association])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {association?.name ?? "Förening"}
          </DialogTitle>
          <DialogDescription>
            {association?.municipality ? `Kommun: ${association.municipality}` : "Kommun saknas"}
          </DialogDescription>
        </DialogHeader>
        {associationQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Hämtar förening…
          </div>
        ) : !association ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Kunde inte hitta föreningen.</div>
        ) : (
          <div className="grid h-[65vh] gap-6 lg:grid-cols-[2fr,1fr]">
            <ScrollArea className="rounded-md border p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="crmStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
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
                          <Select value={field.value} onValueChange={field.onChange}>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="isMember"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Medlem</FormLabel>
                            <p className="text-xs text-muted-foreground">Markerar om föreningen är aktiv medlem.</p>
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
                              value={field.value ? field.value.substring(0, 10) : ""}
                              onChange={(event) => field.onChange(event.target.value ? new Date(event.target.value).toISOString() : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="assignedToId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ansvarig</FormLabel>
                          <Select value={field.value ?? ""} onValueChange={(value) => field.onChange(value || undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Välj ansvarig" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Ingen ansvarig</SelectItem>
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
                      name="homepageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hemsida</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-post</FormLabel>
                          <FormControl>
                            <Input type="email" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)} />
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
                            <Input value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adress</FormLabel>
                          <FormControl>
                            <Input value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postnummer</FormLabel>
                            <FormControl>
                              <Input value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)} />
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
                              <Input value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value || null)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="activities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aktiviteter</FormLabel>
                        <FormControl>
                          <Textarea
                            value={field.value?.join("\n") ?? ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value
                                  .split(/\n+/)
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                              )
                            }
                            placeholder="En aktivitet per rad"
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
                        <FormLabel>Beskrivning</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
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
                          <Textarea rows={3} {...field} />
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
                        <FormLabel>Ny anteckning</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Skriv en anteckning..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Återställ
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Spara ändringar
                    </Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>

            <ScrollArea className="rounded-md border p-4">
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grunduppgifter</h3>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="font-medium">Organisationsnummer:</span> {association.orgNumber ?? "Saknas"}
                    </div>
                    <div>
                      <span className="font-medium">Plattform:</span> {association.platform ?? "Saknas"}
                    </div>
                    <div>
                      <span className="font-medium">Senast uppdaterad:</span> {association.updatedAt?.toLocaleString("sv-SE")}
                    </div>
                    <div>
                      <span className="font-medium">Skapad:</span> {association.createdAt?.toLocaleString("sv-SE")}
                    </div>
                    {association.homepageUrl && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Hemsida:</span>
                        <a
                          href={association.homepageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Besök <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Föreningstyper</h3>
                  <div className="mt-3 space-y-1">
                    {formattedTypes.length ? (
                      formattedTypes.map((item) => (
                        <div key={item} className="rounded border px-2 py-1">
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Saknas</div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktiviteter</h3>
                  <div className="mt-3 space-y-1">
                    {formattedActivities.length ? (
                      formattedActivities.map((item) => (
                        <div key={item} className="rounded border px-2 py-1">
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Saknas</div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kategorier</h3>
                  <div className="mt-3 space-y-1">
                    {formattedCategories.length ? (
                      formattedCategories.map((item) => (
                        <div key={item} className="rounded border px-2 py-1">
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Saknas</div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taggar</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {association.tags?.length ? (
                      association.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Inga taggar</div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anteckningar</h3>
                  <div className="mt-3 space-y-3">
                    {association.notes?.length ? (
                      association.notes.map((note) => (
                        <div key={note.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{note.authorName}</span>
                            <span>{note.createdAt.toLocaleString("sv-SE")}</span>
                          </div>
                          <p className="mt-2 text-sm">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">Inga anteckningar ännu.</div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
