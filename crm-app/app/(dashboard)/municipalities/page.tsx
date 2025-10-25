"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Search, Loader2, MapPin, ExternalLink, Save, Edit } from "lucide-react"

import { api } from "@/lib/trpc/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import type { Municipality } from "@prisma/client"

const MunicipalityMap = dynamic(() => import("@/components/MunicipalityMap"), {
  ssr: false,
})

type MunicipalityWithCount = Municipality & {
  _count: { associations: number }
}

export default function MunicipalitiesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityWithCount | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPopulation, setEditedPopulation] = useState<string>("")
  const [editedRegisterUrl, setEditedRegisterUrl] = useState("")

  const utils = api.useUtils()

  // Fetch all municipalities
  const municipalitiesQuery = api.municipality.list.useQuery({
    search: searchTerm.trim() || undefined,
    limit: 290,
  })

  // Update municipality mutation
  const updateMunicipality = api.municipality.update.useMutation({
    onSuccess: () => {
      toast({ title: "Kommun uppdaterad" })
      setIsEditing(false)
      municipalitiesQuery.refetch()
      if (selectedMunicipality) {
        setSelectedMunicipality(prev => ({
          ...prev!,
          population: editedPopulation ? parseInt(editedPopulation) : prev!.population,
          registerUrl: editedRegisterUrl || prev!.registerUrl,
        }))
      }
    },
    onError: (error) => toast({ title: "Kunde inte uppdatera kommun", description: error.message, variant: "destructive" }),
  })

  const municipalities = municipalitiesQuery.data ?? []

  const handleSelectMunicipality = (municipality: MunicipalityWithCount) => {
    setSelectedMunicipality(municipality)
    setIsEditing(false)
    setEditedPopulation(municipality.population?.toString() ?? "")
    setEditedRegisterUrl(municipality.registerUrl ?? "")
  }

  const handleSave = async () => {
    if (!selectedMunicipality) return

    await updateMunicipality.mutateAsync({
      id: selectedMunicipality.id,
      data: {
        population: editedPopulation ? parseInt(editedPopulation) : undefined,
        registerUrl: editedRegisterUrl || undefined,
      },
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (selectedMunicipality) {
      setEditedPopulation(selectedMunicipality.population?.toString() ?? "")
      setEditedRegisterUrl(selectedMunicipality.registerUrl ?? "")
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-6">
      {/* Left column: Table (80%) */}
      <div className="flex w-[80%] flex-col">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kommunöversikt</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök kommun..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {municipalitiesQuery.isPending ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Laddar...
              </div>
            ) : municipalities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                <p>Inga kommuner hittades</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kommun</TableHead>
                    <TableHead>Kommunkod</TableHead>
                    <TableHead>Län</TableHead>
                    <TableHead>Länskod</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Landskap</TableHead>
                    <TableHead>Importstatus</TableHead>
                    <TableHead>Befolkning</TableHead>
                    <TableHead>Hemsida</TableHead>
                    <TableHead>Plattform</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {municipalities.map((municipality) => (
                    <TableRow
                      key={municipality.id}
                      className={`cursor-pointer ${
                        selectedMunicipality?.id === municipality.id
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectMunicipality(municipality)}
                    >
                      <TableCell className="font-medium">{municipality.name}</TableCell>
                      <TableCell>{municipality.code ?? "-"}</TableCell>
                      <TableCell>{municipality.county ?? "-"}</TableCell>
                      <TableCell>{municipality.countyCode ?? "-"}</TableCell>
                      <TableCell>{municipality.region ?? "-"}</TableCell>
                      <TableCell>{municipality.province ?? "-"}</TableCell>
                      <TableCell>
                        {municipality.registerStatus ? (
                          <Badge variant="secondary">{municipality.registerStatus}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {municipality.population?.toLocaleString("sv-SE") ?? "-"}
                      </TableCell>
                      <TableCell>
                        {municipality.homepage ? (
                          <a
                            href={municipality.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Länk <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {municipality.platform ? (
                          <Badge variant="outline">{municipality.platform}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column: Details (20%) */}
      <div className="flex w-[20%] flex-col gap-4">
        {!selectedMunicipality ? (
          <Card className="flex h-full items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <MapPin className="mx-auto mb-2 h-12 w-12" />
              <p>Välj en kommun från tabellen</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Editable Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedMunicipality.name}</CardTitle>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="population">Befolkning</Label>
                  {isEditing ? (
                    <Input
                      id="population"
                      type="number"
                      value={editedPopulation}
                      onChange={(e) => setEditedPopulation(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm">
                      {selectedMunicipality.population?.toLocaleString("sv-SE") ?? "Saknas"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerUrl">Kommunens föreningsregister</Label>
                  {isEditing ? (
                    <Input
                      id="registerUrl"
                      type="url"
                      value={editedRegisterUrl}
                      onChange={(e) => setEditedRegisterUrl(e.target.value)}
                    />
                  ) : (
                    <div>
                      {selectedMunicipality.registerUrl ? (
                        <a
                          href={selectedMunicipality.registerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          Länk till register <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">Saknas</p>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      disabled={updateMunicipality.isPending}
                    >
                      {updateMunicipality.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Spara
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline">
                      Avbryt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Karta</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {selectedMunicipality.latitude && selectedMunicipality.longitude ? (
                  <MunicipalityMap
                    key={selectedMunicipality.id}
                    latitude={selectedMunicipality.latitude}
                    longitude={selectedMunicipality.longitude}
                    municipalityName={selectedMunicipality.name}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md bg-muted">
                    <div className="text-center text-sm text-muted-foreground">
                      <MapPin className="mx-auto mb-2 h-8 w-8" />
                      <p>Ingen position tillgänglig</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
