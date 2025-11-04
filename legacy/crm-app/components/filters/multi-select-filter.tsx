"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  align?: "start" | "center" | "end"
}

export function MultiSelectFilter({
  label,
  placeholder = "Välj…",
  options,
  values,
  onChange,
  align = "start",
}: MultiSelectFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options
    }
    const term = searchTerm.trim().toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, searchTerm])

  const activeLabels = options.filter((option) => values.includes(option.value)).map((option) => option.label)
  const allSelected = values.length > 0 && values.length === options.length

  return (
    <DropdownMenu>
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
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-1">
            {options.length > 0 && !allSelected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0 text-xs"
                onClick={() => onChange(options.map((option) => option.value))}
              >
                Markera alla
              </Button>
            )}
            {values.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0 text-xs"
                onClick={() => onChange([])}
              >
                Rensa
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <div className="px-3 py-2">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={`Sök ${label.toLowerCase()}...`}
            className="h-8"
          />
        </div>
        <Separator />
        <ScrollArea className="max-h-60">
          <div className="py-1">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Inga alternativ tillgängliga</p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Inga träffar</p>
            ) : (
              filteredOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={values.includes(option.value)}
                  onCheckedChange={() => toggleValue(option.value)}
                  className="flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5"
                >
                  <span className="truncate text-sm">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-muted-foreground">{option.count}</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </ScrollArea>
        {activeLabels.length > 0 && (
          <div className={cn("border-t px-3 py-2 text-xs text-muted-foreground")}>Valda: {activeLabels.join(", ")}</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
