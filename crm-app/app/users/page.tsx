"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersPage() {
  return (
    <AppLayout title="Användare" description="Administrera åtkomst och roller (kommer snart)">
      <Card>
        <CardHeader>
          <CardTitle>Användarhantering planeras</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Den förenklade plattformen stödjer just nu en administratör. Funktioner för fler användare
          kommer att introduceras här framöver.
        </CardContent>
      </Card>
    </AppLayout>
  )
}
