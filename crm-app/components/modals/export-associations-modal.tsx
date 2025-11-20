"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Download } from "lucide-react"

export interface ExportColumn {
  key: string
  label: string
  enabled: boolean
}

interface ExportAssociationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAssociationIds: string[]
  onExport: (selectedColumns: string[]) => Promise<void>
}

const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: "municipality_name", label: "Kommun", enabled: true },
  { key: "name", label: "Förening", enabled: true },
  { key: "org_number", label: "Organisationsnummer", enabled: true },
  { key: "crm_status", label: "Status", enabled: true },
  { key: "pipeline", label: "Pipeline", enabled: true },
  { key: "email", label: "E-post", enabled: true },
  { key: "phone", label: "Telefon", enabled: true },
  { key: "type", label: "Föreningstyp", enabled: true },
  { key: "street_address", label: "Gatuadress", enabled: true },
  { key: "postal_code", label: "Postnummer", enabled: true },
  { key: "city", label: "Ort", enabled: true },
  { key: "website", label: "Webbplats", enabled: true },
  { key: "tags", label: "Taggar", enabled: true },
  { key: "member_since", label: "Medlem sedan", enabled: true },
  { key: "updated_at", label: "Uppdaterad", enabled: true },
  { key: "created_at", label: "Skapad", enabled: true },
]

export function ExportAssociationsModal({
  open,
  onOpenChange,
  selectedAssociationIds,
  onExport,
}: ExportAssociationsModalProps) {
  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS)
  const [exporting, setExporting] = useState(false)

  const handleToggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, enabled: !col.enabled } : col))
    )
  }

  const handleToggleAll = () => {
    const allEnabled = columns.every((col) => col.enabled)
    setColumns((prev) => prev.map((col) => ({ ...col, enabled: !allEnabled })))
  }

  const handleExport = async () => {
    const selectedColumns = columns.filter((col) => col.enabled).map((col) => col.key)

    if (selectedColumns.length === 0) {
      return
    }

    setExporting(true)
    try {
      await onExport(selectedColumns)
      onOpenChange(false)
      // Reset columns to default
      setColumns(DEFAULT_COLUMNS)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setExporting(false)
    }
  }

  const allEnabled = columns.every((col) => col.enabled)
  const enabledCount = columns.filter((col) => col.enabled).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportera föreningar</DialogTitle>
          <DialogDescription>
            Välj vilka kolumner som ska inkluderas i exporten. {selectedAssociationIds.length}{" "}
            {selectedAssociationIds.length === 1 ? "förening" : "föreningar"} kommer att exporteras.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="toggle-all"
                checked={allEnabled}
                onCheckedChange={handleToggleAll}
              />
              <label
                htmlFor="toggle-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Välj alla kolumner
              </label>
            </div>
            <span className="text-sm text-muted-foreground">
              {enabledCount} av {columns.length} valda
            </span>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={column.enabled}
                    onCheckedChange={() => handleToggleColumn(column.key)}
                  />
                  <label
                    htmlFor={column.key}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Avbryt
          </Button>
          <Button onClick={handleExport} disabled={exporting || enabledCount === 0}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporterar...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportera ({enabledCount} kolumner)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
