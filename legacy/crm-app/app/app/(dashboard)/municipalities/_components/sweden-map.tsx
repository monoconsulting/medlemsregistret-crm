"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

type MunicipalityStat = {
  name: string
  count: number
}

const SWEDEN_PATH =
  "M55 5C40 12 28 24 20 42c-6 16-10 32-8 46 2 16 11 32 22 45 9 11 20 21 24 34 3 10 1 22-2 34-3 12-6 24-4 34 2 10 10 18 21 23 11 4 26 6 38 4 14-3 26-10 34-20 9-10 15-22 18-36 3-15 3-33-1-47-3-14-9-24-15-34-6-9-12-18-15-28-3-12-1-26 0-38 1-11 1-22-3-32-4-12-14-22-26-31-12-8-27-14-40-20Z"

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const getCoordinate = (name: string) => {
  const hash = hashString(name)
  const latitude = 55 + (hash % 1400) / 100 // 55 - 69
  const longitude = 11 + ((Math.floor(hash / 1400) % 1300) / 100) // 11 - 24

  const x = ((longitude - 11) / (24 - 11)) * 60 + 20
  const y = ((69 - latitude) / (69 - 55)) * 120 + 10

  return { x, y }
}

const maxCount = (data: MunicipalityStat[]) => Math.max(...data.map((item) => item.count), 1)

export function SwedenMap({ data }: { data: MunicipalityStat[] }) {
  const router = useRouter()
  const max = useMemo(() => maxCount(data), [data])

  const points = useMemo(() => {
    return data.map((item) => ({
      ...item,
      coordinate: getCoordinate(item.name),
      intensity: item.count / max,
    }))
  }, [data, max])

  return (
    <svg viewBox="0 0 100 160" className="h-full w-full">
      <defs>
        <radialGradient id="heat">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={SWEDEN_PATH} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      {points.map((point) => (
        <g key={point.name} transform={`translate(${point.coordinate.x}, ${point.coordinate.y})`}>
          <circle
            r={Math.max(2, 6 * point.intensity)}
            fill="url(#heat)"
            onClick={() => router.push(`/associations?municipality=${encodeURIComponent(point.name)}`)}
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            <title>
              {point.name}: {point.count} förening{point.count === 1 ? "" : "ar"}
            </title>
          </circle>
        </g>
      ))}
    </svg>
  )
}
