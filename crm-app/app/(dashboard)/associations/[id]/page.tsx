import { notFound } from "next/navigation"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { CalendarClock, Mail, Phone, UserRound } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const formatDate = (date: Date | null | undefined) =>
  date ? format(date, "PPP", { locale: sv }) : "–"

export default async function AssociationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const association = await db.association.findUnique({
    where: { id: params.id },
    include: {
      contacts: true,
      notes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      tags: true,
      groupMemberships: {
        include: { group: true },
      },
      activityLog: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  })

  if (!association) {
    notFound()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{association.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{association.municipality}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Status: {association.crmStatus}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Pipeline: {association.pipeline}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {association.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="contacts">Kontakter</TabsTrigger>
          <TabsTrigger value="notes">Anteckningar</TabsTrigger>
          <TabsTrigger value="timeline">Aktiviteter</TabsTrigger>
          <TabsTrigger value="scrape">Scrapad data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktuppgifter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {association.email ?? "Ingen e-post"}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {association.phone ?? "Ingen telefon"}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" /> Skapad: {formatDate(association.createdAt)}
                </p>
                {association.isMember && (
                  <p className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" /> Medlem sedan {formatDate(association.memberSince)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grupperingar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {association.groupMemberships.length === 0 ? (
                  <p className="text-muted-foreground">Inga grupperingar än.</p>
                ) : (
                  <ul className="space-y-1">
                    {association.groupMemberships.map((membership) => (
                      <li key={membership.id} className="flex items-center justify-between">
                        <span>{membership.group.name}</span>
                        <Badge variant="outline">{formatDate(membership.addedAt)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {association.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beskrivning</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {JSON.stringify(association.description, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Kontakter</CardTitle>
            </CardHeader>
            <CardContent>
              {association.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga kontakter registrerade.</p>
              ) : (
                <div className="space-y-4">
                  {association.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.role ?? ""}</p>
                        </div>
                        {contact.isPrimary && <Badge>Primär</Badge>}
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <span>E-post: {contact.email ?? "-"}</span>
                        <span>Telefon: {contact.phone ?? contact.mobile ?? "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Senaste anteckningar</CardTitle>
            </CardHeader>
            <CardContent>
              {association.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga anteckningar loggade.</p>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {association.notes.map((note) => (
                      <div key={note.id} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{note.authorName}</span>
                          <span>{format(note.createdAt, "PPP HH:mm", { locale: sv })}</span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-line">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitetslogg</CardTitle>
            </CardHeader>
            <CardContent>
              {association.activityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga aktiviteter registrerade ännu.</p>
              ) : (
                <div className="space-y-4">
                  {association.activityLog.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-primary/40 pl-4">
                      <p className="text-xs text-muted-foreground">
                        {format(activity.createdAt, "PPP HH:mm", { locale: sv })}
                      </p>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.userName}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scrape">
          <Card>
            <CardHeader>
              <CardTitle>Scrapad metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Scrape-run</h3>
                  <p>System: {association.sourceSystem}</p>
                  <p>Scrapad: {formatDate(association.scrapedAt)}</p>
                  <p>Run ID: {association.scrapeRunId}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Placering</h3>
                  <p>Lista: {association.listPageIndex ?? "-"}</p>
                  <p>Position: {association.positionOnPage ?? "-"}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Extras</h3>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(association.extras, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
