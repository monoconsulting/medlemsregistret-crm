import { z } from "zod"
import { UserRole } from "@prisma/client"

export const createUserSchema = z.object({
  name: z.string().min(1, "Namn krävs").max(100),
  email: z.string().email("Ogiltig e-postadress"),
  role: z.nativeEnum(UserRole, { required_error: "Roll krävs" }),
  password: z.string().min(8, "Lösenord måste vara minst 8 tecken").optional(),
})

export const updateUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Namn krävs").max(100).optional(),
  email: z.string().email("Ogiltig e-postadress").optional(),
  role: z.nativeEnum(UserRole).optional(),
  password: z.string().min(8, "Lösenord måste vara minst 8 tecken").optional(),
})

export const deleteUserSchema = z.object({
  id: z.string().cuid(),
})

export const listUsersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type DeleteUserInput = z.infer<typeof deleteUserSchema>
export type ListUsersInput = z.infer<typeof listUsersSchema>
