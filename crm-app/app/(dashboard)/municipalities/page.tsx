"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MunicipalitiesPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kommuner (endast filterstöd)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Kommunlistan används nu uteslutande som filter i föreningsöversikten. Eventuella administrationsverktyg från den
            gamla stacken ligger under <code>/legacy</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
