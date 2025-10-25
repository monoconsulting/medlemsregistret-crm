"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Loader2, MapPin, NotepadText, Users } from "lucide-react"

import { api } from "@/lib/trpc/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface AssociationDetailsDialogProps {
  associationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function renderList(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values
      .map((value) => {
        if (typeof value === "string") return value
        if (value && typeof value === "object" && "name" in value) {
          return String((value as Record<string, unknown>).name)
        }
        return typeof value === "number" ? String(value) : ""
      })
      .filter(Boolean)
  }

  if (typeof values === "string" && values.trim().length > 0) {
    return values.split(",").map((value) => value.trim()).filter(Boolean)
  }

  return []
}

export function AssociationDetailsDialog({ associationId, open, onOpenChange }: AssociationDetailsDialogProps) {
  const utils = api.useUtils()
  const [note, setNote] = useState("")

  const detailsQuery = api.association.getById.useQuery(
    { id: associationId ?? "" },
    {
      enabled: open && Boolean(associationId),
      staleTime: 10_000,
    },
  )

  const createNote = api.notes.create.useMutation({
    onSuccess: async () => {
      await utils.association.getById.invalidate({ id: associationId! })
      setNote("")
      toast({ title: "Anteckning sparad" })
    },
    onError: (error) => {
      toast({ title: "Kunde inte spara anteckning", description: error.message, variant: "destructive" })
    },
  })

  const association = detailsQuery.data

  const types = useMemo(() => renderList(association?.types), [association?.types])
  const activities = useMemo(() => renderList(association?.activities), [association?.activities])
  const categories = useMemo(() => renderList(association?.categories), [association?.categories])

  const handleSaveNote = async () => {
    if (!associationId || note.trim().length === 0) return
    await createNote.mutateAsync({ associationId, content: note.trim(), tags: [] })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] w-[80vw] max-w-6xl p-0">
        {detailsQuery.isPending ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Hämtar förening…
          </div>
        ) : !association ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Föreningen kunde inte laddas.</p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="text-2xl font-semibold">{association.name}</DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {association.municipality ?? "Okänd kommun"}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {association.contacts.length} kontakter
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs uppercase tracking-wide">
                  Status: <span className="font-medium">{association.crmStatus}</span>
                </span>
                <span className="text-xs uppercase tracking-wide">
                  Pipeline: <span className="font-medium">{association.pipeline}</span>
                </span>
              </div>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-6 py-4 lg:flex-row">
              <ScrollArea className="h-full flex-1 pr-4">
                <div className="space-y-6 pb-8">
                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grunduppgifter</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Organisationsnummer</dt>
                        <dd>{association.orgNumber ?? "Saknas"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Medlemsstatus</dt>
                        <dd>{association.isMember ? "Aktiv medlem" : "Inte medlem"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Medlem sedan</dt>
                        <dd>
                          {association.memberSince
                            ? format(new Date(association.memberSince), "PPP", { locale: sv })
                            : "Saknas"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Hemsida</dt>
                        <dd>
                          {association.homepageUrl ? (
                            <a
                              href={association.homepageUrl}
                              className="text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {association.homepageUrl}
                            </a>
                          ) : (
                            "Saknas"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Primär kontakt</dt>
                        <dd>
                          {association.contacts.find((contact) => contact.isPrimary)?.name ?? "Ej angiven"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Detaljsida</dt>
                        <dd>
                          {association.detailUrl ? (
                            <a
                              href={association.detailUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {association.detailUrl}
                            </a>
                          ) : (
                            "Saknas"
                          )}
                        </dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-muted-foreground">Adress</dt>
                        <dd className="space-y-1">
                          {association.streetAddress ? <div>{association.streetAddress}</div> : null}
                          {association.postalCode || association.city ? (
                            <div className="text-muted-foreground">
                              {[association.postalCode, association.city].filter(Boolean).join(" ")}
                            </div>
                          ) : null}
                          {!association.streetAddress && !association.postalCode && !association.city ? (
                            <div>Saknas</div>
                          ) : null}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Klassificeringar</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Typer</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {types.length ? types.map((type) => <li key={type}>{type}</li>) : <li>Ingen data</li>}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Taggar</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {association.tags.length ? (
                            association.tags.map((tag) => (
                              <Badge key={tag.id} variant="outline" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm">Inga taggar</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Aktiviteter</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {activities.length
                            ? activities.map((activity) => <li key={activity}>{activity}</li>)
                            : <li>Ingen data</li>}
                        </ul>
                      </div>
                    </div>

                    {categories.length ? (
                      <div className="mt-6">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Kategorier</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          {categories.map((category) => (
                            <li key={category}>{category}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Beskrivning</h3>
                    <div className="mt-4 space-y-4 text-sm">
                      {association.descriptionFreeText ? (
                        <div>
                          <p className="whitespace-pre-line text-sm text-muted-foreground">
                            {association.descriptionFreeText}
                          </p>
                        </div>
                      ) : (
                        <p>Ingen beskrivning tillgänglig.</p>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="flex w-full max-w-md flex-col gap-4">
                <section className="flex-1 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <NotepadText className="h-4 w-4" /> Anteckningar
                  </div>
                  <ScrollArea className="h-full max-h-[40vh]">
                    <div className="space-y-4 px-4 py-4">
                      {association.notes.length ? (
                        association.notes.map((noteItem) => (
                          <div key={noteItem.id} className="rounded-md border bg-muted/40 p-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{noteItem.authorName}</span>
                              <span>
                                {format(new Date(noteItem.createdAt), "yyyy-MM-dd HH:mm", {
                                  locale: sv,
                                })}
                              </span>
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-line">{noteItem.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Inga anteckningar ännu.</p>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t px-4 py-3">
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Lägg till anteckning..."
                      rows={4}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button onClick={handleSaveNote} size="sm" disabled={createNote.isPending || note.trim().length === 0}>
                        {createNote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Spara anteckning
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-4 text-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metadata</h3>
                  <dl className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Skapad</dt>
                      <dd>
                        {format(new Date(association.createdAt), "yyyy-MM-dd HH:mm", {
                          locale: sv,
                        })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Senast uppdaterad</dt>
                      <dd>
                        {format(new Date(association.updatedAt), "yyyy-MM-dd HH:mm", {
                          locale: sv,
                        })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Senaste aktivitet</dt>
                      <dd>{association.activityLog[0]?.type ?? "Saknas"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ansvarig</dt>
                      <dd>{association.assignedTo?.name ?? "Ej tilldelad"}</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}