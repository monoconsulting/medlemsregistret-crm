"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactsPage() {
  return (
    <AppLayout title="Kontakter" description="Hantera föreningskontakter (kommer snart)">
      <Card>
        <CardHeader>
          <CardTitle>Arbete pågår</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Funktionalitet för kontaktregister planeras och kommer att aktiveras här.
        </CardContent>
      </Card>
    </AppLayout>
  )
}
