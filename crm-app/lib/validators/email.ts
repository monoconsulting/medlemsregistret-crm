import { z } from 'zod'

export const emailComposerSchema = z.object({
  associationId: z.string().min(1),
  to: z.string().email('Ange en giltig mottagare'),
  subject: z.string().min(3, 'Ämnesrad krävs'),
  body: z.string().min(20, 'Mailet behöver minst 20 tecken'),
  tone: z.enum(['friendly', 'formal', 'followup']).default('friendly'),
})

export type EmailComposerValues = z.infer<typeof emailComposerSchema>
