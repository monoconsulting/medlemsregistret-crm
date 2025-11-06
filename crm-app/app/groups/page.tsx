"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GroupsPage() {
  return (
    <AppLayout title="Grupperingar" description="Skapa och hantera föreningsgrupper (kommer snart)">
      <Card>
        <CardHeader>
          <CardTitle>Funktion under utveckling</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Vi arbetar med att flytta över grupperingshanteringen till den nya plattformen.
        </CardContent>
      </Card>
    </AppLayout>
  )
}
