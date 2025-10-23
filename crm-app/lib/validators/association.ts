import { z } from 'zod'

export const CRM_STATUSES = [
  'UNCONTACTED',
  'CONTACTED',
  'INTERESTED',
  'NEGOTIATION',
  'MEMBER',
  'LOST',
  'INACTIVE',
] as const

export const PIPELINES = [
  'PROSPECT',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'FOLLOW_UP',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const

export const associationUpdateSchema = z.object({
  crmStatus: z.enum(CRM_STATUSES, {
    errorMap: () => ({ message: 'Välj en giltig status' }),
  }),
  pipeline: z.enum(PIPELINES, {
    errorMap: () => ({ message: 'Välj en giltig pipeline' }),
  }),
  isMember: z.boolean(),
  memberSince: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
})

export type AssociationUpdateInput = z.infer<typeof associationUpdateSchema>
