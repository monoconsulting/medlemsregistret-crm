"use client"

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
import { UserRole } from "@prisma/client"
import { createUserSchema, type CreateUserInput } from "@/lib/validators/user"
import { Loader2 } from "lucide-react"

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateUserInput) => Promise<void>
  isSubmitting: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administratör",
  MANAGER: "Handläggare",
  USER: "Användare",
}

export function CreateUserModal({ open, onOpenChange, onSubmit, isSubmitting }: CreateUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: UserRole.USER,
    },
  })

  const role = watch("role")

  const handleFormSubmit = async (values: CreateUserInput) => {
    await onSubmit(values)
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
          <DialogTitle>Skapa ny användare</DialogTitle>
          <DialogDescription>
            Lägg till en ny användare i systemet. Fyll i alla obligatoriska fält.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Namn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Förnamn Efternamn"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              E-post <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="anvandare@exempel.se"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Roll <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="password">Lösenord (valfritt)</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Minst 8 tecken"
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">
              Om inget lösenord anges kan användaren logga in via OAuth eller återställa lösenord.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skapa användare
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
