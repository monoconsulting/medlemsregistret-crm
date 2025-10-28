"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Filter, Search, X } from "lucide-react"

import { MultiSelectOption } from "./multi-select-filter"

type SummaryFormatter = (selected: MultiSelectOption[], placeholder: string) => string

interface SearchableMultiSelectProps {
  label: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  align?: "start" | "center" | "end"
  summaryFormatter?: SummaryFormatter
}

export function SearchableMultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder = "Alla",
  searchPlaceholder = "Sök...",
  emptyLabel = "Inga alternativ",
  align = "start",
  summaryFormatter,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const optionMap = useMemo(() => new Map(options.map((option) => [option.value, option])), [options])
  const selectedOptions = useMemo(
    () => values.map((value) => optionMap.get(value)).filter((option): option is MultiSelectOption => Boolean(option)),
    [optionMap, values]
  )

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    const lowerSearch = searchTerm.trim().toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(lowerSearch))
  }, [options, searchTerm])

  const summaryText = useMemo(() => {
    if (summaryFormatter) {
      return summaryFormatter(selectedOptions, placeholder)
    }

    if (selectedOptions.length === 0) return placeholder
    if (selectedOptions.length === 1) return selectedOptions[0].label
    if (selectedOptions.length === 2) {
      return `${selectedOptions[0].label}, ${selectedOptions[1].label}`
    }
    return `${selectedOptions.length} valda`
  }, [selectedOptions, placeholder, summaryFormatter])

  const handleToggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const handleSelectAllFiltered = () => {
    const filteredValues = new Set(filteredOptions.map((option) => option.value))
    const next = new Set(values)
    filteredValues.forEach((value) => next.add(value))
    onChange(Array.from(next))
  }

  const handleClearFiltered = () => {
    if (!filteredOptions.length) return
    const filteredValues = new Set(filteredOptions.map((option) => option.value))
    onChange(values.filter((value) => !filteredValues.has(value)))
  }

  const handleClearAll = () => {
    onChange([])
    setSearchTerm("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2">
          <Filter className="h-4 w-4" />
          <span className="truncate">{label}</span>
          {values.length > 0 ? (
            <Badge variant="secondary" className="ml-auto rounded-sm px-2 py-0 text-xs">
              {values.length}
            </Badge>
          ) : (
            <span className="ml-auto text-xs text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="font-medium text-sm">{label}</div>
          <Button variant="ghost" size="sm" className="h-auto px-2 py-0 text-xs" onClick={handleClearAll}>
            Rensa alla
          </Button>
        </div>
        <div className="relative pb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Rensa sökfält</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between pb-2 text-xs">
          <Button variant="ghost" size="sm" className="h-auto px-2 py-0" onClick={handleSelectAllFiltered}>
            Välj alla
          </Button>
          <Button variant="ghost" size="sm" className="h-auto px-2 py-0" onClick={handleClearFiltered}>
            Rensa valda
          </Button>
        </div>
        <ScrollArea className="max-h-60 space-y-1 pr-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</div>
          ) : (
            filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={values.includes(option.value)}
                  onCheckedChange={() => handleToggleValue(option.value)}
                />
                <span className="flex-1 truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                )}
              </label>
            ))
          )}
        </ScrollArea>
        <div className="pt-3 text-xs text-muted-foreground">{summaryText}</div>
      </PopoverContent>
    </Popover>
  )
}
