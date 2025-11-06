import { z } from "zod"

export const municipalityHomepageRowSchema = z.object({
  kommun: z.string().min(1, "Kommunnamn saknas"),
  hemsida: z.string().min(1, "Hemsida saknas"),
  plattform: z.string().optional(),
})

export type MunicipalityHomepageRow = z.infer<typeof municipalityHomepageRowSchema>