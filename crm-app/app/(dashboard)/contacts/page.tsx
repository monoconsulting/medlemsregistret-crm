"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Loader2, Mail, Phone, Search, Users } from "lucide-react"

import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

const PAGE_SIZE = 25

const formatDate = (value: Date | string | null | undefined): string => {
  if (!value) return "-"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.valueOf())) return "-"
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "short" }).format(date)
}

export default function ContactsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [onlyPrimary, setOnlyPrimary] = useState(false)

  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    setPage(1)
  }, [deferredSearch, onlyPrimary])

  const { data, isLoading, isFetching, isError } = api.contacts.list.useQuery(
    {
      page,
      limit: PAGE_SIZE,
      search: deferredSearch.trim() || undefined,
      onlyPrimary: onlyPrimary || undefined,
      sortBy: "name",
      sortDirection: "asc",
    },
    {
      placeholderData: (prev) => prev,
      gcTime: 1000 * 60 * 5,
      staleTime: 1000 * 5,
    },
  )

  const contacts = data?.contacts ?? []
  const pagination = data?.pagination
  const total = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1

  const rangeLabel = useMemo(() => {
    if (!total) return "Inga kontakter att visa"
    const start = (page - 1) * PAGE_SIZE + 1
    const end = Math.min(page * PAGE_SIZE, total)
    return `Visar ${start}–${end} av ${total}`
  }, [page, total])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kontakter</h1>
          <p className="text-muted-foreground">Alla kontaktpersoner från föreningarna i Loopia-databasen.</p>
        </div>
        <Badge variant="secondary" className="w-fit gap-2 text-sm">
          <Users className="h-4 w-4" />
          Totalt {total.toLocaleString("sv-SE")}
        </Badge>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Kontaktlista</CardTitle>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Sök på namn, e-post eller telefon…"
                className="pl-10"
                aria-label="Sök kontakt"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={onlyPrimary}
                onCheckedChange={(checked) => setOnlyPrimary(Boolean(checked))}
                aria-label="Visa endast primära kontakter"
              />
              Visa endast primära kontakter
            </label>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{rangeLabel}</div>

          {isError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 text-destructive">
              Kunde inte hämta kontaktlistan. Försök igen senare.
            </div>
          ) : isLoading && !contacts.length ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Laddar kontakter…
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <p>Inga kontakter matchade din sökning.</p>
              <p className="text-xs">Justera filtren eller rensa sökningen för att se fler resultat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Förening</TableHead>
                    <TableHead>Kommun</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Senast uppdaterad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{contact.name ?? "—"}</span>
                          {contact.isPrimary ? <Badge variant="outline">Primär</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>{contact.role ?? "—"}</TableCell>
                      <TableCell>{contact.association?.name ?? "—"}</TableCell>
                      <TableCell>{contact.association?.municipality ?? "—"}</TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                            href={`mailto:${contact.email}`}
                          >
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a
                            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                            href={`tel:${contact.phone}`}
                          >
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(contact.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {isFetching ? "Uppdaterar…" : rangeLabel}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || isFetching}
              >
                Föregående
              </Button>
              <span className="text-sm text-muted-foreground">
                Sida {Math.min(page, totalPages)} av {Math.max(totalPages, 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || isFetching}
              >
                Nästa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
