"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Loader2,
  RefreshCcw,
  UserCog,
  Mail,
  Shield,
  Pencil,
  Trash2,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/trpc/client"
import { toast } from "@/hooks/use-toast"
import type { User, UserRole } from "@prisma/client"
import { CreateUserModal } from "@/components/modals/create-user-modal"
import { EditUserModal } from "@/components/modals/edit-user-modal"
import { DeleteUserDialog } from "@/components/modals/delete-user-dialog"

type UserWithStats = User & {
  _count: {
    associations: number
    createdGroups: number
    createdTasks: number
    assignedTasks: number
    notes: number
    activities: number
  }
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administratör",
  MANAGER: "Handläggare",
  USER: "Användare",
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-800 border-red-200",
  MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
  USER: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserWithStats | null>(null)

  const utils = api.useUtils()

  const queryInput = useMemo(() => {
    return {
      page,
      limit,
      search: searchTerm.trim() || undefined,
      role: roleFilter !== "ALL" ? roleFilter : undefined,
    }
  }, [page, limit, searchTerm, roleFilter])

  const usersQuery = api.users.list.useQuery(queryInput, {
    placeholderData: (previousData) => previousData,
  })

  const createUser = api.users.create.useMutation({
    onSuccess: () => {
      toast({ title: "Användare skapad" })
      setCreateModalOpen(false)
      utils.users.list.invalidate(queryInput)
    },
    onError: (error) => {
      toast({ title: "Kunde inte skapa användare", description: error.message, variant: "destructive" })
    },
  })

  const updateUser = api.users.update.useMutation({
    onSuccess: () => {
      toast({ title: "Användare uppdaterad" })
      setEditTarget(null)
      utils.users.list.invalidate(queryInput)
    },
    onError: (error) => {
      toast({ title: "Kunde inte uppdatera användare", description: error.message, variant: "destructive" })
    },
  })

  const deleteUser = api.users.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Användare borttagen" })
      setDeleteTarget(null)
      utils.users.list.invalidate(queryInput)
    },
    onError: (error) => {
      toast({ title: "Kunde inte ta bort användare", description: error.message, variant: "destructive" })
    },
  })

  const data = usersQuery.data
  const users = useMemo(() => (data?.users ?? []) as UserWithStats[], [data?.users])
  const totalPages = data?.pagination.totalPages ?? 1

  const handleCreateUser = async (values: {
    name: string
    email: string
    role: UserRole
    password?: string
  }) => {
    await createUser.mutateAsync(values)
  }

  const handleUpdateUser = async (values: {
    id: string
    name?: string
    email?: string
    role?: UserRole
    password?: string
  }) => {
    await updateUser.mutateAsync(values)
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    await deleteUser.mutateAsync({ id: deleteTarget.id })
  }

  const isLoading = usersQuery.isPending

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Användare</h1>
          <p className="text-muted-foreground">Hantera användare och behörigheter i systemet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => usersQuery.refetch()} disabled={usersQuery.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Uppdatera
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Ny användare
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök användare..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as UserRole | "ALL")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filtrera roll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alla roller</SelectItem>
                  <SelectItem value="ADMIN">Administratör</SelectItem>
                  <SelectItem value="MANAGER">Handläggare</SelectItem>
                  <SelectItem value="USER">Användare</SelectItem>
                </SelectContent>
              </Select>
              <Select value={limit.toString()} onValueChange={(value) => { setLimit(parseInt(value)); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Per sida" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per sida</SelectItem>
                  <SelectItem value="25">25 per sida</SelectItem>
                  <SelectItem value="50">50 per sida</SelectItem>
                  <SelectItem value="100">100 per sida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <CardTitle>Användarlista</CardTitle>
            <p className="text-sm text-muted-foreground">
              {usersQuery.data?.pagination.total ?? 0} resultat – sida {page} av {totalPages}
            </p>
          </div>
          {usersQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Laddar användare…
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <UserCog className="h-8 w-8" />
              <p>Inga användare matchade dina filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tilldelad</TableHead>
                    <TableHead>Grupper</TableHead>
                    <TableHead>Uppgifter</TableHead>
                    <TableHead>Anteckningar</TableHead>
                    <TableHead>Aktiviteter</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => {
                    const rowIndex = (page - 1) * limit + index + 1
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {rowIndex}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name ?? "User"}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <UserCog className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{user.name ?? "Namnlös"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.email ?? "Ingen e-post"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ROLE_COLORS[user.role]}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.emailVerified ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                              Verifierad
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Ej verifierad
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user._count.associations}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user._count.createdGroups}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {user._count.createdTasks + user._count.assignedTasks}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user._count.notes}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user._count.activities}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditTarget(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Föregående
            </Button>
            <span className="text-sm text-muted-foreground">
              Sida {page} av {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Nästa
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateUser}
        isSubmitting={createUser.isPending}
      />

      {editTarget && (
        <EditUserModal
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          user={editTarget}
          onSubmit={handleUpdateUser}
          isSubmitting={updateUser.isPending}
        />
      )}

      {deleteTarget && (
        <DeleteUserDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          user={deleteTarget}
          onConfirm={handleDeleteUser}
          isDeleting={deleteUser.isPending}
        />
      )}
    </div>
  )
}
