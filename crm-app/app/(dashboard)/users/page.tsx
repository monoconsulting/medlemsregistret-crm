"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Användare (single-user)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Den förenklade lösningen antar ett enda administratörskonto. Multiuser-stöd från den tidigare lösningen finns
            dokumenterat i <code>/legacy</code> och kan implementeras i PHP-API:t vid behov.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
