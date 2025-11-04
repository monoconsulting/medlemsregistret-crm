"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GroupsPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grupper (legacy)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Funktionaliteten för sparade grupper har flyttats till <code>/legacy</code> tillsammans med det tidigare tRPC-
            gränssnittet. Återaktivera den genom att porta motsvarande API-endpoints till PHP om den behövs i framtiden.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
