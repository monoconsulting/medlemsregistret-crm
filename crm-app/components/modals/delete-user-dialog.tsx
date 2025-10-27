"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import type { User } from "@prisma/client"

interface UserWithStats extends User {
  _count: {
    associations: number
    createdGroups: number
    createdTasks: number
    assignedTasks: number
    notes: number
    activities: number
  }
}

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserWithStats
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteUserDialog({ open, onOpenChange, user, onConfirm, isDeleting }: DeleteUserDialogProps) {
  const hasRelatedData =
    user._count.associations > 0 ||
    user._count.createdGroups > 0 ||
    user._count.createdTasks > 0 ||
    user._count.assignedTasks > 0 ||
    user._count.notes > 0 ||
    user._count.activities > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Ta bort användare
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Är du säker på att du vill ta bort användaren <strong>{user.name ?? user.email}</strong>?
              </p>

              {hasRelatedData && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                  <p className="mb-2 text-sm font-medium text-yellow-900">
                    Observera: Denna användare har relaterad data
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user._count.associations > 0 && (
                      <Badge variant="outline" className="bg-white">
                        {user._count.associations} tilldelade föreningar
                      </Badge>
                    )}
                    {user._count.createdGroups > 0 && (
                      <Badge variant="outline" className="bg-white">
                        {user._count.createdGroups} skapade grupper
                      </Badge>
                    )}
                    {user._count.createdTasks > 0 && (
                      <Badge variant="outline" className="bg-white">
                        {user._count.createdTasks} skapade uppgifter
                      </Badge>
                    )}
                    {user._count.assignedTasks > 0 && (
                      <Badge variant="outline" className="bg-white">
                        {user._count.assignedTasks} tilldelade uppgifter
                      </Badge>
                    )}
                    {user._count.notes > 0 && (
                      <Badge variant="outline" className="bg-white">
                        {user._count.notes} anteckningar
                      </Badge>
                    )}
                    {user._count.activities > 0 && (
                      <Badge variant="outline" className="bg-white">
                        {user._count.activities} aktiviteter
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-yellow-800">
                    Användaren kommer att arkiveras (soft delete) och deras data kommer att bevaras.
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Användaren kommer att markeras som borttagen och kan inte längre logga in i systemet.
                All historisk data bevaras i databasen.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault()
              await onConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ta bort användare
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
