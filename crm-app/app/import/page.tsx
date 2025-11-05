"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ImportPage() {
  return (
    <AppLayout title="Import" description="Importera föreningsdata (kommer snart)">
      <Card>
        <CardHeader>
          <CardTitle>Importverktyg under uppbyggnad</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Rutiner för att importera föreningsregister från externa system flyttas hit i samband med
          migreringen till PHP API:t.
        </CardContent>
      </Card>
    </AppLayout>
  )
}
