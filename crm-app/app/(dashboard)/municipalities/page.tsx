import { Card, CardContent } from "@/components/ui/card"

export default function MunicipalitiesPage() {
  return (
    <div className="h-full">
      <div className="flex h-full">
        {/* Map area (50%) */}
        <div className="w-1/2 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Sverigekarta</h2>
            <p className="text-muted-foreground">
              Karta över kommuner kommer här
            </p>
          </div>
        </div>

        {/* List area (50%) */}
        <div className="w-1/2 bg-white overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Kommunöversikt</h1>
            <div className="space-y-4">
              {["Sollentuna", "Stockholm", "Göteborg", "Malmö", "Uppsala"].map((municipality) => (
                <Card key={municipality} className="hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{municipality}</h3>
                    <p className="text-sm text-muted-foreground">
                      Klicka för att se föreningar
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
