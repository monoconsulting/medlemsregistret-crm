import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Titel krävs'),
  description: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED']).default('OPEN'),
  associationId: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>
