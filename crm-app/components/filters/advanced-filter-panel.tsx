'use client'

import { MultiSelectFilter, type MultiSelectOption } from './multi-select-filter'
import { DateRangeFilter, type DateRangeValue } from './date-range-filter'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChevronDown, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AdvancedFilterState = {
  statuses: string[]
  pipelines: string[]
  types: string[]
  activities: string[]
  categories: string[]
  tags: string[]
  assignedToId?: string
  hasEmail?: boolean
  hasPhone?: boolean
  isMember?: boolean
  dateRange?: DateRangeValue
  lastActivityDays?: number
  useSearchIndex?: boolean
}

interface AdvancedFilterPanelProps {
  state: AdvancedFilterState
  onChange: (patch: Partial<AdvancedFilterState>) => void
  options: {
    statuses: MultiSelectOption[]
    pipelines: MultiSelectOption[]
    types: MultiSelectOption[]
    activities: MultiSelectOption[]
    categories: MultiSelectOption[]
    tags: MultiSelectOption[]
    users: MultiSelectOption[]
    activityWindows: { label: string; value: number }[]
  }
}

export function AdvancedFilterPanel({ state, onChange, options }: AdvancedFilterPanelProps) {
  const toggleBoolean = (key: keyof AdvancedFilterState) => {
    onChange({ [key]: !state[key] } as Partial<AdvancedFilterState>)
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
          label="Aktiviteter"
          options={options.activities}
          values={state.activities}
          onChange={(values) => onChange({ activities: values })}
        />
        <MultiSelectFilter
          label="Kategorier"
          options={options.categories}
          values={state.categories}
          onChange={(values) => onChange({ categories: values })}
        />
        <MultiSelectFilter
          label="Taggar"
          options={options.tags}
          values={state.tags}
          onChange={(values) => onChange({ tags: values })}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              <Radio className="h-4 w-4" />
              <span>Ansvarig</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {options.users.find((user) => user.value === state.assignedToId)?.label ?? 'Alla'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuLabel>Ansvarig handläggare</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange({ assignedToId: undefined })}>
              Alla handläggare
            </DropdownMenuItem>
            {options.users.map((user) => (
              <DropdownMenuItem key={user.value} onClick={() => onChange({ assignedToId: user.value })}>
                {user.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <DateRangeFilter value={state.dateRange} onChange={(dateRange) => onChange({ dateRange })} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-start gap-2">
              <Radio className="h-4 w-4" />
              <span>Senaste aktivitet</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {state.lastActivityDays
                  ? options.activityWindows.find((option) => option.value === state.lastActivityDays)?.label ?? 'Anpassad'
                  : 'Alla'}
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
        <Button
          variant={state.hasEmail ? 'default' : 'outline'}
          className={cn('justify-start gap-2', state.hasEmail && 'bg-emerald-500 hover:bg-emerald-500/90')}
          onClick={() => toggleBoolean('hasEmail')}
        >
          E-post registrerad
        </Button>
        <Button
          variant={state.hasPhone ? 'default' : 'outline'}
          className={cn('justify-start gap-2', state.hasPhone && 'bg-blue-500 hover:bg-blue-500/90')}
          onClick={() => toggleBoolean('hasPhone')}
        >
          Telefon registrerad
        </Button>
        <Button
          variant={state.isMember ? 'default' : 'outline'}
          className={cn('justify-start gap-2', state.isMember && 'bg-amber-500 hover:bg-amber-500/90')}
          onClick={() => toggleBoolean('isMember')}
        >
          Endast medlemmar
        </Button>
        <Button
          variant={state.useSearchIndex ? 'default' : 'outline'}
          className={cn('justify-start gap-2', state.useSearchIndex && 'bg-purple-500 hover:bg-purple-500/90')}
          onClick={() => toggleBoolean('useSearchIndex')}
        >
          Meilisearch-index
        </Button>
      </div>
    </div>
  )
}
