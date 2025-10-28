"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredOptions = useMemo(() => {
    if (!normalizedSearch.length) return options
    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch))
  }, [normalizedSearch, options])

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const activeLabels = options.filter((option) => values.includes(option.value)).map((option) => option.label)

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setSearchTerm("")
        }
      }}
    >
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
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel className="flex flex-wrap items-center justify-between gap-2">
          <span>{label}</span>
          <div className="flex items-center gap-1">
            {options.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0 text-xs"
                onClick={() => onChange(options.map((option) => option.value))}
              >
                Välj alla
              </Button>
            )}
            {values.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-0 text-xs"
                onClick={() => onChange([])}
              >
                Rensa
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 pb-2">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Sök..."
            className="h-9"
          />
        </div>
        <ScrollArea className="max-h-64">
          {filteredOptions.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground">
              Inga alternativ tillgängliga
            </DropdownMenuItem>
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
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className={cn("text-xs text-muted-foreground")}>
              Valda: {activeLabels.join(", ")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
