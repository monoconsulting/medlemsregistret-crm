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
  'QUALIFIED_LEAD',
  'DISCOVERY',
  'PROPOSAL_SENT',
  'NEGOTIATION',
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
  email: z.union([z.string().email('Ogiltig e-postadress'), z.literal('')]).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  homepageUrl: z.union([z.string().url('Ogiltig URL'), z.literal('')]).nullable().optional(),
  activities: z
    .array(z.string().trim().min(1))
    .max(25, 'Max 25 aktiviteter samtidigt')
    .optional(),
  otherInformation: z.string().trim().max(2000).optional(),
  descriptionFreeText: z.string().trim().max(5000).optional(),
  notes: z.string().optional(),
  orgNumber: z.string().trim().max(20).nullable().optional(),
  categories: z
    .array(z.string().trim().min(1))
    .max(25, 'Max 25 kategorier samtidigt')
    .optional(),
})

export type AssociationUpdateInput = z.infer<typeof associationUpdateSchema>

export const associationCreateSchema = associationUpdateSchema.extend({
  name: z.string().trim().min(1, 'Namn krävs').max(255),
  municipalityId: z.string().min(1, 'Välj en kommun'),
})

export type AssociationCreateInput = z.infer<typeof associationCreateSchema>
