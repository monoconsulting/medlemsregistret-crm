'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, LayoutList, Map } from 'lucide-react'

type ViewMode = 'table' | 'card' | 'map'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <Tabs value={value} onValueChange={(val) => onChange(val as ViewMode)} className="w-full md:w-auto">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="table" className="gap-2">
          <LayoutList className="h-4 w-4" />
          Tabell
        </TabsTrigger>
        <TabsTrigger value="card" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          Kort
        </TabsTrigger>
        <TabsTrigger value="map" className="gap-2">
          <Map className="h-4 w-4" />
          Karta
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export type { ViewMode }
