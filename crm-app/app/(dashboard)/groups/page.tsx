import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GroupsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grupperingar</h1>
        <p className="text-muted-foreground">
          Dynamiska grupperingar av föreningar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mina grupperingar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Grupperingar kommer här</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
