"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { LatLngTuple } from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
import L from "leaflet"
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface MunicipalityMapProps {
  latitude: number
  longitude: number
  municipalityName: string
}

export default function MunicipalityMap({ latitude, longitude, municipalityName }: MunicipalityMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  const position: LatLngTuple = [latitude, longitude]

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(position, 6)
    }
  }, [latitude, longitude])

  return (
    <MapContainer
      center={position}
      zoom={6}
      className="h-full w-full"
      scrollWheelZoom={false}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          <strong>{municipalityName}</strong>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
