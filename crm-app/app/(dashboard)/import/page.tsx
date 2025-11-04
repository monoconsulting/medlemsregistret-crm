"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ImportPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import (legacy)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Importverktygen och CSV-flödena kräver den gamla Node-miljön och har placerats i <code>/legacy</code>. Vid behov kan
            de byggas om ovanpå den nya PHP-datan.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
