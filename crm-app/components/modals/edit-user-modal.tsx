"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserRole, type User } from "@prisma/client"
import { updateUserSchema, type UpdateUserInput } from "@/lib/validators/user"
import { Loader2 } from "lucide-react"

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSubmit: (values: UpdateUserInput) => Promise<void>
  isSubmitting: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administratör",
  MANAGER: "Handläggare",
  USER: "Användare",
}

export function EditUserModal({ open, onOpenChange, user, onSubmit, isSubmitting }: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  })

  const role = watch("role")

  useEffect(() => {
    if (open && user) {
      setValue("id", user.id)
      setValue("name", user.name ?? "")
      setValue("email", user.email ?? "")
      setValue("role", user.role)
      setValue("password", "")
    }
  }, [open, user, setValue])

  const handleFormSubmit = async (values: UpdateUserInput) => {
    const cleanedValues = { ...values }
    if (!cleanedValues.password) {
      delete cleanedValues.password
    }
    await onSubmit(cleanedValues)
    reset()
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redigera användare</DialogTitle>
          <DialogDescription>
            Uppdatera användarens information. Lämna lösenordsfältet tomt om du inte vill ändra lösenordet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Namn</Label>
            <Input
              id="edit-name"
              {...register("name")}
              placeholder="Förnamn Efternamn"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-post</Label>
            <Input
              id="edit-email"
              type="email"
              {...register("email")}
              placeholder="anvandare@exempel.se"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Roll</Label>
            <Select
              value={role}
              onValueChange={(value) => setValue("role", value as UserRole)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj roll" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Nytt lösenord (valfritt)</Label>
            <Input
              id="edit-password"
              type="password"
              {...register("password")}
              placeholder="Lämna tomt för att behålla nuvarande"
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">
              Ange endast om du vill ändra användarens lösenord.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara ändringar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
