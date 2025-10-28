"use client"

import { MultiSelectFilter, type MultiSelectOption } from "./multi-select-filter"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Radio } from "lucide-react"

export type AdvancedFilterState = {
  statuses: string[]
  pipelines: string[]
  types: string[]
  tags: string[]
  lastActivityDays?: number
}

interface AdvancedFilterPanelProps {
  state: AdvancedFilterState
  onChange: (patch: Partial<AdvancedFilterState>) => void
  options: {
    statuses: MultiSelectOption[]
    pipelines: MultiSelectOption[]
    types: MultiSelectOption[]
    tags: MultiSelectOption[]
    activityWindows: { label: string; value: number }[]
  }
}

export function AdvancedFilterPanel({ state, onChange, options }: AdvancedFilterPanelProps) {
  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MultiSelectFilter
          label="Status"
          options={options.statuses}
          values={state.statuses}
          onChange={(values) => onChange({ statuses: values })}
        />
        <MultiSelectFilter
          label="Pipeline"
          options={options.pipelines}
          values={state.pipelines}
          onChange={(values) => onChange({ pipelines: values })}
        />
        <MultiSelectFilter
          label="Föreningstyper"
          options={options.types}
          values={state.types}
          onChange={(values) => onChange({ types: values })}
        />
        <MultiSelectFilter
          label="Taggar"
          options={options.tags}
          values={state.tags}
          onChange={(values) => onChange({ tags: values })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:max-w-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              <Radio className="h-4 w-4" />
              <span>Senaste aktivitet</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {state.lastActivityDays
                  ? options.activityWindows.find((option) => option.value === state.lastActivityDays)?.label ?? "Anpassad"
                  : "Alla"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Aktivitetsfönster</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange({ lastActivityDays: undefined })}>Alla</DropdownMenuItem>
            {options.activityWindows.map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => onChange({ lastActivityDays: option.value })}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
