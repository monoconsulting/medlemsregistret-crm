import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kontakter</h1>
        <p className="text-muted-foreground">
          Alla kontaktpersoner från föreningarna
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontaktlista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Kontaktlista kommer här</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
