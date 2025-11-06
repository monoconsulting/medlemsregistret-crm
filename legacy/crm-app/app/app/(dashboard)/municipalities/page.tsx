"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Search, Loader2, MapPin, ExternalLink, Save, Edit, Users2, ChevronUp, ChevronDown } from "lucide-react"

import { api } from "@/lib/trpc/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

const MunicipalityMap = dynamic(() => import("@/components/MunicipalityMap"), { ssr: false })

type MunicipalityWithCount = Municipality & {
  _count: { associations: number }
}

const formatCountyCode = (code?: string | null) => {
  if (!code) return "-"
  const trimmed = `${code}`.trim()
  return trimmed.padStart(2, "0")
}

const formatMunicipalityCode = (code?: string | null) => {
  if (!code) return "-"
  const trimmed = `${code}`.trim()
  return trimmed.padStart(4, "0")
}

export default function MunicipalitiesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMunicipality, setSelectedMunicipality] = useState<MunicipalityWithCount | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPopulation, setEditedPopulation] = useState<string>("")
  const [editedRegisterUrl, setEditedRegisterUrl] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const utils = api.useUtils()

  // Fetch all municipalities
  const municipalitiesQuery = api.municipality.list.useQuery({
    search: searchTerm.trim() || undefined,
    limit: 290,
    sortBy: sortBy as any,
    sortOrder,
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

  const municipalities = useMemo(() => {
    return (municipalitiesQuery.data ?? []).map((municipality) => ({
      ...municipality,
      code: municipality.code ? formatMunicipalityCode(municipality.code) : municipality.code,
      countyCode: municipality.countyCode ? formatCountyCode(municipality.countyCode) : municipality.countyCode,
    }))
  }, [municipalitiesQuery.data])

  const handleSelectMunicipality = (municipality: MunicipalityWithCount) => {
    setSelectedMunicipality(municipality)
    setIsEditing(false)
    setEditedPopulation(municipality.population?.toString() ?? "")
    setEditedRegisterUrl(municipality.registerUrl ?? "")
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleCreateGroup = () => {
    if (selectedIds.size === 0) {
      toast({ title: "Inga kommuner valda", description: "Välj minst en kommun för att skapa en grupp.", variant: "destructive" })
      return
    }
    toast({ title: "Grupp skapad", description: `Grupp skapad med ${selectedIds.size} kommuner.` })
    // TODO: Implement actual group creation
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
    <div className="flex flex-col gap-4 p-6 lg:h-[calc(100vh-4rem)] lg:flex-row">
      {/* Left column: Table (80%) */}
      <div className="flex flex-1 flex-col lg:basis-[80%]">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kommunöversikt</CardTitle>
              <div className="flex items-center gap-4">
                {selectedIds.size > 0 && (
                  <Button onClick={handleCreateGroup} variant="outline">
                    Skapa grupp ({selectedIds.size})
                  </Button>
                )}
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
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === municipalities.length && municipalities.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(municipalities.map(m => m.id)))
                          } else {
                            setSelectedIds(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("name")}>
                        Kommun
                        {sortBy === "name" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Kommunkod</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("county")}>
                        Län
                        {sortBy === "county" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Länskod</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("region")}>
                        Region
                        {sortBy === "region" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("province")}>
                        Landskap
                        {sortBy === "province" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Importstatus</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("population")}>
                        Befolkning
                        {sortBy === "population" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("associations")}>
                        Föreningar
                        {sortBy === "associations" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Hemsida</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 font-medium" onClick={() => handleSort("platform")}>
                        Plattform
                        {sortBy === "platform" && (
                          sortOrder === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
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
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(municipality.id)}
                          onCheckedChange={(checked) => handleSelect(municipality.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="space-y-1">
                        <button
                          type="button"
                          className="block w-full text-left font-medium text-blue-600 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectMunicipality(municipality)
                          }}
                        >
                          {municipality.name}
                        </button>
                        <Link
                          href={{
                            pathname: "/associations",
                            query: {
                              municipalityId: municipality.id,
                              municipality: municipality.name,
                            },
                          }}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visa föreningar
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
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
                        {municipality._count.associations.toLocaleString("sv-SE")}
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
      <div className="flex flex-col gap-4 lg:basis-[20%]">
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

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Kommunkod</p>
                    <p className="font-medium">{selectedMunicipality.code ? formatMunicipalityCode(selectedMunicipality.code) : "Saknas"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Länskod</p>
                    <p className="font-medium">{selectedMunicipality.countyCode ? formatCountyCode(selectedMunicipality.countyCode) : "Saknas"}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Antal föreningar</p>
                      <p className="font-medium">{selectedMunicipality._count.associations.toLocaleString("sv-SE")}</p>
                    </div>
                  </div>
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
              <CardContent className="h-full">
                {selectedMunicipality.latitude && selectedMunicipality.longitude ? (
                  <div className="h-72 overflow-hidden rounded-md border lg:h-full">
                    <MunicipalityMap
                      latitude={selectedMunicipality.latitude}
                      longitude={selectedMunicipality.longitude}
                      municipalityName={selectedMunicipality.name}
                    />
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground lg:h-full">
                    Ingen position tillgänglig
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
