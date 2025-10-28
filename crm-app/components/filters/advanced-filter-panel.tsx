"use client"

import { MultiSelectFilter, type MultiSelectOption } from "./multi-select-filter"

export type AdvancedFilterState = {
  statuses: string[]
  pipelines: string[]
  types: string[]
  tags: string[]
}

interface AdvancedFilterPanelProps {
  state: AdvancedFilterState
  onChange: (patch: Partial<AdvancedFilterState>) => void
  options: {
    statuses: MultiSelectOption[]
    pipelines: MultiSelectOption[]
    types: MultiSelectOption[]
    tags: MultiSelectOption[]
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
    </div>
  )
}
