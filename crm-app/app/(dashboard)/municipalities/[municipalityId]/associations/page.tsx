"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ArrowLeft, Building2, Mail, Phone, MapPin, ExternalLink } from "lucide-react"

interface Municipality {
  id: string
  name: string
  county: string | null
  platform: string | null
}

interface Association {
  id: string
  name: string
  orgNumber: string | null
  email: string | null
  phone: string | null
  streetAddress: string | null
  postalCode: string | null
  city: string | null
  homepageUrl: string | null
  types: string[]
  activities: string[]
  crmStatus: string
  pipeline: string
  isDeleted: boolean
}

export default function MunicipalityAssociationsPage() {
  const params = useParams()
  const router = useRouter()
  const municipalityId = params.municipalityId as string

  const [municipality, setMunicipality] = useState<Municipality | null>(null)
  const [associations, setAssociations] = useState<Association[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch municipality details
        const munResponse = await fetch(`/api/municipalities/${municipalityId}`)
        if (munResponse.ok) {
          const munData = await munResponse.json()
          setMunicipality(munData)
        }

        // Fetch associations for this municipality
        const assocResponse = await fetch(`/api/municipalities/${municipalityId}/associations`)
        if (assocResponse.ok) {
          const assocData = await assocResponse.json()
          setAssociations(assocData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [municipalityId])

  const filteredAssociations = useMemo(() => {
    return associations.filter(a =>
      !a.isDeleted && (
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.orgNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.types.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.activities.some(act => act.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
  }, [associations, searchQuery])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Laddar föreningar...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/municipalities')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till kommunöversikt
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{municipality?.name || 'Kommun'}</h1>
            <p className="text-muted-foreground">
              {municipality?.county && `${municipality.county} • `}
              {filteredAssociations.length} föreningar
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök föreningar, org.nr, aktiviteter, kontaktuppgifter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Associations Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredAssociations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga föreningar hittades</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Prova att söka med andra sökord"
                : "Det finns inga importerade föreningar för denna kommun än."}
            </p>
            {!searchQuery && (
              <Link href="/import" className="mt-4">
                <Button>
                  Importera föreningar
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssociations.map((association) => (
              <Card key={association.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between">
                    <span className="flex-1">{association.name}</span>
                    {association.homepageUrl && (
                      <a
                        href={association.homepageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </CardTitle>
                  {association.orgNumber && (
                    <p className="text-sm text-muted-foreground">
                      Org.nr: {association.orgNumber}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Types */}
                  {association.types.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Typ
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {association.types.slice(0, 3).map((type, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                          >
                            {type}
                          </span>
                        ))}
                        {association.types.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            +{association.types.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {association.activities.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Aktiviteter
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {association.activities.slice(0, 2).map((activity, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded"
                          >
                            {activity}
                          </span>
                        ))}
                        {association.activities.length > 2 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            +{association.activities.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 pt-2 border-t">
                    {association.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${association.email}`}
                          className="text-primary hover:underline truncate"
                        >
                          {association.email}
                        </a>
                      </div>
                    )}
                    {association.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <a
                          href={`tel:${association.phone}`}
                          className="text-primary hover:underline"
                        >
                          {association.phone}
                        </a>
                      </div>
                    )}
                    {(association.streetAddress || association.city) && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="text-muted-foreground">
                          {association.streetAddress && <div>{association.streetAddress}</div>}
                          {(association.postalCode || association.city) && (
                            <div>
                              {association.postalCode} {association.city}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRM Status */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className={`text-xs px-2 py-1 rounded ${
                      association.crmStatus === 'MEMBER'
                        ? 'bg-green-100 text-green-700'
                        : association.crmStatus === 'CONTACTED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {association.crmStatus}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {association.pipeline}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
