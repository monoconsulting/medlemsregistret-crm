import { z } from 'zod'

export const contactFormSchema = z.object({
  associationId: z.string().min(1),
  name: z.string().min(1, 'Namn är obligatoriskt'),
  role: z.string().optional(),
  email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
