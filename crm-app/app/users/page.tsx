"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AppLayout } from "@/components/layout/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { api, type AuthRole, type ManagedUser } from "@/lib/api"
import { useAuth } from "@/lib/providers/auth-provider"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  ArchiveRestore,
  Loader2,
  LogIn,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Undo2,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react"

const roleOptions: Array<{ value: AuthRole; label: string; description: string }> = [
  { value: "ADMIN", label: "Administratör", description: "Full åtkomst och systemhantering." },
  { value: "MANAGER", label: "Ansvarig", description: "Kan arbeta i CRM men inte hantera användare." },
  { value: "USER", label: "Användare", description: "Kan se och uppdatera sina tilldelade poster." },
]

const passwordSchema = z
  .string()
  .trim()
  .min(8, { message: "Minst 8 tecken" })
  .or(z.literal(""))
  .optional()

const userFormSchema = z.object({
  name: z
    .string()
    .max(160, { message: "Max 160 tecken" })
    .optional(),
  email: z.string().trim().email({ message: "Ogiltig e-post" }),
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
  password: passwordSchema,
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  initialUser: ManagedUser | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues, mode: "create" | "edit") => Promise<void>
  isSubmitting: boolean
}

export default function UsersPage() {
  const { session, status, refresh } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userPendingDeletion, setUserPendingDeletion] = useState<ManagedUser | null>(null)
  const [rowActionUserId, setRowActionUserId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const currentRole = session?.user.role ?? "USER"
  const isAdmin = currentRole === "ADMIN"
  const authLoading = status === "loading"

  const debouncedSearch = useDebouncedValue(search, 400)

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((user) => !user.isDeleted).length
    const admins = users.filter((user) => !user.isDeleted && normalizeAuthRole(user.role) === "ADMIN").length
    const deleted = users.filter((user) => user.isDeleted).length
    return { total, active, admins, deleted }
  }, [users])

  const summaryCards = useMemo<
    Array<{ key: string; label: string; value: number; subtext: string; icon: LucideIcon }>
  >(
    () => [
      {
        key: "active",
        label: "Aktiva användare",
        value: stats.active,
        subtext: "Kan logga in och arbeta i CRM",
        icon: Users,
      },
      {
        key: "admins",
        label: "Administratörer",
        value: stats.admins,
        subtext: "Full åtkomst & roller",
        icon: UserCheck,
      },
      {
        key: "deleted",
        label: "Raderade konton",
        value: stats.deleted,
        subtext: "Tillgängliga för återställning",
        icon: ArchiveRestore,
      },
    ],
    [stats.admins, stats.active, stats.deleted],
  )

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
      try {
        const items = await api.getUsers({
          q: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
          includeDeleted: showDeleted,
        })
        setUsers(items)
        setLoadError(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Kunde inte hämta användare"
        if (message.toLowerCase().includes("auth")) {
          setLoadError("auth")
          await refresh()
          toast({
            title: "Sessionen saknas",
            description: "Logga in igen för att se användarna.",
            variant: "destructive",
          })
        } else {
          setLoadError(message)
          toast({ title: "Fel vid inläsning", description: message, variant: "destructive" })
        }
      } finally {
      setLoading(false)
    }
  }, [debouncedSearch, showDeleted, isAdmin, toast, refresh])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setSelectedIds((prev) => {
      if (!prev.size) return prev
      const available = new Set(users.map((user) => user.id))
      const next = new Set<string>()
      prev.forEach((id) => {
        if (available.has(id)) {
          next.add(id)
        }
      })
      return next
    })
  }, [users])

  const allVisibleSelected = useMemo(() => {
    if (!users.length) return false
    const selectable = users.map((user) => user.id)
    return selectable.every((id) => selectedIds.has(id))
  }, [users, selectedIds])

  const handleToggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(users.map((user) => user.id)))
  }

  const handleToggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormMode("create")
    setFormOpen(true)
  }

  const openEditDialog = (user: ManagedUser) => {
    setEditingUser(user)
    setFormMode("edit")
    setFormOpen(true)
  }

  const handleSubmitForm = async (values: UserFormValues, mode: "create" | "edit") => {
    setFormSubmitting(true)
    const payload = {
      ...values,
      name: values.name && values.name.trim().length ? values.name.trim() : undefined,
      password: values.password && values.password.trim().length ? values.password.trim() : undefined,
    }

    try {
      if (mode === "create") {
        if (!payload.password) {
          throw new Error("Lösenord krävs för nya användare")
        }
        await api.createUser({
          name: payload.name ?? null,
          email: values.email,
          role: values.role,
          password: payload.password,
        })
        toast({ title: "Användare skapad", description: `${values.email} har lagts till.` })
      } else {
        if (!editingUser) {
          throw new Error("Ingen användare vald för redigering")
        }
        const updatePayload: { id: string; name?: string | null; email?: string; role?: AuthRole; password?: string } = {
          id: editingUser.id,
        }
        if (payload.name !== undefined) updatePayload.name = payload.name ?? null
        if (values.email) updatePayload.email = values.email
        if (values.role) updatePayload.role = values.role
        if (payload.password) updatePayload.password = payload.password
        await api.updateUser(updatePayload)
        toast({ title: "Användare uppdaterad", description: `${values.email} har sparats.` })
      }
      setFormOpen(false)
      setEditingUser(null)
      await fetchUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Åtgärden misslyckades"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setFormSubmitting(false)
    }
  }

  const requestDeleteUser = (user: ManagedUser) => {
    setUserPendingDeletion(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userPendingDeletion) return
    setRowActionUserId(userPendingDeletion.id)
    try {
      if (session?.user.id === userPendingDeletion.id) {
        throw new Error("Du kan inte radera din egen användare")
      }
      await api.deleteUser(userPendingDeletion.id)
      toast({
        title: "Användare raderad",
        description: `${userPendingDeletion.email ?? "Användaren"} är nu inaktiverad.`,
      })
      await fetchUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte radera användaren"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setRowActionUserId(null)
      setDeleteDialogOpen(false)
      setUserPendingDeletion(null)
    }
  }

  const handleRestore = async (user: ManagedUser) => {
    setRowActionUserId(user.id)
    try {
      await api.restoreUser(user.id)
      toast({ title: "Användare återställd", description: `${user.email ?? "Användaren"} är aktiv igen.` })
      await fetchUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunde inte återställa användaren"
      toast({ title: "Misslyckades", description: message, variant: "destructive" })
    } finally {
      setRowActionUserId(null)
    }
  }

  if (authLoading) {
    return (
      <AppLayout title="Användare" description="Administrera åtkomst och roller">
        <Card>
          <CardHeader>
            <CardTitle>Laddar</CardTitle>
            <CardDescription>Hämtar behörigheter...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Kontrollerar åtkomst
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (!isAdmin) {
    return (
      <AppLayout title="Användare" description="Administrera åtkomst och roller">
        <Card>
          <CardHeader>
            <CardTitle>Åtkomst nekad</CardTitle>
            <CardDescription>Endast administratörer kan hantera användare.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Kontakta en administratör om du behöver uppdatera behörigheter eller bjuda in nya användare.
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="Användarhantering"
      description="Administrera roller, konton och åtkomst till CRM-systemet."
      actions={
        isAdmin ? (
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Ny användare
          </Button>
        ) : undefined
      }
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <UserCog className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Användarhantering</h1>
              <p className="text-sm text-slate-500">
                Samma byggstenar som i Associations- och Kommunöversikten: tydlig översikt, sammanfattande kort och
                tabeller med åtgärder.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {loadError === "auth" ? (
              <Button
                variant="outline"
                onClick={() => router.push("/login?redirectTo=/users")}
                className="border-orange-200 text-orange-600"
              >
                <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                Logga in igen
              </Button>
            ) : (
              <Button variant="outline" onClick={() => void fetchUsers()}>
                <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Uppdatera lista
              </Button>
            )}
            {isAdmin ? (
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Ny användare
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3 rounded-full bg-slate-100 p-1">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="roles">Roller & behörigheter</TabsTrigger>
            <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.key} className="border border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                    <card.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.subtext}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loadError && loadError !== "auth" ? (
              <Card className="border border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Kunde inte hämta användare
                  </CardTitle>
                  <CardDescription className="text-destructive">
                    {loadError}. Försök igen eller kontakta systemadministratören om problemet kvarstår.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle>Alla användare</CardTitle>
                <CardDescription>Sammanställd lista med samma tabellstandard som övriga CRM-moduler.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Sök på namn, e-post eller roll"
                        className="pl-9"
                        aria-label="Sök användare"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5">
                      <Switch
                        id="show-deleted"
                        checked={showDeleted}
                        onChange={(event) => setShowDeleted(event.currentTarget.checked)}
                      />
                      <label htmlFor="show-deleted" className="text-sm text-muted-foreground">
                        Visa raderade
                      </label>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground lg:text-right">
                    {stats.active} aktiva · {stats.deleted} raderade · {stats.admins} administratörer
                  </div>
                </div>

                {selectedIds.size > 0 ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
                    {selectedIds.size} användare valda
                  </div>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allVisibleSelected}
                            onCheckedChange={(checked) => handleToggleAll(!!checked)}
                            aria-label="Markera alla"
                          />
                        </TableHead>
                        <TableHead>Namn</TableHead>
                        <TableHead>Användarnamn</TableHead>
                        <TableHead>Roll</TableHead>
                        <TableHead className="text-right">Åtgärder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">
                            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" aria-hidden="true" />
                            Hämtar användare ...
                          </TableCell>
                        </TableRow>
                      ) : users.length ? (
                        users.map((user) => {
                          const isSelected = selectedIds.has(user.id)
                          const isDeleted = user.isDeleted
                          const roleLabel = resolveRoleLabel(user.role)
                          const badgeVariant = roleBadgeVariant(user.role)

                          return (
                            <TableRow
                              key={user.id}
                              className={cn(
                                isDeleted && "bg-orange-50/70 text-muted-foreground line-through",
                                isSelected && "bg-primary/5"
                              )}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleToggleRow(user.id, !!checked)}
                                  aria-label={`Markera ${user.email ?? user.name ?? "användaren"}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {isDeleted ? <Trash2 className="h-4 w-4 text-orange-500" aria-hidden="true" /> : null}
                                  <span>{user.name ?? "—"}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{user.email ?? "Ingen e-post"}</span>
                                  {isDeleted && user.deletedAt ? (
                                    <span className="text-xs text-muted-foreground">
                                      Raderad {new Date(user.deletedAt).toLocaleDateString("sv-SE")}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={badgeVariant}>{roleLabel}</Badge>
                              </TableCell>
                              <TableCell className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  disabled={rowActionUserId === user.id}
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Redigera
                                </Button>
                                {isDeleted ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(user)}
                                    disabled={rowActionUserId === user.id}
                                  >
                                    {rowActionUserId === user.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                    )}
                                    Återställ
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => requestDeleteUser(user)}
                                    disabled={rowActionUserId === user.id || session?.user.id === user.id}
                                  >
                                    {rowActionUserId === user.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                    )}
                                    Radera
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                            {showDeleted
                              ? "Inga raderade användare matchar din sökning."
                              : "Inga användare matchar din sökning just nu."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Roller & behörighetsnivåer</CardTitle>
                <CardDescription>Sammanfattning av vad varje roll kan göra (enligt Figma-dokumentet).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {roleOptions.map((role) => (
                  <div key={role.value} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        {role.label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{role.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitet & kommande loggar</CardTitle>
                <CardDescription>
                  Historik och audit-logg för användarändringar kommer att placeras här enligt Figma-specen.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Funktionaliteten är inte implementerad ännu men layouten följer samma struktur så att loggen kan aktiveras utan
                ytterligare UI-arbete.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <UserFormDialog
        open={formOpen}
        mode={formMode}
        initialUser={editingUser}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingUser(null)
          }
        }}
        onSubmit={handleSubmitForm}
        isSubmitting={formSubmitting}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera användare?</AlertDialogTitle>
            <AlertDialogDescription>
              Användaren markeras som raderad och kan återställas senare. Ingen data tas permanent bort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-white hover:bg-destructive/90">
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

function UserFormDialog({ open, onOpenChange, mode, initialUser, onSubmit, isSubmitting }: UserFormDialogProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "USER",
      password: "",
    },
  })

  useEffect(() => {
    if (mode === "edit" && initialUser) {
      const nextValues: UserFormValues = {
        name: initialUser.name ?? "",
        email: initialUser.email ?? "",
        role: normalizeAuthRole(initialUser.role),
        password: "",
      }
      form.reset(nextValues)
    } else {
      form.reset({
        name: "",
        email: "",
        role: "USER",
        password: "",
      })
    }
  }, [initialUser, form, mode])

  const handleSubmit = form.handleSubmit(async (values) => {
    if (mode === "create" && (!values.password || values.password.trim().length < 8)) {
      form.setError("password", { type: "manual", message: "Lösenord måste vara minst 8 tecken" })
      return
    }
    await onSubmit(values, mode)
  })

  const title = mode === "create" ? "Ny användare" : "Redigera användare"
  const description =
    mode === "create"
      ? "Skapa ett konto för en ny kollega och ange roll samt lösenord."
      : "Uppdatera uppgifter och behörigheter. Lämna lösenordet tomt för att behålla nuvarande."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Namn</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex. Anna Andersson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post / användarnamn</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="anna@example.se" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj roll" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Lösenord {mode === "edit" ? <span className="text-xs text-muted-foreground">(valfritt)</span> : null}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={mode === "edit" ? "Lämna tomt för oförändrat" : "Minst 8 tecken"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Sparar...
                  </>
                ) : mode === "create" ? (
                  <>
                    <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                    Skapa användare
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Uppdatera
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function resolveRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "Administratör"
    case "MANAGER":
      return "Ansvarig"
    default:
      return "Användare"
  }
}

function roleBadgeVariant(role: string | null | undefined): "default" | "secondary" | "outline" {
  switch (role) {
    case "ADMIN":
      return "default"
    case "MANAGER":
      return "secondary"
    default:
      return "outline"
  }
}

function normalizeAuthRole(role: string | null | undefined): "ADMIN" | "MANAGER" | "USER" {
  if (role === "ADMIN" || role === "MANAGER") {
    return role
  }
  return "USER"
}

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
