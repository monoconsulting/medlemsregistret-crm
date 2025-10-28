'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Download, FolderPlus, Users, X } from 'lucide-react'

interface BulkActionsToolbarProps {
  selectedCount: number
  onClear: () => void
  onExport: (format: 'csv' | 'json' | 'xlsx') => void
  onAssignOwner: (ownerId: string | null) => void
  owners: { id: string; name: string }[]
  onAddToGroup?: () => void
}

export function BulkActionsToolbar({
  selectedCount,
  onClear,
  onExport,
  onAssignOwner,
  owners,
  onAddToGroup,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{selectedCount} valda objekt</span>
        <Button variant="link" size="sm" className="text-destructive" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Rensa
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onAddToGroup && (
          <Button variant="default" size="sm" className="gap-2" onClick={onAddToGroup}>
            <FolderPlus className="h-4 w-4" /> Lägg till i grupp
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Exportera
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Välj format</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onExport('csv')}>CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('json')}>JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('xlsx')}>Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="h-4 w-4" /> Tilldela ansvarig
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Handläggare</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAssignOwner(null)}>Ta bort ansvarig</DropdownMenuItem>
            {owners.map((owner) => (
              <DropdownMenuItem key={owner.id} onClick={() => onAssignOwner(owner.id)}>
                {owner.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
