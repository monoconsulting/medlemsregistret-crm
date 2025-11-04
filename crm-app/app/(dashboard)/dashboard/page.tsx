"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Översikt över CRM-data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funktioner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Den nya PHP-baserade versionen fokuserar på föreningsregistret, anteckningar och taggar. Utforska allt arbete i
            <Link href="/associations" className="text-primary underline underline-offset-4"> Associationsvyn</Link>.
          </p>
          <p>
            Historiska widgets för uppgifter, AI och statistik har arkiverats under <code>/legacy</code> och kan återintroduceras
            när motsvarande API-stöd finns.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
