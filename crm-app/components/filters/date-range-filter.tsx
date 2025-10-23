'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarDays, X } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useMemo } from 'react'

export type DateRangeValue = {
  from?: Date
  to?: Date
}

interface DateRangeFilterProps {
  label?: string
  value: DateRangeValue | undefined
  onChange: (value: DateRangeValue | undefined) => void
}

export function DateRangeFilter({ label = 'Datumintervall', value, onChange }: DateRangeFilterProps) {
  const displayValue = useMemo(() => {
    if (!value?.from && !value?.to) return 'Alla datum'
    if (value?.from && value?.to) {
      return `${format(value.from, 'PP', { locale: sv })} – ${format(value.to, 'PP', { locale: sv })}`
    }
    if (value?.from) {
      return `Från ${format(value.from, 'PP', { locale: sv })}`
    }
    if (value?.to) {
      return `Till ${format(value.to, 'PP', { locale: sv })}`
    }
    return 'Alla datum'
  }, [value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2">
          <CalendarDays className="h-4 w-4" />
          <span className="truncate">{label}</span>
          <span className="ml-auto text-xs text-muted-foreground">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4" align="start">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          {value?.from || value?.to ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-0 text-xs"
              onClick={() => onChange(undefined)}
            >
              <X className="mr-1 h-3 w-3" /> Rensa
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Från och med</label>
            <input
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''}
              onChange={(event) => {
                const next = event.target.value ? new Date(event.target.value) : undefined
                onChange({
                  from: next,
                  to: value?.to,
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Till och med</label>
            <input
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''}
              onChange={(event) => {
                const next = event.target.value ? new Date(event.target.value) : undefined
                onChange({
                  from: value?.from,
                  to: next,
                })
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
