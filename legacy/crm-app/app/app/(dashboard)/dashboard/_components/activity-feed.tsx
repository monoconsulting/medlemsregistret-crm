"use client"

import { trpc } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import {
  CalendarClock,
  FileText,
  Mail,
  Phone,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react"

import type { ReactNode } from "react"

const activityIcons: Record<string, ReactNode> = {
  CREATED: <Sparkles className="h-4 w-4 text-primary" />,
  UPDATED: <Sparkles className="h-4 w-4 text-primary" />,
  STATUS_CHANGED: <CalendarClock className="h-4 w-4 text-primary" />,
  NOTE_ADDED: <FileText className="h-4 w-4 text-primary" />,
  EMAIL_SENT: <Mail className="h-4 w-4 text-primary" />,
  CALL_MADE: <Phone className="h-4 w-4 text-primary" />,
  MEETING_SCHEDULED: <UsersRound className="h-4 w-4 text-primary" />,
  TAG_ADDED: <Sparkles className="h-4 w-4 text-primary" />,
  MEMBER_CONVERTED: <UserRound className="h-4 w-4 text-primary" />,
}

const activityLabels: Record<string, string> = {
  CREATED: "Ny förening skapad",
  UPDATED: "Förening uppdaterad",
  STATUS_CHANGED: "Status uppdaterad",
  NOTE_ADDED: "Anteckning tillagd",
  EMAIL_SENT: "E-post skickad",
  CALL_MADE: "Samtal loggat",
  MEETING_SCHEDULED: "Möte bokat",
  TAG_ADDED: "Tagg tillagd",
  MEMBER_CONVERTED: "Medlem konverterad",
}

export function ActivityFeed() {
  const { data, isLoading } = trpc.activities.recent.useQuery(
    { limit: 10 },
    { refetchInterval: 15000 }
  )

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Aktivitetsflöde</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Inga aktiviteter registrerade de senaste dagarna.
          </p>
        )}

        {data?.map((activity) => {
          const icon = activityIcons[activity.type] ?? (
            <Sparkles className="h-4 w-4 text-primary" />
          )
          const label = activityLabels[activity.type] ?? "Aktivitet"

          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-lg border bg-card p-3 shadow-sm"
            >
              <Avatar className="h-10 w-10 border bg-muted">
                <AvatarFallback>{activity.userName?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {icon}
                  <span>{label}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                {activity.association && (
                  <p className="text-xs text-muted-foreground">
                    {activity.association.name} • {activity.association.municipality ?? ""}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: sv,
                })}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
