"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactsPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kontakter (legacy)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Kontaktmodulen ingick i den tidigare Node/tRPC-implementationen och har placerats i <code>/legacy</code>. Den nya
            PHP-backenden levererar i nuläget endast föreningar, taggar och anteckningar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
