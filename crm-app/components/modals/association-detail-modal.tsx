"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import type { Association, Contact, Note, Tag } from "@prisma/client"

interface AssociationDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  association: Pick<
    Association,
    | "id"
    | "name"
    | "municipality"
    | "crmStatus"
    | "pipeline"
    | "orgNumber"
    | "homepageUrl"
    | "email"
    | "phone"
    | "streetAddress"
    | "postalCode"
    | "city"
  > & {
    tags?: Tag[]
  }
}

type AssociationDetails = Association & {
  contacts: Contact[]
  tags: Tag[]
  notes: Note[]
  descriptionSections: { id: string; title: string; data: unknown }[]
}

const asStringArray = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : typeof item === "number" ? String(item) : JSON.stringify(item)))
      .filter(Boolean)
  }
  return [typeof value === "string" ? value : JSON.stringify(value)]
}

export function AssociationDetailModal({ open, onOpenChange, association }: AssociationDetailModalProps) {
  const [note, setNote] = useState("")
  const detailsQuery = api.association.getById.useQuery(
    { id: association.id },
    { enabled: open }
  )
  const notesQuery = api.notes.list.useQuery(
    { associationId: association.id, limit: 20 },
    { enabled: open }
  )
  const createNote = api.notes.create.useMutation({
    onSuccess: () => {
      toast({ title: "Anteckning sparad" })
      notesQuery.refetch()
      setNote("")
    },
    onError: (error) => toast({ title: "Kunde inte spara anteckning", description: error.message, variant: "destructive" }),
  })

  const details = detailsQuery.data as AssociationDetails | undefined
  const tags = useMemo(() => details?.tags ?? association.tags ?? [], [association.tags, details?.tags])

  const handleSaveNote = async () => {
    const content = note.trim()
    if (!content) return
    await createNote.mutateAsync({ associationId: association.id, content, tags: [] })
  }

  const renderStringTable = (title: string, values: string[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="outline">{values.length}</Badge>
      </div>
      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen data</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Värde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.map((value) => (
              <TableRow key={`${title}-${value}`}>
                <TableCell className="text-sm">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] w-full max-w-[80vw]">
        <DialogHeader>
          <DialogTitle>{association.name}</DialogTitle>
        </DialogHeader>
        {detailsQuery.isPending ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Hämtar föreningsinformation…
          </div>
        ) : !details ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Kunde inte läsa in detaljer.
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 pb-6">
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Grunddata</h3>
                  <div className="grid gap-1 text-sm">
                    <div><span className="text-muted-foreground">Kommun:</span> {details.municipality ?? "Okänd"}</div>
                    <div><span className="text-muted-foreground">Organisationsnummer:</span> {details.orgNumber ?? "Saknas"}</div>
                    <div><span className="text-muted-foreground">Status:</span> {details.crmStatus}</div>
                    <div><span className="text-muted-foreground">Pipeline:</span> {details.pipeline}</div>
                    <div><span className="text-muted-foreground">Plats:</span> {details.city ?? "Saknas"}</div>
                    <div><span className="text-muted-foreground">Adress:</span> {details.streetAddress ?? "Saknas"}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Kontaktuppgifter</h3>
                  <div className="grid gap-1 text-sm">
                    <div><span className="text-muted-foreground">E-post:</span> {details.email ?? "Saknas"}</div>
                    <div><span className="text-muted-foreground">Telefon:</span> {details.phone ?? "Saknas"}</div>
                    <div>
                      <span className="text-muted-foreground">Hemsida:</span>{" "}
                      {details.homepageUrl ? (
                        <a
                          href={details.homepageUrl}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {details.homepageUrl}
                        </a>
                      ) : (
                        "Saknas"
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section className="grid gap-4 lg:grid-cols-2">
                {renderStringTable("Föreningstyper", asStringArray(details.types))}
                {renderStringTable("Aktiviteter", asStringArray(details.activities))}
                {renderStringTable("Kategorier", asStringArray(details.categories))}
                {renderStringTable("Taggar", tags.map((tag) => tag.name))}
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Kontakter</h3>
                {details.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Inga kontakter registrerade.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Namn</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead>E-post</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Primär</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell>{contact.role ?? "-"}</TableCell>
                          <TableCell>{contact.email ?? "-"}</TableCell>
                          <TableCell>{contact.phone ?? contact.mobile ?? "-"}</TableCell>
                          <TableCell>{contact.isPrimary ? "Ja" : "Nej"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Beskrivning</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {details.descriptionFreeText ? (
                    <p className="whitespace-pre-wrap text-foreground">{details.descriptionFreeText}</p>
                  ) : (
                    <p>Ingen fritextbeskrivning sparad.</p>
                  )}
                  {Array.isArray(details.descriptionSections) && details.descriptionSections.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sektion</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.descriptionSections.map((section) => (
                          <TableRow key={section.id}>
                            <TableCell className="font-medium">{section.title}</TableCell>
                            <TableCell>
                              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                                {JSON.stringify(section.data, null, 2)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Anteckningar</h3>
                <div className="space-y-2">
                  <Label htmlFor="note">Ny anteckning</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Skriv en anteckning…"
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNote} disabled={createNote.isPending || !note.trim()}>
                      {createNote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Spara anteckning
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(notesQuery.data?.notes ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Inga anteckningar ännu.</p>
                  ) : (
                    <ul className="space-y-3">
                      {notesQuery.data?.notes.map((item) => (
                        <li key={item.id} className="rounded-md border p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{item.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.createdAt), "d MMMM yyyy HH:mm", { locale: sv })}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
