"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"

export type MultiSelectOption = {
  label: string
  value: string
  count?: number
}

interface MultiSelectFilterProps {
  label: string
  placeholder?: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (values: string[]) => void
  align?: 'start' | 'center' | 'end'
}

export function MultiSelectFilter({
  label,
  placeholder = "Välj…",
  options,
  values,
  onChange,
  align = "start",
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!open) {
      setSearchTerm("")
    }
  }, [open])

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term.length) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, searchTerm])

  const activeLabels = useMemo(
    () => options.filter((option) => values.includes(option.value)).map((option) => option.label),
    [options, values]
  )

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const handleSelectAll = () => {
    onChange(Array.from(new Set(options.map((option) => option.value))))
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-72 p-0">
        <div className="border-b p-3">
          <div className="flex items-center justify-between gap-2">
            <DropdownMenuLabel className="p-0 text-sm font-medium">{label}</DropdownMenuLabel>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0 text-xs"
                onClick={handleSelectAll}
                disabled={options.length === 0}
              >
                Välj alla
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0 text-xs"
                onClick={handleClear}
                disabled={values.length === 0}
              >
                Rensa
              </Button>
            </div>
          </div>
          <Input
            placeholder={`Sök ${label.toLowerCase()}`}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="mt-2 h-8"
          />
        </div>
        <ScrollArea className="max-h-64">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Inga matchande alternativ</div>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={values.includes(option.value)}
                onCheckedChange={() => toggleValue(option.value)}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{option.count}</span>
                )}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </ScrollArea>
        {activeLabels.length > 0 && (
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Valda: {activeLabels.join(", ")}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
