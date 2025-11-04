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
  streetAddress: z.string().trim().max(255).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  email: z.string().email('Ogiltig e-postadress').nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  homepageUrl: z.string().url('Ogiltig URL').nullable().optional(),
  activities: z
    .array(z.string().trim().min(1))
    .max(25, 'Max 25 aktiviteter samtidigt')
    .optional(),
  otherInformation: z.string().trim().max(2000).optional(),
  descriptionFreeText: z.string().trim().max(5000).optional(),
  notes: z.string().optional(),
})

export type AssociationUpdateInput = z.infer<typeof associationUpdateSchema>
